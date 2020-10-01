import { OpenAPIV3 } from 'openapi-types';

import { WriteCb, SchemaType } from './base';
import { RefType } from './ref';
import { isInterface } from './interface';

export function isComposite(schema: OpenAPIV3.SchemaObject): schema is OpenAPIV3.NonArraySchemaObject & { properties: undefined } {
    return schema.properties === undefined && !!(schema.allOf || schema.oneOf || schema.anyOf);
}

enum CompositeModes {
    'ALL_OF',
    'ONE_OF',
}

export class Composite extends SchemaType {
    mode: CompositeModes;
    schema: OpenAPIV3.NonArraySchemaObject;

    constructor(name: string, schema: OpenAPIV3.NonArraySchemaObject) {
        super(name, schema);
        this.schema = schema;
        this.mode = schema.allOf ? CompositeModes.ALL_OF : CompositeModes.ONE_OF;
    }

    emitTypeGuard(write: WriteCb): void {
        write(`export function ${this.typeGuardName}(val: unknown, options?: TypeGuardOptions): val is ${this.name} {`);

        if (this.mode === CompositeModes.ALL_OF) {
            for (const schema of this.schema.allOf || []) {
                if (!('$ref' in schema)) continue;
                const ref = new RefType(this.name, schema);
                write(`if (!${ref.typeGuardName}(val, options)) { return false; }`, 4);
            }
            write(`return true;}`);
        } else if (this.mode === CompositeModes.ONE_OF) {
            for (const schema of this.schema.oneOf || []) {
                if (!('$ref' in schema)) continue;
                const ref = new RefType(this.name, schema);
                write(`if (${ref.typeGuardName}(val, options)) { return true; }`, 4);
            }
            write(`return false;\n}`, 4);
        } else {
            throw new Error(`Unhandled composite operator ${this.mode}`);
        }
    }

    emitTypeAssertion(write: WriteCb): void {
        write(`export function ${this.assertionName}(val: unknown, options?: TypeGuardOptions): asserts val is ${this.name} {`);

        write([
            'let err: Errors[] = [];',
            `if (!isObject(val)) {`,
            `    err.push({ name: 'TypeMismatch', expected: 'object' });`,
            `    throw new ValidationError(err);`,
            `}`,
            'const props = new Set(Object.keys(val));',
        ], 4);

        for (const schema of this.schema.allOf || this.schema.oneOf || []) {

            if ('$ref' in schema) {
                const ref = new RefType(this.name, schema);
                write(`try { ${ref.assertionName}(val, options); } catch(compErr) { err.push(compErr); }`, 4);
            }
        }
        if (this.mode === CompositeModes.ONE_OF) {
            write(`if (err.length < ${(this.schema.oneOf || []).length}) err = [];`, 4);
        }

        write([
            `if (options?.additionalProperties === false && props.size) err.push({ name: 'AdditionalProperties', expected: [], actual: [...props] });`,
            `if (err.length) throw new ValidationError(err);`,
        ], 4);
        write('}');
    }

    emit(): string {
        let joinOperator: string;

        if (this.mode === CompositeModes.ALL_OF) {
            joinOperator = " & ";
        } else if (this.mode === CompositeModes.ONE_OF) {
            joinOperator = " | ";
        } else {
            throw new Error(`Unhandled composite operator ${this.mode}`);
        }
        const types: string[] = [];
        for (const schema of this.schema.allOf || this.schema.oneOf || []) {
            if (!('$ref' in schema)) continue;
            types.push(new RefType(this.name, schema).emit());
        }
        return types.join(joinOperator);
    }

    emitDefinition(write: WriteCb): void {
        write(`export type ${this.name} = ${this.emit()};`);
    }
}
