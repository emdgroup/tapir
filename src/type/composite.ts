import { OpenAPIV3 } from 'openapi-types';
import { Generator } from '..';

import { WriteCb, SchemaType } from './base';
import { RefType } from './ref';

export function isComposite(schema: OpenAPIV3.SchemaObject): schema is OpenAPIV3.NonArraySchemaObject & { properties: undefined } {
    return schema.properties === undefined && !!(schema.allOf || schema.oneOf || schema.anyOf);
}

enum CompositeModes {
    'ALL_OF',
    'ONE_OF',
    'ANY_OF',
}

export class Composite extends SchemaType {
    mode: CompositeModes;
    schema: OpenAPIV3.NonArraySchemaObject;

    constructor(name: string, schema: OpenAPIV3.NonArraySchemaObject, generator: Generator) {
        super(name, schema, generator);
        this.schema = schema;
        this.mode = schema.allOf ? CompositeModes.ALL_OF : schema.oneOf ? CompositeModes.ONE_OF : CompositeModes.ANY_OF;
    }

    emit(): string {
        let joinOperator: string;

        if (this.mode === CompositeModes.ALL_OF) {
            joinOperator = " & ";
        } else if (this.mode === CompositeModes.ONE_OF || this.mode === CompositeModes.ANY_OF) {
            joinOperator = " | ";
        } else {
            throw new Error(`Unhandled composite operator ${this.mode}`);
        }
        const types: string[] = [];
        for (const schema of this.schema.allOf || this.schema.oneOf || []) {
            if (!('$ref' in schema)) continue;
            types.push(new RefType(this.name, schema, this.generator).emit());
        }
        const tp = types.join(joinOperator);
        return this.nullable ? `(${tp}) | null` : tp;
    }

    emitDefinition(write: WriteCb): void {
        write(`export type ${this.name} = ${this.emit()};`);
    }
}
