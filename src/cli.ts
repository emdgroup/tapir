import * as SwaggerParser from "swagger-parser";
import { OpenAPIV3 } from "openapi-types";
import yargs from 'yargs/yargs';

import * as path from 'path';
import * as yaml from 'js-yaml';

import { Generator } from '.';

const args = yargs(process.argv.slice(2)).options({
    formats: {
        type: 'boolean',
        default: true,
    },
}).usage('tapir [openapi.yml] [output directory]').demandCommand(2);


const generate = async ({ _, formats }: typeof args.argv): Promise<void> => {
    const [source, dest] = _;

    let parseInput: string | OpenAPIV3.Document;
    if (source.toString() === '-') {
        const chunks: Buffer[] = [];
        for await (const chunk of process.stdin) chunks.push(chunk);
        parseInput = yaml.load(Buffer.concat(chunks).toString()) as OpenAPIV3.Document;
    } else {
        parseInput = source.toString();
    }

    const parser = new SwaggerParser.default();

    const api = await parser.parse(parseInput, { validate: { schema: true, spec: true } }) as OpenAPIV3.Document;

    if (!api.openapi) {
        throw new Error("Not a valid OpenAPI V3 specification.");
    }

    const generator = new Generator({
        api,
        out: path.resolve(dest.toString()),
        ajvOptions: {
            ...(formats ? {
                validateFormats: true,
            } : {}),
        },
    });
    await generator.generate();
};

generate(args.argv).catch((err: Error) => {
    console.error(err.stack);
    process.exit(1);
});
