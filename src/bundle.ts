import * as fs from 'fs';
import { buildSync } from 'esbuild';
import * as path from 'path';

const ajvPath = require.resolve('ajv');
let nodePath = ajvPath;
while (path.basename(nodePath) !== 'node_modules') {
    nodePath = path.resolve(nodePath, '..');
}

export function bundle(entrypoint: string, outfile: string): void {
    buildSync({
        entryPoints: [entrypoint],
        outfile: `${outfile}.js`,
        platform: 'node',
        format: 'cjs',
        bundle: true,
        nodePaths: [nodePath],
    });
    fs.unlinkSync(entrypoint);
}
