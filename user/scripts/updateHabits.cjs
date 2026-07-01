const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, '../src/screens/HabitScreens');
const files = fs.readdirSync(dir).filter(f => f.endsWith('.tsx'));

for (const file of files) {
  const filePath = path.join(dir, file);
  let content = fs.readFileSync(filePath, 'utf-8');

  // 1. Add Trash2 to lucide-react imports if not there
  if (content.includes('lucide-react') && !content.includes('Trash2')) {
    content = content.replace(/import \{([^}]+)\} from 'lucide-react';/, (match, p1) => {
      return `import { ${p1.trim()}, Trash2 } from 'lucide-react';`;
    });
  }

  // 2. Destructure token and apiUrl
  content = content.replace(/const \{ user \} = useAuth\(\);/, 'const { user, token, apiUrl } = useAuth();');

  // 3. Update getRecentHabits
  content = content.replace(/HabitsService\.getRecentHabits\(user(\.id)?,\s*([^,]+),\s*([^)]+)\)/g, 'HabitsService.getRecentHabits(apiUrl, token, $2, $3)');
  // In case user.id is optional like user?.id
  content = content.replace(/HabitsService\.getRecentHabits\(user\?\.id( as string)?,\s*([^,]+),\s*([^)]+)\)/g, 'HabitsService.getRecentHabits(apiUrl, token, $2, $3)');

  // 4. Update logHabit
  content = content.replace(/HabitsService\.logHabit\(user(\.id)?,\s*([^,]+),\s*([^)]+)\)/g, 'HabitsService.logHabit(apiUrl, token, $2, $3)');
  content = content.replace(/HabitsService\.logHabit\(user\?\.id( as string)?,\s*([^,]+),\s*([^)]+)\)/g, 'HabitsService.logHabit(apiUrl, token, $2, $3)');

  // 5. Add handleDelete function before handleLog
  if (!content.includes('handleDelete')) {
    const deleteFunc = `
  const handleDelete = async (id: string) => {
    if (!token) return;
    try {
      await HabitsService.deleteHabit(apiUrl, token, id);
      await loadHistory();
    } catch (err) {
      console.error('Failed to delete habit', err);
    }
  };
`;
    content = content.replace(/const handleLog = async/, deleteFunc + '\n  const handleLog = async');
  }

  // 6. Update UI for Delete Button
  // Finding the div rendering the history items:
  // usually: <div key={h.id} ...> ... </div>
  // we want to add the Trash2 button next to the Check/Minus icon
  if (content.includes('key={h.id}')) {
    // Find the closing </div> of the item and insert a button before it.
    // This is tricky with regex, let's just replace the icon part
    // Usually it's:
    // {h.value... ? (
    //   <Check className="h-4 w-4 ..." />
    // ) : (
    //   <Minus className="h-4 w-4 ..." />
    // )}
    // </div>
    // Let's replace the last </div> before the map closing.
    content = content.replace(/(\n\s*\{\s*h\.value[^}]+\}\n\s*<\/div>)/g, (match, p1) => {
      // Actually, a better approach is replacing the flex end:
      return match.replace('</div>', `  <button onClick={() => handleDelete(h.id)} className="ml-3 p-1.5 hover:bg-rose-50 text-slate-300 hover:text-rose-500 rounded-lg transition-colors"><Trash2 className="h-4 w-4" /></button>\n              </div>`);
    });
  }

  // 7. Remove font-serif
  content = content.replace(/font-serif/g, 'font-sans');

  fs.writeFileSync(filePath, content, 'utf-8');
}
console.log('Update complete.');
