// pages/index.tsx

import React, { useState, useCallback } from 'react';
import Head from 'next/head';
import EmailValidationResults from '../components/EmailValidationResults';
import { batchEmails } from '../utils/batchEmails'; // Import batching utility
import { BounceRatePrediction } from '../components/BounceRatePrediction';
import type { SESValidationResult, ValidationStatistics } from '../utils/types';
import LoadingState from '../components/LoadingState';
import FileUpload from '../components/FileUpload';
import { useCredentials } from '../context/CredentialsContext';
import { bouncePredictor } from '../utils/bounceRatePredictor';

interface ValidationResponse {
  results: SESValidationResult[];
  stats: ValidationStatistics;
  totalProcessed: number;
  successful: number;
  failed: number;
}

interface ErrorResponse {
  error: string;
  details?: string;
}

export default function Home() {
  const [emails, setEmails] = useState<string[]>([]);
  const [isValidating, setIsValidating] = useState(false);
  const [validationResults, setValidationResults] = useState<{
    results: SESValidationResult[];
    stats: ValidationStatistics;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const [logs, setLogs] = useState<Array<{
    message: string;
    type: 'info' | 'success' | 'error' | 'warning';
    timestamp: string;
  }>>([]);

  const { credentials } = useCredentials();

  const addLog = useCallback((message: string, type: 'info' | 'success' | 'error' | 'warning' = 'info') => {
    setLogs(prev => [...prev, {
      message,
      type,
      timestamp: new Date().toLocaleTimeString()
    }]);
  }, []);

  const handleValidation = async () => {
    if (!credentials) {
      setError('AWS Credentials are not set.');
      addLog('AWS Credentials are not set.', 'error');
      return;
    }

    setIsValidating(true);
    setError(null);
    addLog('Starting validation process...', 'info');

    const BATCH_SIZE = 500; // Define batch size
    const emailBatches = batchEmails(emails, BATCH_SIZE);
    const totalBatches = emailBatches.length;
    let allResults: SESValidationResult[] = [];
    const aggregatedStats: ValidationStatistics = { // Changed to const
      total: 0,
      verified: 0,
      failed: 0,
      pending: 0,
      domains: {
        total: 0,
        verified: 0
      },
      dkim: {
        enabled: 0
      }
    };

    try {
      for (let i = 0; i < totalBatches; i++) {
        const batch = emailBatches[i];
        addLog(`Validating batch ${i + 1} of ${totalBatches}`, 'info');

        const response = await fetch('/api/validateBulk', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            emails: batch,
            credentials: credentials
          }),
        });

        if (!response.ok) {
          let errorData: ErrorResponse = { error: 'Validation failed' };
          try {
            errorData = await response.json();
            addLog(`Batch ${i + 1} failed: ${errorData.error} - ${errorData.details || ''}`, 'error');
          } catch (parseError) {
            console.error('Failed to parse error response:', parseError);
            addLog(`Batch ${i + 1} failed: Unable to parse error response from server.`, 'error');
          }
          throw new Error(errorData.error || 'Validation failed');
        }

        const data: ValidationResponse = await response.json();

        allResults = allResults.concat(data.results);

        // Aggregate stats
        aggregatedStats.total += data.stats.total;
        aggregatedStats.verified += data.stats.verified;
        aggregatedStats.failed += data.stats.failed;
        aggregatedStats.pending += data.stats.pending;
        aggregatedStats.domains.total += data.stats.domains.total;
        aggregatedStats.domains.verified += data.stats.domains.verified;
        aggregatedStats.dkim.enabled += data.stats.dkim.enabled;

        if (data.stats.deliverability) {
          aggregatedStats.deliverability = {
            score: (aggregatedStats.deliverability?.score || 0) + data.stats.deliverability.score,
            predictedBounceRate: (aggregatedStats.deliverability?.predictedBounceRate || 0) + data.stats.deliverability.predictedBounceRate,
            recommendations: [...(aggregatedStats.deliverability?.recommendations || []), ...data.stats.deliverability.recommendations]
          };
        }

        addLog(`Batch ${i + 1} validated successfully`, 'success');
        addLog(`Found ${data.stats.verified} valid emails`, 'success');
        if (data.stats.deliverability) {
          addLog(`Predicted bounce rate: ${data.stats.deliverability.predictedBounceRate}%`, 'info');
        }
      }

      // Average the deliverability scores
      if (aggregatedStats.deliverability) {
        aggregatedStats.deliverability.score = aggregatedStats.deliverability.score / totalBatches;
        aggregatedStats.deliverability.predictedBounceRate = aggregatedStats.deliverability.predictedBounceRate / totalBatches;
        // Remove duplicate recommendations
        aggregatedStats.deliverability.recommendations = Array.from(new Set(aggregatedStats.deliverability.recommendations));
      }

      // Calculate unique domains
      const uniqueDomains = new Set(allResults.map(r => r.email.split('@')[1]));
      aggregatedStats.domains.total = uniqueDomains.size;

      // Calculate verified domains
      const verifiedDomains = new Set(
        allResults
          .filter(r => r.details.domain_status.verified)
          .map(r => r.email.split('@')[1])
      );
      aggregatedStats.domains.verified = verifiedDomains.size;

      setValidationResults({
        results: allResults,
        stats: aggregatedStats
      });

      addLog(`All batches validated successfully`, 'success');
      addLog(`Total valid emails: ${aggregatedStats.verified}`, 'success');
      if (aggregatedStats.deliverability) {
        addLog(`Overall predicted bounce rate: ${aggregatedStats.deliverability.predictedBounceRate.toFixed(2)}%`, 'info');
      }

    } catch (error) {
      setError(error instanceof Error ? error.message : 'An error occurred');
      addLog(`Validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error');
    } finally {
      setIsValidating(false);
    }
  };

  return (
    <>
      <Head>
        <title>Email Validator</title>
        <meta name="description" content="Validate emails effectively" />
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
                <h2 className="text-lg font-semibold mb-4">Upload Email List</h2>
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
                {isValidating ? 'Validating...' : 'Start Validation'}
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
                  {validationResults.stats.deliverability && (
                    <BounceRatePrediction
                      predictedRate={validationResults.stats.deliverability.predictedBounceRate}
                      totalEmails={validationResults.stats.total}
                    />
                  )}
                </>
              )}
              {error && (
                <div className="bg-red-50 border-l-4 border-red-500 p-4">
                  <p className="text-red-700">{error}</p>
                </div>
              )}
            </div>
          </div>

          {/* Log Display Section */}
          {logs.length > 0 && (
            <div className="mt-8 bg-gray-100 p-4 rounded-lg">
              <h2 className="text-xl font-semibold mb-4">Logs</h2>
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

// Helper function to determine log style based on type
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
