// components/DomainVerificationStatus.tsx
import React from 'react';
import type { SESValidationResult } from '../utils/types';

interface Props {
  domain: string;
  results: SESValidationResult[];
}

export const DomainVerificationStatus: React.FC<Props> = ({ domain, results }) => {
  const totalEmails = results.length;
  const validEmails = results.filter(r => r.is_valid).length;
  const verificationStatus = results[0]?.details.domain_status.verified;
  const hasDKIM = results[0]?.details.domain_status.has_dkim;
  const hasSPF = results[0]?.details.domain_status.has_spf;

  return (
    <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-100">
      <div className="flex items-center justify-between">
        <h4 className="text-lg font-medium text-gray-900">{domain}</h4>
        <span
          className={`px-2 py-1 text-sm rounded-full ${
            verificationStatus
              ? 'bg-green-100 text-green-800'
              : 'bg-yellow-100 text-yellow-800'
          }`}
        >
          {verificationStatus ? 'Verified' : 'Unverified'}
        </span>
      </div>
      
      <div className="mt-4 grid grid-cols-2 gap-4">
        <div>
          <p className="text-sm text-gray-500">Emails</p>
          <p className="text-lg font-semibold">
            {validEmails}/{totalEmails}
          </p>
        </div>
        <div>
          <p className="text-sm text-gray-500">Authentication</p>
          <div className="flex space-x-2 mt-1">
            <span
              className={`px-2 py-1 text-xs rounded ${
                hasDKIM
                  ? 'bg-green-100 text-green-800'
                  : 'bg-red-100 text-red-800'
              }`}
            >
              DKIM
            </span>
            <span
              className={`px-2 py-1 text-xs rounded ${
                hasSPF
                  ? 'bg-green-100 text-green-800'
                  : 'bg-red-100 text-red-800'
              }`}
            >
              SPF
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
