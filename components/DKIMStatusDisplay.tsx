// components/DKIMStatusDisplay.tsx
import React, { useMemo } from 'react';
import type { SESValidationResult } from '../utils/types';

interface Props {
  domains: string[];
  results: SESValidationResult[];
}

interface DKIMStatus {
  enabled: boolean;
  tokens: string[];
  status: string;
}

export const DKIMStatusDisplay: React.FC<Props> = ({ domains, results }) => {
  /**
   * Computes the DKIM status for each domain.
   * Memoized for performance optimization.
   */
  const domainStatuses: { [key: string]: DKIMStatus } = useMemo(() => {
    const statuses: { [key: string]: DKIMStatus } = {};

    domains.forEach((domain) => {
      const domainResults = results.filter((r) => r.email.endsWith(`@${domain}`));
      const hasDKIM = domainResults.some((r) => r.details.domain_status.has_dkim);
      const dkimDetails = domainResults[0]?.details.verification_attributes?.dkimAttributes;

      statuses[domain] = {
        enabled: hasDKIM,
        tokens: dkimDetails?.tokens || [],
        status: dkimDetails?.status || 'NotStarted',
      };
    });

    return statuses;
  }, [domains, results]);

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        DKIM Configuration Status
      </h3>
      
      <div className="space-y-4">
        {domains.map((domain) => {
          const status = domainStatuses[domain];
          
          return (
            <div key={domain} className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium text-gray-900">{domain}</h4>
                <span
                  className={`px-2 py-1 text-xs font-medium rounded-full ${
                    status.enabled 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-yellow-100 text-yellow-800'
                  }`}
                >
                  {status.enabled ? 'Verified' : 'Not Configured'}
                </span>
              </div>

              {status.enabled && status.tokens.length > 0 && (
                <div className="mt-3">
                  <p className="text-sm font-medium text-gray-700 mb-2">DKIM Records:</p>
                  <div className="space-y-2">
                    {status.tokens.map((token, index) => (
                      <div key={index} className="bg-gray-50 p-3 rounded-lg">
                        <p className="text-xs font-mono text-gray-600 break-all">{token}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {!status.enabled && (
                <div className="mt-3 space-y-3">
                  <div className="flex items-start">
                    <svg
                      className="w-5 h-5 text-yellow-500 mt-0.5 mr-2"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                      />
                    </svg>
                    <div>
                      <p className="text-sm font-medium text-gray-900">DKIM Not Configured</p>
                      <p className="mt-1 text-sm text-gray-600">
                        DKIM authentication helps prevent email spoofing and improves deliverability.
                      </p>
                    </div>
                  </div>

                  <div className="bg-blue-50 rounded-lg p-3">
                    <p className="text-sm font-medium text-blue-900 mb-2">Setup Instructions:</p>
                    <ol className="list-decimal list-inside space-y-1 text-sm text-blue-800">
                      <li>Open AWS SES Console</li>
                      <li>Navigate to Verified Identities</li>
                      <li>Select your domain</li>
                      <li>Click on "View or generate DKIM settings"</li>
                      <li>Follow AWS instructions to add DKIM records to your DNS</li>
                    </ol>
                  </div>
                </div>
              )}

              {/* Status Information */}
              <div className="mt-4 grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Status</p>
                  <p className="text-sm font-medium text-gray-900">{status.status}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Last checked</p>
                  <p className="text-sm font-medium text-gray-900">
                    {new Date().toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Help Section */}
      <div className="mt-6 bg-gray-50 rounded-lg p-4">
        <h4 className="text-sm font-medium text-gray-900 mb-2">About DKIM</h4>
        <p className="text-sm text-gray-600">
          DomainKeys Identified Mail (DKIM) is an email authentication method that helps prevent
          email spoofing by adding a digital signature to your emails. When properly configured,
          it can improve your email deliverability and sender reputation.
        </p>
        <a
          href="https://docs.aws.amazon.com/ses/latest/dg/send-email-authentication-dkim.html"
          target="_blank"
          rel="noopener noreferrer"
          className="mt-2 inline-flex items-center text-sm text-blue-600 hover:text-blue-800"
        >
          Learn more about DKIM
          <svg
            className="w-4 h-4 ml-1"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
            />
          </svg>
        </a>
      </div>
    </div>
  );
};
