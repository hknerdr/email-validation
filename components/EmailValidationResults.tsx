// components/EmailValidationResults.tsx
import React from 'react';
// Removed unused 'Line' import
import { DomainVerificationStatus } from './DomainVerificationStatus';
import { DeliverabilityMetrics } from './DeliverabilityMetrics';
import { DKIMStatusDisplay } from './DKIMStatusDisplay';
import { BounceRatePrediction } from './BounceRatePrediction';
import type { SESValidationResult } from '../utils/types';

interface Props {
  results: SESValidationResult[];
  stats: {
    total: number;
    verified: number;
    failed: number;
    pending: number;
    domains: {
      total: number;
      verified: number;
    };
    dkim: {
      enabled: number;
    };
    deliverability?: {
      score: number;
      predictedBounceRate: number;
      recommendations: string[];
    };
  };
}

const EmailValidationResults: React.FC<Props> = ({ results, stats }) => {
  const domains = Array.from(new Set(results.map(r => r.email.split('@')[1])));

  return (
    <div className="space-y-6">
      {/* Overall Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-sm font-medium text-gray-500">Total Processed</h3>
          <p className="text-3xl font-bold text-gray-900 mt-2">{stats.total}</p>
        </div>
        
        <div className="bg-green-50 rounded-xl shadow-sm p-6">
          <h3 className="text-sm font-medium text-green-600">Verified</h3>
          <p className="text-3xl font-bold text-green-700 mt-2">{stats.verified}</p>
        </div>
        
        <div className="bg-red-50 rounded-xl shadow-sm p-6">
          <h3 className="text-sm font-medium text-red-600">Failed</h3>
          <p className="text-3xl font-bold text-red-700 mt-2">{stats.failed}</p>
        </div>
        
        <div className="bg-yellow-50 rounded-xl shadow-sm p-6">
          <h3 className="text-sm font-medium text-yellow-600">Pending</h3>
          <p className="text-3xl font-bold text-yellow-700 mt-2">{stats.pending}</p>
        </div>
      </div>

      {/* Deliverability Score */}
      {stats.deliverability && (
        <DeliverabilityMetrics 
          score={stats.deliverability.score}
          recommendations={stats.deliverability.recommendations}
        />
      )}

      {/* Domain Status */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h3 className="text-lg font-semibold mb-4">Domain Verification Status</h3>
        <div className="space-y-4">
          {domains.map(domain => (
            <DomainVerificationStatus
              key={domain}
              domain={domain}
              results={results.filter(r => r.email.endsWith(`@${domain}`))} // Improved domain matching
            />
          ))}
        </div>
      </div>

      {/* DKIM Status */}
      <DKIMStatusDisplay 
        domains={domains}
        results={results}
      />

      {/* Bounce Rate Prediction */}
      {stats.deliverability && (
        <BounceRatePrediction
          predictedRate={stats.deliverability.predictedBounceRate}
          totalEmails={stats.total}
        />
      )}

      {/* Detailed Results Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Email
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Status
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  DKIM
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  MX Records
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Details
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {results.map((result, index) => (
                <tr key={index}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {result.email}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        result.verification_status === 'Success'
                          ? 'bg-green-100 text-green-800'
                          : result.verification_status === 'Failed'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}
                      aria-label={`Verification status: ${result.verification_status}`} // Accessibility improvement
                    >
                      {result.verification_status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {result.details.domain_status.has_dkim ? (
                      <span className="text-green-600" aria-label="DKIM Enabled">✓</span>
                    ) : (
                      <span className="text-red-600" aria-label="DKIM Disabled">✗</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {result.details.domain_status.has_mx_records ? (
                      <span className="text-green-600" aria-label="MX Records Present">✓</span>
                    ) : (
                      <span className="text-red-600" aria-label="MX Records Missing">✗</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {result.reason || 'No issues found'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default EmailValidationResults;
