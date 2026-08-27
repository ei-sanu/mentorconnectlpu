const fs = require('fs');
const path = require('path');

const replacements = [
  [/bg-gray-/g, 'bg-slate-'],
  [/text-gray-/g, 'text-slate-'],
  [/border-gray-/g, 'border-slate-'],
  [/text-lpu-orange/g, 'text-blue-600'],
  [/bg-lpu-orange/g, 'bg-blue-600'],
  [/fill-lpu-orange/g, 'fill-blue-600'],
];

function processDirectory(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      processDirectory(fullPath);
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts') || fullPath.endsWith('.css')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      let changed = false;
      for (const [regex, replacement] of replacements) {
        if (regex.test(content)) {
          content = content.replace(regex, replacement);
          changed = true;
        }
      }
      if (changed) {
        fs.writeFileSync(fullPath, content);
        console.log('Updated', fullPath);
      }
    }
  }
}

processDirectory('app');
processDirectory('components');
