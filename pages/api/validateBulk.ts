// pages/api/validateBulk.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';
import FormData from 'form-data';

const MAILGUN_API_BASE = 'https://api.mailgun.net/v4/address/validate/bulk';

interface ValidationJob {
  id: string;
  message?: string;
  status?: string;
  summary?: {
    result: {
      deliverable: number;
      do_not_send: number;
      undeliverable: number;
      catch_all: number;
      unknown: number;
    };
    risk: {
      high: number;
      low: number;
      medium: number;
      unknown: number;
    };
  };
}

async function createBulkValidation(
  file: Buffer,
  apiKey: string,
  listName: string
): Promise<ValidationJob> {
  try {
    const formData = new FormData();
    formData.append('file', file, {
      filename: 'email_list.csv',
      contentType: 'text/csv',
    });

    const response = await axios.post(
      `${MAILGUN_API_BASE}/${listName}`,
      formData,
      {
        auth: {
          username: 'api',
          password: apiKey
        },
        headers: {
          ...formData.getHeaders(),
        }
      }
    );

    return response.data;
  } catch (error) {
    console.error('Create validation error:', error);
    if (axios.isAxiosError(error)) {
      throw new Error(`API Error: ${error.response?.data?.message || error.message}`);
    }
    throw error;
  }
}

async function checkJobStatus(
  listName: string,
  apiKey: string
): Promise<ValidationJob> {
  try {
    const response = await axios.get(
      `${MAILGUN_API_BASE}/${listName}`,
      {
        auth: {
          username: 'api',
          password: apiKey
        }
      }
    );
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(`API Error: ${error.response?.data?.message || error.message}`);
    }
    throw error;
  }
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { emails, apiKey } = req.body;

    if (!emails?.length || !apiKey) {
      return res.status(400).json({
        error: 'Missing required fields',
        details: !emails?.length ? 'No emails provided' : 'No API key provided'
      });
    }

    // Create CSV content
    const csvContent = 'email\n' + emails.join('\n');
    const buffer = Buffer.from(csvContent, 'utf-8');

    // Generate a unique list name
    const timestamp = Date.now();
    const listName = `validation_${timestamp}`;

    // Create validation job
    console.log('Creating validation job...');
    const job = await createBulkValidation(buffer, apiKey, listName);

    if (!job.id) {
      throw new Error('Failed to create validation job');
    }

    // Poll for results
    let attempts = 0;
    const maxAttempts = 30;

    while (attempts < maxAttempts) {
      const status = await checkJobStatus(job.id, apiKey);
      console.log('Job status:', status);

      if (status.status === 'uploaded' || status.status === 'completed') {
        return res.status(200).json({
          success: true,
          job: status
        });
      }

      if (status.status === 'failed') {
        throw new Error('Validation job failed');
      }

      await new Promise(resolve => setTimeout(resolve, 10000));
      attempts++;
    }

    throw new Error('Validation timed out');

  } catch (error) {
    console.error('Validation error:', error);
    return res.status(500).json({
      error: 'Validation failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}