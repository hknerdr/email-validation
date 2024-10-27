// components/AWSCredentialsForm.tsx
import React, { useState } from 'react';
import { useCredentials } from '../context/CredentialsContext';

const AWSCredentialsForm: React.FC = () => {
  const { setCredentials } = useCredentials();
  const [credentials, setLocalCredentials] = useState({
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
      const rememberCheckbox = document.getElementById('remember-credentials') as HTMLInputElement;
      if (rememberCheckbox?.checked) {
        localStorage.setItem('aws_access_key_id', credentials.accessKeyId);
        localStorage.setItem('aws_secret_access_key', credentials.secretAccessKey);
        localStorage.setItem('aws_region', credentials.region);
      }

      setCredentials(credentials);

    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to verify credentials');
    } finally {
      setIsVerifying(false);
    }
  };

  // Rest of the component remains the same...
};

export default AWSCredentialsForm;