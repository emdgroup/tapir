
import { Writable } from 'stream';

import { OpenAPIV3 } from "openapi-types";

import { Interface, isInterface } from './type/interface';
import { Composite, isComposite } from './type/composite';
import { List, isList } from './type/list';
import { Enum } from './type/enum';
import { SchemaType } from './type/base';

import * as path from 'path';
import * as fs from 'fs';

import AJV, { Options } from 'ajv';
import standaloneCode from 'ajv/dist/standalone';
import addFormats from 'ajv-formats';

import { createWriteStream } from 'fs';
import { isPrimitiveType, PrimitiveType } from './type/primitive';
import { bundle } from './bundle';

const { NODE_TESTING: TESTING } = process.env;

export function isObject(arg: unknown): arg is Record<string, unknown> {
    return arg !== null && typeof arg === "object" && !Array.isArray(arg);
}

type SchemaObject = OpenAPIV3.ReferenceObject | OpenAPIV3.NonArraySchemaObject | OpenAPIV3.ArraySchemaObject;
interface GeneratorOptions {
    api: OpenAPIV3.Document;
    out?: string;
    ajvOptions?: Partial<Options>;
}

export class Generator implements GeneratorOptions {
    api;
    dts;
    js;
    types;
    references: Map<string, unknown>;
    dummy;
    ajv;
    out;

    constructor({ api, ajvOptions, out = 'out' }: GeneratorOptions) {
        this.api = api;
        this.references = new Map();
        this.out = out;
        this.dts = createWriteStream(path.join(out, 'types.d.ts'));
        this.js = createWriteStream(path.join(out, 'types.ajv.ts'));
        this.buildReferences('#', this.api);
        this.types = new Map<string, OpenAPIV3.NonArraySchemaObject | OpenAPIV3.ArraySchemaObject>();
        this.dummy = 1;
        this.ajv = new AJV({
            allErrors: true,
            inlineRefs: false,
            strict: true,
            strictTypes: false,
            validateFormats: false,
            code: { lines: true, source: true },
            keywords: [{
                keyword: 'example',
            }],
            ...ajvOptions,
        });

        if (ajvOptions?.validateFormats) {
            addFormats(this.ajv);
        }


    }

    write(stream: Writable, line: string | string[], indent = 0): void {
        const lines: string[] = Array.isArray(line) ? line : [line];
        const padding = Array.from({ length: indent }, () => ' ').join('');
        for (const l of lines) stream.write(`${padding}${l}\n`);
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
        return '$ref' in schema || isInterface(schema) || isComposite(schema)
            || (isList(schema) && 'type' in schema.items && !isPrimitiveType(schema.items));
    }

    generateName(name: string | undefined, prop: string): string {
        if (name === undefined) return `Anonymous${this.dummy++}`;
        const candidate = `${name}${prop.charAt(0).toUpperCase()}${prop.slice(1)}`;
        if (this.types.has(candidate)) return `Anonymous${this.dummy++}`;
        return candidate;
    }

    addReference(name: string, schema: OpenAPIV3.SchemaObject): OpenAPIV3.ReferenceObject {
        const path = `#/components/schemas/${name}`;
        this.references.set(path, schema);
        return { '$ref': path };
    }

    addType(schema: OpenAPIV3.ReferenceObject | OpenAPIV3.SchemaObject, name?: string): OpenAPIV3.ReferenceObject | OpenAPIV3.SchemaObject {
        if ('$ref' in schema) {
            const parts = schema.$ref.split('/');
            const ref = this.unreference(schema) as OpenAPIV3.SchemaObject;
            if (ref && this.walkSchema(ref)) this.addType(ref, parts[parts.length - 1]);
            else if (ref) this.types.set(parts[parts.length - 1], ref);
            return schema;
        } else if (isComposite(schema)) {
            const newName = name ? name : `Anonymous${this.dummy++}`;
            schema.allOf = schema.allOf?.map((s) => this.walkSchema(s) ? this.addType(s) : s);
            schema.oneOf = schema.oneOf?.map((s) => this.walkSchema(s) ? this.addType(s) : s);
            schema.anyOf = schema.anyOf?.map((s) => this.walkSchema(s) ? this.addType(s) : s);
            this.types.set(newName, schema);
            return this.addReference(newName, schema);
        } else if (isInterface(schema)) {
            const newName = name ? name : `Anonymous${this.dummy++}`;

            for (const [prop, propSchema] of Object.entries(schema.properties || {})) {
                if (this.walkSchema(propSchema)) schema.properties = {
                    ...(schema.properties || {}),
                    [prop]: this.addType(propSchema, this.generateName(newName, prop)),
                };
            }
            this.types.set(newName, schema);
            return this.addReference(newName, schema);
        } else if (schema.type === 'array') {
            const newName = name ? name : `Anonymous${this.dummy++}`;
            const itemSchema = schema.items;
            if (this.walkSchema(itemSchema)) schema.items = this.addType(itemSchema, this.generateName(name, 'item'));
            this.types.set(newName, schema);
            return this.addReference(newName, schema);
        } else if (isPrimitiveType(schema)) {
            const newName = name ? name : `Anonymous${this.dummy++}`;
            this.types.set(newName, schema);
            return schema;
        }
        console.log(schema);
        throw new Error('Schema not supported');
    }

    buildContent(req: OpenAPIV3.ReferenceObject | OpenAPIV3.RequestBodyObject | OpenAPIV3.ResponseObject): OpenAPIV3.NonArraySchemaObject | undefined {
        const requestBody = this.unreference(req);
        const content = requestBody && requestBody.content || {};

        const contentSchema: OpenAPIV3.MediaTypeObject[] = Object.values(content);

        if (!contentSchema.length) return undefined;

        return contentSchema.length > 1 ? {
            anyOf: contentSchema.filter((c) => c).map((c) => c.schema as OpenAPIV3.NonArraySchemaObject),
        } : contentSchema[0].schema as OpenAPIV3.NonArraySchemaObject;
    }

    buildParameters(params: (OpenAPIV3.ReferenceObject | OpenAPIV3.ParameterObject)[]): {
        pathParameters?: OpenAPIV3.NonArraySchemaObject,
        queryStringParameters?: OpenAPIV3.NonArraySchemaObject,
        json?: OpenAPIV3.NonArraySchemaObject,
     } {
        const location: Record<string, OpenAPIV3.NonArraySchemaObject> = {};
        params?.forEach((p) => {
            const { name, in: where, schema, required, description } = this.unreference(p);
            if (!location[where]) location[where] = {
                type: 'object',
                required: [],
                properties: {},
                nullable: true,
            };
            const props = location[where];
            if (required) {
                props.required?.push(name);
                location[where].nullable = false;
            }
            if(props.properties) {
                props.properties[name] = {
                    ...schema,
                    ...(description ? { description } : {}),
                } as OpenAPIV3.NonArraySchemaObject;
            }
        });
        return {
            ...(location.path ? { pathParameters: location.path } : {}),
            ...(location.query ? { queryStringParameters: location.query } : {}),
        };
    }

    emitRoutes() {
        const routes = [];
        const validators = [];
        const validatorsTs = [];

        for(const [path, value] of Object.entries(this.api.paths)) {
            const { parameters, description, servers, summary, ...methods } = this.unreference<any>(value);
            for (const [method, operation] of Object.entries(methods as { [key: string]: OpenAPIV3.OperationObject })) {
                const { operationId } = operation;
                if (!operationId) continue;
                const ucOperationId = operationId.slice(0, 1).toUpperCase() + operationId.slice(1);
                routes.push(`    '${method.toUpperCase()} ${path}': '${operationId}',`);
                if (summary || description || operation.summary || operation.description) {
                    this.write(this.dts, `/** ${operation.summary || operation.description || summary || description} */`);
                }
                this.write(this.dts, `export type ${ucOperationId}Route = Route<${ucOperationId}Request, ${ucOperationId}Response>;`);
                validators.push(
                    `${operationId}: {`,
                    `    isRequest: exports.is${ucOperationId}Request,`,
                    `    isResponse: exports.is${ucOperationId}Response,`,
                    `    assertRequest: assert${ucOperationId}Request,`,
                    `    assertResponse: assert${ucOperationId}Response,`,
                    `},`,
                );
                validatorsTs.push(
                    `${operationId}: {`,
                    `    isRequest(arg: unknown): arg is ${ucOperationId}Request;`,
                    `    isResponse(arg: unknown): arg is ${ucOperationId}Response;`,
                    `    assertRequest(arg: unknown): asserts arg is ${ucOperationId}Request;`,
                    `    assertResponse(arg: unknown): asserts arg is ${ucOperationId}Response;`,
                    `},`,
                );
            }
        }
        this.write(this.js, `export const validators = {`);
        this.write(this.js, validators, 4);
        this.write(this.js, '};');

        this.write(this.dts, ['export const validators: {']);
        this.write(this.dts, validatorsTs, 4);
        this.write(this.dts, '};');

        this.write(this.dts, 'export const routes: { [key: string]: Operation | undefined };');

        this.write(this.js, 'export const routes = {');
        this.write(this.js, routes, 4);
        this.write(this.js, '};');
    }

    async generate(): Promise<void> {
        const operations: string[] = [];

        for(const [name, schema] of Object.entries(this.api.components?.schemas || [])) {
            this.addType(schema, name);
        }


        for(const value of Object.values(this.api.paths)) {
            const { parameters, description, servers, summary, ...methods } = this.unreference<any>(value);
            for (const [, operation] of Object.entries(methods as { [key: string]: OpenAPIV3.OperationObject })) {
                const { operationId } = operation;
                if (!operationId) continue;
                const desc = operation.summary || operation.description || summary || description;
                operations.push(operationId);
                const responses: OpenAPIV3.NonArraySchemaObject[] = [];
                for (const [code, response] of Object.entries(operation.responses || {})) {
                    const json = this.buildContent(response);
                    const statusCode = parseInt(code, 10);
                    responses.push({
                        type: 'object',
                        description: this.unreference(response).description || desc,
                        required: json ? ['statusCode', 'json'] : ['statusCode'],
                        properties: {
                            statusCode: {
                                type: 'number',
                                ...(isNaN(statusCode) ? {} : { enum: [statusCode] }),
                            },
                            json: json || {
                                type: 'object',
                                additionalProperties: false,
                            },
                        },
                    });
                }
                const upperCased = operationId.slice(0, 1).toUpperCase() + operationId.slice(1);
                const responseTypeName = `${upperCased}Response`;
                this.addType(responses.length === 1 ? responses[0] : {
                    type: 'object',
                    oneOf: responses,
                }, responseTypeName);

                const requestTypeName = `${upperCased}Request`;

                const params = this.buildParameters([...parameters || [], ...operation.parameters || []]);
                const json = operation.requestBody && this.buildContent(operation.requestBody);
                if (json) params.json = json;

                this.addType({
                    type: 'object',
                    required: Object.entries(params).filter(([, schema]) => schema.required?.length).map((([name]) => name)),
                    properties: params,
                    description: desc,
                } as OpenAPIV3.NonArraySchemaObject, requestTypeName);
            }
        }

        const exports: Record<string, string> = {};

        for (const [type, schema] of this.types) {
            const ref = '#/components/schemas/' + type;
            this.ajv.addSchema(schema, ref);
            exports['is' + type] = ref;

            const unreferenced = this.unreference(schema);

            const nullableType = unreferenced.nullable ? `${type} | null` : type;

            this.write(this.js, [
                `export function assert${type}(data): asserts data is ${nullableType} {`,
                `    if(exports.is${type}(data)) return;`,
                `    throw new ValidationError(exports.is${type}.errors);`,
                `}`,
                '',
            ]);
            this.write(this.dts, [
                `export function assert${type}(data: unknown): asserts data is ${nullableType};`,
                `export function is${type}(data: unknown): data is ${nullableType};`,
            ]);

            let i: SchemaType | undefined = undefined;
            if (isComposite(schema)) {
                i = new Composite(type, schema, this);
            } else if (isInterface(schema)) {
                i = new Interface(type, schema, this);
            } else if (schema.type === 'array') {
                i = new List(type, schema, this);
            } else if (schema.enum !== undefined) {
                i = new Enum(type, schema, this);
                i.emitDefinition(this.write.bind(this, this.js));
            } else if (isPrimitiveType(schema)) {
                i = new PrimitiveType(type, schema, this);
            }
            if (i) {
                i.emitDefinition(this.write.bind(this, this.dts));
            }
        }

        const src = path.resolve(__dirname, '..', 'dist');

        this.js.write(fs.readFileSync(path.resolve(src, 'error.js')) + '\n');
        this.dts.write(TESTING ? `export * from '../../dist/error';` : `export * from '@emdgroup/tapir/dist/error';\n`);
        this.js.write(standaloneCode(this.ajv, exports) + '\n');

        if (operations.length) this.write(this.dts, [
            `export type Operation =\n    ` +
            operations.map((k) => `'${k}'`).join(' |\n    ') + ';',
        ]);
        else this.write(this.dts, [`export type Operation = unknown;`]);

        this.write(this.dts, ['export type Route<L, K> = [L, K];']);

        this.emitRoutes();

        await Promise.all([
            new Promise((resolve) => this.dts.end(resolve)),
            new Promise((resolve) => this.js.end(resolve)),
        ]);

        await bundle(
            path.join(this.out, 'types.ajv.ts'),
            path.join(this.out, 'types'),
        );
    }

}
