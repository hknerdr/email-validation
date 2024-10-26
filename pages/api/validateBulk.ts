// pages/api/validateBulk.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';

const MAILGUN_API_BASE = 'https://api.mailgun.net/v4/address/validate/bulk';
const CHUNK_SIZE = 250;

// Helper function to validate Mailgun API key format
function isValidMailgunApiKey(apiKey: string): boolean {
  // Mailgun private API keys are 48 characters long hexadecimal strings
  // with two dashes splitting it into three parts
  const parts = apiKey.split('-');
  return parts.length === 3 && apiKey.length >= 40;
}

// Helper function to create a bulk validation job
async function createBulkValidation(
  emails: string[],
  apiKey: string,
  accountId: string
) {
  try {
    const response = await axios({
      method: 'post',
      url: MAILGUN_API_BASE,
      headers: {
        'Content-Type': 'application/json',
        'X-Mailgun-Account-Id': accountId,
        'Authorization': `Basic ${Buffer.from(`api:${apiKey}`).toString('base64')}`
      },
      data: {
        addresses: emails
      }
    });
    
    console.log('Bulk validation job created:', response.data);
    return response.data.id;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      if (error.response?.status === 401) {
        throw new Error('Invalid API key or unauthorized access');
      }
      throw new Error(`API Error: ${error.response?.data?.message || error.message}`);
    }
    throw error;
  }
}

// Helper function to check job status
async function checkJobStatus(
  listId: string,
  apiKey: string,
  accountId: string
) {
  try {
    const response = await axios({
      method: 'get',
      url: `${MAILGUN_API_BASE}/${listId}`,
      headers: {
        'X-Mailgun-Account-Id': accountId,
        'Authorization': `Basic ${Buffer.from(`api:${apiKey}`).toString('base64')}`
      }
    });
    
    console.log('Job status:', response.data);
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      if (error.response?.status === 401) {
        throw new Error('Invalid API key or unauthorized access');
      }
      if (error.response?.status === 404) {
        throw new Error('Validation job not found');
      }
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
    const { emails, apiKey, accountId } = req.body;

    // Validate inputs
    if (!emails?.length) {
      return res.status(400).json({ 
        error: 'No emails provided',
        details: 'Please upload a CSV file with email addresses'
      });
    }
    if (!apiKey) {
      return res.status(400).json({ 
        error: 'API key is required',
        details: 'Please provide your Mailgun API key'
      });
    }
    if (!isValidMailgunApiKey(apiKey)) {
      return res.status(400).json({ 
        error: 'Invalid API key format',
        details: 'Please provide a valid Mailgun private API key'
      });
    }
    if (!accountId) {
      return res.status(400).json({ 
        error: 'Account ID is required',
        details: 'Please provide your Mailgun Account ID'
      });
    }

    // Create the bulk validation job
    const listId = await createBulkValidation(emails, apiKey, accountId);

    // Poll for results
    let attempts = 0;
    const maxAttempts = 30; // 5 minutes with 10s intervals
    let lastStatus = null;

    while (attempts < maxAttempts) {
      const status = await checkJobStatus(listId, apiKey, accountId);
      lastStatus = status;
      
      if (status.status === 'completed') {
        return res.status(200).json({
          success: true,
          results: status.records || [],
          totalProcessed: status.records_processed,
          id: status.id,
          summary: status.summary
        });
      }
      
      if (status.status === 'failed') {
        throw new Error(status.reason || 'Validation failed');
      }
      
      // Wait 10 seconds before next check
      await new Promise(resolve => setTimeout(resolve, 10000));
      attempts++;
    }

    // If we reach here, we timed out
    throw new Error(`Validation timed out after 5 minutes. Last status: ${JSON.stringify(lastStatus)}`);

  } catch (error) {
    console.error('Validation error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorResponse = {
      error: 'Validation failed',
      details: errorMessage
    };
    
    return res.status(500).json(errorResponse);
  }
}