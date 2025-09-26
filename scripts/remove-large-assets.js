const fs = require('fs');
const path = require('path');

const BASE = path.resolve(process.cwd(), '.next');
const MAX_BYTES = 25 * 1024 * 1024; // 25 MiB

function walk(dir) {
  try {
    const items = fs.readdirSync(dir, { withFileTypes: true });
    for (const it of items) {
      const full = path.join(dir, it.name);
      if (it.isDirectory()) {
        walk(full);
      } else if (it.isFile()) {
        try {
          const stat = fs.statSync(full);
          if (stat.size > MAX_BYTES) {
            console.log(
              'Removing large file:',
              full,
              (stat.size / (1024 * 1024)).toFixed(2) + 'MiB'
            );
            fs.unlinkSync(full);
          }
        } catch (e) {
          console.warn('Could not stat/unlink', full, e.message);
        }
      }
    }
  } catch (e) {
    // ignore
  }
}

console.log('Scanning .next for files >25MiB...');
walk(BASE);
console.log('Done.');
