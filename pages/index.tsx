// pages/index.tsx
import React, { useState, useCallback } from 'react';
import { useAppContext } from '../context/AppContext';
import FileUpload from '../components/FileUpload';
import ApiKeyInput from '../components/ApiKeyInput';
import ValidationProgress from '../components/ValidationProgress';
import { ArrowRight, Check, AlertTriangle, RefreshCcw } from 'lucide-react';

export default function Home() {
  const { state, dispatch } = useAppContext();
  const [apiKey, setApiKey] = useState('');
  const [accountId, setAccountId] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [processedEmails, setProcessedEmails] = useState(0);
  const [errors, setErrors] = useState<string[]>([]);
  const [logs, setLogs] = useState<string[]>([]);
  const [validationStats, setValidationStats] = useState({
    totalValid: 0,
    totalInvalid: 0,
    avgProcessingTime: 0,
  });

  const addLog = (message: string, type: 'info' | 'success' | 'error' | 'warning' = 'info') => {
    setLogs(prev => [...prev, { message, type, timestamp: new Date().toLocaleTimeString() }]);
  };

  const handleValidation = async () => {
    if (!apiKey || !accountId) {
      setErrors(['Please enter both your Mailgun API key and Account ID']);
      return;
    }

    setIsValidating(true);
    setProcessedEmails(0);
    setErrors([]);
    setLogs([]);
    
    const startTime = Date.now();
    addLog('Initializing validation process...', 'info');
    addLog(`Preparing to validate ${state.emails.length} emails`, 'info');

    try {
      // Validate API key format
      addLog('Validating API credentials...', 'info');
      
      const response = await fetch('/api/validateBulk', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          emails: state.emails,
          apiKey,
          accountId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.details || 'Validation failed');
      }

      const data = await response.json();
      
      if (data.errors?.length) {
        setErrors(data.errors);
        data.errors.forEach((error: string) => addLog(error, 'error'));
      }

      dispatch({ type: 'SET_VALIDATED_EMAILS', payload: data.results });
      
      setProcessedEmails(data.totalProcessed);
      const endTime = Date.now();
      const processingTime = (endTime - startTime) / 1000;

      setValidationStats({
        totalValid: data.results.filter((r: any) => r.is_valid).length,
        totalInvalid: data.results.filter((r: any) => !r.is_valid).length,
        avgProcessingTime: processingTime,
      });

      addLog(`Validation completed successfully in ${processingTime.toFixed(2)} seconds`, 'success');
      addLog(`Processed ${data.totalProcessed} emails`, 'info');
      addLog(`Found ${data.results.filter((r: any) => r.is_valid).length} valid emails`, 'success');
      addLog(`Found ${data.results.filter((r: any) => !r.is_valid).length} invalid emails`, 'warning');
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setErrors([errorMessage]);
      addLog(`Fatal error: ${errorMessage}`, 'error');
    } finally {
      setIsValidating(false);
      addLog('Validation process completed', 'info');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-6xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        {/* Header Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4 font-display">
            Email Validation Suite
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Validate your email lists in bulk using Mailgun's powerful validation service.
            Get detailed insights and improve your email deliverability.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Configuration Panel */}
          <div className="lg:col-span-1 space-y-6">
            {/* API Configuration Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">
                API Configuration
              </h2>
              <ApiKeyInput 
                apiKey={apiKey} 
                setApiKey={setApiKey}
                accountId={accountId}
                setAccountId={setAccountId}
              />
            </div>

            {/* File Upload Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">
                Email List Upload
              </h2>
              <FileUpload />
            </div>

            {/* Validation Button */}
            <button
              onClick={handleValidation}
              disabled={isValidating || !apiKey || !accountId || state.emails.length === 0}
              className={`
                w-full px-6 py-3 rounded-lg font-semibold text-white
                transition-all duration-200 ease-in-out flex items-center justify-center
                ${isValidating || !apiKey || !accountId || state.emails.length === 0
                  ? 'bg-gray-400 cursor-not-allowed opacity-50'
                  : 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 shadow-lg hover:shadow-xl'
                }
              `}
            >
              {isValidating ? (
                <>
                  <RefreshCcw className="animate-spin -ml-1 mr-3 h-5 w-5" />
                  Validating...
                </>
              ) : (
                <>
                  Start Validation
                  <ArrowRight className="ml-2 h-5 w-5" />
                </>
              )}
            </button>
          </div>

          {/* Progress and Results Panel */}
          <div className="lg:col-span-2 space-y-6">
            {/* Progress Section */}
            {(isValidating || logs.length > 0) && (
              <ValidationProgress
                totalEmails={state.emails.length}
                processedEmails={processedEmails}
                errors={errors}
                logs={logs}
                isValidating={isValidating}
              />
            )}

            {/* Results Summary */}
            {state.validatedEmails.length > 0 && !isValidating && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-xl font-semibold text-gray-800 mb-6">Validation Summary</h2>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="text-sm text-gray-500">Total Processed</div>
                    <div className="text-3xl font-bold text-gray-900">{state.validatedEmails.length}</div>
                  </div>
                  <div className="bg-green-50 rounded-lg p-4">
                    <div className="text-sm text-green-600">Valid Emails</div>
                    <div className="text-3xl font-bold text-green-600">
                      {validationStats.totalValid}
                    </div>
                  </div>
                  <div className="bg-red-50 rounded-lg p-4">
                    <div className="text-sm text-red-600">Invalid Emails</div>
                    <div className="text-3xl font-bold text-red-600">
                      {validationStats.totalInvalid}
                    </div>
                  </div>
                </div>

                <div className="mt-6">
                  <div className="text-sm text-gray-500 mb-2">Processing Time</div>
                  <div className="text-lg font-semibold text-gray-700">
                    {validationStats.avgProcessingTime.toFixed(2)} seconds
                  </div>
                </div>

                <div className="mt-6">
                  <button
                    onClick={() => {
                      // Add export functionality here
                      addLog('Preparing export...', 'info');
                    }}
                    className="px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors duration-200"
                  >
                    Export Results
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}