import React from 'react';

interface ApiKeyInputProps {
  apiKey: string;
  setApiKey: (key: string) => void;
}

const ApiKeyInput: React.FC<ApiKeyInputProps> = ({ apiKey, setApiKey }) => (
  <div>
    <input
      type="text"
      placeholder="Enter Mailgun API Key"
      value={apiKey}
      onChange={(e) => setApiKey(e.target.value)}
      style={{ padding: '10px', width: '300px', marginBottom: '10px' }}
    />
  </div>
);

export default ApiKeyInput;
