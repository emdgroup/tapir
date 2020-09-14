# tapir

Generate TypeScript assertions and type guards from OpenAPI specs

## Synopsis

```
npm install --global @emdgroup/tapir
tapir openapi.yml > types.ts
```

## Supported Input Validation

* Core Types: `boolean`, `string`, `number`, `integer`
    * `enum`
* Objects:
    * `required`
    * `allOf` and `oneOf`
    * `additionalProperties` with a boolean
* Arrays:
    * `items`

Not supported

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
