import Head from 'next/head';
import React, { useState } from 'react';
import { useCredentials } from '../context/CredentialsContext';
import AWSCredentialsForm from '../components/AWSCredentialsForm';
import EmailValidationResults from '../components/EmailValidationResults';
import { batchEmails } from '../utils/batchEmails';
import { BounceRatePrediction } from '../components/BounceRatePrediction';
import type { SESValidationResult, ValidationStatistics } from '../utils/types';
import LoadingState from '../components/LoadingState';
import FileUpload from '../components/FileUpload';

interface ValidationResponse {
  results: SESValidationResult[];
  stats: ValidationStatistics;
  totalProcessed: number;
  successful: number;
  failed: number;
}

export default function Home() {
  // Keep existing state declarations
  const { credentials, isVerified, clearCredentials } = useCredentials();
  const [credentialError, setCredentialError] = useState<string | null>(null);
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

  // Add credential handler
  const handleCredentialSubmit = async (creds: { accessKeyId: string; secretAccessKey: string; region: string }) => {
    try {
      const response = await fetch('/api/test-credentials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(creds),
      });

      const data = await response.json();
      if (!data.success) {
        setCredentialError(data.error || 'Failed to verify credentials');
      } else {
        setCredentialError(null);
      }
    } catch (err) {
      setCredentialError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  if (!credentials || !isVerified) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-8">
        <div className="max-w-lg mx-auto">
          <div className="bg-white rounded-xl shadow-sm p-6 space-y-6">
            <h1 className="text-2xl font-bold text-gray-900">AWS Credentials Required</h1>
            <p className="text-gray-600">Please enter your AWS credentials to use the email validator.</p>
            {credentialError && (
              <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded">
                <p className="text-red-700">{credentialError}</p>
              </div>
            )}
            <AWSCredentialsForm onCredentialsSubmit={handleCredentialSubmit} />
          </div>
        </div>
      </div>
    );
  }

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
            <div className="flex justify-between items-center">
              <h1 className="text-3xl font-bold text-gray-900">
                Email Validator
              </h1>
              <div className="flex items-center space-x-4">
                <button
                  onClick={clearCredentials}
                  className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900"
                >
                  Clear Credentials
                </button>
              </div>
            </div>
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