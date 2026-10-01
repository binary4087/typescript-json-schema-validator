import { validate, ValidationRule } from '../src';

describe('JSON Schema Validator', () => {
  const userSchema: ValidationRule = {
    type: 'object',
    required: true,
    properties: {
      username: { type: 'string', required: true, minLength: 3 },
      age: { type: 'number', minimum: 18 },
      role: { type: 'string', enum: ['admin', 'user', 'guest'] },
      tags: { type: 'array', items: { type: 'string' }, minItems: 1, maxItems: 3 },
      email: { type: 'string', pattern: /^\S+@\S+\.\S+$/ }
    }
  };

  it('should validate a correct object', () => {
    const data = { username: 'alice', age: 25, role: 'admin', tags: ['ts', 'dev'], email: 'alice@example.com' };
    const result = validate(data, userSchema);
    expect(result.valid).toBe(true);
  });

  it('should fail when required field is missing', () => {
    const data = { age: 25 };
    const result = validate(data, userSchema);
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.errors[0].path).toBe('root.username');
    }
  });

  it('should fail when type is incorrect', () => {
    const data = { username: 'alice', age: '25' };
    const result = validate(data, userSchema);
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.errors[0].message).toContain('Expected type number');
    }
  });

  it('should fail when minLength is not met', () => {
    const data = { username: 'al', age: 25 };
    const result = validate(data, userSchema);
    expect(result.valid).toBe(false);
  });

  it('should fail when enum value is invalid', () => {
    const data = { username: 'alice', age: 25, role: 'superadmin' };
    const result = validate(data, userSchema);
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.errors[0].message).toContain('Value must be one of: admin, user, guest');
    }
  });

  it('should fail when array is too short', () => {
    const data = { username: 'alice', age: 25, tags: [] };
    const result = validate(data, userSchema);
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.errors.some(e => e.message.includes('at least 1 items'))).toBe(true);
    }
  });

  it('should fail when array is too long', () => {
    const data = { username: 'alice', age: 25, tags: ['1', '2', '3', '4'] };
    const result = validate(data, userSchema);
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.errors.some(e => e.message.includes('at most 3 items'))).toBe(true);
    }
  });

  it('should fail when pattern is not matched', () => {
    const data = { username: 'alice', age: 25, email: 'invalid-email' };
    const result = validate(data, userSchema);
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.errors.some(e => e.message.includes('must match pattern'))).toBe(true);
    }
  });

  it('should validate multipleOf for numbers', () => {
    const schema: ValidationRule = { type: 'number', multipleOf: 5 };
    expect(validate(10, schema).valid).toBe(true);
    expect(validate(12, schema).valid).toBe(false);
    const result = validate(12, schema);
    if (!result.valid) {
      expect(result.errors[0].message).toBe('Value must be a multiple of 5');
    }
  });

  it('should fail when additional properties are present and additionalProperties is false', () => {
    const schema: ValidationRule = {
      type: 'object',
      properties: { name: { type: 'string' } },
      additionalProperties: false
    };
    const data = { name: 'Alice', age: 30 };
    const result = validate(data, schema);
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.errors[0].message).toBe('Additional property age is not allowed');
    }
  });

  it('should validate additional properties when additionalProperties is a schema', () => {
    const schema: ValidationRule = {
      type: 'object',
      properties: { name: { type: 'string' } },
      additionalProperties: { type: 'number' }
    };
    expect(validate({ name: 'Alice', age: 30 }, schema).valid).toBe(true);
    const result = validate({ name: 'Alice', age: '30' }, schema);
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.errors[0].message).toContain('Expected type number');
    }
  });

  it('should validate uniqueItems for arrays', () => {
    const schema: ValidationRule = { type: 'array', uniqueItems: true };
    expect(validate([1, 2, 3], schema).valid).toBe(true);
    expect(validate([1, 2, 1], schema).valid).toBe(false);
    
    const complexSchema: ValidationRule = { type: 'array', uniqueItems: true, items: { type: 'object' } };
    expect(validate([{ a: 1 }, { a: 2 }], complexSchema).valid).toBe(true);
    expect(validate([{ a: 1 }, { a: 1 }], complexSchema).valid).toBe(false);
  });

  it('should validate anyOf', () => {
    const schema: ValidationRule = {
      type: 'any',
      anyOf: [
        { type: 'string', minLength: 5 },
        { type: 'number', minimum: 10 }
      ]
    };
    expect(validate('hello', schema).valid).toBe(true);
    expect(validate(15, schema).valid).toBe(true);
    expect(validate('hi', schema).valid).toBe(false);
    expect(validate(5, schema).valid).toBe(false);
    expect(validate(true, schema).valid).toBe(false);
  });
});