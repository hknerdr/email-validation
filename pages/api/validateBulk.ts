// pages/api/validateBulk.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';

const MAILGUN_API_URL = 'https://api.mailgun.net/v4/address/validate';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { apiKeys, emails } = req.body;

  if (!emails || !apiKeys || !Array.isArray(apiKeys) || emails.length === 0) {
    return res.status(400).json({ error: 'Emails and API keys are required' });
  }

  let results: any[] = [];
  let currentKeyIndex = 0;

  for (const email of emails) {
    try {
      const apiKey = apiKeys[currentKeyIndex];
      const response = await axios.get(MAILGUN_API_URL, {
        params: { address: email },
        auth: {
          username: 'api',
          password: apiKey,
        },
      });

      results.push({ email, is_valid: response.data.is_valid });

      if (response.data.is_valid) {
        // If quota is reached, move to the next API key
        currentKeyIndex = (currentKeyIndex + 1) % apiKeys.length;
      }
    } catch (error) {
      return res.status(500).json({ error: 'Validation failed', details: error.message });
    }
  }

  res.status(200).json(results);
}
