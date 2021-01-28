import { OpenAPIV3 } from 'openapi-types';
import { SchemaType } from './base';

export class RefType extends SchemaType {
    refName;

    constructor(name: string, schema: OpenAPIV3.ReferenceObject) {
        super(name, schema);
        const ref = schema.$ref;
        const parts = ref.split('/');
        this.refName = parts[parts.length - 1];
        this.typeGuardName = `is${this.refName}`;
        this.assertionName = `assert${this.refName}`;
    }

    emit(): string {
        return this.refName;
    }
}
