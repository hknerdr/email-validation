// pages/index.tsx

import React, { useState, useCallback } from 'react';
import Head from 'next/head';
import EmailValidationResults from '../components/EmailValidationResults';
import { batchEmails } from '../utils/batchEmails';
import BounceRatePrediction from '../components/BounceRatePrediction'; // Default Import
import type { EmailValidationResult, ValidationStatistics } from '../utils/types';
import LoadingState from '../components/LoadingState';
import FileUpload from '../components/FileUpload';
import DKIMStatusDisplay from '../components/DKIMStatusDisplay'; // Correct Import

interface ValidationResponse {
  results: EmailValidationResult[];
  stats: ValidationStatistics;
}

interface ErrorResponse {
  error: string;
  details?: string;
}

export default function Home() {
  const [emails, setEmails] = useState<string[]>([]);
  const [isValidating, setIsValidating] = useState(false);
  const [validationResults, setValidationResults] = useState<{
    results: EmailValidationResult[];
    stats: ValidationStatistics;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const [logs, setLogs] = useState<Array<{
    message: string;
    type: 'info' | 'success' | 'error' | 'warning';
    timestamp: string;
  }>>([]);

  const addLog = useCallback((message: string, type: 'info' | 'success' | 'error' | 'warning' = 'info') => {
    setLogs(prev => [...prev, {
      message,
      type,
      timestamp: new Date().toLocaleTimeString()
    }]);
  }, []);

  const handleValidation = async () => {
    if (!emails.length) return;

    setIsValidating(true);
    setError(null);
    addLog('Doğrulama süreci başlatılıyor...', 'info');

    const BATCH_SIZE = 500; // Batch boyutu
    const emailBatches = batchEmails(emails, BATCH_SIZE);
    const totalBatches = emailBatches.length;
    let allResults: EmailValidationResult[] = [];

    try {
      for (let i = 0; i < totalBatches; i++) {
        const batch = emailBatches[i];
        addLog(`Batch ${i + 1} / ${totalBatches} doğrulanıyor`, 'info');

        const response = await fetch('/api/validateBulk', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            emails: batch
          }),
        });

        if (!response.ok) {
          let errorData: ErrorResponse = { error: 'Doğrulama başarısız oldu' };
          try {
            errorData = await response.json();
          } catch (parseError) {
            console.error('Hata yanıtı çözümlenemedi:', parseError);
            throw new Error('Sunucudan gelen hata yanıtı çözümlenemedi.');
          }
          throw new Error(errorData.error || 'Doğrulama başarısız oldu');
        }

        const data: ValidationResponse = await response.json();

        allResults = allResults.concat(data.results);
        addLog(`Batch ${i + 1} başarıyla doğrulandı`, 'success');
      }

      // Tüm batchler işlendiğinde, toplu analiz yap
      const bounceMetrics = bounceRatePrediction(allResults); // Eğer `bounceRatePrediction` fonksiyonu varsa

      const enhancedStats: ValidationStatistics = {
        total: allResults.length,
        verified: allResults.filter(r => r.is_valid).length,
        failed: allResults.filter(r => !r.is_valid).length,
        pending: validationResults?.stats.pending || 0,
        domains: {
          total: new Set(allResults.map(r => r.email.split('@')[1])).size,
          verified: new Set(
            allResults
              .filter(r => r.is_valid)
              .map(r => r.email.split('@')[1])
          ).size
        },
        dkim: {
          enabled: allResults.filter(r => r.details.domain_status.has_dkim).length
        },
        deliverability: {
          score: 100 - bounceMetrics.predictedRate,
          predictedBounceRate: bounceMetrics.predictedRate,
          recommendations: bounceMetrics.recommendations
        }
      };

      setValidationResults({
        results: allResults,
        stats: enhancedStats
      });

      addLog(`Tüm batchler başarıyla doğrulandı`, 'success');
      addLog(`${allResults.filter(r => r.is_valid).length} geçerli e-posta bulundu`, 'success');
      addLog(`Tahmini bounce oranı: ${bounceMetrics.predictedRate}%`, 'info');

    } catch (error) {
      setError(error instanceof Error ? error.message : 'Bir hata oluştu');
      addLog('Doğrulama başarısız oldu', 'error');
    } finally {
      setIsValidating(false);
    }
  };

  // DKIM verilerini görüntülemek için hazırlık
  const getDKIMData = () => {
    if (!validationResults) return [];
    const domains = Array.from(new Set(validationResults.results.map(r => r.email.split('@')[1])));
    return domains.map(domain => ({
      domain,
      hasDKIM: validationResults.results.some(r => r.email.endsWith(`@${domain}`) && r.details.domain_status.has_dkim)
    }));
  };

  return (
    <>
      <Head>
        <title>Email Validator</title>
        <meta name="description" content="DNS ve SMTP kullanarak e-postaları doğrulayın" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <header className="bg-white/30 backdrop-blur-sm border-b border-gray-200/50 sticky top-0 z-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <h1 className="text-3xl font-bold text-gray-900">
              Email Validator
            </h1>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="space-y-6">
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h2 className="text-lg font-semibold mb-4">E-posta Listesi Yükle</h2>
                <FileUpload onEmailsUploaded={setEmails} />
              </div>

              <button
                onClick={handleValidation}
                disabled={isValidating || !emails.length}
                className={`w-full ${
                  isValidating || !emails.length
                    ? 'bg-gray-300 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700'
                } text-white py-3 rounded-xl font-medium transition-colors`}
              >
                {isValidating ? 'Doğrulanıyor...' : 'Doğrulamayı Başlat'}
              </button>
            </div>

            <div className="lg:col-span-2 space-y-6">
              {isValidating && <LoadingState />}
              {validationResults && (
                <>
                  <EmailValidationResults 
                    results={validationResults.results}
                    stats={validationResults.stats}
                  />
                  <BounceRatePrediction
                    predictedRate={validationResults.stats.deliverability?.predictedBounceRate || 0}
                    totalEmails={validationResults.stats.total}
                  />
                  <DKIMStatusDisplay
                    domains={getDKIMData()}
                  />
                </>
              )}
              {error && (
                <div className="bg-red-50 border-l-4 border-red-500 p-4">
                  <p className="text-red-700">{error}</p>
                </div>
              )}
            </div>
          </div>

          {/* Log Gösterim Bölümü */}
          {logs.length > 0 && (
            <div className="mt-8 bg-gray-100 p-4 rounded-lg">
              <h2 className="text-xl font-semibold mb-4">Loglar</h2>
              <ul className="space-y-2">
                {logs.map((log, index) => (
                  <li key={index} className={`p-2 rounded ${getLogStyle(log.type)}`}>
                    <span className="font-medium">{log.timestamp}:</span> {log.message}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </main>
      </div>
    </>
  );
}

// Yardımcı Fonksiyon: Log stilini belirler
function getLogStyle(type: 'info' | 'success' | 'error' | 'warning') {
  switch (type) {
    case 'success':
      return 'bg-green-100 text-green-800';
    case 'error':
      return 'bg-red-100 text-red-800';
    case 'warning':
      return 'bg-yellow-100 text-yellow-800';
    case 'info':
    default:
      return 'bg-blue-100 text-blue-800';
  }
}

// Yardımcı Fonksiyon: Bounce Rate Prediction (Örnek)
function bounceRatePrediction(results: EmailValidationResult[]) {
  // Basit bir tahmin örneği
  const invalidCount = results.filter(r => !r.is_valid).length;
  const total = results.length;
  const predictedRate = total === 0 ? 0 : (invalidCount / total) * 100;
  const recommendations = predictedRate > 20 ? ['Clean your email list', 'Implement double opt-in'] : [];

  return {
    predictedRate,
    recommendations
  };
}
