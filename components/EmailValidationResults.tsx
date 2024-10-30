// utils/hybridValidator.ts

import { SESClient } from "@aws-sdk/client-ses";
import { smtpValidator } from './smtpValidator';
import { bouncePredictor } from './bounceRatePredictor';
import type { 
  EmailValidationResult, 
  BulkValidationResult, 
  ValidationStatistics 
} from './types';
import { Cache } from './cache';
import pLimit from 'p-limit';
import dns from 'dns/promises';

export class HybridValidator {
  private sesClient: SESClient;
  private dnsCache: Cache<{
    hasMX: boolean;
    hasSPF: boolean;
    hasDMARC: boolean;
  }>;

  constructor(credentials: { accessKeyId: string; secretAccessKey: string; region: string }) {
    this.sesClient = new SESClient({
      region: credentials.region,
      credentials: {
        accessKeyId: credentials.accessKeyId,
        secretAccessKey: credentials.secretAccessKey
      },
      maxAttempts: 5,
      retryStrategy: undefined
    });
    this.dnsCache = new Cache({
      ttl: 24 * 60 * 60 * 1000, // 24 hours
      maxSize: 1000
    });
  }

  private async checkDNSRecords(domain: string): Promise<{
    hasMX: boolean;
    hasSPF: boolean;
    hasDMARC: boolean;
  }> {
    // Check cache first
    const cached = this.dnsCache.get(domain);
    if (cached) {
      console.log(`Cache hit for DNS records of domain: ${domain}`);
      return cached;
    }

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

      const dnsResults = {
        hasMX: mxRecords.length > 0,
        hasSPF,
        hasDMARC
      };

      // Cache the DNS results
      this.dnsCache.set(domain, dnsResults);
      console.log(`Cached DNS records for domain: ${domain}`);

      return dnsResults;
    } catch (error) {
      console.error(`DNS resolution failed for domain ${domain}:`, error);
      return { hasMX: false, hasSPF: false, hasDMARC: false };
    }
  }

  private async validateEmailFormat(email: string): Promise<EmailValidationResult> {
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
            has_spf: false,
            dmarc_status: 'none'
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
          verified: false, // SES verification removed
          has_mx_records: false,
          has_dkim: false, // SES verification removed
          has_spf: false,
          dmarc_status: 'none'
        }
      }
    };
  }

  public async validateEmail(email: string): Promise<EmailValidationResult> {
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

    // Combine all results
    const isValid = smtpResult.is_valid && dnsResults.hasMX && !smtpResult.is_catch_all;

    return {
      email,
      is_valid: isValid,
      verification_status: isValid ? 'Success' : 'Failed',
      reason: !isValid ? this.determineFailureReason(smtpResult, dnsResults) : undefined,
      details: {
        domain_status: {
          verified: false, // SES verification removed
          has_mx_records: dnsResults.hasMX,
          has_dkim: false, // SES verification removed
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
    const limit = pLimit(5); // Adjust concurrency as needed
    const allResults: EmailValidationResult[] = [];
    const uniqueDomains = new Set(emails.map(email => email.split('@')[1]));

    // Pre-fetch DNS checks for all unique domains
    const dnsCheckPromises = Array.from(uniqueDomains).map(domain => 
      limit(() => this.checkDNSRecords(domain))
    );
    await Promise.all(dnsCheckPromises);

    // Process emails with controlled concurrency
    const validationPromises = emails.map(email =>
      limit(() => this.validateEmail(email))
    );

    const validationResults = await Promise.all(validationPromises);
    allResults.push(...validationResults);

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

  private calculateStats(results: EmailValidationResult[]): ValidationStatistics {
    const domains = new Set(results.map(r => r.email.split('@')[1]));
    const verifiedDomains = new Set(
      results
        .filter(r => r.is_valid)
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
      },
      deliverability: undefined, // Will be set after prediction
    };
  }
}

export const createHybridValidator = (credentials: { accessKeyId: string; secretAccessKey: string; region: string }) => {
  return new HybridValidator(credentials);
};
