/* Zero-dependency static server, used only if the platform runs a Node
 * buildpack rather than the Dockerfile. Serves the same four things. */
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');

const PORT = Number(process.env.PORT) || 8000;
const ROOT = __dirname;
const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.woff2': 'font/woff2',
  '.ico': 'image/x-icon',
  // The OG card. Social scrapers reject an image served as octet-stream.
  '.png': 'image/png',
};
const ALLOWED = new Set(['/index.html', '/styles.css', '/audit.js']);

http.createServer((req, res) => {
  const url = new URL(req.url, 'http://localhost');
  let pathname = url.pathname === '/' ? '/index.html' : url.pathname;
  if (!ALLOWED.has(pathname) && !pathname.startsWith('/assets/')) pathname = '/index.html';
  const file = path.resolve(ROOT, '.' + pathname);
  if (!file.startsWith(ROOT + path.sep) || !fs.existsSync(file) || !fs.statSync(file).isFile()) {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not found');
    return;
  }
  res.writeHead(200, { 'Content-Type': TYPES[path.extname(file)] || 'application/octet-stream' });
  fs.createReadStream(file).pipe(res);
}).listen(PORT, '0.0.0.0', () => console.log(`cloud-audit listening on ${PORT}`));
