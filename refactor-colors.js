const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'client', 'src');
const excludeFiles = ['Login.jsx', 'Register.jsx', 'Landing.jsx'];

const colorMap = {
  'coral': 'primary',
  'teal': 'secondary',
  'tangerine': 'accent',
  'mint': 'accent',
  'lavender': 'primary',
  'purple': 'primary',
  'gold': 'warning',
  'cyan': 'secondary'
};

const regex = /\b(text|bg|border|shadow|fill|stroke|ring|from|to|via|blob|badge)-(coral|teal|tangerine|mint|lavender|purple|gold|cyan)(?:-[0-9]{2,3})?\b/g;
const gradientRegex = /\bbg-gradient-(warm|cool|green|soft)\b/g;

function processDirectory(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      processDirectory(fullPath);
    } else if (fullPath.endsWith('.jsx')) {
      if (excludeFiles.includes(file)) {
        console.log(`Skipping ${file}`);
        continue;
      }
      let content = fs.readFileSync(fullPath, 'utf8');
      let modified = false;

      const newContent = content.replace(regex, (match, prefix, color) => {
        modified = true;
        return `${prefix}-${colorMap[color]}`;
      }).replace(gradientRegex, (match, grad) => {
        modified = true;
        return 'bg-primary'; // Simplify all weird gradients to primary background
      });

      if (modified) {
        fs.writeFileSync(fullPath, newContent, 'utf8');
        console.log(`Updated ${file}`);
      }
    }
  }
}

processDirectory(srcDir);
console.log('Done!');
