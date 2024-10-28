import { 
  SESClient, 
  GetIdentityVerificationAttributesCommand, 
  ListIdentitiesCommand,
  VerificationStatus,
  IdentityVerificationAttributes
} from "@aws-sdk/client-ses";
import { smtpValidator } from './smtpValidator';
import { bouncePredictor } from './bounceRatePredictor';
import type { SESValidationResult, BulkValidationResult, ValidationStatistics, VerificationAttributes } from './types';
import dns from 'dns/promises';

// Define a type for the allowed verification statuses
type SESVerificationStatus = Extract<VerificationStatus, 'Success' | 'Failed' | 'Pending' | 'NotStarted'>;

// Define the DkimAttributes interface manually
interface DkimAttributes {
  DkimStatus?: VerificationStatus;
  DkimTokens?: string[];
}

export class HybridValidator {
  private sesClient: SESClient;

  constructor(credentials: { accessKeyId: string; secretAccessKey: string; region: string }) {
    this.sesClient = new SESClient({
      region: credentials.region,
      credentials: {
        accessKeyId: credentials.accessKeyId,
        secretAccessKey: credentials.secretAccessKey
      }
    });
  }

  private mapVerificationStatus(status: VerificationStatus | undefined): SESVerificationStatus {
    switch (status) {
      case 'Success':
      case 'Failed':
      case 'Pending':
        return status;
      default:
        return 'NotStarted';
    }
  }

  private async getDomainVerificationStatus(domain: string): Promise<VerificationAttributes | null> {
    try {
      const command = new GetIdentityVerificationAttributesCommand({
        Identities: [domain]
      });
      
      const response = await this.sesClient.send(command);
      
      if (response.VerificationAttributes && response.VerificationAttributes[domain]) {
        const domainAttrs = response.VerificationAttributes[domain];
        const status = this.mapVerificationStatus(domainAttrs.VerificationStatus);

        const dkimAttrs = (domainAttrs as any).DkimAttributes as DkimAttributes | undefined;

        return {
          verificationStatus: status,
          dkimAttributes: dkimAttrs ? {
            status: this.mapVerificationStatus(dkimAttrs.DkimStatus),
            tokens: dkimAttrs.DkimTokens || []
          } : undefined
        };
      }
      
      return null;
    } catch (error) {
      console.error('Error getting domain verification status:', error);
      return null;
    }
  }

  private async checkDNSRecords(domain: string): Promise<{
    hasMX: boolean;
    hasSPF: boolean;
    hasDMARC: boolean;
  }> {
    try {
      const [mxRecords, txtRecords] = await Promise.all([
        dns.resolveMx(domain),
        dns.resolveTxt(domain)
      ]);

      const hasSPF = txtRecords.some(records => 
        records.some(record => record.startsWith('v=spf1'))
      );

      let hasDMARC = false;
      try {
        const dmarcRecords = await dns.resolveTxt(`_dmarc.${domain}`);
        hasDMARC = dmarcRecords.some(records =>
          records.some(record => record.startsWith('v=DMARC1'))
        );
      } catch {
        hasDMARC = false;
      }

      return {
        hasMX: mxRecords.length > 0,
        hasSPF,
        hasDMARC
      };
    } catch {
      return { hasMX: false, hasSPF: false, hasDMARC: false };
    }
  }

  private async validateEmailFormat(email: string): Promise<SESValidationResult> {
    const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
    const isValidFormat = emailRegex.test(email);

    if (!isValidFormat) {
      return {
        email,
        is_valid: false,
        verification_status: 'Failed',
        reason: 'Invalid email format',
        details: {
          domain_status: {
            verified: false,
            has_mx_records: false,
            has_dkim: false,
            has_spf: false
          }
        }
      };
    }

    return {
      email,
      is_valid: true,
      verification_status: 'Pending',
      details: {
        domain_status: {
          verified: false,
          has_mx_records: false,
          has_dkim: false,
          has_spf: false
        }
      }
    };
  }

  public async validateEmail(email: string): Promise<SESValidationResult> {
    // Step 1: Format validation
    const formatResult = await this.validateEmailFormat(email);
    if (!formatResult.is_valid) {
      return formatResult;
    }

    const domain = email.split('@')[1];

    // Step 2: DNS checks
    const dnsResults = await this.checkDNSRecords(domain);
    
    // Step 3: SMTP validation
    const smtpResult = await smtpValidator.validateEmail(email);

    // Step 4: SES domain verification check
    const sesVerification = await this.getDomainVerificationStatus(domain);

    // Combine all results
    const isValid = smtpResult.is_valid && dnsResults.hasMX && !smtpResult.is_catch_all;

    return {
      email,
      is_valid: isValid,
      verification_status: isValid ? 'Success' : 'Failed',
      reason: !isValid ? this.determineFailureReason(smtpResult, dnsResults) : undefined,
      details: {
        domain_status: {
          verified: sesVerification?.verificationStatus === 'Success',
          has_mx_records: dnsResults.hasMX,
          has_dkim: sesVerification?.dkimAttributes?.status === 'Success',
          has_spf: dnsResults.hasSPF,
          dmarc_status: dnsResults.hasDMARC ? 'pass' : 'none'
        }
      }
    };
  }

  private determineFailureReason(smtpResult: any, dnsResults: any): string {
    if (!dnsResults.hasMX) return 'No MX records found';
    if (smtpResult.is_catch_all) return 'Catch-all domain detected';
    if (!smtpResult.is_valid) return smtpResult.smtp_response || 'SMTP validation failed';
    return 'Multiple validation checks failed';
  }

  public async validateBulk(emails: string[]): Promise<BulkValidationResult> {
    const batchSize = 50;
    const allResults: SESValidationResult[] = [];
    const uniqueDomains = new Set(emails.map(email => email.split('@')[1]));

    // Pre-fetch domain verifications for all unique domains
    const domainVerificationPromises = Array.from(uniqueDomains).map(domain => 
      this.getDomainVerificationStatus(domain)
    );
    await Promise.all(domainVerificationPromises);

    // Process emails in batches
    for (let i = 0; i < emails.length; i += batchSize) {
      const batch = emails.slice(i, i + batchSize);
      const batchResults = await Promise.all(
        batch.map(email => this.validateEmail(email))
      );
      allResults.push(...batchResults);

      if (i + batchSize < emails.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    // Calculate statistics
    const stats = this.calculateStats(allResults);
    
    // Predict bounce rate
    const bounceMetrics = bouncePredictor.predictBounceRate(allResults);
    stats.deliverability = {
      score: 100 - bounceMetrics.predictedRate,
      predictedBounceRate: bounceMetrics.predictedRate,
      recommendations: bounceMetrics.recommendations
    };

    return {
      results: allResults,
      stats
    };
  }

  private calculateStats(results: SESValidationResult[]): ValidationStatistics {
    const domains = new Set(results.map(r => r.email.split('@')[1]));
    const verifiedDomains = new Set(
      results
        .filter(r => r.details.domain_status.verified)
        .map(r => r.email.split('@')[1])
    );

    return {
      total: results.length,
      verified: results.filter(r => r.is_valid).length,
      failed: results.filter(r => !r.is_valid).length,
      pending: results.filter(r => r.verification_status === 'Pending').length,
      domains: {
        total: domains.size,
        verified: verifiedDomains.size
      },
      dkim: {
        enabled: results.filter(r => r.details.domain_status.has_dkim).length
      }
    };
  }
}

export const createHybridValidator = (credentials: { 
  accessKeyId: string; 
  secretAccessKey: string; 
  region: string; 
}) => {
  return new HybridValidator(credentials);
};