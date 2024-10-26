// components/ApiKeyInput.tsx
import React, { useState } from 'react';

interface ApiKeyInputProps {
  apiKey: string;
  setApiKey: (key: string) => void;
}

const ApiKeyInput: React.FC<ApiKeyInputProps> = ({ apiKey, setApiKey }) => {
  const [showKey, setShowKey] = useState(false);

  return (
    <div className="space-y-4">
      <div className="relative">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Mailgun Private API Key
          <span className="ml-1 text-xs text-gray-500">
            (Find in Mailgun Dashboard → Settings → API Keys)
          </span>
        </label>
        <div className="relative rounded-lg shadow-sm">
          <input
            type={showKey ? 'text' : 'password'}
            placeholder="Enter your Mailgun private API key"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all duration-200 pr-12 font-mono text-sm"
          />
          <button
            type="button"
            onClick={() => setShowKey(!showKey)}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors"
            aria-label={showKey ? 'Hide API key' : 'Show API key'}
          >
            {showKey ? (
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
      </div>

      <div className="bg-blue-50 rounded-lg p-4 text-sm text-blue-800">
        <div className="flex items-start">
          <svg className="w-5 h-5 text-blue-500 mt-0.5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <p className="font-medium mb-1">Where to find your API key:</p>
            <ol className="list-decimal list-inside space-y-1 text-blue-700">
              <li>Log in to your Mailgun Dashboard</li>
              <li>Navigate to Settings → API Keys</li>
              <li>Copy your Private API Key</li>
            </ol>
          </div>
        </div>
      </div>

      {apiKey && !apiKey.includes('-') && (
        <div className="bg-yellow-50 rounded-lg p-4 text-sm text-yellow-800">
          <div className="flex">
            <svg className="w-5 h-5 text-yellow-400 mt-0.5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <p>
              The API key format looks incorrect. Mailgun API keys typically contain hyphens (-).
              Please check your API key and try again.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default ApiKeyInput;