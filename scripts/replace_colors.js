const fs = require('fs');
const path = require('path');

const replacements = [
  [/bg-orange-/g, 'bg-blue-'],
  [/text-orange-/g, 'text-blue-'],
  [/border-orange-/g, 'border-blue-'],
  [/bg-green-/g, 'bg-emerald-'],
  [/text-green-/g, 'text-emerald-'],
  [/border-green-/g, 'border-emerald-'],
  [/bg-yellow-/g, 'bg-amber-'],
  [/text-yellow-/g, 'text-amber-'],
  [/border-yellow-/g, 'border-amber-'],
  [/#FF8C2B/g, '#2563EB'], // some raw color might be in charts
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
