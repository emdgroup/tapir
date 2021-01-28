import { OpenAPIV3 } from 'openapi-types';

import { WriteCb } from './base';
import { PrimitiveType } from './primitive';

export class Enum extends PrimitiveType {
    constructor(name: string, schema: OpenAPIV3.NonArraySchemaObject) {
        super(name, schema);
    }

    emitDefinition(write: WriteCb): void {
        if (this.type === 'string') {
            write(`export enum ${this.name} {`);

            for (const v of this.enum || []) {
                write(`${v} = "${v}",`, 4);
            }
            write('}');
        } else {
            write(`export type ${this.name} = ${this.enum?.join(' | ')};`);
        }
    }
}
