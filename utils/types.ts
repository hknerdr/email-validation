// utils/types.ts

export interface DomainStatus {
  verified: boolean;
  has_mx_records?: boolean;
  has_dkim?: boolean;
  has_spf?: boolean;
  dmarc_status?: 'pass' | 'fail' | 'none';
}

export interface EmailValidationResult {
  email: string;
  is_valid: boolean;
  verification_status?: 'Success' | 'Failed' | 'Pending' | 'NotStarted';
  reason?: string;
  details: {
    domain_status: DomainStatus;
  };
}

export interface ValidationStatistics {
  total: number;
  verified: number;
  failed: number;
  pending: number;
  domains: {
    total: number;
    verified: number;
  };
  dkim: {
    enabled: number;
  };
  deliverability?: {
    score: number;
    predictedBounceRate: number;
    recommendations: string[];
  };
}

export interface BulkValidationResult {
  results: EmailValidationResult[];
  stats: ValidationStatistics;
}

export interface BounceRateMetrics {
  predictedRate: number;
  confidence: number;
  factors: {
    domainReputation: number;
    listQuality: number;
    authenticationStatus: number;
  };
  recommendations: string[];
}
