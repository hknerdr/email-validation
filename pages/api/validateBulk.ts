import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';
import pLimit from 'p-limit';

const MAILGUN_API_URL = 'https://api.mailgun.net/v4/address/validate';

export default async function validateBulk(req: NextApiRequest, res: NextApiResponse) {
  console.log('Received request to /api/validateBulk');
  console.log('Request body:', req.body);

  try {
    const { emails, apiKey } = req.body;

    if (!emails || !apiKey) {
      return res.status(400).json({ error: 'Missing required fields: emails or apiKey' });
    }

    const limit = pLimit(5); // Adjust concurrency as needed

    const results = await Promise.all(
      emails.map((email: string) =>
        limit(async () => {
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
            console.error(`Error validating email ${email}:`, error);

            if (axios.isAxiosError(error)) {
              return {
                email,
                error: error.message || 'Axios error occurred',
                status: error.response?.status,
                data: error.response?.data,
              };
            }
            return { email, error: 'Unknown error occurred' };
          }
        })
      )
    );

    return res.status(200).json({ results });
  } catch (error) {
    console.error('Validation failed:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return res.status(500).json({ error: 'Validation failed', details: errorMessage });
  }
}
