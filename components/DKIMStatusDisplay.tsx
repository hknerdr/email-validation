// components/DKIMStatusDisplay.tsx
import React from 'react';
import type { SESValidationResult } from '../utils/types';

interface Props {
  domains: string[];
  results: SESValidationResult[];
}

export const DKIMStatusDisplay: React.FC<Props> = ({ domains, results }) => {
  const getDKIMStatus = (domain: string) => {
    const domainResults = results.filter(r => r.email.includes(domain));
    const hasDKIM = domainResults.some(r => r.details.domain_status.has_dkim);
    const dkimDetails = domainResults[0]?.details.verification_attributes?.dkim_attributes;

    return {
      enabled: hasDKIM,
      tokens: dkimDetails?.tokens || [],
      status: dkimDetails?.status || 'NotStarted'
    };
  };

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">DKIM Configuration</h3>
      
      <div className="space-y-4">
        {domains.map(domain => {
          const status = getDKIMStatus(domain);
          
          return (
            <div key={domain} className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium text-gray-900">{domain}</h4>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                  status.enabled ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {status.enabled ? 'Enabled' : 'Not Configured'}
                </span>
              </div>

              {status.tokens.length > 0 && (
                <div className="mt-2">
                  <p className="text-sm text-gray-500 mb-1">DKIM Records:</p>
                  <div className="space-y-1">
                    {status.tokens.map((token, index) => (
                      <div key={index} className="text-xs font-mono bg-gray-50 p-2 rounded">
                        {token}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {!status.enabled && (
                <div className="mt-2 text-sm text-gray-600">
                  <p className="font-medium">Steps to enable DKIM:</p>
                  <ol className="list-decimal list-inside mt-1 space-y-1">
                    <li>Generate DKIM keys in AWS SES</li>
                    <li>Add CNAME records to your DNS</li>
                    <li>Verify DKIM setup in AWS Console</li>
                  </ol>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};