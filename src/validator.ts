import { ValidationRule, ValidationError, ValidationResult } from './types';

export function validate(data: any, schema: ValidationRule, path: string = 'root'): ValidationResult {
  const errors: ValidationError[] = [];

  if (data === undefined || data === null) {
    if (schema.required) {
      errors.push({ path, message: 'Field is required' });
    }
    return errors.length > 0 ? { valid: false, errors } : { valid: true };
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
  } else if (schema.type === 'object' && schema.properties) {
    for (const key in schema.properties) {
      const result = validate(data[key], schema.properties[key], `${path}.${key}`);
      if (!result.valid) {
        errors.push(...result.errors);
      }
    }
  } else if (schema.type === 'array') {
    if (schema.minItems !== undefined && data.length < schema.minItems) {
      errors.push({ path, message: `Array must have at least ${schema.minItems} items` });
    }
    if (schema.maxItems !== undefined && data.length > schema.maxItems) {
      errors.push({ path, message: `Array must have at most ${schema.maxItems} items` });
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
