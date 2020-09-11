import { OpenAPIV3 } from 'openapi-types';

import { SchemaType, WriteCb } from './base';
import { RefType } from './ref';
import { PrimitiveType, isPrimitiveType } from './primitive';

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

    typeCheck(): string {
        return `isTypedArray(val.${this.name}, ${this.subType.typeGuardName})`;
    }

    assert(): string {
        return `assertTypedArray(val.${this.name}, ${this.subType.assertionName})`;
    }

    emitDefinition(write: WriteCb): void {
        write(`export type ${this.name} = ${this.emit()};`);
    }

    emit(): string {
        return `${this.subType.emit()}[]`;
    }
}
