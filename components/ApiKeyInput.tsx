import React, { useState } from 'react';

interface ApiKeyInputProps {
  apiKey: string;
  setApiKey: (key: string) => void;
  accountId: string;
  setAccountId: (id: string) => void;
}

const ApiKeyInput: React.FC<ApiKeyInputProps> = ({ 
  apiKey, 
  setApiKey,
  accountId,
  setAccountId 
}) => {
  const [showKey, setShowKey] = useState(false);

  return (
    <div className="space-y-4">
      <div className="relative">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Mailgun Private API Key
          <span className="ml-1 text-xs text-gray-500">
            (Format: xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx-xxxxxxxx-xxxxxxxx)
          </span>
        </label>
        <input
          type={showKey ? 'text' : 'password'}
          placeholder="Enter your Mailgun private API key"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all duration-200"
        />
        <button
          type="button"
          onClick={() => setShowKey(!showKey)}
          className="absolute right-2 top-[52%] transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
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

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Mailgun Account ID
          <span className="ml-1 text-xs text-gray-500">
            (Found in your Mailgun dashboard settings)
          </span>
        </label>
        <input
          type="text"
          placeholder="Enter your Mailgun Account ID"
          value={accountId}
          onChange={(e) => setAccountId(e.target.value)}
          className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all duration-200"
        />
      </div>

      <div className="text-xs text-gray-500 mt-2">
        <p>You can find both your Private API Key and Account ID in your Mailgun Dashboard under Settings → API Keys.</p>
      </div>
    </div>
  );
};

export default ApiKeyInput;