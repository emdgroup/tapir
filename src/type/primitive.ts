import { OpenAPIV3 } from 'openapi-types';
import { SchemaType } from './base';

export function isPrimitiveType(schema: OpenAPIV3.SchemaObject): schema is OpenAPIV3.NonArraySchemaObject {
    return !!schema.type && ['string', 'number', 'boolean', 'integer'].includes(schema.type);
}

export class PrimitiveType extends SchemaType {
    type?: 'string' | 'number' | 'boolean' | 'object';
    enum;

    constructor(name: string, schema: OpenAPIV3.NonArraySchemaObject) {
        super(name, schema);
        const { type, enum: values } = schema;
        this.type = type === 'integer' ? 'number' : type;
        this.enum = values;
        if (this.type === 'string') {
            this.assertionName = `assertString`;
        } else if (this.type === 'number') {
            this.assertionName = 'assertNumber';
        } else if (this.type === 'boolean') {
            this.assertionName = 'assertBoolean';
        } else {
            console.log(schema);
            throw new Error(`Unimplemented primitive type ${this.type}.`);
        }

        if (this.type === 'string') {
            this.typeGuardName = `isString`;
        } else if (this.type === 'number') {
            this.typeGuardName = 'isNumber';
        } else if (this.type === 'boolean') {
            this.typeGuardName = 'isBoolean';
        }
    }

    assert(): string {
        return `${this.assertionName}(val.${this.name})`;
    }

    typeCheck(): string {
        const typeCheck = `${this.typeGuardName}(val.${this.name})`;
        if (!this.enum) return typeCheck;

        return `(${typeCheck} && ${JSON.stringify(this.enum)}.includes(val.${this.name}))`;
    }

    emit(): string {
        if (this.enum) {
            return this.enum.map((v) => `${JSON.stringify(v)}`).join(' | ');
        }
        return this.type || 'undefined';
    }
}