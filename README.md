# tapir

Generate TypeScript assertions and type guards from OpenAPI specs

## Synopsis

```bash
yarn add --dev @emdgroup/tapir
yarn tapir openapi.yml dir/to/lib/

# or use - to read from stdin
cat openapi.yml | yarn tapir - dist/
```

This will create the following files:

```
dist/
  types.d.ts
  types.js
  types.mjs
```

The generated files are self-contained and tree-shakable.
There are no runtime dependencies on `tapir` or any other package.


The following properties should be set in the `package.json` file to make the package work across `node` and `browser` environments:

```json
{
    "types": "dist/types.d.ts",
    "main": "dist/types.js",
    "module": "dist/types.mjs"
}
```

## Supported OpenAPI schemas

* Responses
* Request bodys (application/json only)
* Path parameters

Missing:

* Query parameters
* Headers

## Supported Input Validation

Tested:

* Core Types: `boolean`, `string`, `number`, `integer`
    * `enum`
* Objects:
    * `required`
    * `allOf` and `oneOf`
    * `additionalProperties` with a boolean
* Arrays:
    * `items`

Untested:

* [Any Type](https://swagger.io/docs/specification/data-models/data-types/#any)
* Core Types: `boolean`, `string`, `number`, `integer`
    * `minLength`
    * `maxLength`
    * `minimum`
    * `maximum`
    * `exclusiveMinimum`
    * `exclusiveMaximum`
    * `multipleOf`
    * `format`
    * `not`
    * `nullable`
    * `pattern`
    * `readOnly`
    * `writeOnly`
* Objects:
    * `additionalProperties` with a schema
    * `minProperties`
    * `maxProperties`
    * `anyOf`
    * `xml`
* Arrays:
    * `minItems`
    * `maxItems`
    * `uniqueItems`
