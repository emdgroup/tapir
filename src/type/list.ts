import { OpenAPIV3 } from 'openapi-types';

import { SchemaType, WriteCb } from './base.js';

import type { Generator } from '../index.js';
import { emitType } from './index.js';

export function isList(schema: OpenAPIV3.SchemaObject): schema is OpenAPIV3.ArraySchemaObject {
    return schema.type === 'array';
}
export class List extends SchemaType {
    schema: OpenAPIV3.ArraySchemaObject;

    constructor(name: string, schema: OpenAPIV3.ArraySchemaObject, generator: Generator) {
        super(name, schema, generator);
        this.schema = schema;
    }

    emitDefinition(write: WriteCb): void {
        write(`export type ${this.name} = ${this.emit()};`);
    }

    emit(): string {
        const subtype = emitType(this.name, this.schema.items, this.generator);
        const tp = `${subtype}[]`;
        return this.nullable ? `${tp} | null` : tp;
    }
}
