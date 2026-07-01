const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, '../src/screens/HabitScreens');
const files = fs.readdirSync(dir).filter(f => f.endsWith('.tsx'));

for (const file of files) {
  const filePath = path.join(dir, file);
  let content = fs.readFileSync(filePath, 'utf-8');

  // Skip if already applied
  if (content.includes('loadingHistory')) continue;

  // 1. Add loadingHistory state
  content = content.replace(
    /const \[history, setHistory\] = useState<HabitLog\[\]>\(\[\]\);/,
    'const [history, setHistory] = useState<HabitLog[]>([]);\n  const [loadingHistory, setLoadingHistory] = useState(true);'
  );

  // 2. Update loadHistory to use setLoadingHistory
  content = content.replace(
    /const loadHistory = async \(\) => \{[\s\S]*?try \{/,
    (match) => match + '\n      setLoadingHistory(true);'
  );

  content = content.replace(
    /setHistory\(([^)]+)\);\n\s*\} catch/,
    (match, p1) => `setHistory(${p1});\n    } catch`
  );

  content = content.replace(
    /console\.error\(([^)]+)\);\n\s*\}/,
    (match, p1) => `console.error(${p1});\n    } finally {\n      setLoadingHistory(false);\n    }`
  );

  // 3. Update the render logic for the spinner
  // Current pattern:
  // {history.length === 0 ? (
  //   <div className="text-center py-8">
  //     <div className="w-6 h-6 border-2 border-slate-200 border-t-slate-400 rounded-full animate-spin mx-auto mb-3"></div>
  //     <p className="text-xs text-slate-400">No fasts logged yet</p>
  //   </div>
  // )
  
  content = content.replace(/\{history\.length === 0 \? \(\s*<div className="text-center py-8">\s*<div className="w-6 h-6 border-2 border-slate-200 border-t-slate-400 rounded-full animate-spin mx-auto mb-3"><\/div>\s*<p className="text-xs text-slate-400">([^<]+)<\/p>\s*<\/div>\s*\) : \(/, 
  (match, p1) => {
    return `{loadingHistory ? (
          <div className="text-center py-8">
            <div className="w-6 h-6 border-2 border-slate-200 border-t-slate-400 rounded-full animate-spin mx-auto mb-3"></div>
          </div>
        ) : history.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-xs text-slate-400">${p1}</p>
          </div>
        ) : (`;
  });

  fs.writeFileSync(filePath, content, 'utf-8');
}

console.log('Fixed loaders.');
