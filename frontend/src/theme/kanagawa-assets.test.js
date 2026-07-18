import { existsSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { kanagawaAssets } from './kanagawa-assets';

const expectedAssets = [
  '/assets/kanagawa/kanagawa-dashboard-background.webp',
  '/assets/kanagawa/kanagawa-dashboard-background-light.webp',
  '/assets/kanagawa/kanagawa-dashboard-background-mobile.webp',
  '/assets/kanagawa/kanagawa-dashboard-background-light-mobile.webp',
  '/assets/kanagawa/kanagawa-income-pines-transparent.webp',
  '/assets/kanagawa/kanagawa-expense-fuji-transparent.webp',
];

const resolvePublicPath = (assetPath) => path.join(process.cwd(), 'public', assetPath.replace(/^\//, ''));

const readWebPChunks = (buffer) => {
  const chunks = [];
  let offset = 12;

  while (offset + 8 <= buffer.length) {
    const type = buffer.toString('ascii', offset, offset + 4);
    const size = buffer.readUInt32LE(offset + 4);
    const payloadOffset = offset + 8;
    chunks.push({ type, size, payloadOffset });
    offset = payloadOffset + size + (size % 2);
  }

  return chunks;
};

const hasAlphaEvidence = (buffer) => {
  const chunks = readWebPChunks(buffer);
  const hasAlphChunk = chunks.some((chunk) => chunk.type === 'ALPH');
  const vp8xChunk = chunks.find((chunk) => chunk.type === 'VP8X');
  const hasVp8xAlphaFlag = vp8xChunk ? (buffer[vp8xChunk.payloadOffset] & 0x10) === 0x10 : false;
  return hasAlphChunk || hasVp8xAlphaFlag;
};

describe('kanagawaAssets contract', () => {
  it('registers exactly the expected WebP runtime assets', () => {
    const registeredPaths = Object.values(kanagawaAssets).sort();

    expect(registeredPaths).toEqual([...expectedAssets].sort());
    expect(registeredPaths.every((assetPath) => assetPath.endsWith('.webp'))).toBe(true);
    expect(registeredPaths.some((assetPath) => assetPath.endsWith('.png'))).toBe(false);
  });

  it('points to existing small WebP public files', () => {
    for (const assetPath of expectedAssets) {
      const filePath = resolvePublicPath(assetPath);

      expect(existsSync(filePath), `${assetPath} should exist`).toBe(true);
      const buffer = readFileSync(filePath);
      expect(statSync(filePath).size, `${assetPath} should stay under 300KB`).toBeLessThanOrEqual(300000);
      expect(buffer.toString('ascii', 0, 4), `${assetPath} RIFF signature`).toBe('RIFF');
      expect(buffer.toString('ascii', 8, 12), `${assetPath} WEBP signature`).toBe('WEBP');
    }
  });

  it('keeps alpha evidence in transparent income and expense artwork', () => {
    for (const assetPath of [kanagawaAssets.incomePines, kanagawaAssets.expenseFuji]) {
      const buffer = readFileSync(resolvePublicPath(assetPath));
      expect(hasAlphaEvidence(buffer), `${assetPath} should include WebP alpha metadata`).toBe(true);
    }
  });
});
