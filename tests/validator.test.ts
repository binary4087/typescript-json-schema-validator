import { validate, ValidationRule } from '../src';

describe('JSON Schema Validator', () => {
  const userSchema: ValidationRule = {
    type: 'object',
    required: true,
    properties: {
      username: { type: 'string', required: true, minLength: 3 },
      age: { type: 'number', minimum: 18 },
      role: { type: 'string', enum: ['admin', 'user', 'guest'] },
      tags: { type: 'array', items: { type: 'string' } }
    }
  };

  it('should validate a correct object', () => {
    const data = { username: 'alice', age: 25, role: 'admin', tags: ['ts', 'dev'] };
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
});