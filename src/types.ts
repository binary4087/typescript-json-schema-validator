export type SchemaType = 'string' | 'number' | 'boolean' | 'object' | 'array' | 'any';

export interface ValidationRule {
  type: SchemaType;
  required?: boolean;
  properties?: Record<string, ValidationRule>;
  additionalProperties?: boolean | ValidationRule;
  items?: ValidationRule;
  minLength?: number;
  maxLength?: number;
  minimum?: number;
  maximum?: number;
  multipleOf?: number;
  enum?: any[];
  minItems?: number;
  maxItems?: number;
  uniqueItems?: boolean;
  pattern?: string | RegExp;
  anyOf?: ValidationRule[];
  oneOf?: ValidationRule[];
}

export interface ValidationError {
  path: string;
  message: string;
}

export type ValidationResult = {
  valid: true;
} | {
  valid: false;
  errors: ValidationError[];
};