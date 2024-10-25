// components/ValidationResults.tsx
import React from 'react';

interface ValidationResultsProps {
  validatedEmails: any[];
}

const ValidationResults: React.FC<ValidationResultsProps> = ({ validatedEmails }) => {
  return (
    <div style={{ marginTop: '20px' }}>
      <h3>Validation Results</h3>
      {validatedEmails.map((result, index) => (
        <p key={index}>
          {result.email}: {result.is_valid ? 'Valid' : 'Invalid'} - {result.message}
        </p>
      ))}
    </div>
  );
};

export default ValidationResults;
