import { buildWriteCb, transpile, testAssertion, expect } from '../test';

import { Errors } from '../error';
import { SchemaType } from './base';
import { Composite } from './composite';

const guards = `
function isCat({ sound }) { return sound === 'meow'; }
function isDog({ sound }) { return sound === 'woof'; }

function assertCat({ sound }) { if (sound !== 'meow') throw new ValidationError({ name: 'TypeMismatch' }); }
function assertDog({ sound }) { if (sound !== 'woof') throw new ValidationError({ name: 'TypeMismatch' }); }
`;

const suite = [{
    subject: new Composite('OneOf', {
        oneOf: [{
            '$ref': '#/components/Cat',
        }, {
            '$ref': '#/components/Dog',
        }],
    }),
    tests: [{
        input: { sound: 'woof' },
    }, {
        input: { sound: 'meow' },
    }, {
        input: { sound: 'mooh' },
        errors: [{ name: 'ValidationError' }, { name: 'ValidationError' }],
    }],
}] as {
    subject: SchemaType;
    tests: {
        input: any;
        errors?: Errors[];
    }[];
}[];

describe('Composite', () => suite.forEach(({ subject, tests }) => {
    describe(subject.name, () => {
        const [out, writeCb] = buildWriteCb();
        subject.emitDefinition(writeCb);
        subject.emitTypeAssertion(writeCb);
        subject.emitTypeGuard(writeCb);
        const funcs = transpile(guards + out());
        it(subject.assertionName, () => tests.forEach((test) => {
            testAssertion(() => funcs[subject.assertionName](test.input), test.errors || []);
        }));
        it(subject.typeGuardName, () => tests.forEach((test) => {
            expect(funcs[subject.typeGuardName](test.input)).to.equal(!test.errors);
        }));
    });
}));
