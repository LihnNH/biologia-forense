import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';

const fromRoot = (path: string) => fileURLToPath(new URL(path, import.meta.url));

function offlineBuild(): Plugin {
  return {
    name: 'forensic-offline',
    apply: 'build',
    enforce: 'post',
    generateBundle: {
      order: 'post',
      handler(_options, bundle) {
        const worker = readFileSync(fromRoot('./src/offline/service-worker.js'), 'utf8');
        const files = Object.keys(bundle).filter(file => !file.endsWith('.map')).sort();
        const hash = createHash('sha256').update(worker);
        for (const file of files) {
          const output = bundle[file];
          hash.update(file).update(output.type === 'chunk' ? output.code : output.source);
        }
        this.emitFile({ type: 'asset', fileName: 'sw.js', source: worker
          .replace('__OFFLINE_VERSION__', JSON.stringify(hash.digest('hex').slice(0, 20)))
          .replace('__OFFLINE_MANIFEST__', JSON.stringify(files)) });
      },
    },
  };
}

export default defineConfig({
  plugins: [react(), offlineBuild()],
  base: './',
  build: {
    rolldownOptions: {
      input: {
        index: fromRoot('./index.html'),
        trabalho: fromRoot('./trabalho.html'),
        debug: fromRoot('./debug/index.html'),
        positions: fromRoot('./debug/positions.html'),
        answers: fromRoot('./debug/gabarito.html'),
      },
    },
  },
});
