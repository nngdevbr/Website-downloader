var fs = require('fs');
var path = require('path');
var childProcess = require('child_process');

var isWindows = process.platform === 'win32';

/**
 * Returns an absolute path to a wget binary the app can execFile(), or null
 * when nothing usable is available.
 *
 * Order of preference:
 * 1. WGET_PATH environment variable
 * 2. vendor/wget/wget.exe (portable Windows package)
 * 3. wget / wget.exe on PATH
 * 4. Common Windows install locations
 */
function resolveWgetPath() {
  var fromEnv = process.env.WGET_PATH;
  if (fromEnv && isExecutable(fromEnv)) return path.resolve(fromEnv);

  var vendor = path.join(__dirname, '..', 'vendor', 'wget', isWindows ? 'wget.exe' : 'wget');
  if (isExecutable(vendor)) return vendor;

  var fromPath = findOnPath(isWindows ? ['wget.exe', 'wget.cmd', 'wget.bat', 'wget'] : ['wget']);
  if (fromPath) return fromPath;

  if (isWindows) {
    var candidates = [
      path.join(process.env.LOCALAPPDATA || '', 'Microsoft', 'WinGet', 'Links', 'wget.exe'),
      path.join(process.env.ProgramFiles || 'C:\\Program Files', 'GnuWin32', 'bin', 'wget.exe'),
      path.join(process.env['ProgramFiles(x86)'] || 'C:\\Program Files (x86)', 'GnuWin32', 'bin', 'wget.exe'),
      path.join(process.env.ProgramFiles || 'C:\\Program Files', 'Git', 'usr', 'bin', 'wget.exe'),
      path.join(process.env.SystemRoot || 'C:\\Windows', 'wget.exe')
    ];
    for (var i = 0; i < candidates.length; i++) {
      if (candidates[i] && isExecutable(candidates[i])) return candidates[i];
    }
  }

  return null;
}

function findOnPath(names) {
  var pathEnv = process.env.PATH || process.env.Path || '';
  var dirs = pathEnv.split(path.delimiter);
  var pathExts = isWindows
    ? (process.env.PATHEXT || '.EXE;.CMD;.BAT;.COM').split(';').map(function (e) {
        return e.toLowerCase();
      })
    : [''];

  for (var d = 0; d < dirs.length; d++) {
    if (!dirs[d]) continue;
    for (var n = 0; n < names.length; n++) {
      var name = names[n];
      var hasExt = isWindows && path.extname(name);
      if (hasExt) {
        var direct = path.join(dirs[d], name);
        if (isExecutable(direct)) return direct;
        continue;
      }
      for (var e = 0; e < pathExts.length; e++) {
        var candidate = path.join(dirs[d], name + (isWindows ? pathExts[e] : ''));
        if (isExecutable(candidate)) return candidate;
      }
    }
  }
  return null;
}

function isExecutable(filePath) {
  try {
    var stat = fs.statSync(filePath);
    return stat.isFile();
  } catch (err) {
    return false;
  }
}

/**
 * Stops a child process (and on Windows, its whole tree). wget can spawn
 * helpers; a plain kill() often leaves them running on win32.
 */
function stopProcess(child) {
  if (!child || !child.pid) return;
  if (isWindows) {
    try {
      childProcess.execFileSync('taskkill', ['/pid', String(child.pid), '/T', '/F'], {
        stdio: 'ignore',
        windowsHide: true
      });
    } catch (err) {
      try { child.kill(); } catch (ignored) { /* already gone */ }
    }
    return;
  }
  try {
    child.kill('SIGTERM');
  } catch (err) {
    try { child.kill(); } catch (ignored) { /* already gone */ }
  }
}

module.exports = {
  resolveWgetPath: resolveWgetPath,
  stopProcess: stopProcess,
  isWindows: isWindows
};
