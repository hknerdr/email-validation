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

    return res.status(200).json({
      success: true,
      message: 'Credentials verified successfully',
      details: {
        sendingEnabled: response.Enabled
      }
    });

  } catch (error) {
    // More specific error handling
    if (error instanceof Error) {
      switch (error.name) {
        case 'InvalidClientTokenId':
          return res.status(401).json({
            success: false,
            error: 'Invalid Access Key ID'
          });
        case 'SignatureDoesNotMatch':
          return res.status(401).json({
            success: false,
            error: 'Invalid Secret Access Key'
          });
        case 'UnrecognizedClientException':
          return res.status(401).json({
            success: false,
            error: 'Invalid credentials'
          });
        default:
          return res.status(401).json({
            success: false,
            error: `AWS Error: ${error.message}`
          });
      }
    }

    return res.status(500).json({
      success: false,
      error: 'An unexpected error occurred'
    });
  }
}