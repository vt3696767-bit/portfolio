import { readdirSync, statSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const directory = resolve(dirname(fileURLToPath(import.meta.url)), '../dist');
const limit = 25 * 1024 * 1024;
let count = 0;
let largest = { path: '', bytes: 0 };
const oversized = [];

function inspect(folder) {
  for (const item of readdirSync(folder, { withFileTypes: true })) {
    const path = join(folder, item.name);
    if (item.isDirectory()) { inspect(path); continue; }
    const bytes = statSync(path).size;
    count++;
    const name = relative(directory, path).replaceAll('\\', '/');
    if (bytes > largest.bytes) largest = { path: name, bytes };
    if (bytes > limit) oversized.push({ path: name, bytes });
  }
}

inspect(directory);
if (oversized.length) {
  console.error('Cloudflare Pages allows a maximum of 25 MiB per file. Oversized assets:');
  for (const item of oversized) console.error(`  ${item.path}: ${(item.bytes / 1024 / 1024).toFixed(2)} MiB`);
  process.exitCode = 1;
} else {
  console.log(`Pages asset check passed: ${count} files, all within 25 MiB.`);
  console.log(`Largest: ${largest.path} (${(largest.bytes / 1024 / 1024).toFixed(2)} MiB).`);
}
