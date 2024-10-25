// components/EmailInput.tsx
import React from 'react';

interface EmailInputProps {
  email: string;
  setEmail: (email: string) => void;
  onValidate: () => void;
  loading: boolean;
}

const EmailInput: React.FC<EmailInputProps> = ({ email, setEmail, onValidate, loading }) => {
  return (
    <div>
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Enter an email address"
        style={{ padding: '10px', marginRight: '10px', width: '300px' }}
      />
      <button onClick={onValidate} disabled={loading || !email}>
        {loading ? 'Validating...' : 'Validate'}
      </button>
    </div>
  );
};

export default EmailInput;
