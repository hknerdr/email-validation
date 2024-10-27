// utils/types.ts
export interface ValidationResult {
  email: string;
  is_valid: boolean;
  reason?: string;
  risk: 'high' | 'medium' | 'low' | 'none';
  details: {
    syntax: {
      is_valid: boolean;
      has_valid_format: boolean;
      has_valid_length: boolean;
    };
    domain: {
      has_mx_records: boolean;
      has_valid_syntax: boolean;
      is_disposable_domain: boolean;
      is_role_account: boolean;
    };
    smtp?: {
      connection_success: boolean;
      recipient_accepted: boolean;
      is_catch_all: boolean;
      response_code?: number;
      response_message?: string;
    };
  };
  suggestions?: string[];
}

export interface BulkValidationResult {
  results: ValidationResult[];
  stats: {
    total: number;
    valid: number;
    invalid: number;
    risk_levels: {
      high: number;
      medium: number;
      low: number;
      none: number;
    };
    errors: string[];
  };
}