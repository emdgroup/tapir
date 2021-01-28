import * as SwaggerParser from "swagger-parser";
import { OpenAPIV3 } from "openapi-types";

import * as path from 'path';
import * as yaml from 'js-yaml';

import { Generator } from '.';


const generate = async (argv: string[]): Promise<void> => {
    const [source, dest] = argv.slice(2);

    let parseInput: string | OpenAPIV3.Document;
    if (source === '-') {
        const chunks: Buffer[] = [];
        for await (const chunk of process.stdin) chunks.push(chunk);
        parseInput = yaml.load(Buffer.concat(chunks).toString()) as OpenAPIV3.Document;
    } else {
        parseInput = source;
    }

    const parser = new SwaggerParser.default();

    const api = await parser.parse(parseInput, { validate: { schema: true, spec: true } }) as OpenAPIV3.Document;

    if (!api.openapi) {
        throw new Error("Not a valid OpenAPI V3 specification.");
    }

    const generator = new Generator({ api, out: path.resolve(dest) });
    await generator.generate();
};

generate(process.argv)
    .catch((err: Error) => {
        console.error(err.stack);
        process.exit(1);
    });
