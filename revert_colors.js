const fs = require('fs');
const path = require('path');

const replacements = [
  [/bg-slate-/g, 'bg-gray-'],
  [/text-slate-/g, 'text-gray-'],
  [/border-slate-/g, 'border-gray-'],
  [/bg-blue-600/g, 'bg-lpu-orange'],
  [/text-blue-600/g, 'text-lpu-orange'],
  [/border-blue-600/g, 'border-lpu-orange'],
  [/fill-blue-600/g, 'fill-lpu-orange'],
  [/bg-blue-/g, 'bg-orange-'],
  [/text-blue-/g, 'text-orange-'],
  [/border-blue-/g, 'border-orange-'],
  [/bg-emerald-/g, 'bg-green-'],
  [/text-emerald-/g, 'text-green-'],
  [/border-emerald-/g, 'border-green-'],
  [/bg-amber-/g, 'bg-yellow-'],
  [/text-amber-/g, 'text-yellow-'],
  [/border-amber-/g, 'border-yellow-'],
  [/#2563EB/g, '#f27c22']
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
