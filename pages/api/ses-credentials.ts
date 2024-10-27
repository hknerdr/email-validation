// pages/api/ses-credentials.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { SESClient, GetAccountSendingEnabledCommand } from "@aws-sdk/client-ses";

interface CredentialsResponse {
  success: boolean;
  message?: string;
  error?: string;
  details?: {
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
    const command = new GetAccountSendingEnabledCommand({});
    const response = await sesClient.send(command);

    // If we get here, credentials are valid
    return res.status(200).json({
      success: true,
      message: 'Credentials verified successfully',
      details: {
        sendingEnabled: response.Enabled
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
  }
}