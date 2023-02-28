import { OpenAPIV3 } from 'openapi-types';
import { SchemaType, WriteCb } from './base.js';

import type { Generator } from '../index.js';

export function isPrimitiveType(schema: OpenAPIV3.SchemaObject): schema is OpenAPIV3.NonArraySchemaObject {
    return !!schema.type && ['string', 'number', 'boolean', 'integer'].includes(schema.type);
}

export class PrimitiveType extends SchemaType {
    type?: 'string' | 'number' | 'boolean' | 'object';
    enum;

    constructor(name: string, schema: OpenAPIV3.NonArraySchemaObject, generator: Generator) {
        super(name, schema, generator);
        const { type, enum: values } = schema;
        this.type = type === 'integer' ? 'number' : type;
        this.enum = values;
        if (this.type === 'string') {
            this.assertionName = 'assertString';
        } else if (this.type === 'number') {
            this.assertionName = 'assertNumber';
        } else if (this.type === 'boolean') {
            this.assertionName = 'assertBoolean';
        } else {
            console.log(schema);
            throw new Error(`Unimplemented primitive type ${this.type}.`);
        }

        if (this.type === 'string') {
            this.typeGuardName = 'isString';
        } else if (this.type === 'number') {
            this.typeGuardName = 'isNumber';
        } else if (this.type === 'boolean') {
            this.typeGuardName = 'isBoolean';
        }
    }

    emit(): string {
        let tp: string;
        if (this.enum) {
            tp = this.enum.map((v) => `${JSON.stringify(v)}`).join(' | ');
        } else {
            tp = this.type || 'undefined';
        }
        return this.nullable ? `${tp} | null` : tp;
    }

    emitDefinition(write: WriteCb): void {
        write(`export type ${this.name} = ${this.type};`);
    }
}