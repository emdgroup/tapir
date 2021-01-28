import { runSuite, TestSuite } from '../test';

const suite: TestSuite[] = [{
    subject: { TestEnum: {
        type: 'string',
        enum: [
            'foo',
            'bar',
        ],
    } },
    tests: [{
        input: 'foo',
    }, {
        input: 'bar',
    }, {
        input: 'baz',
        errors: [{ name: 'Enum' }],
    }],
}];

runSuite(suite);
