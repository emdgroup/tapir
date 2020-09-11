import { OpenAPIV3 } from 'openapi-types';

import { SchemaType, WriteCb } from './base';
import { PrimitiveType, isPrimitiveType } from './primitive';
import { Composite, isComposite } from './composite';
import { List } from './list';
import { RefType } from './ref';

export function isInterface(schema: OpenAPIV3.SchemaObject): schema is OpenAPIV3.NonArraySchemaObject & { type: 'object' } {
    return schema.type === 'object' || schema.type === undefined && !!schema.properties;
}

export class Interface extends SchemaType {
    extends: string[];
    schema: OpenAPIV3.NonArraySchemaObject;

    constructor(name: string, schema: OpenAPIV3.NonArraySchemaObject, ext?: string[]) {
        super(name, schema);
        this.schema = schema;
        this.extends = ext || [];
    }

    emitDefinition(write: WriteCb): void {
        const ext = this.extends.length ? ` extends ${this.extends.join(', ')}` : '';
        if(this.name) {
            write(`export interface ${this.name}${ext} {`);
        } else {
            write(`interface ${this.name}${ext} {`);
        }

        const required = this.schema.required || [];

        for (const [field, schema] of Object.entries(this.schema.properties || {})) {
            let fieldType = '';
            if ('$ref' in schema) {
                fieldType = new RefType(field, schema).emit();
            } else if (schema.type === 'array') {
                fieldType = new List(field, schema).emit();
            } else if (isComposite(schema)) {
                fieldType = new Composite(field, schema).emit();
            } else if (isPrimitiveType(schema)) {
                fieldType = new PrimitiveType(field, schema).emit();
            }
            write(`${field}${required.includes(field) ? '' : '?'}: ${fieldType};`, 4);
        }
        write('}');
    }

    emitTypeGuard(write: WriteCb): void {
        write(`${this.name ? 'export ': ''}function ${this.typeGuardName}(val: unknown, options?: TypeGuardOptions): val is ${this.name} {`);

        write([
            'if (!isObject(val)) { return false; }',
            'const props = new Set(Object.keys(val));',
        ], 4);

        for (const [field, schema] of Object.entries(this.schema.properties || {})) {
            const required = this.schema.required || [];
            let type;
            if ('$ref' in schema) {
                type = new RefType(field, schema);
            } else if (schema.type === 'array') {
                type = new List(field, schema);
            } else if (schema.type !== 'object') {
                type = new PrimitiveType(field, schema);
            }
            if (type) {
                type.required = required.includes(field);
                type.emitTypeGuard(write);
            }
            write(`props.delete('${field}');`, 4);
        }
        write([
            'if (options?.additionalProperties === false && props.size) return false;',
            'return true;',
        ], 4);
        write('}');
    }

    emitTypeAssertion(write: WriteCb): void {
        write(`${this.name ? 'export ': ''}function ${this.assertionName}(val: unknown, options?: TypeGuardOptions): asserts val is ${this.name} {`);

        write([
            'const err: Errors[] = [];',
            `if (!isObject(val)) {`,
            `    err.push({ name: 'TypeMismatch', expected: 'object' });`,
            `    throw new ValidationError(err);`,
            `}`,
            'const props = new Set(Object.keys(val));',
        ], 4);

        for (const [field, schema] of Object.entries(this.schema.properties || {})) {
            const required = this.schema.required || [];
            let type;
            if ('$ref' in schema) {
                type = new RefType(field, schema);
            } else if (schema.type === 'array') {
                type = new List(field, schema);
            } else if (schema.type !== 'object') {
                type = new PrimitiveType(field, schema);
            }
            if (type) {
                type.required = required.includes(field);
                type.emitTypeAssertion(write);
            }
            write(`props.delete('${field}');`, 4);
        }

        write([
            `if (options?.additionalProperties === false && props.size) {`,
            `    err.push({ name: 'AdditionalProperties', expected: [], actual: [...props] });`,
            `}`,
            'if (err.length) throw new ValidationError(err);',
        ], 4);
        write('}');
    }
}
