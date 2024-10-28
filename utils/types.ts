// utils/types.ts
export interface DKIMAttributes {
  tokens?: string[];
  status: 'Success' | 'Failed' | 'Pending' | 'NotStarted';
  dkimTokens?: string[];
}

export interface VerificationAttributes {
  verificationToken?: string;
  verificationStatus: 'Success' | 'Failed' | 'Pending' | 'NotStarted';
  dkimAttributes?: DKIMAttributes;
}

export interface DomainStatus {
  verified: boolean;
  has_mx_records?: boolean;
  has_dkim?: boolean;
  has_spf?: boolean;
  dmarc_status?: 'pass' | 'fail' | 'none';
}

export interface SESValidationResult {
  email: string;
  is_valid: boolean;
  verification_status?: 'Success' | 'Failed' | 'Pending' | 'NotStarted';
  reason?: string;
  details: {
    domain_status: DomainStatus;
    verification_attributes?: VerificationAttributes;
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
  results: SESValidationResult[];
  stats: ValidationStatistics;
}

export interface EmailValidationError {
  code: string;
  message: string;
  timestamp: string;
}

export interface BounceRateMetrics {
  predictedRate: number;
  confidence: number;
  factors: {
    domainReputation: number;
    listQuality: number;
    authenticationStatus: number;
    historicalPerformance: number;
  };
  recommendations: string[];
}