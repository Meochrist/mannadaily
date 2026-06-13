const fs = require('fs');
const path = require('path');

function searchFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    if (content.includes('FEDAPAY') || content.includes('fedapay') || content.includes('sk_')) {
      console.log(`Found in: ${filePath}`);
      const lines = content.split('\n');
      lines.forEach((line, i) => {
        if (line.includes('FEDAPAY') || line.includes('fedapay') || line.includes('sk_')) {
          console.log(`  L${i + 1}: ${line.trim()}`);
        }
      });
    }
  } catch (err) {}
}

function walk(dir) {
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    const fullPath = path.join(dir, file);
    if (file === 'node_modules' || file === '.next' || file === '.git') return;
    const stat = fs.statSync(fullPath);
    if (stat && stat.isDirectory()) {
      walk(fullPath);
    } else {
      if (file.startsWith('.env') || file.endsWith('.txt') || file.endsWith('.json') || file.endsWith('.md')) {
        searchFile(fullPath);
      }
    }
  });
}

walk('d:/Antigravity');
