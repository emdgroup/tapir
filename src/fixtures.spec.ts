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
        isDescribeDomainRequestJson: [{
            // test that operationIds are properly upper-cased
            input: {},
            result: true,
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
            test.tests[t].forEach((v) => {
                expect(guards[t]).to.be.a('function');
                expect(guards[t](v.input)).to.equal(v.result);
            });

        }));
    });
}));
