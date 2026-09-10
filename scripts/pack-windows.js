/**
 * Builds a ZIP users can download and run on Windows.
 * Output: dist/Website-Downloader-Windows.zip
 */
var fs = require('fs');
var path = require('path');
var archiver = require('archiver');

var ROOT = path.join(__dirname, '..');
var OUT_DIR = path.join(ROOT, 'dist');
var OUT_FILE = path.join(OUT_DIR, 'Website-Downloader-Windows.zip');

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
  'windows',
  'vendor'
];

var SKIP_NAMES = new Set([
  'node_modules',
  'downloads',
  'dist',
  '.git',
  '.github'
]);

function shouldSkip(fullPath, name) {
  if (SKIP_NAMES.has(name)) return true;
  if (name === '.zip' || name.endsWith('.zip')) {
    // Keep intentional assets, skip generated site archives.
    if (fullPath.indexOf(path.join('public', 'sites')) !== -1 && name !== '.gitkeep') {
      return true;
    }
  }
  if (name === 'wget.exe') return true;
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
  console.log('Created ' + OUT_FILE + ' (' + archive.pointer() + ' bytes)');
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
