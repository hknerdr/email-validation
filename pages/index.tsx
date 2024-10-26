// pages/index.tsx
import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import FileUpload from '../components/FileUpload';
import ApiKeyInput from '../components/ApiKeyInput';
import ValidationProgress from '../components/ValidationProgress';

const IndexPage = () => {
  const { state, dispatch } = useAppContext();
  const [apiKey, setApiKey] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [processedEmails, setProcessedEmails] = useState(0);
  const [errors, setErrors] = useState<string[]>([]);
  const [logs, setLogs] = useState<Array<{
    message: string;
    type: 'info' | 'success' | 'error' | 'warning';
    timestamp: string;
  }>>([]);

  const addLog = (message: string, type: 'info' | 'success' | 'error' | 'warning' = 'info') => {
    setLogs(prev => [...prev, {
      message,
      type,
      timestamp: new Date().toLocaleTimeString()
    }]);
  };

  const handleValidation = async () => {
    if (!apiKey) {
      setErrors(['Please enter your Mailgun API key']);
      return;
    }

    setIsValidating(true);
    setProcessedEmails(0);
    setErrors([]);
    setLogs([]);
    
    addLog('Initializing validation process...', 'info');
    addLog(`Preparing to validate ${state.emails.length} emails`, 'info');

    try {
      const response = await fetch('/api/validateBulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emails: state.emails, apiKey }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.details || 'Validation failed');
      }

      const data = await response.json();
      
      if (data.job?.summary) {
        const { result } = data.job.summary;
        setProcessedEmails(data.job.records_processed || 0);
        
        addLog(`Validation completed successfully!`, 'success');
        addLog(`Deliverable emails: ${result.deliverable}`, 'success');
        addLog(`Undeliverable emails: ${result.undeliverable}`, 'warning');
        addLog(`Do not send: ${result.do_not_send}`, 'warning');
        addLog(`Catch-all domains: ${result.catch_all}`, 'info');
        addLog(`Unknown status: ${result.unknown}`, 'info');
      }

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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 mb-4">
            Email Validation Suite
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Professional email validation powered by Mailgun. Ensure your email list is clean, 
            deliverable, and optimized for maximum engagement.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Panel - Configuration */}
          <div className="lg:col-span-1 space-y-6">
            {/* API Config Card */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">API Configuration</h2>
              <ApiKeyInput apiKey={apiKey} setApiKey={setApiKey} />
            </div>

            {/* File Upload Card */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Email List Upload</h2>
              <FileUpload />
              
              {state.emails.length > 0 && (
                <div className="mt-4 text-sm text-gray-600">
                  {state.emails.length} emails loaded
                </div>
              )}
            </div>

            {/* Validation Button */}
            <button
              onClick={handleValidation}
              disabled={isValidating || !apiKey || state.emails.length === 0}
              className={`
                w-full py-4 rounded-xl font-semibold text-lg
                transition-all duration-200 ease-in-out
                flex items-center justify-center space-x-2
                ${isValidating || !apiKey || state.emails.length === 0
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl'
                }
              `}
            >
              {isValidating ? (
                <>
                  <svg className="animate-spin h-5 w-5 text-current" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span>Validating...</span>
                </>
              ) : (
                <>
                  <span>Start Validation</span>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </>
              )}
            </button>
          </div>

          {/* Right Panel - Progress & Results */}
          <div className="lg:col-span-2 space-y-6">
            {(isValidating || logs.length > 0) && (
              <ValidationProgress
                totalEmails={state.emails.length}
                processedEmails={processedEmails}
                errors={errors}
                logs={logs}
                isValidating={isValidating}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default IndexPage;