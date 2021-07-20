import { OpenAPIV3 } from 'openapi-types';

import { SchemaType, WriteCb } from './base';
import { PrimitiveType, isPrimitiveType } from './primitive';
import { Composite, isComposite } from './composite';
import { List } from './list';
import { RefType } from './ref';

import type { Generator } from '../index';

export function isInterface(schema: OpenAPIV3.SchemaObject): schema is OpenAPIV3.NonArraySchemaObject & { type: 'object' } {
    return schema.type === 'object' || schema.type === undefined && !!schema.properties;
}

export class Interface extends SchemaType {
    schema: OpenAPIV3.NonArraySchemaObject;

    constructor(name: string, schema: OpenAPIV3.NonArraySchemaObject, generator: Generator) {
        super(name, schema, generator);
        this.schema = schema;
    }

    emitDefinition(write: WriteCb): void {
        const name = this.nullable ? `${this.name}NonNullable` : this.name;
        if (this.schema.description) write(`/** ${this.schema.description} */`);
        write(`export interface ${name} {`);

        const required = this.schema.required || [];

        for (const [field, schema] of Object.entries(this.schema.properties || {})) {
            let fieldType = '';
            if ('$ref' in schema) {
                fieldType = new RefType(field, schema, this.generator).emit();
            } else if (schema.type === 'array') {
                fieldType = new List(field, schema, this.generator).emit();
            } else if (isComposite(schema)) {
                fieldType = new Composite(field, schema, this.generator).emit();
            } else if (isPrimitiveType(schema)) {
                fieldType = new PrimitiveType(field, schema, this.generator).emit();
            }
            const description = this.generator.unreference(schema).description;

            if (description) write(`/** ${description} */`, 4);
            write(`'${field}'${required.includes(field) ? '' : '?'}: ${fieldType};`, 4);
        }
        write('}');

        if (this.nullable) {
            write(`export type ${this.name} = ${name} | null;`);
        }
    }
}
