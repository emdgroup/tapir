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

    emitTypeGuard(write: WriteCb): void {
        write(`export function is${this.name}(val: unknown, options?: TypeGuardOptions): val is ${this.name} {`);
        write(`return ${this.typeGuardName}(val, options) && `, 4);
        if (this.type === 'string') {
            write(`val in ${this.name};`, 8);
        } else {
            write(`${JSON.stringify(this.enum)}.includes(val);`, 8);
        }
        write(`}`);
    }
}
