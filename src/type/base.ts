import { OpenAPIV3 } from 'openapi-types';

export type WriteCb = (line: string | string[], indent?: number) => void;

export class SchemaType {
    name;
    schema;
    assertionName;
    typeGuardName;
    required;

    constructor(name: string, schema: OpenAPIV3.SchemaObject | OpenAPIV3.ReferenceObject) {
        this.name = name;
        this.schema = schema;
        this.assertionName = `assert${this.name}`;
        this.typeGuardName = `is${this.name}`;
        this.required = false;
    }

    typeCheck(): string {
        return `${this.typeGuardName}(val.${this.name}, options)`;
    }

    assert(): string {
        return `${this.assertionName}(val.${this.name}, options)`;
    }

    emitDefinition(write: WriteCb): void {}

    emitTypeGuard(write: WriteCb): void {
        if(this.required) {
            write(`if (!("${this.name}" in val && val.${this.name} !== undefined) || !${this.typeCheck()}) { return false; }`, 4);
        } else {
            write(`if ("${this.name}" in val && val.${this.name} !== undefined && !${this.typeCheck()}) { return false; }`, 4);
        }
    }

    emitTypeAssertion(write: WriteCb): void {
        if(this.required) {
            write(`if (!("${this.name}" in val && val.${this.name} !== undefined)) err.push({ name: 'Required', field: '${this.name}' });`, 4);
        }
        write([
            `if ("${this.name}" in val && val.${this.name} !== undefined) try {`,
            `    ${this.assert()};`,
            `} catch(nestedErr) {`,
            `    err.push(...nestedErr.errors.map((e: Errors) => ({ ...e, field: "${this.name}" })));`,
            `}`,
        ], 4);
    }

    emit(): string {
        return this.name;
    }
}
