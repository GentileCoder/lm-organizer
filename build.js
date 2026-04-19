const fs = require('fs');
const path = require('path');

const JS_FILES = [
  'src/js/core.js',
  'src/js/calendar.js',
  'src/js/finance.js',
  'src/js/review.js',
  'src/js/chat.js',
];

const shell  = fs.readFileSync('src/shell.html', 'utf8');
const style  = fs.readFileSync('src/style.css',  'utf8');
const script = JS_FILES
  .map(f => `// ═══ ${path.basename(f, '.js').toUpperCase()} ═══\n` + fs.readFileSync(f, 'utf8'))
  .join('\n\n');

const html = shell
  .replace('{{STYLE}}',  style)
  .replace('{{SCRIPT}}', script);

fs.writeFileSync('index.html', html, 'utf8');
console.log(`Built index.html  (${(html.length / 1024).toFixed(1)} KB)`);
