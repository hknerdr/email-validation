import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';

const MAILGUN_API_URL = 'https://api.mailgun.net/v4/address/validate';

export default async function validateBulk(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { emails, apiKey } = req.body;

    if (!emails || !apiKey) {
      return res.status(400).json({ error: 'Missing required fields: emails or apiKey' });
    }

    const results = await Promise.all(
      emails.map(async (email: string) => {
        try {
          const response = await axios.get(MAILGUN_API_URL, {
            params: { address: email },
            auth: {
              username: 'api',
              password: apiKey,
            },
          });
          return { email, ...response.data };
        } catch (error) {
          if (axios.isAxiosError(error)) {
            return { email, error: error.message || 'Axios error occurred' };
          }
          return { email, error: 'Unknown error occurred' };
        }
      })
    );

    return res.status(200).json({ results });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return res.status(500).json({ error: 'Validation failed', details: errorMessage });
  }
}
