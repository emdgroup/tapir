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
    fs.unlinkSync(entrypoint);
}
