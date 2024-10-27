// components/DomainVerificationStatus.tsx
import React from 'react';
import type { SESValidationResult } from '../utils/types';

interface Props {
  domain: string;
  results: SESValidationResult[];
}

export const DomainVerificationStatus: React.FC<Props> = ({ domain, results }) => {
  const dkimEnabled = results.some(r => r.details.domain_status.has_dkim);
  const spfEnabled = results.some(r => r.details.domain_status.has_spf);
  const dmarcStatus = results[0]?.details.domain_status.dmarc_status;

  return (
    <div className="bg-gray-50 rounded-lg p-4">
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-lg font-medium text-gray-900">{domain}</h4>
        <span className={`px-3 py-1 rounded-full text-sm font-medium ${
          dkimEnabled && spfEnabled ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
        }`}>
          {dkimEnabled && spfEnabled ? 'Fully Verified' : 'Incomplete'}
        </span>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="flex items-center space-x-2">
          <div className={`w-2 h-2 rounded-full ${dkimEnabled ? 'bg-green-400' : 'bg-red-400'}`} />
          <span className="text-sm text-gray-600">DKIM</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className={`w-2 h-2 rounded-full ${spfEnabled ? 'bg-green-400' : 'bg-red-400'}`} />
          <span className="text-sm text-gray-600">SPF</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className={`w-2 h-2 rounded-full ${dmarcStatus === 'pass' ? 'bg-green-400' : 'bg-yellow-400'}`} />
          <span className="text-sm text-gray-600">DMARC</span>
        </div>
      </div>

      {(!dkimEnabled || !spfEnabled) && (
        <div className="mt-4 text-sm text-yellow-700 bg-yellow-50 rounded p-3">
          <strong>Recommendations:</strong>
          <ul className="list-disc list-inside mt-1">
            {!dkimEnabled && <li>Set up DKIM authentication</li>}
            {!spfEnabled && <li>Configure SPF records</li>}
            {dmarcStatus !== 'pass' && <li>Implement DMARC policy</li>}
          </ul>
        </div>
      )}
    </div>
  );
};