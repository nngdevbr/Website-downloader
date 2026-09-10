/**
 * Builds a ZIP users can download and run on Windows.
 * Output: dist/Website-Downloader-Windows.zip (+ SHA256SUMS.txt)
 *
 * Intentionally excludes any .exe and any script that downloads one — those
 * patterns trigger browser Safe Browsing / SmartScreen false positives.
 */
var crypto = require('crypto');
var fs = require('fs');
var path = require('path');
var archiver = require('archiver');

var ROOT = path.join(__dirname, '..');
var OUT_DIR = path.join(ROOT, 'dist');
var OUT_FILE = path.join(OUT_DIR, 'Website-Downloader-Windows.zip');
var SUMS_FILE = path.join(OUT_DIR, 'SHA256SUMS.txt');

var INCLUDE = [
  'app.js',
  'app.json',
  'package.json',
  'package-lock.json',
  'LICENSE.md',
  'README.md',
  'bin',
  'routes',
  'socket',
  'views',
  'wget',
  'archiver',
  'public',
  'windows'
];

var SKIP_NAMES = new Set([
  'node_modules',
  'downloads',
  'dist',
  '.git',
  '.github',
  'vendor',
  'runtime'
]);

function shouldSkip(fullPath, name) {
  if (SKIP_NAMES.has(name)) return true;
  if (/\.exe$/i.test(name)) return true;
  if (/\.ps1$/i.test(name) && name.toLowerCase() !== 'ensure-node.ps1') return true;
  if (name.endsWith('.zip')) {
    if (fullPath.indexOf(path.join('public', 'sites')) !== -1) return true;
  }
  // Demo gif is large and unrelated to running the app.
  if (name === 'Record.gif') return true;
  return false;
}

function addDirectory(archive, dirPath, zipPrefix) {
  var entries = fs.readdirSync(dirPath, { withFileTypes: true });
  for (var i = 0; i < entries.length; i++) {
    var entry = entries[i];
    var full = path.join(dirPath, entry.name);
    if (shouldSkip(full, entry.name)) continue;
    var dest = zipPrefix ? zipPrefix + '/' + entry.name : entry.name;
    if (entry.isDirectory()) {
      addDirectory(archive, full, dest);
    } else if (entry.isFile()) {
      archive.file(full, { name: 'Website-Downloader-Windows/' + dest });
    }
  }
}

fs.mkdirSync(OUT_DIR, { recursive: true });
if (fs.existsSync(OUT_FILE)) fs.unlinkSync(OUT_FILE);

var output = fs.createWriteStream(OUT_FILE);
var archive = archiver('zip', { zlib: { level: 9 } });

output.on('close', function () {
  var hash = crypto.createHash('sha256').update(fs.readFileSync(OUT_FILE)).digest('hex');
  var line = hash + '  Website-Downloader-Windows.zip\n';
  fs.writeFileSync(SUMS_FILE, line);
  console.log('Created ' + OUT_FILE + ' (' + archive.pointer() + ' bytes)');
  console.log('SHA256 ' + hash);
  console.log('Wrote ' + SUMS_FILE);
});

archive.on('error', function (err) {
  throw err;
});

archive.pipe(output);

archive.file(path.join(ROOT, 'windows', 'README-WINDOWS.md'), {
  name: 'Website-Downloader-Windows/LEIA-ME.txt'
});

for (var i = 0; i < INCLUDE.length; i++) {
  var rel = INCLUDE[i];
  var full = path.join(ROOT, rel);
  if (!fs.existsSync(full)) continue;
  var stat = fs.statSync(full);
  if (stat.isDirectory()) {
    addDirectory(archive, full, rel);
  } else {
    archive.file(full, { name: 'Website-Downloader-Windows/' + rel });
  }
}

archive.finalize();
