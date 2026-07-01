const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, '../src/screens/HabitScreens');
const files = fs.readdirSync(dir).filter(f => f.endsWith('.tsx'));

for (const file of files) {
  const filePath = path.join(dir, file);
  let content = fs.readFileSync(filePath, 'utf-8');

  // Replace double finally blocks
  const doubleFinallyRegex = /\}\s*finally\s*\{\s*setLoadingHistory\(false\);\s*\}\s*finally\s*\{/g;
  
  if (doubleFinallyRegex.test(content)) {
    content = content.replace(doubleFinallyRegex, '} finally {\n      setLoadingHistory(false);');
    fs.writeFileSync(filePath, content, 'utf-8');
    console.log(`Fixed ${file}`);
  }
}

console.log('Double finally blocks fixed.');
