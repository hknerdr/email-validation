// utils/smtpValidator.ts
import { createConnection } from 'net';
import { DnsPromises as dns } from 'dns';
import { promisify } from 'util';

interface SMTPValidationResult {
  email: string;
  is_valid: boolean;
  has_mx_records: boolean;
  smtp_response?: string;
  is_catch_all?: boolean;
  details: {
    connection_success: boolean;
    recipient_accepted: boolean;
    smtp_code?: number;
    smtp_message?: string;
  };
}

class SMTPValidator {
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
      const timeout = 10000; // 10 seconds timeout

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

  private async testCatchAll(socket: any, domain: string): Promise<boolean> {
    try {
      // Test with a random email that's unlikely to exist
      const randomEmail = `test-${Math.random().toString(36).substring(7)}@${domain}`;
      const response = await this.sendSMTPCommand(socket, `RCPT TO:<${randomEmail}>`);
      return response.startsWith('250'); // 250 means accepted
    } catch {
      return false;
    }
  }

  public async validateEmail(email: string): Promise<SMTPValidationResult> {
    const [localPart, domain] = email.split('@');
    const result: SMTPValidationResult = {
      email,
      is_valid: false,
      has_mx_records: false,
      details: {
        connection_success: false,
        recipient_accepted: false
      }
    };

    try {
      // 1. Get MX records
      const mxRecords = await this.getMxRecords(domain);
      result.has_mx_records = mxRecords.length > 0;

      if (!mxRecords.length) {
        return result;
      }

      // 2. Try SMTP connection with each MX server
      let socket;
      for (const mxHost of mxRecords) {
        try {
          socket = await this.createSMTPConnection(mxHost);
          result.details.connection_success = true;
          break;
        } catch (error) {
          continue;
        }
      }

      if (!socket) {
        return result;
      }

      // 3. SMTP conversation
      try {
        // Get server greeting
        await new Promise(resolve => socket.once('data', resolve));

        // Send HELO
        const heloResponse = await this.sendSMTPCommand(socket, `HELO validator.local`);
        if (!heloResponse.startsWith('250')) {
          throw new Error('HELO failed');
        }

        // Send MAIL FROM
        const fromResponse = await this.sendSMTPCommand(
          socket,
          `MAIL FROM:<validator@validator.local>`
        );
        if (!fromResponse.startsWith('250')) {
          throw new Error('MAIL FROM failed');
        }

        // Send RCPT TO
        const rcptResponse = await this.sendSMTPCommand(socket, `RCPT TO:<${email}>`);
        result.smtp_response = rcptResponse;
        result.details.smtp_code = parseInt(rcptResponse.substring(0, 3));
        result.details.smtp_message = rcptResponse.substring(4);
        
        // Check if recipient was accepted
        result.details.recipient_accepted = rcptResponse.startsWith('250');
        
        // If accepted, check if it's a catch-all domain
        if (result.details.recipient_accepted) {
          result.is_catch_all = await this.testCatchAll(socket, domain);
        }

        result.is_valid = result.details.recipient_accepted && !result.is_catch_all;

      } finally {
        // Clean up
        try {
          await this.sendSMTPCommand(socket, 'QUIT');
          socket.end();
        } catch {
          socket.destroy();
        }
      }

    } catch (error) {
      result.smtp_response = error instanceof Error ? error.message : 'Unknown error';
    }

    return result;
  }

  public async validateBulk(emails: string[]): Promise<SMTPValidationResult[]> {
    const results: SMTPValidationResult[] = [];
    
    // Process in small batches to avoid overwhelming SMTP servers
    const batchSize = 5;
    for (let i = 0; i < emails.length; i += batchSize) {
      const batch = emails.slice(i, i + batchSize);
      const batchResults = await Promise.all(
        batch.map(email => this.validateEmail(email))
      );
      results.push(...batchResults);
      
      // Add delay between batches to avoid rate limits
      if (i + batchSize < emails.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    return results;
  }
}

export const smtpValidator = new SMTPValidator();
export type { SMTPValidationResult };