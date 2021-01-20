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
        write(`return ${this.typeGuardName}(val) && `, 4);
        if (this.type === 'string') {
            write(`val in ${this.name};`, 8);
        } else {
            write(`${JSON.stringify(this.enum)}.includes(val);`, 8);
        }
        write(`}`);
    }


    emitTypeAssertion(write: WriteCb): void {
        write(`${this.name ? 'export ': ''}function assert${this.name}(val: unknown, options?: TypeGuardOptions): asserts val is ${this.name} {`);

        write([
            `${this.assertionName}(val);`,
            this.type === 'string'
                ? `if (!(val in ${this.name}))`
                : `if (!${JSON.stringify(this.enum)}.includes(val))`,
            `    throw new ValidationError([{ name: 'Enum', expected: '${this.name}' }]);`,
        ], 4);
        write('}');
    }
}
