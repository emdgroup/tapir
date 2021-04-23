import { OpenAPIV3 } from 'openapi-types';

import { SchemaType, WriteCb } from './base';
import { RefType } from './ref';
import { PrimitiveType, isPrimitiveType } from './primitive';

export function isList(schema: OpenAPIV3.SchemaObject): schema is OpenAPIV3.ArraySchemaObject {
    return schema.type === 'array';
}
export class List extends SchemaType {
    schema: OpenAPIV3.ArraySchemaObject;
    subType: RefType | PrimitiveType;

    constructor(name: string, schema: OpenAPIV3.ArraySchemaObject) {
        super(name, schema);
        this.schema = schema;
        if ('$ref' in schema.items) {
            this.subType = new RefType(name, schema.items);
        } else if (isPrimitiveType(schema.items)) {
            this.subType = new PrimitiveType(name, schema.items);
        } else {
            throw new Error(`Unsupported subtype in array.`);
        }
    }

    emitDefinition(write: WriteCb): void {
        write(`export type ${this.name} = ${this.emit()};`);
    }

    emit(): string {
        const tp = `${this.subType.emit()}[]`;
        return this.nullable ? `${tp} | null` : tp;
    }
}
