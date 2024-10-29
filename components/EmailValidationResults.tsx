// components/EmailValidationResults.tsx
import React from 'react';
import { DomainVerificationStatus } from './DomainVerificationStatus';
import { DeliverabilityMetrics } from './DeliverabilityMetrics';
import { BounceRatePrediction } from './BounceRatePrediction';
import type { SESValidationResult } from '../utils/types';

interface Props {
  results: SESValidationResult[];
  stats: ValidationStatistics;
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
          <h3 className="text-sm font-medium text-yellow-600">Domains</h3>
          <p className="text-3xl font-bold text-yellow-700 mt-2">{stats.domains.total}</p>
          <p className="text-sm text-yellow-600 mt-1">
            {stats.domains.verified} verified
          </p>
        </div>
      </div>

      {/* Domain Status */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h3 className="text-lg font-semibold mb-4">Domain Verification Status</h3>
        <div className="space-y-4">
          {domains.map(domain => (
            <DomainVerificationStatus
              key={domain}
              domain={domain}
              results={results.filter(r => r.email.endsWith(`@${domain}`))}
            />
          ))}
        </div>
      </div>

      {/* Deliverability Score */}
      {stats.deliverability && (
        <DeliverabilityMetrics 
          score={stats.deliverability.score}
          recommendations={stats.deliverability.recommendations}
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
                  MX Records
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  SMTP Validation
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
                        result.is_valid
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                      aria-label={`Verification status: ${result.is_valid ? 'Valid' : 'Invalid'}`}
                    >
                      {result.is_valid ? 'Valid' : 'Invalid'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {result.details.domain_status.has_mx_records ? (
                      <span className="text-green-600" aria-label="MX Records Present">✓</span>
                    ) : (
                      <span className="text-red-600" aria-label="MX Records Missing">✗</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {result.details.recipient_accepted ? (
                      <span className="text-green-600" aria-label="SMTP Validation Passed">✓</span>
                    ) : (
                      <span className="text-red-600" aria-label="SMTP Validation Failed">✗</span>
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

      {/* Export Button */}
      <div className="flex justify-end">
        <button
          onClick={() => {
            const csv = [
              ['Email', 'Status', 'MX Records', 'SMTP Validation', 'Details'],
              ...results.map(r => [
                r.email,
                r.is_valid ? 'Valid' : 'Invalid',
                r.details.domain_status.has_mx_records ? '✓' : '✗',
                r.details.recipient_accepted ? '✓' : '✗',
                r.reason || 'No issues found'
              ])
            ].map(row => row.join(',')).join('\n');

            const blob = new Blob([csv], { type: 'text/csv' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.setAttribute('hidden', '');
            a.setAttribute('href', url);
            a.setAttribute('download', 'validation-results.csv');
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
          }}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Export Results
        </button>
      </div>
    </div>
  );
};

export default EmailValidationResults;
