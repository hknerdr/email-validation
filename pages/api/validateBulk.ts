// pages/api/validateBulk.ts

import type { NextApiRequest, NextApiResponse } from 'next';
import { smtpValidator } from '../../utils/smtpValidator';
import type { 
  EmailValidationResult, 
  ValidationStatistics 
} from '../../utils/types';

interface ValidationResponse {
  results: EmailValidationResult[];
  stats: ValidationStatistics;
}

interface ErrorResponse {
  error: string;
  details?: string;
}

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '4mb',
    },
    responseLimit: false,
  },
};

export default async function validateBulk(
  req: NextApiRequest,
  res: NextApiResponse<ValidationResponse | ErrorResponse>
) {
  if (req.method !== 'POST') {
    console.error(`Geçersiz yöntem: ${req.method}. Sadece POST izin veriliyor.`);
    return res.status(405).json({ error: 'Yöntem izin verilmedi' });
  }

  try {
    const { emails } = req.body;

    const MAX_EMAILS = 500; // İzin verilen maksimum e-posta sayısı

    // İstek gövdesini doğrulama
    if (!emails?.length) {
      console.error(`Hatalı İstek: Hiç e-posta sağlanmadı`);
      return res.status(400).json({ 
        error: 'Gerekli alanlar eksik',
        details: 'Hiç e-posta sağlanmadı'
      });
    }

    if (emails.length > MAX_EMAILS) {
      console.error(`Çok fazla e-posta: ${emails.length}. Maksimum izin verilen: ${MAX_EMAILS}.`);
      return res.status(400).json({
        error: `Çok fazla e-posta. Maksimum izin verilen: ${MAX_EMAILS}.`,
      });
    }

    console.log(`Toplu doğrulama başlatılıyor: ${emails.length} e-posta.`);

    const validationResults = await smtpValidator.validateBulk(emails);

    console.log(`Toplu doğrulama tamamlandı. Başarılı: ${validationResults.filter(r => r.is_valid).length}, Başarısız: ${validationResults.filter(r => !r.is_valid).length}`);

    // İstatistikleri hesaplama
    const stats: ValidationStatistics = {
      total: validationResults.length,
      verified: validationResults.filter(r => r.is_valid).length,
      failed: validationResults.filter(r => !r.is_valid).length,
      pending: 0,
      domains: {
        total: new Set(validationResults.map(r => r.email.split('@')[1])).size,
        verified: new Set(
          validationResults
            .filter(r => r.is_valid)
            .map(r => r.email.split('@')[1])
        ).size
      },
      dkim: {
        enabled: validationResults.filter(r => r.details.domain_status.has_dkim).length
      },
      deliverability: undefined, // Gelecekte eklenebilir
    };

    return res.status(200).json({
      results: validationResults,
      stats
    });

  } catch (error) {
    console.error('Doğrulama başarısız oldu:', error);
    const errorMessage = error instanceof Error ? error.message : 'Bir hata oluştu';

    return res.status(500).json({ 
      error: 'Doğrulama başarısız oldu', 
      details: errorMessage 
    });
  }
}
