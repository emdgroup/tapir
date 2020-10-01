/* eslint-disable @typescript-eslint/no-var-requires */
import * as fs from 'fs';

import * as path from 'path';

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
    fs.writeFileSync(path.resolve(__dirname, `foo.${files}.ts`), core + source);
    fs.writeFileSync(path.resolve(__dirname, `foo.${files}.js`), transpiled.outputText);
    delete require.cache[require.resolve(`./foo.${files}.js`)];
    const lib = require(`./foo.${files}.js`) as any;
    fs.unlinkSync(path.resolve(__dirname, `foo.${files}.ts`));
    fs.unlinkSync(path.resolve(__dirname, `foo.${files}.js`));
    return lib;
}

export function testAssertion(assertion: () => void, errors: Errors[]): void {
    try {
        assertion();
        if (errors.length) expect(false, 'No exception thrown').to.be.true;
    } catch(err: any) {
        const isValidationError = err instanceof ValidationError;
        if (!isValidationError) console.log(err);
        expect(isValidationError).to.be.true;
        for (const [idx, error] of (err.errors as Errors[]).entries()) {
            expect(errors[idx]).to.not.be.undefined;
            expect(error).to.deep.include(errors[idx]);
        }
    }
}
