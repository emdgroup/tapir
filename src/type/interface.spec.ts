import { buildWriteCb, transpile, testAssertion, expect } from '../test';

import { Errors } from '../error';
import { SchemaType } from './base';
import { Interface } from './interface';

const suite = [{
    subject: new Interface('TestType', {
        properties: {
            foo: {
                type: 'string',
            },
            bar: {
                type: 'array',
                items: {
                    type: 'string',
                },
            },
        },
    }),
    tests: [{
        input: { foo: 123 },
        errors: [{ name: 'TypeMismatch', expected: 'string', field: 'foo' }],
    }, {
        input: { foo: 'bar' },
    }, {
        input: { bar: 'bar' },
        errors: [{ name: 'TypeMismatch', expected: 'array', field: 'bar' }],
    }, {
        input: { bar: ['bar'] },
    }, {
        input: { bar: [123] },
        errors: [{ name: 'Nested', index: 0, field: 'bar', errors: [{
            name: 'TypeMismatch', expected: 'string',
        }] }],
    }],
}, {
    subject: new Interface('RequiredProps', {
        required: ['bar'],
        properties: {
            foo: {
                type: 'string',
            },
            bar: {
                type: 'array',
                items: {
                    type: 'string',
                },
            },
        },
    }),
    tests: [{
        input: { foo: '123' },
        errors: [{ name: 'Required', field: 'bar' }],
    }, {
        input: { bar: ['123'] },
    }],
}, {
    subject: new Interface('AdditionalProperties', {
        additionalProperties: false,
        properties: {
            foo: {
                type: 'string',
            },
        },
    }),
    tests: [{
        input: { foo: '123' },
    }, {
        input: { bar: '123' },
        errors: [{ name: 'AdditionalProperties', actual: ['bar'] }],
    }],
}] as {
    subject: SchemaType;
    tests: {
        input: any;
        errors?: Errors[];
    }[];
}[];

describe('Interface', () => suite.forEach(({ subject, tests }) => {
    describe(subject.name, () => {
        const [out, writeCb] = buildWriteCb();
        subject.emitDefinition(writeCb);
        subject.emitTypeAssertion(writeCb);
        subject.emitTypeGuard(writeCb);
        const funcs = transpile(out());
        it(subject.assertionName, () => tests.forEach((test) => {
            testAssertion(() => funcs[subject.assertionName](test.input), test.errors || []);
        }));
        it(subject.typeGuardName, () => tests.forEach((test) => {
            expect(funcs[subject.typeGuardName](test.input)).to.equal(!test.errors);
        }));
    });
}));
