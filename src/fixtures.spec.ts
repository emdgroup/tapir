/* eslint-disable @typescript-eslint/no-var-requires */
import { expect } from './test';
import { posix as path } from 'path';
import { promises as fs, readFileSync } from 'fs';
import * as yaml from 'js-yaml';


import { Generator } from './index';
import { OpenAPIV3 } from 'openapi-types';

const fixtures: {
    name: string;
    file: string;
    tests: {
        [key: string]: {
            input: any;
            result: boolean;
        }[]
    };
}[] = [{
    name: 'random',
    file: 'random.openapi.yml',
    tests: {
        isTeamInvitation: [{
            input: { stateRef: null },
            result: true,
        }, {
            input: { stateInlined: null },
            result: true,
        }],
        isTeamInvitationState: [{
            input: null,
            result: true,
        }],
        isDescribeDomainRequest: [{
            // test that operationIds are properly upper-cased
            input: { queryStringParameters: { required: 'true' } },
            result: true,
        }, {
            // test that operationIds are properly upper-cased
            input: { queryStringParameters: null },
            result: false,
        }, {
            // test that operationIds are properly upper-cased
            input: { },
            result: false,
        }],
        isGetPetRequest: [{
            input: {},
            result: false,
        }, {
            input: { pathParameters: {} },
            result: false,
        }, {
            input: { pathParameters: { petId: 'foo' } },
            result: true,
        }, {
            input: { pathParameters: { petId: 'foo' }, queryStringParameters: null },
            result: true,
        }, {
            input: { pathParameters: { petId: 'foo' }, queryStringParameters: {} },
            result: true,
        }, {
            input: { pathParameters: { petId: 'foo' }, queryStringParameters: { q: 'str' } },
            result: true,
        }, {
            input: { pathParameters: { petId: 'foo' }, queryStringParameters: { q: 1 } },
            result: false,
        }],
    },
}];

describe('fixtures', () => fixtures.forEach((test) => {
    describe(test.name, () => {
        const out = path.resolve('tmp', test.name);
        before(async () => {
            await fs.mkdir(out, { recursive: true });
            const generator = new Generator({
                api: yaml.load(readFileSync(path.join('fixtures', test.file)).toString()) as OpenAPIV3.Document,
                out,
                ajvOptions: {
                    validateFormats: true,
                },
            });
            await generator.generate();
        });
        Object.keys(test.tests).forEach((t) => it(t, () => {
            const guards = require(path.join(out, 'types.js'));
            expect(guards[t]).to.be.a('function', t);
            test.tests[t].forEach((v, idx) => {
                expect(guards[t](v.input)).to.equal(v.result, `test ${idx}`);
            });
        }));
    });
}));
