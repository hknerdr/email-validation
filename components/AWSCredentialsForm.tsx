// components/AWSCredentialsForm.tsx

import React, { useState } from 'react';

interface Credentials {
  accessKeyId: string;
  secretAccessKey: string;
  region: string;
}

interface Props {
  onCredentialsSubmit: (creds: Credentials) => void;
}

const AWSCredentialsForm: React.FC<Props> = ({ onCredentialsSubmit }) => {
  const [credentials, setCredentials] = useState<Credentials>({
    accessKeyId: '',
    secretAccessKey: '',
    region: 'us-east-1',
  });

  const [showSecret, setShowSecret] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onCredentialsSubmit(credentials);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 rounded-lg shadow-md">
      <div>
        <label htmlFor="accessKeyId" className="block text-sm font-medium text-gray-700">
          AWS Access Key ID
        </label>
        <input
          id="accessKeyId"
          type="text"
          value={credentials.accessKeyId}
          onChange={(e) => setCredentials(prev => ({ ...prev, accessKeyId: e.target.value }))}
          required
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 text-gray-900" // Changed text color
        />
      </div>

      <div className="relative">
        <label htmlFor="secretAccessKey" className="block text-sm font-medium text-gray-700">
          AWS Secret Access Key
        </label>
        <input
          id="secretAccessKey"
          type={showSecret ? 'text' : 'password'}
          value={credentials.secretAccessKey}
          onChange={(e) => setCredentials(prev => ({ ...prev, secretAccessKey: e.target.value }))}
          required
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 text-gray-900" // Changed text color
        />
        <button
          type="button"
          onClick={() => setShowSecret(!showSecret)}
          className="absolute inset-y-0 right-0 pr-3 flex items-center text-sm leading-5"
          aria-label={showSecret ? 'Hide secret key' : 'Show secret key'}
        >
          {showSecret ? (
            <svg className="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
          ) : (
            <svg className="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
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
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 text-gray-900" // Changed text color
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
