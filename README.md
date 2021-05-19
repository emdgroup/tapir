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
```

The generated files are self-contained and tree-shakable.
There are no runtime dependencies on `tapir` or any other package.


The following properties should be set in the `package.json` file to make the package work across `node` and `browser` environments:

```json
{
    "types": "dist/types.d.ts",
    "main": "dist/types.js"
}
```

## Supported OpenAPI schemas

* Responses
* Request bodies (application/json only)
* Path parameters

Missing:

* Query parameters
* Headers

## Supported Input Validation

Tested:

* Core Types: `boolean`, `string`, `number`, `integer`
    * `enum`
    * `nullable`
    * `minLength`
    * `maxLength`
    * `minimum`
    * `maximum`
    * `exclusiveMinimum`
    * `exclusiveMaximum`
    * `multipleOf`
    * `format`
    * `not`
    * `pattern`
* Objects:
    * `required`
    * `allOf`, `anyOf` and `oneOf`
    * `additionalProperties` with a boolean
* Arrays:
    * `items`
    * `minItems`
    * `maxItems`
    * `uniqueItems`

Untested:

* [Any Type](https://swagger.io/docs/specification/data-models/data-types/#any)
* Core Types: `boolean`, `string`, `number`, `integer`
    * `readOnly`
    * `writeOnly`
* Objects:
    * `additionalProperties` with a schema
    * `minProperties`
    * `maxProperties`
    * `xml`
