// components/DomainVerificationStatus.tsx

import React from 'react';
import type { EmailValidationResult } from '../utils/types';

interface Props {
  domain: string;
  results: EmailValidationResult[];
}

export const DomainVerificationStatus: React.FC<Props> = ({ domain, results }) => {
  const hasMX = results.some(r => r.details.domain_status.has_mx_records);
  const hasDKIM = results.some(r => r.details.domain_status.has_dkim);
  const hasSPF = results.some(r => r.details.domain_status.has_spf);
  const dmarcStatus = results.some(r => r.details.domain_status.dmarc_status === 'pass');

  return (
    <div className="border rounded-lg p-4 shadow-sm bg-gray-50">
      <h4 className="text-md font-semibold mb-2">{domain}</h4>
      <ul className="space-y-1">
        <li className="flex items-center">
          <span
            className={`inline-block w-3 h-3 mr-2 rounded-full ${
              hasMX ? 'bg-green-500' : 'bg-red-500'
            }`}
          ></span>
          MX Kayıtları: {hasMX ? 'Mevcut' : 'Eksik'}
        </li>
        <li className="flex items-center">
          <span
            className={`inline-block w-3 h-3 mr-2 rounded-full ${
              hasDKIM ? 'bg-green-500' : 'bg-red-500'
            }`}
          ></span>
          DKIM: {hasDKIM ? 'Enabled' : 'Disabled'}
        </li>
        <li className="flex items-center">
          <span
            className={`inline-block w-3 h-3 mr-2 rounded-full ${
              hasSPF ? 'bg-green-500' : 'bg-red-500'
            }`}
          ></span>
          SPF: {hasSPF ? 'Configured' : 'Not Configured'}
        </li>
        <li className="flex items-center">
          <span
            className={`inline-block w-3 h-3 mr-2 rounded-full ${
              dmarcStatus ? 'bg-green-500' : 'bg-red-500'
            }`}
          ></span>
          DMARC: {dmarcStatus ? 'Pass' : 'Fail/None'}
        </li>
      </ul>
    </div>
  );
};

export default DomainVerificationStatus;
