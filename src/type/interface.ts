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
}
