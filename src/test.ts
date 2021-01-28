/* eslint-disable @typescript-eslint/no-var-requires */
import * as fs from 'fs';

import { Generator } from '.';

import * as crypto from 'crypto';
import { OpenAPIV3 } from 'openapi-types';
import * as path from 'path';

import { expect } from 'chai';

export { expect } from 'chai';

import { Errors } from './error';

export interface TestSuite {
    subject: Parameters<typeof setup>[0];
    tests: {
        input: any;
        errors?: Errors[];
    }[];
}

export function testAssertion(ValidationError: any, assertion: () => void, errors: Errors[]): void {
    try {
        assertion();
        if (errors.length) expect(false, 'No exception thrown').to.be.true;
    } catch(err: any) {
        const isValidationError = err instanceof ValidationError;
        if (!isValidationError) console.log(err);
        expect(isValidationError).to.be.true;
        expect(err.errors.length).to.equal(errors.length, 'number of errors');
        for (const [idx, error] of (err.errors as Errors[]).entries()) {
            expect(errors[idx]).to.not.be.undefined;
            expect(error).to.deep.equal(errors[idx]);
        }
    }
}

export async function setup(schemas: OpenAPIV3.ComponentsObject['schemas']): Promise<any> {
    const TMP = path.join(process.cwd(), 'tmp', crypto.randomBytes(8).toString('hex'));
    fs.mkdirSync(TMP);
    const generator = new Generator({
        api: {
            openapi: '3.0.3',
            info: {
                title: 'test',
                version: '1.0.0',
            },
            paths: {
                '/foo': {},
            },
            components: {
                schemas,
            },
        },
        out: TMP,
    });

    await generator.generate();

    after(async () => Promise.all(
        ['types.js', 'types.mjs', 'types.d.ts']
            .map((f) => fs.promises.unlink(path.join(TMP, f)).catch(() => null))
    ).then(() => fs.promises.rmdir(TMP)));

    return require(path.join(TMP, 'types.js'));
}

export function runSuite(suite: TestSuite[]): void {
    describe('Interface', () => suite.forEach(({ subject, tests }) => {
        const name = Object.keys(subject!)[0];
        describe(name, () => {
            let types: any;
            before(async () => types = await setup(subject));
            const assertionName = `assert${name}`;
            it(assertionName, () => tests.forEach((test) => {
                testAssertion(types.ValidationError, () => types[assertionName](test.input), test.errors || []);
            }));
            const typeGuardName = `is${name}`;
            it(typeGuardName, () => tests.forEach((test) => {
                expect(types[typeGuardName](test.input)).to.equal(!test.errors);
            }));
        });
    }));
}
