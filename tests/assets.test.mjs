import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';

const root = new URL('../', import.meta.url).pathname;
const walk = dir => fs.readdirSync(dir, { withFileTypes: true }).flatMap(entry =>
  entry.name.startsWith('.') ? [] : entry.isDirectory()
    ? walk(path.join(dir, entry.name)) : [path.join(dir, entry.name)]);
const files = walk(root);
const image = /\.(?:png|webp|jpe?g|svg|gif|ico)$/i;
const used = new Set();
for (const file of files.filter(f => /\.(?:html|css|js|svg|json)$/.test(f))) {
  const source = fs.readFileSync(file, 'utf8');
  for (const match of source.matchAll(/(?:\.\.\/|\.\/|\/)assets\/[\w./-]+/g)) {
    if (!image.test(match[0])) continue;
    const target = match[0].startsWith('/assets/')
      ? path.join(root, match[0]) : path.resolve(path.dirname(file), match[0]);
    assert.ok(fs.existsSync(target), `${path.relative(root, file)}: missing ${match[0]}`);
    used.add(target);
  }
}
const images = files.filter(f => f.startsWith(path.join(root, 'assets') + '/') && image.test(f));
assert.deepEqual(images.filter(f => !used.has(f)).map(f => path.relative(root, f)), [], 'Unused image assets');
console.log(`PASS: ${images.length} images, all referenced and all image paths exist (including data attributes and CSS backgrounds).`);
