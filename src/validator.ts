import { ValidationRule, ValidationError, ValidationResult } from './types';

export function validate(data: any, schema: ValidationRule, path: string = 'root'): ValidationResult {
  const errors: ValidationError[] = [];

  if (data === undefined || data === null) {
    if (schema.required) {
      errors.push({ path, message: 'Field is required' });
    }
    return errors.length > 0 ? { valid: false, errors } : { valid: true };
  }

  if (schema.anyOf) {
    const results = schema.anyOf.map(s => validate(data, s, path));
    if (results.some(r => r.valid)) {
      return { valid: true };
    }
    
    return {
      valid: false,
      errors: [{ path, message: `Value does not match any of the schemas in anyOf` }]
    };
  }

  if (schema.oneOf) {
    const results = schema.oneOf.map(s => validate(data, s, path));
    const validCount = results.filter(r => r.valid).length;
    if (validCount === 1) {
      return { valid: true };
    }
    
    return {
      valid: false,
      errors: [{ path, message: `Value must match exactly one schema in oneOf (matched ${validCount})` }]
    };
  }

  if (schema.type === 'any') {
    return { valid: true };
  }

  const actualType = Array.isArray(data) ? 'array' : typeof data;

  if (actualType !== schema.type) {
    errors.push({ path, message: `Expected type ${schema.type}, got ${actualType}` });
    return { valid: false, errors };
  }

  if (schema.enum && !schema.enum.includes(data)) {
    errors.push({ path, message: `Value must be one of: ${schema.enum.join(', ')}` });
  }

  if (schema.type === 'string') {
    if (schema.minLength !== undefined && data.length < schema.minLength) {
      errors.push({ path, message: `String length must be at least ${schema.minLength}` });
    }
    if (schema.maxLength !== undefined && data.length > schema.maxLength) {
      errors.push({ path, message: `String length must be at most ${schema.maxLength}` });
    }
    if (schema.pattern) {
      const regex = schema.pattern instanceof RegExp ? schema.pattern : new RegExp(schema.pattern);
      if (!regex.test(data)) {
        errors.push({ path, message: `String must match pattern ${schema.pattern}` });
      }
    }
  } else if (schema.type === 'number') {
    if (schema.minimum !== undefined && data < schema.minimum) {
      errors.push({ path, message: `Value must be at least ${schema.minimum}` });
    }
    if (schema.maximum !== undefined && data > schema.maximum) {
      errors.push({ path, message: `Value must be at most ${schema.maximum}` });
    }
    if (schema.multipleOf !== undefined && data % schema.multipleOf !== 0) {
      errors.push({ path, message: `Value must be a multiple of ${schema.multipleOf}` });
    }
  } else if (schema.type === 'object') {
    if (schema.properties) {
      for (const key in schema.properties) {
        const result = validate(data[key], schema.properties[key], `${path}.${key}`);
        if (!result.valid) {
          errors.push(...result.errors);
        }
      }
    }

    if (schema.additionalProperties === false) {
      const allowedKeys = schema.properties ? Object.keys(schema.properties) : [];
      for (const key in data) {
        if (!allowedKeys.includes(key)) {
          errors.push({ path: `${path}.${key}`, message: `Additional property ${key} is not allowed` });
        }
      }
    } else if (typeof schema.additionalProperties === 'object') {
      const allowedKeys = schema.properties ? Object.keys(schema.properties) : [];
      for (const key in data) {
        if (!allowedKeys.includes(key)) {
          const result = validate(data[key], schema.additionalProperties, `${path}.${key}`);
          if (!result.valid) {
            errors.push(...result.errors);
          }
        }
      }
    }
  } else if (schema.type === 'array') {
    if (schema.minItems !== undefined && data.length < schema.minItems) {
      errors.push({ path, message: `Array must have at least ${schema.minItems} items` });
    }
    if (schema.maxItems !== undefined && data.length > schema.maxItems) {
      errors.push({ path, message: `Array must have at most ${schema.maxItems} items` });
    }
    if (schema.uniqueItems === true) {
      const seen = new Set();
      let hasDuplicates = false;
      for (const item of data) {
        const serialized = typeof item === 'object' && item !== null ? JSON.stringify(item) : item;
        if (seen.has(serialized)) {
          hasDuplicates = true;
          break;
        }
        seen.add(serialized);
      }
      if (hasDuplicates) {
        errors.push({ path, message: 'Array items must be unique' });
      }
    }
    if (schema.items) {
      data.forEach((item: any, index: number) => {
        const result = validate(item, schema.items!, `${path}[${index}]`);
        if (!result.valid) {
          errors.push(...result.errors);
        }
      });
    }
  }

  return errors.length > 0 ? { valid: false, errors } : { valid: true };
}
