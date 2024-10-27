// utils/hybridValidator.ts
import { SESClient, GetIdentityVerificationAttributesCommand, ListIdentitiesCommand } from "@aws-sdk/client-ses";
import type { SESValidationResult } from './types';

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

  private async checkDomainVerification(domain: string): Promise<boolean> {
    try {
      const command = new GetIdentityVerificationAttributesCommand({
        Identities: [domain]
      });
      const response = await this.sesClient.send(command);
      const attributes = response.VerificationAttributes?.[domain];
      return attributes?.VerificationStatus === 'Success';
    } catch {
      return false;
    }
  }

  private async validateEmailFormat(email: string): Promise<SESValidationResult> {
    // Basic format validation
    const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
    const isValidFormat = emailRegex.test(email);

    if (!isValidFormat) {
      return {
        email,
        is_valid: false,
        reason: 'Invalid email format',
        verification_status: 'Failed',
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
          has_mx_records: true,
          has_dkim: false,
          has_spf: false
        }
      }
    };
  }

  public async validateEmail(email: string): Promise<SESValidationResult> {
    // First check format
    const formatResult = await this.validateEmailFormat(email);
    if (!formatResult.is_valid) {
      return formatResult;
    }

    // Extract domain
    const domain = email.split('@')[1];

    // Check domain verification
    const isDomainVerified = await this.checkDomainVerification(domain);

    return {
      ...formatResult,
      is_valid: isDomainVerified,
      verification_status: isDomainVerified ? 'Success' : 'Failed',
      details: {
        ...formatResult.details,
        domain_status: {
          ...formatResult.details.domain_status,
          verified: isDomainVerified
        }
      }
    };
  }

  public async validateBulk(emails: string[]): Promise<{
    results: SESValidationResult[];
    totalProcessed: number;
    successful: number;
    failed: number;
  }> {
    // Process in batches to avoid rate limits
    const batchSize = 100;
    const allResults: SESValidationResult[] = [];

    for (let i = 0; i < emails.length; i += batchSize) {
      const batch = emails.slice(i, i + batchSize);
      const batchResults = await Promise.all(
        batch.map(email => this.validateEmail(email))
      );
      allResults.push(...batchResults);

      // Add delay between batches
      if (i + batchSize < emails.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    return {
      results: allResults,
      totalProcessed: allResults.length,
      successful: allResults.filter(r => r.is_valid).length,
      failed: allResults.filter(r => !r.is_valid).length
    };
  }

  public async getDomainVerificationStatus(domain: string) {
    try {
      const command = new GetIdentityVerificationAttributesCommand({
        Identities: [domain]
      });
      const response = await this.sesClient.send(command);
      return response.VerificationAttributes?.[domain];
    } catch (error) {
      console.error('Error getting domain verification status:', error);
      return null;
    }
  }

  public async listVerifiedDomains() {
    try {
      const command = new ListIdentitiesCommand({
        IdentityType: 'Domain'
      });
      const response = await this.sesClient.send(command);
      return response.Identities || [];
    } catch (error) {
      console.error('Error listing verified domains:', error);
      return [];
    }
  }
}

// Export a factory function to create validator instances
export const createHybridValidator = (credentials: { 
  accessKeyId: string; 
  secretAccessKey: string; 
  region: string; 
}) => {
  return new HybridValidator(credentials);
};