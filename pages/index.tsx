// pages/index.tsx

import React, { useState, useCallback } from 'react';
import Head from 'next/head';
import { useCredentials } from '../context/CredentialsContext';
import AWSCredentialsForm from '../components/AWSCredentialsForm';
import EmailValidationResults from '../components/EmailValidationResults'; // Correct Import
import { DeliverabilityMetrics } from '../components/DeliverabilityMetrics';
import { DKIMStatusDisplay } from '../components/DKIMStatusDisplay';
import { BounceRatePrediction } from '../components/BounceRatePrediction';
import { bouncePredictor } from '../utils/bounceRatePredictor';
import type { SESValidationResult, ValidationStatistics } from '../utils/types';
import LoadingState from '../components/LoadingState';
import FileUpload from '../components/FileUpload';

export default function Home() {
  const { credentials, isVerified, setCredentials } = useCredentials();
  const [emails, setEmails] = useState<string[]>([]);
  const [isValidating, setIsValidating] = useState(false);
  const [validationResults, setValidationResults] = useState<{
    results: SESValidationResult[];
    stats: ValidationStatistics;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // If you choose to use logs, keep this. Otherwise, remove it.
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

  const handleCredentialsSubmit = useCallback(async (creds: {
    accessKeyId: string;
    secretAccessKey: string;
    region: string;
  }) => {
    try {
      await setCredentials(creds);
      addLog('AWS credentials verified successfully', 'success');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to verify credentials';
      setError(errorMessage);
      addLog('Failed to verify AWS credentials', 'error');
    }
  }, [setCredentials, addLog]);

  const handleValidation = async () => {
    if (!credentials || !emails.length) return;

    setIsValidating(true);
    setError(null);
    addLog('Starting validation process...', 'info');

    try {
      const response = await fetch('/api/validateBulk', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          emails,
          credentials 
        }),
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      const data = await response.json();
      
      const bounceMetrics = bouncePredictor.predictBounceRate(data.results);
      
      const enhancedStats = {
        ...data.stats,
        deliverability: {
          score: 100 - bounceMetrics.predictedRate,
          predictedBounceRate: bounceMetrics.predictedRate,
          recommendations: bounceMetrics.recommendations
        }
      };

      setValidationResults({
        results: data.results,
        stats: enhancedStats
      });

      addLog(`Validation completed successfully`, 'success');
      addLog(`Found ${data.stats.verified} valid emails`, 'success');
      addLog(`Predicted bounce rate: ${bounceMetrics.predictedRate}%`, 'info');

    } catch (error) {
      setError(error instanceof Error ? error.message : 'An error occurred');
      addLog('Validation failed', 'error');
    } finally {
      setIsValidating(false);
    }
  };

  return (
    <>
      <Head>
        <title>AWS SES Email Validator</title>
        <meta name="description" content="Validate emails using AWS SES" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <header className="bg-white/30 backdrop-blur-sm border-b border-gray-200/50 sticky top-0 z-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <h1 className="text-3xl font-bold text-gray-900">
              AWS SES Email Validator
            </h1>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {!isVerified ? (
            <AWSCredentialsForm onCredentialsSubmit={handleCredentialsSubmit} />
          ) : (
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
                    <DeliverabilityMetrics
                      score={validationResults.stats.deliverability?.score || 0}
                      recommendations={validationResults.stats.deliverability?.recommendations || []}
                    />
                    <DKIMStatusDisplay
                      domains={[...new Set(validationResults.results.map(r => r.email.split('@')[1]))]}
                      results={validationResults.results}
                    />
                    <BounceRatePrediction
                      predictedRate={validationResults.stats.deliverability?.predictedBounceRate || 0}
                      totalEmails={validationResults.stats.total}
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
          )}

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
