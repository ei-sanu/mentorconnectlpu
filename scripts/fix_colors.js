const fs = require('fs');
const path = require('path');

const replacements = [
  [/bg-blue-600/g, 'bg-lpu-orange'],
  [/text-blue-600/g, 'text-lpu-orange'],
  [/border-blue-600/g, 'border-lpu-orange'],
  [/fill-blue-600/g, 'fill-lpu-orange'],
  [/ring-blue-600/g, 'ring-lpu-orange'],
  [/bg-slate-/g, 'bg-gray-'],
  [/text-slate-/g, 'text-gray-'],
  [/border-slate-/g, 'border-gray-'],
  [/#2563EB/g, '#F37F20']
];

function processDirectory(dir) {
  if (!fs.existsSync(dir)) return;
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
