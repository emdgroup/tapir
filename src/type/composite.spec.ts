import { runSuite, TestSuite } from '../test';

const suite: TestSuite[] = [{
    subject: { OneOf: {
        oneOf: [{
            type: 'string',
            enum: ['meow'],
        }, {
            type: 'string',
            enum: ['woof'],
        }],
    } },
    tests: [{
        input: 'woof',
    }, {
        input: 'meow',
    }, {
        input: 'mooh',
        errors: [{ name: 'Enum' }, { name: 'Enum' }],
    }],
}];

runSuite(suite);
