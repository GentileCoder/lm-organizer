const http = require('http');
const fs   = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const PORT = 8080;
const FILE = path.join(__dirname, 'index.html');

const server = http.createServer((req, res) => {
  try {
    execSync('node build.js', { cwd: __dirname });
  } catch (e) {
    res.writeHead(500, { 'Content-Type': 'text/plain' });
    res.end('Build error:\n' + e.message);
    return;
  }

  fs.readFile(FILE, (err, data) => {
    if (err) {
      res.writeHead(500, { 'Content-Type': 'text/plain' });
      res.end('Could not read index.html');
      return;
    }
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(data);
  });
});

server.listen(PORT, () => {
  console.log(`\n  Dev server → http://localhost:${PORT}`);
  console.log('  Every page reload rebuilds index.html from src/\n');
});
