const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, '../src/screens/HabitScreens');
const files = fs.readdirSync(dir).filter(f => f.endsWith('.tsx'));

for (const file of files) {
  const filePath = path.join(dir, file);
  let content = fs.readFileSync(filePath, 'utf-8');

  // If Trash2 is imported but there is no "<Trash2 " or "Trash2>" in the file
  if (content.includes('Trash2') && !content.includes('<Trash2')) {
    content = content.replace(/,\s*Trash2/, '');
  }

  // If handleDelete is defined but never called
  if (content.includes('handleDelete') && !content.includes('onClick={() => handleDelete')) {
    content = content.replace(/\s*const handleDelete = async \(id: string\) => \{[\s\S]*?\}\;\n/, '');
  }

  // loadHistory not found in SubstancesLogScreen
  // SubstancesLogScreen doesn't have loadHistory defined!
  if (file === 'SubstancesLogScreen.tsx' && content.includes('await loadHistory();')) {
    content = content.replace(/await loadHistory\(\);\n/g, '');
  }

  fs.writeFileSync(filePath, content, 'utf-8');
}
console.log('Fixed unused variables.');
