import { OpenAPIV3 } from 'openapi-types';
import type { Generator } from '..';

import { WriteCb } from './base';
import { PrimitiveType } from './primitive';

export class Enum extends PrimitiveType {
    constructor(name: string, schema: OpenAPIV3.NonArraySchemaObject, generator: Generator) {
        super(name, schema, generator);
    }

    emitDefinition(write: WriteCb): void {
        if (this.type === 'string') {
            write(`export enum ${this.name} {`);

            for (const v of this.enum || []) {
                if (v === null) continue;
                write(`'${v}' = '${v}',`, 4);
            }
            write('}');
        } else {
            write(`export type ${this.name} = ${this.enum?.join(' | ')};`);
        }
    }
}
