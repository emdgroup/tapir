import type { DefinedError } from 'ajv/dist/vocabularies/errors';
import { ValidationError } from './error';
import { expect } from './test';

const tests: {
    [key: string]: [DefinedError, any];
} = {
    additionalProperties: [{
        keyword: 'additionalProperties',
        instancePath: '',
        schemaPath: '#/additionalProperties',
        params: { additionalProperty: 'bar' },
        message: 'should NOT have additional properties',
    }, { name: 'AdditionalProperties', actual: ['bar'], expected: [] }],
    required: [{
        keyword: 'required',
        instancePath: '',
        schemaPath: '#/required',
        params: { missingProperty: 'bar' },
        message: "should have required property 'bar'",
    }, { name: 'Required', field: 'bar' }],
    nestedArray: [{
        keyword: 'type',
        instancePath: '/bar/0',
        schemaPath: '#/properties/bar/items/type',
        params: { type: 'string' },
        message: 'should be string',
    }, { name: 'Nested', index: 0, field: 'bar', errors: [{
        name: 'TypeMismatch', expected: 'string',
    }] }],
    rootArray: [{
        keyword: 'type',
        instancePath: '/0',
        schemaPath: '#/items/type',
        params: { type: 'string' },
        message: 'should be string',
    }, { name: 'Nested', index: 0, errors: [{
        name: 'TypeMismatch', expected: 'string',
    }] }],
    arrayDataType: [{
        keyword: 'type',
        instancePath: '/',
        schemaPath: '#/items/type',
        params: { type: 'string' },
        message: 'should be string',
    }, {
        name: 'TypeMismatch', expected: 'string',
    }],
};

describe('error', () => {
    describe('translate', () => {
        for (const [name, test] of Object.entries(tests)) {
            const [input, output] = test;
            it(name, () => {
                const err = new ValidationError([input]);
                expect(err.errors).to.deep.equal([output]);
            });
        }
    });
});
