import { readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

const schema = readFileSync(new URL('../prisma/schema.prisma', import.meta.url), 'utf8');
const hasModels = /^\s*model\s+\w+\s+{/m.test(schema);

if (!hasModels) {
  console.log('Prisma schema has no models; skipping prisma generate.');
  process.exit(0);
}

const result = spawnSync('prisma', ['generate'], {
  stdio: 'inherit',
  shell: process.platform === 'win32',
});

process.exit(result.status ?? 1);
