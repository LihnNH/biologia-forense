import { mkdir, readdir, stat } from 'node:fs/promises';
import { join } from 'node:path';
import sharp from 'sharp';

const source = 'assets/casos';
const destination = 'assets/casos-webp';
let originalBytes = 0;
let optimizedBytes = 0;
let count = 0;

for (const folder of await readdir(source)) {
  const sourceFolder = join(source, folder);
  if (!(await stat(sourceFolder)).isDirectory()) continue;
  const destinationFolder = join(destination, folder);
  await mkdir(destinationFolder, { recursive: true });
  for (const file of await readdir(sourceFolder)) {
    if (!file.endsWith('.png')) continue;
    const original = join(sourceFolder, file);
    const optimized = join(destinationFolder, file.replace(/\.png$/, '.webp'));
    const result = await sharp(original)
      .resize({ width: 480, withoutEnlargement: true })
      .webp({ quality: 84, effort: 5 })
      .toFile(optimized);
    originalBytes += (await stat(original)).size;
    optimizedBytes += result.size;
    count++;
  }
}

console.log(`${count} retratos: ${(originalBytes / 1_000_000).toFixed(2)} MB → ${(optimizedBytes / 1_000_000).toFixed(2)} MB (${(100 * (1 - optimizedBytes / originalBytes)).toFixed(1)}% menores).`);
