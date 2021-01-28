import { runSuite, TestSuite } from '../test';

const suite: TestSuite[] = [{
    subject: { TestType: {
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
    } },
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
    subject: { RequiredProps: {
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
    } },
    tests: [{
        input: { foo: '123' },
        errors: [{ name: 'Required', field: 'bar' }],
    }, {
        input: { bar: ['123'] },
    }],
}, {
    subject: { AdditionalProperties: {
        additionalProperties: false,
        properties: {
            foo: {
                type: 'string',
            },
        },
    } },
    tests: [{
        input: { foo: '123' },
    }, {
        input: { bar: '123' },
        errors: [{ name: 'AdditionalProperties', actual: ['bar'], expected: [] }],
    }],
}];

runSuite(suite);
