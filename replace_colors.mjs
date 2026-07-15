import fs from 'fs';
import path from 'path';

const SRC_DIR = './src';

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    const dirPath = path.join(dir, f);
    const isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
  });
}

walkDir(SRC_DIR, function(filePath) {
  if (filePath.endsWith('.tsx') || filePath.endsWith('.ts') || filePath.endsWith('.css')) {
    let content = fs.readFileSync(filePath, 'utf-8');
    let newContent = content
      .replace(/violet/g, 'emerald')
      .replace(/indigo/g, 'emerald')
      .replace(/fuchsia/g, 'emerald')
      .replace(/purple/g, 'emerald');
      
    if (content !== newContent) {
      fs.writeFileSync(filePath, newContent, 'utf-8');
      console.log('Updated: ' + filePath);
    }
  }
});
