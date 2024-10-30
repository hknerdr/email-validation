// components/DomainVerificationStatus.tsx
import React from 'react';
import type { EmailValidationResult } from '../utils/types';

interface Props {
  domain: string;
  results: EmailValidationResult[];
}

export const DomainVerificationStatus: React.FC<Props> = ({ domain, results }) => {
  const totalEmails = results.length;
  const validEmails = results.filter(r => r.is_valid).length;
  const hasMX = results.some(r => r.details.domain_status.has_mx_records);
  const hasSMTP = results.some(r => r.details.connection_success);

  return (
    <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-100">
      <div className="flex items-center justify-between">
        <h4 className="text-lg font-medium text-gray-900">{domain}</h4>
        <div className="flex space-x-2">
          <span
            className={`px-2 py-1 text-sm font-medium rounded-full ${
              hasMX
                ? 'bg-green-100 text-green-800'
                : 'bg-red-100 text-red-800'
            }`}
          >
            MX: {hasMX ? 'Mevcut' : 'Eksik'}
          </span>
          <span
            className={`px-2 py-1 text-sm font-medium rounded-full ${
              hasSMTP
                ? 'bg-green-100 text-green-800'
                : 'bg-red-100 text-red-800'
            }`}
          >
            SMTP: {hasSMTP ? 'Başarılı' : 'Başarısız'}
          </span>
        </div>
      </div>
      
      <div className="mt-4 grid grid-cols-2 gap-4">
        <div>
          <p className="text-sm text-gray-500">Geçerli E-posta</p>
          <p className="text-lg font-semibold">
            {validEmails}/{totalEmails}
          </p>
        </div>
        <div>
          <p className="text-sm text-gray-500">SMTP Başarısı</p>
          <span
            className={`px-2 py-1 text-xs rounded-full ${
              hasSMTP
                ? 'bg-green-100 text-green-800'
                : 'bg-red-100 text-red-800'
            }`}
          >
            {hasSMTP ? 'Başarılı' : 'Başarısız'}
          </span>
        </div>
      </div>
    </div>
  );
};

export default DomainVerificationStatus;
