#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const PRAGMA = '#pragma covian secure';

function transformSource(source) {
  const lines = source.split(/\r?\n/);
  const out = [];
  let pending = false;

  for (const line of lines) {
    const trimmed = line.trim();

    if (trimmed === PRAGMA) {
      pending = true;
      continue;
    }

    if (pending) {
      // Convert plain template assignment to secure tagged template.
      // Example:
      // const view = `<div>${userInput}</div>`;
      // => const view = secure`<div>${userInput}</div>`;
      const transformed = line.replace(/=\s*`([\s\S]*)`;?\s*$/, '= secure`$1`;');
      out.push(transformed);
      pending = false;
      continue;
    }

    out.push(line);
  }

  return out.join('\n');
}

function compileFile(inputPath, outputPath) {
  const source = fs.readFileSync(inputPath, 'utf8');
  const transformed = transformSource(source);
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, transformed, 'utf8');
}

const [, , inputPath, outputPath] = process.argv;
if (!inputPath || !outputPath) {
  console.error('Usage: node tools/pragma_compiler.js <input.js> <output.js>');
  process.exit(1);
}

compileFile(inputPath, outputPath);
console.log(`Compiled ${inputPath} -> ${outputPath}`);
