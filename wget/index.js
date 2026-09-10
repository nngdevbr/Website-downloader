var execFile = require('child_process').execFile;
var crypto = require('crypto');
var fs = require('fs');
var path = require('path');
var archive = require('../archiver');
var wgetTools = require('./resolve');
var scrapeWithNode = require('./node-scraper');

/**
 * Every download gets its own directory under downloads/, which keeps two
 * people downloading the same site from writing into each other's files and
 * keeps cleanup from ever reaching outside this folder.
 */
var DOWNLOAD_ROOT = path.join(__dirname, '..', 'downloads');

// wget mirrors recursively, so without a ceiling a single request can fill the
// disk. Both limits can be raised through the environment.
var QUOTA = process.env.DOWNLOAD_QUOTA || '100m';
var TIMEOUT_MS = Number(process.env.DOWNLOAD_TIMEOUT_MS) || 5 * 60 * 1000;

/**
 * Prefer system wget when present. On Windows (and any machine without wget),
 * fall back to a pure-Node scraper so we never download or run a random
 * wget.exe — that pattern triggers SmartScreen / browser "virus" warnings.
 */
module.exports = (socket, data, onFinished) => {
  var done = typeof onFinished === 'function' ? onFinished : function () {};
  var send = (payload) => socket.emit(data.token, payload);

  var target = parseTarget(data.website);
  if (!target) {
    send({ error: 'That does not look like a website address. Try something like https://example.com' });
    done();
    return null;
  }

  var jobId = crypto.randomBytes(8).toString('hex');
  var jobDir = path.join(DOWNLOAD_ROOT, jobId);
  try {
    fs.mkdirSync(jobDir, { recursive: true });
  } catch (err) {
    send({ error: 'Could not create a working directory on the server: ' + err.message });
    done();
    return null;
  }

  var wgetBin = wgetTools.resolveWgetPath();
  if (wgetBin) {
    return runWithWget(socket, data, target, jobId, jobDir, wgetBin, send, done);
  }

  send({ progress: 'wget not found — using the built-in Node downloader.\n' });
  return runWithNode(target, jobId, jobDir, send, done);
};

function runWithWget(socket, data, target, jobId, jobDir, wgetBin, send, done) {
  // execFile rather than exec: the address is passed as a separate argument and
  // never reaches a shell, so it cannot be used to run other commands.
  var child = execFile(wgetBin, [
    '-mkEpnp',
    '--no-if-modified-since',
    '--quota=' + QUOTA,
    target.href
  ], {
    cwd: jobDir,
    maxBuffer: 32 * 1024 * 1024,
    windowsHide: true
  });

  var settled = false;
  var cancelled = false;
  var timedOut = false;
  var stderrTail = [];

  var timer = setTimeout(() => {
    timedOut = true;
    wgetTools.stopProcess(child);
  }, TIMEOUT_MS);

  var fail = (message) => {
    if (settled) return;
    settled = true;
    clearTimeout(timer);
    removeJobDir(jobDir);
    send({ error: message });
    done();
  };

  child.on('error', (err) => {
    if (err.code === 'ENOENT') {
      fail('wget could not be started (' + wgetBin + '). Restart the app to use the built-in ' +
           'Node downloader, or install wget (apt/brew/winget) and try again.');
      return;
    }
    fail('Could not start the download: ' + err.message);
  });

  child.stderr.on('data', (chunk) => {
    var text = chunk.toString();
    stderrTail = stderrTail.concat(text.split('\n')).slice(-60);
    send({ progress: text });
  });

  child.on('close', (code) => {
    if (settled) return;
    clearTimeout(timer);

    if (cancelled) {
      settled = true;
      removeJobDir(jobDir);
      done();
      return;
    }
    if (timedOut) {
      fail('The download took longer than ' + Math.round(TIMEOUT_MS / 1000) +
           ' seconds and was stopped. Try a smaller site or a specific page.');
      return;
    }

    if (countFiles(jobDir) === 0) {
      fail('Nothing could be downloaded from ' + target.hostname + '. ' +
           explainFailure(stderrTail, code));
      return;
    }

    settled = true;
    finishArchive(jobDir, target, jobId, send, done);
  });

  return {
    cancel: function () {
      cancelled = true;
      wgetTools.stopProcess(child);
    }
  };
}

function runWithNode(target, jobId, jobDir, send, done) {
  var handle = scrapeWithNode({
    url: target.href,
    directory: jobDir,
    timeoutMs: TIMEOUT_MS,
    maxBytes: parseQuotaBytes(QUOTA),
    onProgress: function (text) {
      send({ progress: text });
    },
    onDone: function (err) {
      if (err) {
        removeJobDir(jobDir);
        // Cancelled disconnects should stay quiet.
        if (/cancelled/i.test(err.message)) {
          done();
          return;
        }
        send({ error: err.message || String(err) });
        done();
        return;
      }
      if (countFiles(jobDir) === 0) {
        removeJobDir(jobDir);
        send({ error: 'Nothing could be downloaded from ' + target.hostname + '.' });
        done();
        return;
      }
      finishArchive(jobDir, target, jobId, send, done);
    }
  });

  return handle;
}

function finishArchive(jobDir, target, jobId, send, done) {
  send({ progress: 'Converting' });
  var zipName = target.hostname.replace(/[^a-zA-Z0-9._-]/g, '_') + '-' + jobId;
  archive(jobDir, zipName, (err, name) => {
    removeJobDir(jobDir);
    if (err) {
      send({ error: 'The site downloaded but could not be compressed: ' + err.message });
    } else {
      send({ progress: 'Completed', file: name });
    }
    done();
  });
}

/**
 * Accepts what the user typed and returns a URL only if it is a real http(s)
 * address. Anything else is rejected before it reaches wget.
 */
function parseTarget(input) {
  if (typeof input !== 'string' || !input.trim()) return null;
  var raw = input.trim();
  var url;
  try {
    // Only assume http:// when no scheme was given at all. Prefixing a value
    // that already has one turns file:///etc/passwd into a request for a host
    // called "file" instead of rejecting it.
    url = new URL(/^[a-z][a-z0-9+.-]*:/i.test(raw) ? raw : 'http://' + raw);
  } catch (err) {
    return null;
  }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') return null;
  if (!url.hostname) return null;
  return url;
}

function explainFailure(lines, exitCode) {
  var interesting = /failed|unable|refused|denied|ERROR \d|error \d|robots|No such|not found|forbidden|timed out|giving up|Unsupported scheme/i;
  for (var i = lines.length - 1; i >= 0; i--) {
    var line = lines[i].trim();
    if (line && interesting.test(line)) return line;
  }
  if (exitCode === 8) return 'The server refused the request (it may block automated downloads).';
  return 'wget exited with code ' + exitCode + ' without saving any files.';
}

function parseQuotaBytes(quota) {
  if (typeof quota !== 'string') return 100 * 1024 * 1024;
  var match = /^(\d+)\s*([kmg])?$/i.exec(quota.trim());
  if (!match) return 100 * 1024 * 1024;
  var n = Number(match[1]);
  var unit = (match[2] || '').toLowerCase();
  if (unit === 'g') return n * 1024 * 1024 * 1024;
  if (unit === 'm') return n * 1024 * 1024;
  if (unit === 'k') return n * 1024;
  return n;
}

function countFiles(directory) {
  var total = 0;
  var entries;
  try {
    entries = fs.readdirSync(directory, { withFileTypes: true });
  } catch (err) {
    return 0;
  }
  for (var i = 0; i < entries.length; i++) {
    if (entries[i].isDirectory()) {
      total += countFiles(path.join(directory, entries[i].name));
    } else {
      total++;
    }
  }
  return total;
}

function removeJobDir(directory) {
  var resolved = path.resolve(directory);
  var root = path.resolve(DOWNLOAD_ROOT);
  // Windows paths are case-insensitive; normalize before the containment check.
  var resolvedCmp = process.platform === 'win32' ? resolved.toLowerCase() : resolved;
  var rootCmp = process.platform === 'win32' ? root.toLowerCase() : root;
  if (resolvedCmp === rootCmp || !resolvedCmp.startsWith(rootCmp + path.sep)) {
    console.error('Refusing to delete a path outside the downloads folder: ' + resolved);
    return;
  }
  fs.rm(resolved, { recursive: true, force: true }, (err) => {
    if (err) console.error('Could not clean up ' + resolved + ': ' + err.message);
  });
}
