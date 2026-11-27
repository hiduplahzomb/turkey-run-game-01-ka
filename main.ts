// GOBBLE DASH: Escape Before Dinner — hand-in program (Node 22, standard
// library only). It copies this repository's game/ and screenshots/ into the
// output directory and writes dossier.json there with the vendored make.fun
// library, so the grader can check the entry exactly as it is handed in.
//
// Outside the grader, MAKEFUN_OUTPUT_DIR stands in for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const repoRoot = fileURLToPath(new URL('.', import.meta.url));
const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

const gameOut = join(outDir, 'game');
const shotsOut = join(outDir, 'screenshots');

mkdirSync(outDir, { recursive: true });
rmSync(gameOut, { recursive: true, force: true });
rmSync(shotsOut, { recursive: true, force: true });
cpSync(join(repoRoot, 'game'), gameOut, { recursive: true });
if (existsSync(join(repoRoot, 'screenshots'))) {
  cpSync(join(repoRoot, 'screenshots'), shotsOut, { recursive: true });
} else {
  mkdirSync(shotsOut, { recursive: true });
}

// Caps mirror the gate: at most 4 screenshots of 256 KiB, game/ at most
// 993 files and 48 MiB, paths at most 1000 bytes, dossier text at most 160 KiB.
writeFileSync(
  join(outDir, 'dossier.json'),
  buildDossier(outDir, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    game_max_files: 993,
    game_max_bytes: 50331648,
    game_path_max_bytes: 1000,
  }),
);
