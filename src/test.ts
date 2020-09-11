/* eslint-disable @typescript-eslint/no-var-requires */
import * as fs from 'fs';

import { expect } from 'chai';

export { expect } from 'chai';

import * as ts from "typescript";

import { Errors, ValidationError } from './error';

export function buildWriteCb(): [() => string, (line: string | string[], indent?: number) => void] {
    let out = '';
    return [() => out, (line: string | string[], indent = 0) => {
        const lines: string[] = Array.isArray(line) ? line : [line];
        const padding = Array.from({ length: indent }, () => ' ').join('');
        for (const l of lines) out += `${padding}${l}\n`;
    }];
}

const core = fs.readFileSync('./src/core.ts');

let files = 0;

export function transpile(source: string): Record<string, (...args: any[]) => any> {
    const transpiled = ts.transpileModule(core + source, {
        compilerOptions: {
            module: ts.ModuleKind.CommonJS,
            target: ts.ScriptTarget.ES2019,
            strict: true,
            strictNullChecks: true,
        },
    });
    files++;
    fs.writeFileSync(`./src/foo.${files}.ts`, core + source);
    fs.writeFileSync(`./src/foo.${files}.js`, transpiled.outputText);
    const lib = require(`./foo.${files}.js`) as any;
    fs.unlinkSync(`./src/foo.${files}.js`);
    fs.unlinkSync(`./src/foo.${files}.ts`);
    return lib;
}

export function testAssertion(assertion: () => void, errors: Errors[]): void {
    try {
        assertion();
        if (errors.length) expect(false, 'No exception thrown').to.be.true;
    } catch(err: any) {
        expect(err instanceof ValidationError).to.be.true;
        for (const [idx, error] of (err.errors as Errors[]).entries()) {
            expect(errors[idx]).to.not.be.undefined;
            expect(error).to.deep.include(errors[idx]);
        }
    }
}
