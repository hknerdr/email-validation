// pages/api/ses-credentials.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { SESClient, GetAccountSendingCommand } from "@aws-sdk/client-ses";

interface CredentialsResponse {
  success: boolean;
  message?: string;
  error?: string;
  details?: {
    max24HourSend?: number;
    maxSendRate?: number;
    sentLast24Hours?: number;
    sendingEnabled?: boolean;
  };
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<CredentialsResponse>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      success: false, 
      error: 'Method not allowed' 
    });
  }

  const { accessKeyId, secretAccessKey, region = 'us-east-1' } = req.body;

  if (!accessKeyId || !secretAccessKey) {
    return res.status(400).json({ 
      success: false, 
      error: 'Missing credentials' 
    });
  }

  try {
    // Initialize SES client
    const sesClient = new SESClient({
      region,
      credentials: {
        accessKeyId,
        secretAccessKey
      }
    });

    // Try to get account sending status to verify credentials
    const command = new GetAccountSendingCommand({});
    const response = await sesClient.send(command);

    // If we get here, credentials are valid
    return res.status(200).json({
      success: true,
      message: 'Credentials verified successfully',
      details: {
        max24HourSend: response.Max24HourSend,
        maxSendRate: response.MaxSendRate,
        sentLast24Hours: response.SentLast24Hours,
        sendingEnabled: response.SendingEnabled
      }
    });

  } catch (error) {
    console.error('SES Credentials verification error:', error);

    // Handle specific AWS errors
    if (error instanceof Error) {
      if (error.name === 'InvalidClientTokenId') {
        return res.status(401).json({
          success: false,
          error: 'Invalid Access Key ID'
        });
      }
      if (error.name === 'SignatureDoesNotMatch') {
        return res.status(401).json({
          success: false,
          error: 'Invalid Secret Access Key'
        });
      }
      if (error.name === 'UnrecognizedClientException') {
        return res.status(401).json({
          success: false,
          error: 'Invalid credentials'
        });
      }
    }

    // Generic error response
    return res.status(401).json({
      success: false,
      error: 'Failed to verify credentials',
      message: error instanceof Error ? error.message : 'Unknown error occurred'
    });
  } finally {
    // Clean up resources if needed
  }
}