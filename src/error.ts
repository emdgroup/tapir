interface ErrorDetails {
    name: string;
    field?: string;
    errors?: Errors[];
    index?: number;
}

interface RequiredError extends ErrorDetails {
    name: 'Required';
}

interface TypeMismatchError extends ErrorDetails {
    name: 'TypeMismatch';
    expected: 'string' | 'array' | 'boolean' | 'number' | 'object';
}
interface EnumError extends ErrorDetails {
    name: 'Enum';
    expected: string;
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


export class ValidationError extends Error {
    errors: Errors[];

    constructor(errors: Errors[]) {
        super();
        this.name = 'ValidationError';
        this.errors = errors;
    }

    toString(): string {
        return JSON.stringify(this.errors);
    }
}
