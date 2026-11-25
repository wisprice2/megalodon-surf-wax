import fs from 'node:fs';
import path from 'node:path';

fs.mkdirSync('dist', { recursive: true });
for (const entry of fs.readdirSync('.')) {
  if (/\.(html|css|png|jpe?g|webp|svg|mp4|ico|txt|xml)$/.test(entry) || entry === 'cart.js') {
    fs.copyFileSync(entry, path.join('dist', entry));
  }
}
if (fs.existsSync('migrated-images')) fs.cpSync('migrated-images', 'dist/migrated-images', { recursive: true });
fs.writeFileSync('dist/_routes.json', JSON.stringify({version:1,include:['/api/*','/media/*'],exclude:[]}));
console.log('Archivos públicos preparados. API, secretos y scripts internos excluidos.');
