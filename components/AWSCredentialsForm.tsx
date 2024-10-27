// components/AWSCredentialsForm.tsx
import React, { useState } from 'react';

interface Props {
  onCredentialsVerified: (credentials: {
    accessKeyId: string;
    secretAccessKey: string;
    region: string;
  }) => void;
}

const AWSCredentialsForm: React.FC<Props> = ({ onCredentialsVerified }) => {
  const [credentials, setCredentials] = useState({
    accessKeyId: localStorage.getItem('aws_access_key_id') || '',
    secretAccessKey: localStorage.getItem('aws_secret_access_key') || '',
    region: localStorage.getItem('aws_region') || 'us-east-1'
  });
  const [showSecret, setShowSecret] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleVerify = async () => {
    setIsVerifying(true);
    setError(null);

    try {
      const response = await fetch('/api/ses-credentials', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to verify credentials');
      }

      // Save credentials to localStorage if "remember me" is checked
      if (document.getElementById('remember-credentials')?.checked) {
        localStorage.setItem('aws_access_key_id', credentials.accessKeyId);
        localStorage.setItem('aws_secret_access_key', credentials.secretAccessKey);
        localStorage.setItem('aws_region', credentials.region);
      }

      onCredentialsVerified(credentials);

    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to verify credentials');
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-6">
        AWS Credentials
      </h2>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Access Key ID
          </label>
          <input
            type="text"
            value={credentials.accessKeyId}
            onChange={(e) => setCredentials(prev => ({
              ...prev,
              accessKeyId: e.target.value
            }))}
            className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Enter your AWS Access Key ID"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Secret Access Key
          </label>
          <div className="relative">
            <input
              type={showSecret ? 'text' : 'password'}
              value={credentials.secretAccessKey}
              onChange={(e) => setCredentials(prev => ({
                ...prev,
                secretAccessKey: e.target.value
              }))}
              className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter your AWS Secret Access Key"
            />
            <button
              type="button"
              onClick={() => setShowSecret(!showSecret)}
              className="absolute right-2 top-1/2 transform -translate-y-1/2"
            >
              {showSecret ? (
                <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                </svg>
              ) : (
                <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              )}
            </button>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Region
          </label>
          <select
            value={credentials.region}
            onChange={(e) => setCredentials(prev => ({
              ...prev,
              region: e.target.value
            }))}
            className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="us-east-1">US East (N. Virginia)</option>
            <option value="us-east-2">US East (Ohio)</option>
            <option value="us-west-1">US West (N. California)</option>
            <option value="us-west-2">US West (Oregon)</option>
            <option value="eu-west-1">EU (Ireland)</option>
            <option value="eu-central-1">EU (Frankfurt)</option>
            <option value="ap-southeast-1">Asia Pacific (Singapore)</option>
            <option value="ap-southeast-2">Asia Pacific (Sydney)</option>
          </select>
        </div>

        <div className="flex items-center">
          <input
            id="remember-credentials"
            type="checkbox"
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <label htmlFor="remember-credentials" className="ml-2 text-sm text-gray-600">
            Remember credentials (stored locally)
          </label>
        </div>

        {error && (
          <div className="bg-red-50 text-red-700 p-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        <button
          onClick={handleVerify}
          disabled={isVerifying}
          className={`
            w-full py-2 px-4 rounded-lg font-medium text-white
            transition-colors duration-200
            ${isVerifying
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700'
            }
          `}
        >
          {isVerifying ? (
            <span className="flex items-center justify-center">
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Verifying...
            </span>
          ) : (
            'Verify Credentials'
          )}
        </button>
      </div>

      <div className="mt-4 text-sm text-gray-500">
        <p>Need help finding your credentials?</p>
        <a 
          href="https://docs.aws.amazon.com/ses/latest/dg/setting-up.html"
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 hover:text-blue-800"
        >
          View AWS SES setup guide →
        </a>
      </div>
    </div>
  );
};

export default AWSCredentialsForm;