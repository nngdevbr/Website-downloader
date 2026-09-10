var path = require('path');
var fs = require('fs');

/**
 * Pure-Node fallback when wget is unavailable (typical on a fresh Windows
 * install). Uses website-scraper over HTTPS — no external .exe is downloaded
 * or executed, which avoids SmartScreen / antivirus false positives.
 */
module.exports = function scrapeWithNode(options) {
  var url = options.url;
  var directory = options.directory;
  var onProgress = typeof options.onProgress === 'function' ? options.onProgress : function () {};
  var timeoutMs = options.timeoutMs || 5 * 60 * 1000;
  var maxBytes = options.maxBytes || 100 * 1024 * 1024;

  var cancelled = false;
  var settled = false;
  var timer = null;
  var bytesSeen = 0;

  var finish = function (err) {
    if (settled) return;
    settled = true;
    if (timer) clearTimeout(timer);
    options.onDone(err);
  };

  timer = setTimeout(function () {
    cancelled = true;
    finish(new Error('The download took longer than ' + Math.round(timeoutMs / 1000) +
      ' seconds and was stopped. Try a smaller site or a specific page.'));
  }, timeoutMs);

  Promise.resolve()
    .then(function () {
      return Promise.all([
        import('website-scraper'),
        import('website-scraper-existing-directory')
      ]);
    })
    .then(function (mods) {
      if (cancelled) return null;
      var scrape = mods[0].default || mods[0];
      var ExistingDirectoryPlugin = mods[1].default || mods[1];

      onProgress('Using built-in downloader (no wget required)...\n');
      onProgress('Fetching ' + url + '\n');

      return scrape({
        urls: [url],
        directory: directory,
        recursive: true,
        maxRecursiveDepth: 2,
        requestConcurrency: 4,
        plugins: [new ExistingDirectoryPlugin()],
        request: {
          headers: {
            'User-Agent': 'Website-Downloader/0.0.1 (+https://github.com/nngdevbr/Website-downloader)'
          }
        },
        urlFilter: function (resourceUrl) {
          if (cancelled) return false;
          try {
            var base = new URL(url);
            var next = new URL(resourceUrl, url);
            // Stay on the same host; allow subresource CDNs only one hop deep
            // via maxRecursiveDepth rather than an open crawl of the web.
            return next.hostname === base.hostname;
          } catch (err) {
            return false;
          }
        }
      }).then(function (results) {
        // Count saved files for progress parity with the wget path.
        var saved = 0;
        function walk(dir) {
          var entries;
          try {
            entries = fs.readdirSync(dir, { withFileTypes: true });
          } catch (err) {
            return;
          }
          for (var i = 0; i < entries.length; i++) {
            var full = path.join(dir, entries[i].name);
            if (entries[i].isDirectory()) walk(full);
            else {
              saved++;
              try { bytesSeen += fs.statSync(full).size; } catch (e) { /* ignore */ }
              onProgress('saved ' + entries[i].name + ' 200 OK\n');
            }
          }
        }
        walk(directory);

        if (bytesSeen > maxBytes) {
          throw new Error('Download exceeded the size quota (' + formatBytes(maxBytes) + ').');
        }
        if (saved === 0 && (!results || !results.length)) {
          throw new Error('Nothing could be downloaded from ' + url);
        }
        onProgress('Finished built-in download (' + saved + ' files).\n');
        return results;
      });
    })
    .then(function () {
      if (!cancelled) finish(null);
    })
    .catch(function (err) {
      finish(err);
    });

  return {
    cancel: function () {
      cancelled = true;
      finish(new Error('Download cancelled.'));
    }
  };
};

function formatBytes(n) {
  if (n >= 1024 * 1024) return Math.round(n / (1024 * 1024)) + 'm';
  return n + ' bytes';
}
