// pages/api/test-credentials.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { SESClient, GetAccountSendingEnabledCommand } from "@aws-sdk/client-ses";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { accessKeyId, secretAccessKey, region = 'us-east-1' } = req.body;

  if (!accessKeyId || !secretAccessKey) {
    return res.status(400).json({ error: 'Missing credentials' });
  }

  try {
    const sesClient = new SESClient({
      region,
      credentials: {
        accessKeyId,
        secretAccessKey
      }
    });

    // Verify credentials by checking account sending status
    const command = new GetAccountSendingEnabledCommand({});
    const response = await sesClient.send(command);

    return res.status(200).json({
      success: true,
      message: 'Credentials verified successfully',
      sendingEnabled: response.Enabled
    });

  } catch (error) {
    let errorMessage = 'Failed to verify credentials';
    
    if (error instanceof Error) {
      switch (error.name) {
        case 'InvalidClientTokenId':
          errorMessage = 'Invalid Access Key ID';
          break;
        case 'SignatureDoesNotMatch':
          errorMessage = 'Invalid Secret Access Key';
          break;
        case 'UnrecognizedClientException':
          errorMessage = 'Invalid credentials';
          break;
        default:
          errorMessage = error.message;
      }
    }

    return res.status(401).json({
      success: false,
      error: errorMessage
    });
  }
}