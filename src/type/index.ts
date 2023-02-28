import type { OpenAPIV3 } from 'openapi-types';
import { Composite, isComposite } from './composite.js';
import { List } from './list.js';
import { RefType } from './ref.js';
import { PrimitiveType, isPrimitiveType } from './primitive.js';
import { Generator } from '../index.js';

export function emitType(name: string, schema: OpenAPIV3.ReferenceObject | OpenAPIV3.SchemaObject, generator: Generator): string {
    if ('$ref' in schema) {
        return new RefType(name, schema, generator).emit();
    } else if (schema.type === 'array') {
        return new List(name, schema, generator).emit();
    } else if (isComposite(schema)) {
        return new Composite(name, schema, generator).emit();
    } else if (isPrimitiveType(schema)) {
        return new PrimitiveType(name, schema, generator).emit();
    } else {
        throw new Error('Unexpected schema: ' + JSON.stringify(schema));
    }
}
