// components/ApiKeyInput.tsx
import React from 'react';

interface ApiKeyInputProps {
  apiKeys: string[];
  setApiKeys: (apiKeys: string[]) => void;
  addApiKey: () => void;
}

const ApiKeyInput: React.FC<ApiKeyInputProps> = ({ apiKeys, setApiKeys, addApiKey }) => {
  const handleApiKeyChange = (index: number, value: string) => {
    const newApiKeys = [...apiKeys];
    newApiKeys[index] = value;
    setApiKeys(newApiKeys);
  };

  return (
    <div>
      <h2>API Keys</h2>
      {apiKeys.map((key, index) => (
        <div key={index} style={{ marginBottom: '10px' }}>
          <input
            type="text"
            value={key}
            onChange={(e) => handleApiKeyChange(index, e.target.value)}
            placeholder="Enter Mailgun API key"
            style={{ padding: '10px', width: '300px' }}
          />
        </div>
      ))}
      <button onClick={addApiKey} style={{ marginTop: '10px' }}>
        Add another API key
      </button>
    </div>
  );
};

export default ApiKeyInput;
