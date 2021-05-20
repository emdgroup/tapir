import { OpenAPIV3 } from 'openapi-types';
import type { Generator } from '..';
import { SchemaType } from './base';

export class RefType extends SchemaType {
    refName;

    constructor(name: string, schema: OpenAPIV3.ReferenceObject, generator: Generator) {
        super(name, schema, generator);
        const ref = schema.$ref;
        const parts = ref.split('/');
        this.refName = parts[parts.length - 1];
        this.typeGuardName = `is${this.refName}`;
        this.assertionName = `assert${this.refName}`;
    }

    emit(): string {
        const unreferenced = this.generator.unreference(this.schema) as OpenAPIV3.SchemaObject;
        const nullable = unreferenced.nullable || false;

        return nullable ? `${this.refName} | null` : this.refName;
    }
}
