// components/AWSCredentialsForm.tsx
import React, { useState } from 'react';

interface AWSCredentialsFormProps {
  onCredentialsSubmit: (credentials: {
    accessKeyId: string;
    secretAccessKey: string;
    region: string;
  }) => void;
}

const AWSCredentialsForm: React.FC<AWSCredentialsFormProps> = ({ onCredentialsSubmit }) => {
  const [credentials, setCredentials] = useState({
    accessKeyId: '',
    secretAccessKey: '',
    region: 'us-east-1'
  });
  const [showSecretKey, setShowSecretKey] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onCredentialsSubmit(credentials);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="accessKeyId" className="block text-sm font-medium text-gray-700">
          AWS Access Key ID
        </label>
        <input
          type="text"
          id="accessKeyId"
          value={credentials.accessKeyId}
          onChange={(e) => setCredentials(prev => ({ ...prev, accessKeyId: e.target.value }))}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
          required
        />
      </div>

      <div className="relative">
        <label htmlFor="secretAccessKey" className="block text-sm font-medium text-gray-700">
          AWS Secret Access Key
        </label>
        <input
          type={showSecretKey ? 'text' : 'password'}
          id="secretAccessKey"
          value={credentials.secretAccessKey}
          onChange={(e) => setCredentials(prev => ({ ...prev, secretAccessKey: e.target.value }))}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
          required
        />
        <button
          type="button"
          onClick={() => setShowSecretKey(!showSecretKey)}
          className="absolute right-2 top-7 text-gray-500 hover:text-gray-700"
        >
          {showSecretKey ? (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
          )}
        </button>
      </div>

      <div>
        <label htmlFor="region" className="block text-sm font-medium text-gray-700">
          AWS Region
        </label>
        <select
          id="region"
          value={credentials.region}
          onChange={(e) => setCredentials(prev => ({ ...prev, region: e.target.value }))}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
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

      <button
        type="submit"
        className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
      >
        Save Credentials
      </button>
    </form>
  );
};

export default AWSCredentialsForm;