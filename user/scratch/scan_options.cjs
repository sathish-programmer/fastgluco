const fs = require('fs');
const path = require('path');

function walk(dir) {
  let files = [];
  fs.readdirSync(dir).forEach(f => {
    const p = path.join(dir, f);
    if (fs.statSync(p).isDirectory()) {
      if (!['node_modules', 'dist', 'build', '.git', 'scratch'].includes(f)) {
        files = files.concat(walk(p));
      }
    } else if (/\.(tsx|ts)$/.test(f) && !f.endsWith('.d.ts')) {
      files.push(p);
    }
  });
  return files;
}

const habitFiles = walk('./user/src/screens/HabitScreens');
console.log('--- SCANNING HABIT SCREENS ---');
habitFiles.forEach(hf => {
  const content = fs.readFileSync(hf, 'utf8');
  const lines = content.split('\n');
  lines.forEach((line, idx) => {
    if (line.includes('>Yes') || line.includes('>No') || line.includes('Yes,') || line.includes('No,') || line.includes('Yes (') || line.includes('No (')) {
      if (!line.includes('t(') && !line.includes('//')) {
        console.log(`${path.basename(hf)}:${idx + 1} -> ${line.trim()}`);
      }
    }
  });
});

console.log('\n--- SCANNING MODULES ---');
const moduleFiles = walk('./user/src/modules');
moduleFiles.forEach(mf => {
  const content = fs.readFileSync(mf, 'utf8');
  const lines = content.split('\n');
  lines.forEach((line, idx) => {
    if (line.includes('>Yes') || line.includes('>No') || line.includes('Yes,') || line.includes('No,')) {
      if (!line.includes('t(') && !line.includes('//')) {
        console.log(`${path.basename(mf)}:${idx + 1} -> ${line.trim()}`);
      }
    }
  });
});
