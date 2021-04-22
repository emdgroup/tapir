import type { DefinedError } from 'ajv/dist/vocabularies/errors';

interface ErrorDetails {
    name: string;
    field?: string;
    errors?: Errors[];
    index?: number;
}

interface RequiredError extends ErrorDetails {
    name: 'Required';
}

type PrimitiveType = 'string' | 'array' | 'boolean' | 'number' | 'object';

interface TypeMismatchError extends ErrorDetails {
    name: 'TypeMismatch';
    expected: PrimitiveType;
}
interface EnumError extends ErrorDetails {
    name: 'Enum';
    expected?: string;
}

interface FormatError extends ErrorDetails {
    name: 'Format';
    expected: 'date';
}

interface NestedError extends ErrorDetails {
    name: 'Nested';
}

interface AdditionalPropertiesError extends ErrorDetails {
    name: 'AdditionalProperties';
    expected: [];
    actual: string[];
}

export type Errors = RequiredError | TypeMismatchError | AdditionalPropertiesError | FormatError  | NestedError | EnumError;

const isNumber = new RegExp(/^\d+$/);
export class ValidationError extends Error {
    errors: Errors[];

    translate(input: DefinedError[]): Errors[] {
        const errors: Errors[] = [];
        for (const error of input) {
            const [_, rawField, nested] = error.instancePath.split('/');
            const field = rawField !== undefined && rawField.length && !isNumber.test(rawField) ? { field: rawField } : {};
            if (nested || isNumber.test(rawField)) {
                const err = this.translate([{
                    ...error,
                    instancePath: '/',
                }]);
                errors.push({
                    name: 'Nested',
                    ...field,
                    index: parseInt(nested ?? rawField, 10),
                    errors: err,
                });
            } else if (error.keyword === 'enum') {
                errors.push({
                    name: 'Enum',
                    ...field,
                });
            } else if (error.keyword === 'required') {
                errors.push({
                    name: 'Required',
                    field: error.params.missingProperty,
                });
            } else if (error.keyword === 'type') {
                errors.push({
                    name: 'TypeMismatch',
                    expected: error.params.type as PrimitiveType,
                    ...field,
                });
            } else if (error.keyword === 'additionalProperties') {
                errors.push({
                    name: 'AdditionalProperties',
                    actual: [error.params.additionalProperty],
                    expected: [],
                    ...field,
                });
            }
        }
        return errors;
    }

    constructor(errors: DefinedError[]) {
        super();
        this.name = 'ValidationError';
        this.errors = this.translate([...errors]);
    }

    toString(): string {
        return JSON.stringify(this.errors);
    }
}
