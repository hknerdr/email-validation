import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import FileUpload from '../components/FileUpload';
import ApiKeyInput from '../components/ApiKeyInput';
import ValidationProgress from '../components/ValidationProgress';

export default function Home() {
  const { state, dispatch } = useAppContext();
  const [apiKey, setApiKey] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [processedEmails, setProcessedEmails] = useState(0);
  const [errors, setErrors] = useState<string[]>([]);

  const handleValidation = async () => {
    if (!state.emails.length || !apiKey) return;

    setIsValidating(true);
    setProcessedEmails(0);
    setErrors([]);

    try {
      const response = await fetch('/api/validateBulk', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          emails: state.emails,
          apiKey,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.details || 'Validation failed');
      }

      const data = await response.json();
      
      if (data.errors?.length) {
        setErrors(data.errors);
      }

      dispatch({ type: 'SET_VALIDATED_EMAILS', payload: data.results });
      
      // Show final stats
      setProcessedEmails(data.totalProcessed);
      
    } catch (error) {
      setErrors([error instanceof Error ? error.message : 'Unknown error occurred']);
    } finally {
      setIsValidating(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-4xl font-bold mb-8">Email Validator</h1>
        
        <ApiKeyInput apiKey={apiKey} setApiKey={setApiKey} />
        
        <div className="mt-6">
          <FileUpload />
        </div>

        {state.emails.length > 0 && (
          <div className="mt-6">
            <button
              onClick={handleValidation}
              disabled={isValidating || !apiKey}
              className={`px-6 py-2 rounded-lg ${
                isValidating || !apiKey
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-green-600 hover:bg-green-700'
              } text-white font-semibold transition-colors`}
            >
              {isValidating ? 'Validating...' : 'Validate Emails'}
            </button>
          </div>
        )}

        {isValidating && (
          <ValidationProgress
            totalEmails={state.emails.length}
            processedEmails={processedEmails}
            errors={errors}
          />
        )}

        {state.validatedEmails.length > 0 && !isValidating && (
          <div className="mt-8">
            <h2 className="text-xl font-semibold mb-4">Results:</h2>
            <div className="bg-white rounded-lg shadow p-4">
              <p className="mb-2">
                Total Processed: {state.validatedEmails.length}
              </p>
              <p className="mb-2">
                Valid Emails: {state.validatedEmails.filter(e => e.is_valid).length}
              </p>
              <p>
                Invalid Emails: {state.validatedEmails.filter(e => !e.is_valid).length}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}