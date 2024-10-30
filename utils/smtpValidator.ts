// utils/smtpValidator.ts

import { createConnection } from 'net';
import dns from 'dns/promises';
import pLimit from 'p-limit';
import { Cache } from './cache';
import type { EmailValidationResult, DomainStatus } from './types';

interface SMTPValidationResult {
  email: string;
  is_valid: boolean;
  smtp_response?: string;
  details: {
    connection_success: boolean;
    recipient_accepted: boolean;
    smtp_code?: number;
    smtp_message?: string;
    domain_status: DomainStatus;
  };
}

class SMTPValidator {
  private smtpCache: Cache<boolean>;

  constructor() {
    this.smtpCache = new Cache<boolean>({
      ttl: 12 * 60 * 60 * 1000, // 12 saat
      maxSize: 5000
    });
  }

  private async getMxRecords(domain: string): Promise<string[]> {
    try {
      const records = await dns.resolveMx(domain);
      return records.sort((a, b) => a.priority - b.priority).map(r => r.exchange);
    } catch {
      return [];
    }
  }

  private createSMTPConnection(host: string, port: number = 25): Promise<any> {
    return new Promise((resolve, reject) => {
      const socket = createConnection(port, host);
      const timeout = 10000; // 10 saniye timeout

      socket.setTimeout(timeout);
      
      socket.on('connect', () => resolve(socket));
      socket.on('error', (err) => reject(err));
      socket.on('timeout', () => {
        socket.destroy();
        reject(new Error('Connection timeout'));
      });
    });
  }

  private async sendSMTPCommand(socket: any, command: string): Promise<string> {
    return new Promise((resolve, reject) => {
      socket.write(command + '\r\n');
      
      socket.once('data', (data: Buffer) => {
        resolve(data.toString());
      });
      
      socket.once('error', (err: Error) => {
        reject(err);
      });
    });
  }

  public async validateEmail(email: string): Promise<EmailValidationResult> {
    const [localPart, domain] = email.split('@');
    const result: EmailValidationResult = {
      email,
      is_valid: false,
      details: {
        connection_success: false,
        recipient_accepted: false,
        domain_status: {
          has_mx_records: false,
          has_dkim: false,
          has_spf: false,
          dmarc_status: 'none'
        }
      }
    };

    try {
      // MX kayıtlarını kontrol et
      const mxRecords = await this.getMxRecords(domain);
      result.details.domain_status.has_mx_records = mxRecords.length > 0;

      if (!mxRecords.length) {
        return result;
      }

      // SMTP bağlantısını kur
      let socket;
      for (const mxHost of mxRecords) {
        try {
          socket = await this.createSMTPConnection(mxHost);
          result.details.connection_success = true;
          break;
        } catch (error) {
          console.warn(`SMTP connection to ${mxHost} failed:`, error);
          continue;
        }
      }

      if (!socket) {
        return result;
      }

      try {
        // SMTP komutlarını gönder
        const heloResponse = await this.sendSMTPCommand(socket, `HELO validator.local`);
        if (!heloResponse.startsWith('250')) {
          throw new Error('HELO failed');
        }

        const mailFromResponse = await this.sendSMTPCommand(socket, `MAIL FROM:<validator@validator.local>`);
        if (!mailFromResponse.startsWith('250')) {
          throw new Error('MAIL FROM failed');
        }

        const rcptToResponse = await this.sendSMTPCommand(socket, `RCPT TO:<${email}>`);
        result.details.smtp_response = rcptToResponse;
        result.details.recipient_accepted = rcptToResponse.startsWith('250');

        // Validity
        result.is_valid = result.details.recipient_accepted;

        // DNS kayıtlarını tekrar kontrol edebilirsiniz (DKIM, SPF, DMARC)
        // Örnek olarak, sadece MX kayıtlarını kontrol ettik. DKIM, SPF, DMARC kontrolünü ekleyebilirsiniz.

      } finally {
        // Bağlantıyı kapat
        try {
          await this.sendSMTPCommand(socket, 'QUIT');
          socket.end();
        } catch {
          socket.destroy();
        }
      }

    } catch (error) {
      result.details.smtp_response = error instanceof Error ? error.message : 'Unknown error';
    }

    return result;
  }

  public async validateBulk(emails: string[]): Promise<EmailValidationResult[]> {
    const limit = pLimit(5); // Eşzamanlılık limiti
    const results: EmailValidationResult[] = [];

    const validationPromises = emails.map(email =>
      limit(() => this.validateEmail(email))
    );

    const validationResults = await Promise.all(validationPromises);
    results.push(...validationResults);

    return results;
  }
}

export const smtpValidator = new SMTPValidator();
