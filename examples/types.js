var __commonJS = (cb, mod) => function __require() {
  return mod || (0, cb[Object.keys(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
};

// node_modules/ajv/dist/runtime/ucs2length.js
var require_ucs2length = __commonJS({
  "node_modules/ajv/dist/runtime/ucs2length.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    function ucs2length(str) {
      const len = str.length;
      let length = 0;
      let pos = 0;
      let value;
      while (pos < len) {
        length++;
        value = str.charCodeAt(pos++);
        if (value >= 55296 && value <= 56319 && pos < len) {
          value = str.charCodeAt(pos);
          if ((value & 64512) === 56320)
            pos++;
        }
      }
      return length;
    }
    exports.default = ucs2length;
    ucs2length.code = 'require("ajv/dist/runtime/ucs2length").default';
  }
});

// petstore/types.ajv.ts
function assertPetId(data) {
  if (isPetId(data))
    return;
  throw new ValidationError(isPetId.errors);
}
function assertPetStatus(data) {
  if (isPetStatus(data))
    return;
  throw new ValidationError(isPetStatus.errors);
}
var PetStatus;
(function(PetStatus2) {
  PetStatus2["AVAILABLE"] = "AVAILABLE";
  PetStatus2["PENDING"] = "PENDING";
  PetStatus2["SOLD"] = "SOLD";
})(PetStatus || (PetStatus = {}));
function assertPet(data) {
  if (isPet(data))
    return;
  throw new ValidationError(isPet.errors);
}
function assertAnonymous1(data) {
  if (isAnonymous1(data))
    return;
  throw new ValidationError(isAnonymous1.errors);
}
function assertAnonymous3Json(data) {
  if (isAnonymous3Json(data))
    return;
  throw new ValidationError(isAnonymous3Json.errors);
}
function assertAnonymous3(data) {
  if (isAnonymous3(data))
    return;
  throw new ValidationError(isAnonymous3.errors);
}
function assertUpdatePetResponse(data) {
  if (isUpdatePetResponse(data))
    return;
  throw new ValidationError(isUpdatePetResponse.errors);
}
function assertUpdatePetRequestPathParameters(data) {
  if (isUpdatePetRequestPathParameters(data))
    return;
  throw new ValidationError(isUpdatePetRequestPathParameters.errors);
}
function assertUpdatePetRequest(data) {
  if (isUpdatePetRequest(data))
    return;
  throw new ValidationError(isUpdatePetRequest.errors);
}
var isNumber = new RegExp(/^\d+$/);
var ValidationError = class extends Error {
  translate(input) {
    const errors = [];
    for (const error of input) {
      const [, rawField, nested] = error.instancePath.split("/");
      const field = rawField !== void 0 && rawField.length && !isNumber.test(rawField) ? { field: rawField } : {};
      if (nested || isNumber.test(rawField)) {
        const err = this.translate([{
          ...error,
          instancePath: "/"
        }]);
        errors.push({
          name: "Nested",
          ...field,
          index: parseInt(nested ?? rawField, 10),
          errors: err
        });
      } else if (error.keyword === "enum") {
        errors.push({
          name: "Enum",
          ...field
        });
      } else if (error.keyword === "required") {
        errors.push({
          name: "Required",
          field: error.params.missingProperty
        });
      } else if (error.keyword === "type") {
        errors.push({
          name: "TypeMismatch",
          expected: error.params.type,
          ...field
        });
      } else if (error.keyword === "additionalProperties") {
        errors.push({
          name: "AdditionalProperties",
          actual: [error.params.additionalProperty],
          expected: [],
          ...field
        });
      }
    }
    return errors;
  }
  constructor(errors) {
    super();
    this.name = "ValidationError";
    this.errors = this.translate([...errors]);
  }
  toString() {
    return JSON.stringify(this.errors);
  }
};
function isValidationError(arg) {
  return arg instanceof ValidationError;
}
function assertValidationError(arg) {
  if (!(arg instanceof ValidationError))
    throw new Error("Not a ValidationError");
}
var isPetId = validate21;
var pattern0 = new RegExp("^pet-[0-9a-f]{8}$", "u");
function validate21(data, { instancePath = "", parentData, parentDataProperty, rootData = data } = {}) {
  let vErrors = null;
  let errors = 0;
  if (typeof data === "string") {
    if (!pattern0.test(data)) {
      const err0 = { instancePath, schemaPath: "#/pattern", keyword: "pattern", params: { pattern: "^pet-[0-9a-f]{8}$" }, message: 'must match pattern "^pet-[0-9a-f]{8}$"' };
      if (vErrors === null) {
        vErrors = [err0];
      } else {
        vErrors.push(err0);
      }
      errors++;
    }
  } else {
    const err1 = { instancePath, schemaPath: "#/type", keyword: "type", params: { type: "string" }, message: "must be string" };
    if (vErrors === null) {
      vErrors = [err1];
    } else {
      vErrors.push(err1);
    }
    errors++;
  }
  validate21.errors = vErrors;
  return errors === 0;
}
var isPetStatus = validate22;
var schema7 = { "type": "string", "enum": ["AVAILABLE", "PENDING", "SOLD"] };
function validate22(data, { instancePath = "", parentData, parentDataProperty, rootData = data } = {}) {
  let vErrors = null;
  let errors = 0;
  if (typeof data !== "string") {
    const err0 = { instancePath, schemaPath: "#/type", keyword: "type", params: { type: "string" }, message: "must be string" };
    if (vErrors === null) {
      vErrors = [err0];
    } else {
      vErrors.push(err0);
    }
    errors++;
  }
  if (!(data === "AVAILABLE" || data === "PENDING" || data === "SOLD")) {
    const err1 = { instancePath, schemaPath: "#/enum", keyword: "enum", params: { allowedValues: schema7.enum }, message: "must be equal to one of the allowed values" };
    if (vErrors === null) {
      vErrors = [err1];
    } else {
      vErrors.push(err1);
    }
    errors++;
  }
  validate22.errors = vErrors;
  return errors === 0;
}
var isPet = validate23;
var func2 = require_ucs2length().default;
function validate23(data, { instancePath = "", parentData, parentDataProperty, rootData = data } = {}) {
  let vErrors = null;
  let errors = 0;
  if (data && typeof data == "object" && !Array.isArray(data)) {
    if (data.name === void 0) {
      const err0 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "name" }, message: "must have required property 'name'" };
      if (vErrors === null) {
        vErrors = [err0];
      } else {
        vErrors.push(err0);
      }
      errors++;
    }
    for (const key0 in data) {
      if (!(key0 === "name" || key0 === "status")) {
        const err1 = { instancePath, schemaPath: "#/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: key0 }, message: "must NOT have additional properties" };
        if (vErrors === null) {
          vErrors = [err1];
        } else {
          vErrors.push(err1);
        }
        errors++;
      }
    }
    if (data.name !== void 0) {
      let data0 = data.name;
      if (typeof data0 === "string") {
        if (func2(data0) > 64) {
          const err2 = { instancePath: instancePath + "/name", schemaPath: "#/properties/name/maxLength", keyword: "maxLength", params: { limit: 64 }, message: "must NOT have more than 64 characters" };
          if (vErrors === null) {
            vErrors = [err2];
          } else {
            vErrors.push(err2);
          }
          errors++;
        }
        if (func2(data0) < 1) {
          const err3 = { instancePath: instancePath + "/name", schemaPath: "#/properties/name/minLength", keyword: "minLength", params: { limit: 1 }, message: "must NOT have fewer than 1 characters" };
          if (vErrors === null) {
            vErrors = [err3];
          } else {
            vErrors.push(err3);
          }
          errors++;
        }
      } else {
        const err4 = { instancePath: instancePath + "/name", schemaPath: "#/properties/name/type", keyword: "type", params: { type: "string" }, message: "must be string" };
        if (vErrors === null) {
          vErrors = [err4];
        } else {
          vErrors.push(err4);
        }
        errors++;
      }
    }
    if (data.status !== void 0) {
      if (!validate22(data.status, { instancePath: instancePath + "/status", parentData: data, parentDataProperty: "status", rootData })) {
        vErrors = vErrors === null ? validate22.errors : vErrors.concat(validate22.errors);
        errors = vErrors.length;
      }
    }
  } else {
    const err5 = { instancePath, schemaPath: "#/type", keyword: "type", params: { type: "object" }, message: "must be object" };
    if (vErrors === null) {
      vErrors = [err5];
    } else {
      vErrors.push(err5);
    }
    errors++;
  }
  validate23.errors = vErrors;
  return errors === 0;
}
var isAnonymous1 = validate25;
var schema9 = { "type": "object", "description": "OK", "required": ["statusCode", "json"], "properties": { "statusCode": { "type": "number", "enum": [200] }, "json": { "$ref": "#/components/schemas/Pet" } } };
function validate25(data, { instancePath = "", parentData, parentDataProperty, rootData = data } = {}) {
  let vErrors = null;
  let errors = 0;
  if (data && typeof data == "object" && !Array.isArray(data)) {
    if (data.statusCode === void 0) {
      const err0 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "statusCode" }, message: "must have required property 'statusCode'" };
      if (vErrors === null) {
        vErrors = [err0];
      } else {
        vErrors.push(err0);
      }
      errors++;
    }
    if (data.json === void 0) {
      const err1 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "json" }, message: "must have required property 'json'" };
      if (vErrors === null) {
        vErrors = [err1];
      } else {
        vErrors.push(err1);
      }
      errors++;
    }
    if (data.statusCode !== void 0) {
      let data0 = data.statusCode;
      if (!(typeof data0 == "number" && isFinite(data0))) {
        const err2 = { instancePath: instancePath + "/statusCode", schemaPath: "#/properties/statusCode/type", keyword: "type", params: { type: "number" }, message: "must be number" };
        if (vErrors === null) {
          vErrors = [err2];
        } else {
          vErrors.push(err2);
        }
        errors++;
      }
      if (!(data0 === 200)) {
        const err3 = { instancePath: instancePath + "/statusCode", schemaPath: "#/properties/statusCode/enum", keyword: "enum", params: { allowedValues: schema9.properties.statusCode.enum }, message: "must be equal to one of the allowed values" };
        if (vErrors === null) {
          vErrors = [err3];
        } else {
          vErrors.push(err3);
        }
        errors++;
      }
    }
    if (data.json !== void 0) {
      if (!validate23(data.json, { instancePath: instancePath + "/json", parentData: data, parentDataProperty: "json", rootData })) {
        vErrors = vErrors === null ? validate23.errors : vErrors.concat(validate23.errors);
        errors = vErrors.length;
      }
    }
  } else {
    const err4 = { instancePath, schemaPath: "#/type", keyword: "type", params: { type: "object" }, message: "must be object" };
    if (vErrors === null) {
      vErrors = [err4];
    } else {
      vErrors.push(err4);
    }
    errors++;
  }
  validate25.errors = vErrors;
  return errors === 0;
}
var isAnonymous3Json = validate27;
function validate27(data, { instancePath = "", parentData, parentDataProperty, rootData = data } = {}) {
  let vErrors = null;
  let errors = 0;
  if (data && typeof data == "object" && !Array.isArray(data)) {
    for (const key0 in data) {
      const err0 = { instancePath, schemaPath: "#/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: key0 }, message: "must NOT have additional properties" };
      if (vErrors === null) {
        vErrors = [err0];
      } else {
        vErrors.push(err0);
      }
      errors++;
    }
  } else {
    const err1 = { instancePath, schemaPath: "#/type", keyword: "type", params: { type: "object" }, message: "must be object" };
    if (vErrors === null) {
      vErrors = [err1];
    } else {
      vErrors.push(err1);
    }
    errors++;
  }
  validate27.errors = vErrors;
  return errors === 0;
}
var isAnonymous3 = validate28;
var schema11 = { "type": "object", "description": "Not Found", "required": ["statusCode"], "properties": { "statusCode": { "type": "number", "enum": [404] }, "json": { "$ref": "#/components/schemas/Anonymous3Json" } } };
function validate28(data, { instancePath = "", parentData, parentDataProperty, rootData = data } = {}) {
  let vErrors = null;
  let errors = 0;
  if (data && typeof data == "object" && !Array.isArray(data)) {
    if (data.statusCode === void 0) {
      const err0 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "statusCode" }, message: "must have required property 'statusCode'" };
      if (vErrors === null) {
        vErrors = [err0];
      } else {
        vErrors.push(err0);
      }
      errors++;
    }
    if (data.statusCode !== void 0) {
      let data0 = data.statusCode;
      if (!(typeof data0 == "number" && isFinite(data0))) {
        const err1 = { instancePath: instancePath + "/statusCode", schemaPath: "#/properties/statusCode/type", keyword: "type", params: { type: "number" }, message: "must be number" };
        if (vErrors === null) {
          vErrors = [err1];
        } else {
          vErrors.push(err1);
        }
        errors++;
      }
      if (!(data0 === 404)) {
        const err2 = { instancePath: instancePath + "/statusCode", schemaPath: "#/properties/statusCode/enum", keyword: "enum", params: { allowedValues: schema11.properties.statusCode.enum }, message: "must be equal to one of the allowed values" };
        if (vErrors === null) {
          vErrors = [err2];
        } else {
          vErrors.push(err2);
        }
        errors++;
      }
    }
    if (data.json !== void 0) {
      if (!validate27(data.json, { instancePath: instancePath + "/json", parentData: data, parentDataProperty: "json", rootData })) {
        vErrors = vErrors === null ? validate27.errors : vErrors.concat(validate27.errors);
        errors = vErrors.length;
      }
    }
  } else {
    const err3 = { instancePath, schemaPath: "#/type", keyword: "type", params: { type: "object" }, message: "must be object" };
    if (vErrors === null) {
      vErrors = [err3];
    } else {
      vErrors.push(err3);
    }
    errors++;
  }
  validate28.errors = vErrors;
  return errors === 0;
}
var isUpdatePetResponse = validate30;
function validate30(data, { instancePath = "", parentData, parentDataProperty, rootData = data } = {}) {
  let vErrors = null;
  let errors = 0;
  if (!(data && typeof data == "object" && !Array.isArray(data))) {
    const err0 = { instancePath, schemaPath: "#/type", keyword: "type", params: { type: "object" }, message: "must be object" };
    if (vErrors === null) {
      vErrors = [err0];
    } else {
      vErrors.push(err0);
    }
    errors++;
  }
  const _errs1 = errors;
  let valid0 = false;
  let passing0 = null;
  const _errs2 = errors;
  if (!validate25(data, { instancePath, parentData, parentDataProperty, rootData })) {
    vErrors = vErrors === null ? validate25.errors : vErrors.concat(validate25.errors);
    errors = vErrors.length;
  }
  var _valid0 = _errs2 === errors;
  if (_valid0) {
    valid0 = true;
    passing0 = 0;
  }
  const _errs3 = errors;
  if (!validate28(data, { instancePath, parentData, parentDataProperty, rootData })) {
    vErrors = vErrors === null ? validate28.errors : vErrors.concat(validate28.errors);
    errors = vErrors.length;
  }
  var _valid0 = _errs3 === errors;
  if (_valid0 && valid0) {
    valid0 = false;
    passing0 = [passing0, 1];
  } else {
    if (_valid0) {
      valid0 = true;
      passing0 = 1;
    }
  }
  if (!valid0) {
    const err1 = { instancePath, schemaPath: "#/oneOf", keyword: "oneOf", params: { passingSchemas: passing0 }, message: "must match exactly one schema in oneOf" };
    if (vErrors === null) {
      vErrors = [err1];
    } else {
      vErrors.push(err1);
    }
    errors++;
  } else {
    errors = _errs1;
    if (vErrors !== null) {
      if (_errs1) {
        vErrors.length = _errs1;
      } else {
        vErrors = null;
      }
    }
  }
  validate30.errors = vErrors;
  return errors === 0;
}
var isUpdatePetRequestPathParameters = validate33;
function validate33(data, { instancePath = "", parentData, parentDataProperty, rootData = data } = {}) {
  let vErrors = null;
  let errors = 0;
  if (data && typeof data == "object" && !Array.isArray(data)) {
    if (data.petId === void 0) {
      const err0 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "petId" }, message: "must have required property 'petId'" };
      if (vErrors === null) {
        vErrors = [err0];
      } else {
        vErrors.push(err0);
      }
      errors++;
    }
    if (data.petId !== void 0) {
      if (!validate21(data.petId, { instancePath: instancePath + "/petId", parentData: data, parentDataProperty: "petId", rootData })) {
        vErrors = vErrors === null ? validate21.errors : vErrors.concat(validate21.errors);
        errors = vErrors.length;
      }
    }
  } else {
    const err1 = { instancePath, schemaPath: "#/type", keyword: "type", params: { type: "object" }, message: "must be object" };
    if (vErrors === null) {
      vErrors = [err1];
    } else {
      vErrors.push(err1);
    }
    errors++;
  }
  validate33.errors = vErrors;
  return errors === 0;
}
var isUpdatePetRequest = validate35;
function validate35(data, { instancePath = "", parentData, parentDataProperty, rootData = data } = {}) {
  let vErrors = null;
  let errors = 0;
  if (data && typeof data == "object" && !Array.isArray(data)) {
    if (data.pathParameters === void 0) {
      const err0 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "pathParameters" }, message: "must have required property 'pathParameters'" };
      if (vErrors === null) {
        vErrors = [err0];
      } else {
        vErrors.push(err0);
      }
      errors++;
    }
    if (data.json === void 0) {
      const err1 = { instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: "json" }, message: "must have required property 'json'" };
      if (vErrors === null) {
        vErrors = [err1];
      } else {
        vErrors.push(err1);
      }
      errors++;
    }
    if (data.pathParameters !== void 0) {
      if (!validate33(data.pathParameters, { instancePath: instancePath + "/pathParameters", parentData: data, parentDataProperty: "pathParameters", rootData })) {
        vErrors = vErrors === null ? validate33.errors : vErrors.concat(validate33.errors);
        errors = vErrors.length;
      }
    }
    if (data.json !== void 0) {
      if (!validate23(data.json, { instancePath: instancePath + "/json", parentData: data, parentDataProperty: "json", rootData })) {
        vErrors = vErrors === null ? validate23.errors : vErrors.concat(validate23.errors);
        errors = vErrors.length;
      }
    }
  } else {
    const err2 = { instancePath, schemaPath: "#/type", keyword: "type", params: { type: "object" }, message: "must be object" };
    if (vErrors === null) {
      vErrors = [err2];
    } else {
      vErrors.push(err2);
    }
    errors++;
  }
  validate35.errors = vErrors;
  return errors === 0;
}
var validators = {
  UpdatePet: {
    isRequest: isUpdatePetRequest,
    isResponse: isUpdatePetResponse,
    assertRequest: assertUpdatePetRequest,
    assertResponse: assertUpdatePetResponse
  }
};
var routes = {
  "POST /pet/{petId}": "UpdatePet"
};
export {
  PetStatus,
  ValidationError,
  assertAnonymous1,
  assertAnonymous3,
  assertAnonymous3Json,
  assertPet,
  assertPetId,
  assertPetStatus,
  assertUpdatePetRequest,
  assertUpdatePetRequestPathParameters,
  assertUpdatePetResponse,
  assertValidationError,
  isAnonymous1,
  isAnonymous3,
  isAnonymous3Json,
  isPet,
  isPetId,
  isPetStatus,
  isUpdatePetRequest,
  isUpdatePetRequestPathParameters,
  isUpdatePetResponse,
  isValidationError,
  routes,
  validators
};
