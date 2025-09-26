#!/usr/bin/env node
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const STATIC_ROOT = path.resolve(process.cwd(), '.vercel/output/static');
const WORKER_DIR = path.join(STATIC_ROOT, '_worker.js');
const DIST_NAME = '__next-on-pages-dist__';
const SRC_DIST = path.join(WORKER_DIR, DIST_NAME);
const DST_DIST = path.join(STATIC_ROOT, DIST_NAME);

function getDirSize(dir) {
  let total = 0;
  try {
    const items = fs.readdirSync(dir, { withFileTypes: true });
    for (const it of items) {
      const full = path.join(dir, it.name);
      if (it.isDirectory()) {
        total += getDirSize(full);
      } else if (it.isFile()) {
        try {
          total += fs.statSync(full).size;
        } catch (e) {
          // ignore
        }
      }
    }
  } catch (e) {
    return 0;
  }
  return total;
}

function moveIfExists() {
  try {
    if (!fs.existsSync(SRC_DIST)) return false;

    // wait until directory size stabilizes (avoid moving while files are being written)
    const first = getDirSize(SRC_DIST);
    if (first === 0) return false;
    // small delay
    const wait = 700; // ms
    const start = Date.now();
    while (Date.now() - start < wait) {
      // busy-wait small intervals
      Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 50);
    }
    const second = getDirSize(SRC_DIST);
    if (first !== second) {
      // still changing
      return false;
    }

    // now move atomically
    if (fs.existsSync(DST_DIST)) {
      const bak = DST_DIST + '.bak.' + Date.now();
      fs.renameSync(DST_DIST, bak);
      console.log('Backed up existing', DST_DIST, '->', bak);
    }
    fs.renameSync(SRC_DIST, DST_DIST);
    console.log('Moved', SRC_DIST, '->', DST_DIST);
    return true;
  } catch (e) {
    console.warn('Failed to move dist', e && e.message);
    return false;
  }
}

async function run() {
  console.log(
    'Running next-on-pages and trimming worker output when needed...'
  );

  const child = spawn(
    'pnpx',
    ['@cloudflare/next-on-pages', '--experimental-minify'],
    {
      stdio: 'inherit',
      shell: false,
    }
  );

  // Poll for the src dist every 400ms and move it immediately when detected.
  const interval = setInterval(() => {
    moveIfExists();
  }, 400);

  child.on('exit', (code, signal) => {
    clearInterval(interval);
    // Try one last time
    moveIfExists();
    if (code !== 0) {
      console.error('next-on-pages exited with code', code, 'signal', signal);
      process.exit(code || 1);
    } else {
      console.log('next-on-pages completed successfully.');
      process.exit(0);
    }
  });

  child.on('error', (err) => {
    clearInterval(interval);
    console.error('Failed to start next-on-pages:', err && err.message);
    process.exit(1);
  });
}

run();
