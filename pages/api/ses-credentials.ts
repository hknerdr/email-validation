// pages/api/ses-credentials.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { SESClient, GetAccountCommand } from "@aws-sdk/client-ses";

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
    // Test the credentials
    const sesClient = new SESClient({
      region,
      credentials: {
        accessKeyId,
        secretAccessKey
      }
    });

    // Try to get account information to verify credentials
    await sesClient.send(new GetAccountCommand({}));

    // Store credentials in session
    if (req.session) {
      req.session.awsCredentials = {
        accessKeyId,
        secretAccessKey,
        region
      };
      await req.session.save();
    }

    return res.status(200).json({ 
      success: true,
      message: 'Credentials verified successfully'
    });

  } catch (error) {
    return res.status(401).json({ 
      error: 'Invalid credentials',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}