import * as SwaggerParser from "swagger-parser";
import { OpenAPIV3 } from "openapi-types";

import * as fs from 'fs';
import * as path from 'path';

import { Generator } from '.';


const generate = async (source: string): Promise<void> => {
    const parser = new SwaggerParser.default();

    await parser.validate(source);
    const api = await parser.parse(source) as OpenAPIV3.Document;

    if (!api.openapi) {
        throw new Error("Not a valid OpenAPI V3 specification.");
    }

    const generator = new Generator({ api, out: process.stdout });
    const src = path.resolve(__dirname, '..', 'src');
    process.stdout.write(fs.readFileSync(path.resolve(src, 'error.ts')));
    process.stdout.write(fs.readFileSync(path.resolve(src, 'core.ts')).toString().replace(/^import .*/g, ''));
    await generator.generate();
};

generate(process.argv[2])
    .catch((err: Error) => {
        console.error(err.stack);
        process.exit(1);
    });
