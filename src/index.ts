
import { Writable } from 'stream';

import { OpenAPIV3 } from "openapi-types";

import { Interface, isInterface } from './type/interface';
import { Composite, isComposite } from './type/composite';
import { List } from './type/list';
import { Enum } from './type/enum';
import { SchemaType } from './type/base';

import { isObject } from './core';

const METHODS: (keyof OpenAPIV3.PathItemObject)[] = ['get', 'post', 'put', 'delete', 'options', 'patch', 'head', 'patch'];

type SchemaObject = OpenAPIV3.ReferenceObject | OpenAPIV3.NonArraySchemaObject | OpenAPIV3.ArraySchemaObject;
interface GeneratorOptions {
    api: OpenAPIV3.Document;
    out: Writable;
};

export class Generator implements GeneratorOptions {
    api;
    out;
    types;
    references: Map<string, unknown>;
    dummy;

    constructor({ api, out }: GeneratorOptions) {
        this.api = api;
        this.references = new Map();
        this.out = out;
        this.buildReferences('#', this.api);
        this.types = new Map<string, OpenAPIV3.NonArraySchemaObject | OpenAPIV3.ArraySchemaObject>();
        this.dummy = 1;

    }

    write(line: string | string[], indent = 0) {
        const lines: string[] = Array.isArray(line) ? line : [line];
        const padding = Array.from({ length: indent }, () => ' ').join('');
        for (const l of lines) this.out.write(`${padding}${l}\n`);
    }

    private buildReferences(prefix: string, root: unknown): void {
        if (!isObject(root)) return;
        for (const [key, value] of Object.entries(root)) {
            const newPrefix = `${prefix}/${key.replace(/~/g, '~0').replace(/\//g, '~1')}`;
            this.references.set(newPrefix, value);
            this.buildReferences(newPrefix, value);
        }
    }

    unreference<T>(arg: T | OpenAPIV3.ReferenceObject): T {
        if (!isObject(arg) || typeof arg.$ref !== 'string') return arg as T;
        const obj = this.references.get(arg.$ref) as T;
        if (!obj) throw new Error(`Reference ${arg.$ref} not found`);
        return obj as T;
    }

    walkSchema(schema: SchemaObject): boolean {
        return '$ref' in schema || isInterface(schema) || isComposite(schema) || schema.type === 'array';
    }

    generateName(name: string | undefined, prop: string): string {
        if (name === undefined) return `Anonymous${this.dummy++}`;
        const candidate = `${name}${prop.charAt(0).toUpperCase()}${prop.slice(1)}`;
        if (this.types.has(candidate)) return `Anonymous${this.dummy++}`;
        return candidate;
    }

    addType(schema: OpenAPIV3.ReferenceObject | OpenAPIV3.SchemaObject, name?: string): OpenAPIV3.ReferenceObject | OpenAPIV3.SchemaObject {
        if ('$ref' in schema) {
            const parts = schema.$ref.split('/');
            const ref = this.references.get(schema.$ref) as OpenAPIV3.NonArraySchemaObject | OpenAPIV3.ArraySchemaObject;
            if (ref && this.walkSchema(ref)) this.addType(ref, parts[parts.length - 1]);
            else if (ref) this.types.set(parts[parts.length - 1], ref);
            return schema;
        } else if (isComposite(schema)) {
            const newName = name ? name : `Anonymous${this.dummy++}`;
            schema.allOf = schema.allOf?.map((s) => this.walkSchema(s) ? this.addType(s) : s);
            schema.oneOf = schema.oneOf?.map((s) => this.walkSchema(s) ? this.addType(s) : s);
            this.types.set(newName, schema);
            return { '$ref': `#/components/schemas/${newName}` };
        } else if (isInterface(schema)) {
            const newName = name ? name : `Anonymous${this.dummy++}`;

            for (const [prop, propSchema] of Object.entries(schema.properties || {})) {
                if (this.walkSchema(propSchema)) schema.properties = {
                    ...(schema.properties || {}),
                    [prop]: this.addType(propSchema, this.generateName(newName, prop)),
                };
            }
            this.types.set(newName, schema);
            return { '$ref': `#/components/schemas/${newName}` };
        } else if (schema.type === 'array') {
            const itemSchema = schema.items;
            if (this.walkSchema(itemSchema)) schema.items = this.addType(itemSchema, this.generateName(name, 'item'));
            return schema;
        }
        console.log(schema);
        throw new Error('Schema not supported');
    }

    emitRoutes() {
        const routes = [];
        const validators = [];

        for(const [path, value] of Object.entries(this.api.paths)) {
            const { parameters, description, servers, summary, ...methods } = this.unreference(value);
            routes.push(`"${path}": {`)
            for (const [method, operation] of Object.entries(methods as { [key: string]: OpenAPIV3.OperationObject })) {
                const { operationId } = operation;
                routes.push(`    ${method}: "${operationId}",`);
                this.write(`export type ${operationId}Route = Route<${operationId}Request, ${operationId}Response>;`);
                validators.push(
                    `"${operationId}": {`,
                    `    request: is${operationId}Request,`,
                    `    response: assert${operationId}Response,`,
                    `},`,
                );
            }
            routes.push(`},`);
        }
        this.write(`export const validators = {`);
        this.write(validators, 4);
        this.write('};');

        this.write('export const routes: { [key: string]: { [key: string]: keyof typeof validators } } = {');
        this.write(routes, 4);
        this.write('};');
    }

    generate() {
        for(const [path, value] of Object.entries(this.api.paths)) {
            const { parameters, description, servers, summary, ...methods } = this.unreference(value);
            for (const [method, operation] of Object.entries(methods as { [key: string]: OpenAPIV3.OperationObject })) {
                const { operationId } = operation;
                const responses: OpenAPIV3.NonArraySchemaObject[] = [];
                for (const [code, response] of Object.entries(operation.responses || {})) {
                    const { content } = this.unreference(response);
                    responses.push({
                        type: 'object',
                        required: content ? ['statusCode', 'json'] : ['statusCode'],
                        properties: {
                            statusCode: {
                                type: 'number',
                                enum: [parseInt(code)],
                            },
                            json: content && content['application/json'].schema || {
                                type: 'object',
                                additionalProperties: false,
                            },
                        },
                    });
                }
                const responseTypeName = `${operationId}Response`;
                this.addType(responses.length === 1 ? responses[0] : {
                    type: 'object',
                    oneOf: responses,
                }, responseTypeName);

                const requestTypeName = `${operationId}Request`;

                const requestBody = this.unreference(operation.requestBody);
                const schema = requestBody && requestBody.content && requestBody.content['application/json'].schema;
                this.addType({
                    type: 'object',
                    required: ['json', 'pathParameters'],
                    properties: {
                        json: schema || { type: 'object', properties: {} },
                        // ...this.buildPathParameters(pathData),
                    },
                } as OpenAPIV3.NonArraySchemaObject, requestTypeName);
            }
        }

        for (const [type, schema] of this.types) {
            let i: SchemaType | undefined = undefined;
            if (isComposite(schema)) {
                i = new Composite(type, schema);
            } else if (isInterface(schema)) {
                i = new Interface(type, schema);
            } else if (schema.type === 'array') {
                i = new List(type, schema);
            } else if (schema.enum !== undefined) {
                i = new Enum(type, schema);
            }
            if (i) {
                i.emitDefinition(this.write.bind(this));
                i.emitTypeAssertion(this.write.bind(this));
                i.emitTypeGuard(this.write.bind(this));
            }
        }

        this.emitRoutes();

        return new Promise((resolve) => this.out.end(resolve));
    }

}
