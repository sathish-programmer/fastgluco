const fs = require('fs');
const path = require('path');

const files = [
  'admin/src/App.tsx',
  'admin/src/components/AdminWorkflow.tsx',
  'admin/src/components/AdminCancerTests.tsx',
  'admin/src/components/AdminShopProducts.tsx'
];

for (const rel of files) {
  const filePath = path.join(__dirname, '..', rel);
  if (!fs.existsSync(filePath)) continue;

  let content = fs.readFileSync(filePath, 'utf-8');

  // Skip if already has useToast
  if (content.includes('useToast')) continue;

  // 1. Add import
  const importPath = rel === 'admin/src/App.tsx' ? './context/ToastContext' : '../context/ToastContext';
  content = `import { useToast } from '${importPath}';\n` + content;

  // 2. Add hook to component
  // Find component declaration
  if (rel === 'admin/src/App.tsx') {
    content = content.replace(/export default function App\(\) \{/, 'export default function App() {\n  const { showToast } = useToast();\n');
  } else {
    // For components like export const AdminWorkflow: React.FC = () => {
    content = content.replace(/export const [A-Za-z]+: React\.FC[^=]*=\s*\([^)]*\)\s*=>\s*\{/, (match) => {
      return match + '\n  const { showToast } = useToast();\n';
    });
  }

  // 3. Replace alerts
  // Simple regex for alert('...') or alert(...)
  content = content.replace(/alert\(([^)]+)\)/g, (match, p1) => {
    // Determine type based on string content
    let type = "'info'";
    if (p1.toLowerCase().includes('error') || p1.toLowerCase().includes('failed') || p1.toLowerCase().includes('could not')) {
      type = "'error'";
    } else if (p1.toLowerCase().includes('success') || p1.toLowerCase().includes('applied') || p1.toLowerCase().includes('sent') || p1.toLowerCase().includes('deleted')) {
      type = "'success'";
    }
    return `showToast(${p1}, ${type})`;
  });

  fs.writeFileSync(filePath, content, 'utf-8');
}

console.log('Toasts updated.');
