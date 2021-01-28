import { runSuite, TestSuite } from '../test';

const suite: TestSuite[] = [{
    subject: { TestType: {
        type: 'array',
        items: {
            type: 'string',
        },
    } },
    tests: [{
        input: [['foo', 'bar']],
        errors: [{ name: 'Nested', index: 0, errors: [{
            name: 'TypeMismatch', expected: 'string',
        }] }],
    }, {
        input: ['bar'],
    }, {
        input: 'bar',
        errors: [{ name: 'TypeMismatch', expected: 'array' }],
    }, {
        input: ['abc', 123],
        errors: [{ name: 'Nested', index: 1, errors: [{
            name: 'TypeMismatch', expected: 'string',
        }] }],
    }],
}];

runSuite(suite);
