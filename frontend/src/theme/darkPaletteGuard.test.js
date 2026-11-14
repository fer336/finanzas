// Guards the dark palette: in every file reachable from src/main.jsx, a raw
// color utility (hex or Tailwind palette color) that would also paint in dark
// mode must have a `dark:` sibling for the same property, and that sibling must
// use a theme token. Translucent neutral overlays (bg-black/50, bg-white/5)
// are allowed because they read correctly on any dark background.
import { readFileSync, existsSync, statSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const SRC = resolve(process.cwd(), 'src');
const PROPS = 'bg|text|border(?:-[trblxy])?|ring|from|via|to|divide|placeholder|outline|fill|stroke';
const FAMILIES = 'slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose';
const COLOR = `(?:\\[#[0-9a-fA-F]{3,8}\\]|(?:${FAMILIES})-\\d{2,3}|black|white)`;
const NEUTRAL = /^(?:(?:slate|gray|zinc|neutral|stone)-\d+|black|white|\[#[0-9a-fA-F]+\])$/;
const STRING = /"[^"\n]*"|'[^'\n]*'|`[^`]*`/g;
const IMPORT = /(?:import\s[^'"]*?from\s*|import\s*\(\s*|import\s+)['"](\.[^'"]+)['"]/g;

const utilRe = () => new RegExp(`(?<![\\w\\[\\]:/-])((?:[a-z-]+:)*)(${PROPS})-(${COLOR})(/\\d+)?(?![\\w\\[-])`, 'g');
const darkAnyRe = () => new RegExp(`(?<![\\w\\[\\]:/-])((?:[a-z-]+:)*dark:(?:[a-z-]+:)*)(${PROPS})-(?!\\[?\\d)[\\w\\[\\]#().,%/-]+`, 'g');

const resolveImport = (from, spec) => {
  const base = resolve(dirname(from), spec);
  return [base, `${base}.jsx`, `${base}.js`, join(base, 'index.jsx'), join(base, 'index.js')]
    .find((candidate) => existsSync(candidate) && statSync(candidate).isFile());
};

const liveFiles = () => {
  const seen = new Set();
  const stack = [join(SRC, 'main.jsx')];
  while (stack.length) {
    const file = stack.pop();
    if (seen.has(file)) continue;
    seen.add(file);
    for (const [, spec] of readFileSync(file, 'utf8').matchAll(IMPORT)) {
      const target = resolveImport(file, spec);
      if (target && /\.jsx?$/.test(target)) stack.push(target);
    }
  }
  return [...seen].filter((file) => !/\.test\./.test(file));
};

// A neutral translucent overlay, or an existing white/black overlay.
const isOverlay = (color, opacity) => Boolean(opacity) && NEUTRAL.test(color);

export const findDarkPaletteViolations = (files) => {
  const violations = [];
  for (const file of files) {
    const text = readFileSync(file, 'utf8');
    for (const [literal] of text.matchAll(STRING)) {
      const darkKeys = new Set(
        [...literal.matchAll(darkAnyRe())].map((m) => `${m[1].replace('dark:', '')}|${m[2]}`)
      );
      for (const m of literal.matchAll(utilRe())) {
        const [whole, variants, prop, color, opacity] = m;
        if (isOverlay(color, opacity)) continue;
        if (variants.includes('dark:')) {
          violations.push(`${file.replace(`${SRC}/`, '')}: ${whole} (raw color in dark variant)`);
        } else if (!darkKeys.has(`${variants}|${prop}`)) {
          violations.push(`${file.replace(`${SRC}/`, '')}: ${whole} (no dark token)`);
        }
      }
    }
  }
  return violations;
};

describe('dark palette guard', () => {
  it('finds the live app through main.jsx', () => {
    expect(liveFiles().length).toBeGreaterThan(40);
  });

  it('leaves no raw color painting in dark mode in live files', () => {
    expect(findDarkPaletteViolations(liveFiles())).toEqual([]);
  });

  it('flags raw colors without a dark token and accepts tokens and overlays', () => {
    const sample = join(SRC, 'theme', '__fixtures__', 'darkPaletteSample.jsx');
    expect(findDarkPaletteViolations([sample]).map((v) => v.split(': ')[1])).toEqual([
      'bg-zinc-900 (no dark token)',
      'dark:text-[#c8c093] (raw color in dark variant)',
    ]);
  });
});
