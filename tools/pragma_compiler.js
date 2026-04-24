#!/usr/bin/env node
import { readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';

const PRAGMA = '// #pragma covian secure';

function transformSource(source, filePath) {
  const lines = source.split(/\r?\n/);
  const out = [];
  let i = 0;

  while (i < lines.length) {
    const trimmed = lines[i].trim();

    if (trimmed === PRAGMA) {
      // Skip blank lines and comment lines between the pragma and the target statement.
      let j = i + 1;
      while (j < lines.length && /^\s*(\/\/.*)?$/.test(lines[j])) {
        out.push(lines[j]);
        j++;
      }

      if (j >= lines.length) {
        throw new Error(
          `${filePath}:${i + 1}: '${PRAGMA}' found but no template-literal assignment follows.`
        );
      }

      // Convert plain template assignment to secure tagged template.
      // Example:
      // const view = `<div>${userInput}</div>`;
      // => const view = secure`<div>${userInput}</div>`;
      const transformed = lines[j].replace(/=\s*`([^`]*)`;?\s*$/, '= secure`$1`;');
      if (transformed === lines[j]) {
        throw new Error(
          `${filePath}:${j + 1}: '${PRAGMA}' directive found but the following line is not a ` +
          'single-line template-literal assignment.'
        );
      }

      out.push(transformed);
      i = j + 1;
      continue;
    }

    out.push(lines[i]);
    i++;
  }

  return out.join('\n');
}

function compileFile(inputPath, outputPath) {
  const source = readFileSync(inputPath, 'utf8');
  const transformed = transformSource(source, inputPath);
  mkdirSync(dirname(outputPath), { recursive: true });
  writeFileSync(outputPath, transformed, 'utf8');
}

const [, , inputPath, outputPath] = process.argv;
if (!inputPath || !outputPath) {
  console.error('Usage: node tools/pragma_compiler.js <input.js> <output.js>');
  process.exit(1);
}

compileFile(inputPath, outputPath);
console.log(`Compiled ${inputPath} -> ${outputPath}`);
