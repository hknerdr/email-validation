import React, { useState } from 'react';
import EmailInput from '../components/EmailInput';
import ApiKeyInput from '../components/ApiKeyInput';
import ValidationResults from '../components/ValidationResults';

const EmailValidator = () => {
  const [email, setEmail] = useState('');
  const [apiKeys, setApiKeys] = useState<string[]>(['']);
  const [validatedEmails, setValidatedEmails] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isStopped, setIsStopped] = useState(false);

  const addApiKey = () => setApiKeys([...apiKeys, '']);

  const stopValidation = () => {
    setIsStopped(true);
    setLoading(false);
  };

  const validateEmail = async () => {
    // Validation logic here...
  };

  const downloadCSV = () => {
    // CSV download logic here...
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial' }}>
      <h1>Email Validator</h1>
      <EmailInput
        email={email}
        setEmail={setEmail}
        onValidate={validateEmail}
        loading={loading}
      />
      <button onClick={stopValidation} disabled={!loading}>
        Stop
      </button>
      <button onClick={downloadCSV} disabled={validatedEmails.length === 0}>
        Download CSV
      </button>
      <ApiKeyInput apiKeys={apiKeys} setApiKeys={setApiKeys} addApiKey={addApiKey} />
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <ValidationResults validatedEmails={validatedEmails} />
    </div>
  );
};

export default EmailValidator;
