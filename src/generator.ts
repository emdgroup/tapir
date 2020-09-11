import * as SwaggerParser from "swagger-parser";
import * as fs from "fs";

import { OpenAPIV3 } from "openapi-types";

let dummies = 0;

const METHODS: (keyof OpenAPIV3.PathItemObject)[] = ['get', 'post', 'put', 'delete', 'options', 'patch', 'head', 'patch'];

class Field {
    name: string;
    type: PropertyType;
    required: boolean;

    constructor(name: string, type: PropertyType, required: boolean) {
        this.name = name;
        this.type = type;
        this.required = required;
    }

    async emit(output: fs.promises.FileHandle, indentationLevel: number) {
        await output.write("    ".repeat(indentationLevel + 1) + this.name);
        if(this.required) {
            await output.write(': ');
        } else {
            await output.write('?: ');
        }
        await this.type.emit(output, indentationLevel);
        await output.write(';\n');
    }

    typeGuardName(): string | undefined {
        return this.type.typeGuardName();
    }

    typeCheck(field: string): string | undefined {
        return this.type.typeCheck(field);
    }

    assert(field: string): string | undefined {
        return this.type.assert(field);
    }

    async emitTypeGuard(output: fs.promises.FileHandle) {
        if(this.required) {
            await output.write(`    if (!("${this.name}" in val && val.${this.name} !== undefined) || !${this.typeCheck(this.name)}) { return false; }\n`);
        } else {
            await output.write(`    if ("${this.name}" in val && val.${this.name} !== undefined && !${this.typeCheck(this.name)}) { return false; }\n`);
        }
    }

    async emitTypeAssertion(output: fs.promises.FileHandle) {
        if(this.required) {
            await output.write(`    if (!("${this.name}" in val && val.${this.name} !== undefined)) err.push({ name: 'Required', field: '${this.name}' });\n`);
        }
        await output.write(`    if ("${this.name}" in val && val.${this.name} !== undefined) try { ${this.type.assert(this.name)}; } catch(nestedErr) { err.push(...nestedErr.errors.map((e: Errors) => ({ ...e, field: "${this.name}" }))); }\n`);
    }
}

class Enum {
    name: string | null;
    type?: OpenAPIV3.NonArraySchemaObjectType;
    variants: any[];
    dummy: number | null;
    id: string;
    assertionName: string;

    constructor(name: string | null, schema: OpenAPIV3.NonArraySchemaObject) {
        this.name = name;
        this.type = schema.type;
        this.variants = schema.enum || [];
        this.dummy = null;

        if (!this.name) {
            dummies += 1;
            this.dummy = dummies;
        }

        this.id = name ?? `Anonymous${this.dummy}`;

        this.assertionName = `assert${this.id}`;
    }

    getId(): string {
        return this.name ?? `Anonymous${this.dummy}`;
    }

    async emitDefinition(output: fs.promises.FileHandle) {
        if (this.name) await output.write('export ');
        if (this.type === 'string') {
            await output.write(`enum ${this.getId()} {\n`);

            for (const v of this.variants) {
                await output.write(`    ${v} = "${v}",\n`);
            }
            await output.write('}\n\n');
        } else {
            await output.write(`type ${this.getId()} = ${this.variants.join(' | ')};\n\n`);
        }
    }

    typeGuardName() {
        return `is${this.getId()}`;
    }

    typeCheck(field: string): string {
        return `${this.typeGuardName()}(val.${field})`;
    }

    assert(field: string): string {
        return `${this.typeGuardName()}(val.${field})`;
    }

    async emitTypeGuard(output: fs.promises.FileHandle) {
        if (this.name) await output.write('export ');
        await output.write(`function ${this.typeGuardName()}(val: unknown, options?: TypeGuardOptions): val is ${this.getId()} {\n`);
        await output.write(`    return typeof(val) === "${this.type}" && `);
        if (this.type === 'string') {
            await output.write(`val in ${this.getId()};`);
        } else {
            await output.write(`${JSON.stringify(this.variants)}.includes(val);`);
        }
        await output.write(`\n}\n\n`);
    }

    async emit(output: fs.promises.FileHandle) {
        const value = this.name ?? this.variants.map(v => `${JSON.stringify(v)}`).join(" | ");
        await output.write(value);
    }
}

class Interface {
    name: string | null;
    fields: Field[];
    dummy: number | null;
    extends: string[];
    id: string;
    assertionName: string;

    constructor(name: string | null, fields: Field[], ext?: string[]) {
        this.name = name;
        this.fields = fields;
        this.dummy = null;
        this.extends = ext || [];

        if(!name) {
            dummies += 1;
            this.dummy = dummies;
        }

        this.id = name ?? `Anonymous${this.dummy}`;

        this.assertionName = `assert${this.id}`;
    }

    async emitDefinition(output: fs.promises.FileHandle) {
        const ext = this.extends.length ? ` extends ${this.extends.join(', ')}` : '';
        if(this.name) {
            await output.write(`export interface ${this.name}${ext} {\n`);
        } else {
            await output.write(`interface ${this.getId()}${ext} {\n`);
        }

        for (const f of this.fields) {
            await f.emit(output, 0);
        }
        await output.write('}\n\n');
    }

    typeGuardName(): string {
        if (this.name) {
            return `is${this.name}`;
        } else {
            return `isAnonymous${this.dummy}`;
        }
    }

    typeCheck(field: string): string {
        return `${this.typeGuardName()}(val.${field}, options)`;
    }

    assert(field: string): string {
        return `${this.assertionName}(val.${field}, options)`;
    }

    getId(): string {
        return this.name ?? `Anonymous${this.dummy}`;
    }

    async emitTypeGuard(output: fs.promises.FileHandle) {
        if (this.name) await output.write('export ');
        await output.write(`function ${this.typeGuardName()}(val: unknown, options?: TypeGuardOptions): val is ${this.getId()} {\n`);

        await output.write('    if (!isObject(val)) { return false; }\n');

        await output.write('    const props = new Set(Object.keys(val));\n');

        for (const field of this.fields) {
            await field.emitTypeGuard(output);
            await output.write(`    props.delete("${field.name}");\n`);
        }
        await output.write('    if (options?.additionalProperties === false && props.size) return false;\n');

        await output.write('    return true;\n}\n\n');

        return this.emitTypeAssertion(output);
    }

    async emitTypeAssertion(output: fs.promises.FileHandle) {
        await output.write(`${this.name ? 'export ': ''}function ${this.assertionName}(val: unknown, options?: TypeGuardOptions): asserts val is ${this.getId()} {\n`);

        await output.write('    const err: any[] = [];\n');

        await output.write(`    if (!isObject(val)) { err.push({ name: 'TypeMismatch', expected: 'object' }); throw new ValidationError(err); }\n`);

        await output.write('    const props = new Set(Object.keys(val));\n');

        for (const field of this.fields) {
            await field.emitTypeAssertion(output);
            await output.write(`    props.delete("${field.name}");\n`);
        }

        await output.write(`    if (options?.additionalProperties === false && props.size) err.push({ name: 'AdditionalProperties', expected: [], actual: [...props] });\n`);

        await output.write(`    if (err.length) throw new ValidationError(err);\n`);
        await output.write('}\n\n');
    }

    async emit(output: fs.promises.FileHandle, indentationLevel: number) {
        if (!this.name) {
            await output.write(`{\n`);
            for (const f of this.fields) {
                await f.emit(output, indentationLevel + 1);
            }
            await output.write('    '.repeat(indentationLevel + 1) + '}');
        } else {
            await output.write(this.name);
        }
    }
}

class NakedArray {
    name: string | null;
    type: PropertyType;
    assertionName: string;

    constructor(name: string | null, type: PropertyType) {
        this.name = null;
        this.type = type;
        this.assertionName = ''; // not happening
    }

    typeGuardName(): string {
        throw new Error("An array does not have a type guard name.");
    }

    typeCheck(field: string): string {
        return `isTypedArray(val.${field}, ${this.type.typeGuardName()})`;
    }

    assert(field: string): string {
        return `assertTypedArray(val.${field}, ${this.type.assertionName})`;
    }

    async emit(output: fs.promises.FileHandle, indentationLevel: number) {
        await output.write("Array<");
        await this.type.emit(output, indentationLevel);
        await output.write(">");
    }
}

class RouteType {
    path: string;
    method: string;
    name: string;

    constructor(path: string, method: string, name: string) {
        this.path = path;
        this.method = method;
        this.name = name;
    }

    async emitDefinition(output: fs.promises.FileHandle) {
        const name = this.name;
        await output.write(`export type ${name}Route = Route<${name}Request, ${name}Response>;\n\n`);
    }
}

class PrimitiveType {
    enum?: any[];
    type?: OpenAPIV3.NonArraySchemaObjectType;
    assertionName: string;

    constructor(schema: OpenAPIV3.NonArraySchemaObject) {
        const { type, enum: values } = schema;
        this.type = type === 'integer' ? 'number' : type;
        this.enum = values;
        if (this.type === "string") {
            this.assertionName = `assertString`;
        } else if (this.type === "number") {
            this.assertionName = 'assertNumber';
        } else if (this.type === "boolean") {
            this.assertionName = 'assertBoolean';
        } else {
            throw new Error(`Unimplemented primitive type ${this.type}.`);
        }
    }

    typeCheck(field: string): string {
        return this.typeGuardName() + "(val." + field + ")";
    }

    assert(field: string): string {
        return this.typeGuardName() + "(val." + field + ")";
    }

    typeGuardName(): string {
        if (this.type === "string") {
            return `isString`;
        } else if (this.type === "number") {
            return 'isNumber';
        } else if (this.type === "boolean") {
            return 'isBoolean';
        } else {
            throw new Error(`Unimplemented primitive type ${this.type}.`);
        }
    }

    async emit(output: fs.promises.FileHandle) {
        await output.write(this.type || 'undefined');
    }
}

class UndefinedType {
    assertionName?: string;
    constructor() {}

    typeGuardName() {
        return undefined;
    }

    typeCheck() {
        return undefined;
    }

    assert() {
        return undefined;
    }

    emit() {}
}

class EmptyInterface {
    name: string | null = null;
    assertionName: string;

    constructor(schema: OpenAPIV3.NonArraySchemaObject, name: string | null) {
        this.name = name;
        this.assertionName = 'XXXX';
    }

    typeCheck(name: string): string {
        return `isObject(val.${name})`;
    }

    assert(name: string): string {
        return `assertObject(val.${name})`;
    }

    typeGuardName(): string {
        return "isObject";
    }

    async emit(output: fs.promises.FileHandle) {
        await output.write("Record<string, unknown>");
    }
}

enum CompositeModes {
    'ALL_OF',
    'ONE_OF',
}

class CompositeInterface {
    name: string | null;
    types: Array<PropertyType>;
    mode: CompositeModes;
    dummy: number | null;
    id: string;
    assertionName: string;

    constructor(types: Array<PropertyType>, name: string | null, mode: CompositeModes) {
        this.types = types;
        this.name = name;
        this.mode = mode;
        this.dummy = null;

        if(this.name === null) {
            dummies += 1;
            this.dummy = dummies;
        }

        this.id = name ?? `Anonymous${this.dummy}`;

        this.assertionName = `assert${this.id}`;
    }

    getId(): string {
        return this.name || `Anonymous${this.dummy}`;
    }

    typeCheck(field: string): string {
        return this.typeGuardName() + "(val." + field + ")";
    }

    assert(field: string): string {
        return this.assertionName + "(val." + field + ")";
    }

    typeGuardName(): string {
        return `is${this.getId()}`;
    }

    async emitTypeGuard(output: fs.promises.FileHandle) {
        if (this.name) await output.write('export ');
        await output.write(`function ${this.typeGuardName()}(val: unknown, options?: TypeGuardOptions): val is ${this.id} {\n`);

        if (this.mode === CompositeModes.ALL_OF) {
            for (const t of this.types) {
                await output.write(`    if (!${t.typeGuardName()}(val)) { return false; }\n`);
            }
            await output.write(`    return true;\n}\n\n`);
        } else if (this.mode === CompositeModes.ONE_OF) {
            for (const t of this.types) {
                await output.write(`    if (${t.typeGuardName()}(val)) { return true; }\n`);
            }
            await output.write(`    return false;\n}\n\n`);
        } else {
            throw new Error(`Unhandled composite operator ${this.mode}`);
        }

        return this.emitTypeAssertion(output);
    }

    async emitTypeAssertion(output: fs.promises.FileHandle) {
        await output.write(`${this.name ? 'export ': ''}function ${this.assertionName}(val: unknown, options?: TypeGuardOptions): asserts val is ${this.id} {\n`);

        await output.write('    let err: any[] = [];\n');

        await output.write(`    if (!isObject(val)) { err.push({ name: 'TypeMismatch', expected: 'object' }); throw new ValidationError(err); }\n`);

        await output.write('    const props = new Set(Object.keys(val));\n');

        for (const t of this.types) {
            await output.write(`    try { ${t.assertionName}(val); } catch(compErr) { err.push(compErr); }\n`);
        }
        if (this.mode === CompositeModes.ONE_OF) {
            await output.write(`    if (err.length < ${this.types.length}) err = [];`);
        }

        await output.write(`    if (options?.additionalProperties === false && props.size) err.push({ name: 'AdditionalProperties', expected: [], actual: [...props] });\n`);

        await output.write(`    if (err.length) throw new ValidationError(err);\n`);
        await output.write('}\n\n');
    }

    async emit(output: fs.promises.FileHandle) {
        let joinOperator;

        if (this.mode === CompositeModes.ALL_OF) {
            joinOperator = " & ";
        } else if (this.mode === CompositeModes.ONE_OF) {
            joinOperator = " | ";
        } else {
            throw new Error(`Unhandled composite operator ${this.mode}`);
        }

        let i = 0;
        for (const t of this.types) {
            if (i !== 0) {
                await output.write(joinOperator);
            }
            i += 1;

            await t.emit(output, -1);
        }
    }

    async emitDefinition(output: fs.promises.FileHandle) {
        await output.write(`export type ${this.getId()} = `);
        await this.emit(output);
        await output.write(";\n\n");
    }
}

type PropertyType = Enum | Interface | NakedArray | PrimitiveType | EmptyInterface | CompositeInterface | UndefinedType;

type SchemaOrRef = OpenAPIV3.ReferenceObject | Schema;
type Schema = OpenAPIV3.ArraySchemaObject | OpenAPIV3.NonArraySchemaObject;
type Schemas = { [key: string]: OpenAPIV3.ReferenceObject | OpenAPIV3.ArraySchemaObject | OpenAPIV3.NonArraySchemaObject };
type Responses = { [name: string]: OpenAPIV3.ReferenceObject | OpenAPIV3.ResponseObject };

class TypescriptGenerator {
    schemas: Schemas;
    responses: Responses;
    paths: OpenAPIV3.PathsObject;
    types: Map<string, Interface | Enum | CompositeInterface>;
    routes: Set<RouteType>

    constructor(api: OpenAPIV3.Document) {
        this.paths = api.paths;
        this.schemas = api.components?.schemas || {};
        this.responses = api.components?.responses || {};
        this.types = new Map();
        this.routes = new Set();

        this.collectTypes();
    }

    collectNakedArray(schema: OpenAPIV3.ArraySchemaObject, name: string | null): NakedArray {
        const itemType = this.collectSchemaOrRef(schema.items, null);
        return new NakedArray(name, itemType);
    }

    collectInterfaceProperties(schema: OpenAPIV3.NonArraySchemaObject, guessedName: string | null): PropertyType {

        if(schema.properties === undefined) {
            return new EmptyInterface(schema, guessedName);
        }

        const required = schema.required ?? [];

        const fields: Array<Field> = [];
        for(const propName in schema.properties) {
            if(Object.prototype.hasOwnProperty.call(schema.properties, propName)) {
                const t = this.collectSchemaOrRef(schema.properties[propName], null);
                fields.push(new Field(propName, t, required.includes(propName)));
            }
        }

        let name = guessedName;
        if(schema.title) {
            name = schema.title;
        }

        const result = new Interface(name ?? null, fields);
        this.types.set(result.getId(), result);
        return result;
    }

    collectInterface(schema: OpenAPIV3.NonArraySchemaObject, guessedName: string | null): PropertyType {
        let mode;
        let schemas;
        if (schema.allOf) {
            mode = CompositeModes.ALL_OF;
            schemas = schema.allOf;
        } else if (schema.oneOf) {
            mode = CompositeModes.ONE_OF;
            schemas = schema.oneOf;
        } else {
            return this.collectInterfaceProperties(schema, guessedName);
        }

        const types = schemas.map(x => this.collectSchemaOrRef(x, null));
        const result = new CompositeInterface(types, guessedName, mode);

        // if(!guessedName) {
        //     throw new Error("Cannot collect a top-level interface without a name.");
        // }

        this.types.set(result.getId(), result);
        return result;
    }

    resolveReference(reference: OpenAPIV3.ReferenceObject): PropertyType {
        const prefix = "#/components/schemas/";
        if(!reference.$ref.startsWith(prefix)) {
            throw new Error("Unhandled reference type");
        }

        const name = reference.$ref.substr(prefix.length);

        const cached = this.types.get(name);
        if(cached !== undefined) {
            return cached;
        }

        if(name in this.schemas) {
            return this.collectSchemaOrRef(this.schemas[name], name);
        }

        throw new Error("Could not resolve reference " + name);
    }

    collectSchema(schema: Schema, guessedName: string | null): PropertyType {
        let name = guessedName;
        if(schema.title) {
            name = schema.title;
        }
        if (schema.enum) {
            const result = new Enum(name, schema as OpenAPIV3.NonArraySchemaObject);
            this.types.set(result.getId(), result);
            return result;
        }
        switch(schema.type) {
        case "object":
            return this.collectInterface(schema as OpenAPIV3.NonArraySchemaObject, name);
            case "array":
                return this.collectNakedArray(schema as OpenAPIV3.ArraySchemaObject, name);
            case undefined:
                return new UndefinedType();
        default:
            return new PrimitiveType(schema as OpenAPIV3.NonArraySchemaObject);
        }
    }

    collectSchemaOrRef(schema: SchemaOrRef, guessedName: string | null): PropertyType {
        if("$ref" in schema) {
            return this.resolveReference(schema as OpenAPIV3.ReferenceObject);
        }

        return this.collectSchema(schema as OpenAPIV3.SchemaObject, guessedName);
    }

    buildPathParameters(pathData: OpenAPIV3.PathItemObject): { [key: string]: OpenAPIV3.NonArraySchemaObject } {
        const params = pathData.parameters;
        const props: OpenAPIV3.NonArraySchemaObject = {
            type: 'object',
            required: [],
            properties: {},
        };
        params?.forEach((p) => {
            if('$ref' in p) return;
            const { name, in: where, schema } = p;
            props.required?.push(name);
            if(props.properties) props.properties[name] = schema as OpenAPIV3.NonArraySchemaObject;
        });
        return params ? {
            pathParameters: props,
        } : {};
    }

    walkOperation(pathData: OpenAPIV3.PathItemObject, operation: OpenAPIV3.OperationObject, endpointName: string | null) {
        const requestName = `${endpointName}Request`;

        const content = operation.requestBody && "content" in operation.requestBody && operation.requestBody.content;

        const schema = content && "application/json" in content && content["application/json"].schema;
        const wrapper: OpenAPIV3.NonArraySchemaObject = {
            type: 'object',
            required: ['json', 'pathParameters'],
            properties: {
                json: schema || { type: 'object', properties: {} },
                ...this.buildPathParameters(pathData),
            },
        };
        this.collectSchemaOrRef(wrapper, requestName);


        const responseName = `${endpointName}Response`;

        const responses: OpenAPIV3.NonArraySchemaObject[] = [];
        for(const k in operation.responses) {

            if(Object.prototype.hasOwnProperty.call(operation.responses, k)) {
                let response = operation.responses[k];


                if("$ref" in response) {
                    const prefix = "#/components/responses/";
                    if(!response.$ref.startsWith(prefix)) {
                        throw new Error("Unhandled reference type");
                    }

                    response = this.responses[responseName];
                    // responses.push(response);
                } else {
                    const content = response.content;
                    const schema = content && "application/json" in content && content["application/json"].schema;
                    const wrapper: OpenAPIV3.NonArraySchemaObject = {
                        type: 'object',
                        required: schema ? ['statusCode', 'json'] : ['statusCode'],
                        properties: {
                            statusCode: {
                                type: 'number',
                                enum: [parseInt(k)],
                            },
                            json: schema || {
                                type: 'object',
                            },
                        },
                    };
                    responses.push(wrapper);
                }
            }
        }
        this.collectSchemaOrRef(responses.length === 1 ? responses[0] : {
            type: 'object',
            oneOf: responses,
        }, responseName);
    }


    walkPaths(path: string, pathData: OpenAPIV3.PathItemObject) {
        for (const method of METHODS) {
            const route = pathData[method] as OpenAPIV3.OperationObject;
            if (!route) continue;
            const operation = route.operationId ?? route.summary;
            if (operation && operation.match(/\s/)) throw new Error(`Whitespace detected in operationId ${operation}`);
            this.walkOperation(pathData, route, operation ?? null);
            this.routes.add(new RouteType(path, method, operation as string));
        }
    }

    collectTypes() {
        for(const k in this.paths) {
            if(Object.prototype.hasOwnProperty.call(this.paths, k)) {
                this.walkPaths(k, this.paths[k]);
            }
        }
    }

    async emitTypes(target: string) {
        const output = await fs.promises.open(target, "w");

        await output.write(`import { ValidationError, Errors } from './error';

export function isObject(arg: unknown): arg is Record<string, unknown> {
    return arg !== null && typeof(arg) === "object";
}

export function isString(arg: unknown): arg is string {
    return typeof(arg) === "string";
}

export function isNumber(arg: unknown): arg is string {
    return typeof(arg) === "number";
}

export function isBoolean(arg: unknown): arg is string {
    return typeof(arg) === "boolean";
}

export function isDateString(arg: unknown): arg is string {
    return typeof(arg) === "string" && !isNaN(new Date(arg).getTime());
}

export function isTypedArray<T>(arg: unknown, internalValidator: (x: unknown) => x is T): arg is Array<T> {
    return Array.isArray(arg) && arg.every(internalValidator);
}

export function assertObject(arg: unknown): asserts arg is Record<string, unknown> {
    if (arg === undefined || arg === null || typeof(arg) !== "object") throw new ValidationError([{ name: 'TypeMismatch', expected: 'object' }]);
}

export function assertString(arg: unknown): asserts arg is string {
    if (typeof(arg) !== "string") throw new ValidationError([{ name: 'TypeMismatch', expected: 'string' }]);
}

export function assertNumber(arg: unknown): asserts arg is string {
    if (typeof(arg) !== "number") throw new ValidationError([{ name: 'TypeMismatch', expected: 'number' }]);
}

export function assertBoolean(arg: unknown): asserts arg is string {
    if (typeof(arg) !== "boolean") throw new ValidationError([{ name: 'TypeMismatch', expected: 'boolean' }]);
}

export function assertTypedArray<T>(arg: unknown, internalValidator: (x: unknown) => asserts x is T): asserts arg is Array<T> {
    Array.isArray(arg) && arg.every(internalValidator);
}

export function assertDateString(arg: unknown): asserts arg is string {
    if (typeof(arg) !== "string" || isNaN(new Date(arg).getTime())) throw new ValidationError([{ name: 'Format', expected: 'date' }]);
}

interface TypeGuardOptions {
    additionalProperties?: boolean;
}

export type Route<L, K> = [L, K];
`);
        for(const [_, type] of this.types) {
            await type.emitDefinition(output);
            await type.emitTypeGuard(output);
        }

        const routes: any = {};
        const validators = ['export const validators = {'];
        for (const route of this.routes) {
            await route.emitDefinition(output);
            routes[route.path] = routes[route.path] || {};
            routes[route.path][route.method] = route.name;
            validators.push(
                `    "${route.name}": {`,
                `        request: is${route.name}Request,`,
                `        response: assert${route.name}Response,`,
                `    },`,
            );
        }
        validators.push('};\n');

        const r = ['export const routes: { [key: string]: { [key: string]: keyof typeof validators } } = {'];
        for (const path of Object.keys(routes)) {
            r.push(`    "${path}": {`);
            for (const method of Object.keys(routes[path])) {
                r.push(`        ${method}: "${routes[path][method]}",`);
            }
            r.push(`    },`);
        }
        r.push('};\n');
        await output.write(r.join('\n'));
        await output.write(validators.join('\n'));

    }
}


const generate = async (source: string, target: string): Promise<void> => {
    const parser = new SwaggerParser.default();

    await parser.validate(source);
    const api = await parser.parse(source) as OpenAPIV3.Document;

    if (!api.openapi) {
        throw new Error("Not a valid OpenAPI V3 specification.");
    }

    const generator = new TypescriptGenerator(api);
    await generator.emitTypes(target);
};

generate(process.argv[2], process.argv[3])
    .then(() => console.log("done"))
    .catch(err => {
        console.error(err.toString());
        process.exit(1);
    });
