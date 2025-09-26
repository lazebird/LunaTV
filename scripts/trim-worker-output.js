const fs = require('fs');
const path = require('path');

const STATIC_ROOT = path.resolve(process.cwd(), '.vercel/output/static');
const WORKER_DIR = path.join(STATIC_ROOT, '_worker.js');
const DIST_NAME = '__next-on-pages-dist__';

function safeMove(src, dest) {
  try {
    if (!fs.existsSync(src)) return false;
    // if dest exists, rename to a timestamped backup
    if (fs.existsSync(dest)) {
      const backup = dest + '.backup.' + Date.now();
      fs.renameSync(dest, backup);
      console.log('Existing dest moved to backup:', backup);
    }
    fs.renameSync(src, dest);
    return true;
  } catch (e) {
    console.warn('Failed to move', src, '->', dest, e && e.message);
    return false;
  }
}

try {
  console.log('Trimming worker output...');

  // remove large build log if present
  const logFile = path.join(WORKER_DIR, 'nop-build-log.json');
  if (fs.existsSync(logFile)) {
    try {
      fs.unlinkSync(logFile);
      console.log('Removed build log:', logFile);
    } catch (e) {
      console.warn('Could not remove build log', logFile, e && e.message);
    }
  }

  const srcDist = path.join(WORKER_DIR, DIST_NAME);
  const dstDist = path.join(STATIC_ROOT, DIST_NAME);
  if (fs.existsSync(srcDist)) {
    const ok = safeMove(srcDist, dstDist);
    if (ok) {
      console.log(`Moved ${srcDist} -> ${dstDist} to keep the worker small.`);
    }
  } else {
    console.log('No', srcDist, 'found — nothing to move.');
  }

  console.log('Done trimming worker output.');
} catch (err) {
  console.error('Error trimming worker output:', err && err.message);
  process.exitCode = 1;
}
