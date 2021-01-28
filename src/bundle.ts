import * as fs from 'fs';
import { buildSync } from 'esbuild';

export function bundle(entrypoint: string, outfile: string): void {
    buildSync({
        entryPoints: [entrypoint],
        outfile: `${outfile}.js`,
        platform: 'node',
        format: 'cjs',
        bundle: true,
    });
    buildSync({
        entryPoints: [`${outfile}.js`],
        outfile: `${outfile}.mjs`,
        platform: 'browser',
        format: 'esm',
        bundle: false,
        target: [
            'es6',
        ],
    });
    fs.unlinkSync(entrypoint);
}
