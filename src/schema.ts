import { OpenAPIV3 } from 'openapi-types';

export class Schema {
    schema;
    type;

    constructor(schema: OpenAPIV3.SchemaObject) {
        this.schema = schema;
        this.type = schema.type;
    }
}