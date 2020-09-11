import { ValidationError, Errors } from './error';

export function isObject(arg: unknown): arg is Record<string, unknown> {
    return arg !== null && typeof arg === "object" && !Array.isArray(arg);
}

export function isString(arg: unknown): arg is string {
    return typeof(arg) === "string";
}

export function isNumber(arg: unknown): arg is number {
    return typeof(arg) === "number";
}

export function isBoolean(arg: unknown): arg is boolean {
    return typeof(arg) === "boolean";
}

export function isDateString(arg: unknown): arg is string {
    return typeof(arg) === "string" && !isNaN(new Date(arg).getTime());
}

export function isTypedArray<T>(arg: unknown, internalValidator: (x: unknown) => x is T): arg is Array<T> {
    return Array.isArray(arg) && arg.every(internalValidator);
}

export function assertObject(arg: unknown): asserts arg is Record<string, unknown> {
    if (arg === undefined || arg === null || typeof(arg) !== "object") throw new ValidationError([{ name: 'TypeMismatch', expected: 'object' }]);
}

export function assertString(arg: unknown): asserts arg is string {
    if (typeof(arg) !== "string") throw new ValidationError([{ name: 'TypeMismatch', expected: 'string' }]);
}

export function assertNumber(arg: unknown): asserts arg is number {
    if (typeof(arg) !== "number") throw new ValidationError([{ name: 'TypeMismatch', expected: 'number' }]);
}

export function assertBoolean(arg: unknown): asserts arg is boolean {
    if (typeof(arg) !== "boolean") throw new ValidationError([{ name: 'TypeMismatch', expected: 'boolean' }]);
}

export function assertTypedArray<T>(arg: unknown, internalValidator: (x: unknown) => asserts x is T): asserts arg is Array<T> {
    if (!Array.isArray(arg)) throw new ValidationError([{ name: 'TypeMismatch', expected: 'array' }]);
    const err: Errors[] = [];
    for (const [idx, val] of arg.entries()) {
        try {
            internalValidator(val);
        } catch(nestedErr) {
            err.push({ ...nestedErr, index: idx, name: 'Nested' });
        }
    }
    if (err.length) throw new ValidationError(err);
}

export function assertDateString(arg: unknown): asserts arg is string {
    if (typeof(arg) !== "string" || isNaN(new Date(arg).getTime())) throw new ValidationError([{ name: 'Format', expected: 'date' }]);
}

export interface TypeGuardOptions {
    additionalProperties?: boolean;
}

export type Route<L, K> = [L, K];
