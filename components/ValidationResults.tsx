// components/ValidationResults.tsx
import React from 'react';
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

const ValidationResults: React.FC<Props> = ({ results, stats }) => {
  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-sm font-medium text-gray-500">Total Processed</h3>
          <p className="text-3xl font-bold text-gray-900 mt-2">{stats.total}</p>
        </div>
        
        <div className="bg-green-50 rounded-xl shadow-sm p-6">
          <h3 className="text-sm font-medium text-green-600">Valid</h3>
          <p className="text-3xl font-bold text-green-700 mt-2">{stats.verified}</p>
          <p className="text-sm text-green-600 mt-1">
            {((stats.verified / stats.total) * 100).toFixed(1)}%
          </p>
        </div>
        
        <div className="bg-red-50 rounded-xl shadow-sm p-6">
          <h3 className="text-sm font-medium text-red-600">Invalid</h3>
          <p className="text-3xl font-bold text-red-700 mt-2">{stats.failed}</p>
          <p className="text-sm text-red-600 mt-1">
            {((stats.failed / stats.total) * 100).toFixed(1)}%
          </p>
        </div>
        
        <div className="bg-blue-50 rounded-xl shadow-sm p-6">
          <h3 className="text-sm font-medium text-blue-600">Domains</h3>
          <p className="text-3xl font-bold text-blue-700 mt-2">{stats.domains.total}</p>
          <p className="text-sm text-blue-600 mt-1">
            {stats.domains.verified} verified
          </p>
        </div>
      </div>

      {/* Results Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Domain Status
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Authentication
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Details
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {results.map((result, index) => (
                <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {result.email}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      result.is_valid
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {result.is_valid ? 'Valid' : 'Invalid'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      result.details.domain_status.verified
                        ? 'bg-green-100 text-green-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {result.details.domain_status.verified ? 'Verified' : 'Unverified'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex space-x-2">
                      {result.details.domain_status.has_dkim && (
                        <span className="px-2 py-1 text-xs rounded bg-green-100 text-green-800">
                          DKIM
                        </span>
                      )}
                      {result.details.domain_status.has_spf && (
                        <span className="px-2 py-1 text-xs rounded bg-green-100 text-green-800">
                          SPF
                        </span>
                      )}
                      {!result.details.domain_status.has_dkim && !result.details.domain_status.has_spf && (
                        <span className="px-2 py-1 text-xs rounded bg-gray-100 text-gray-800">
                          None
                        </span>
                      )}
                    </div>
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
              ['Email', 'Status', 'Domain Status', 'Authentication', 'Details'],
              ...results.map(r => [
                r.email,
                r.is_valid ? 'Valid' : 'Invalid',
                r.details.domain_status.verified ? 'Verified' : 'Unverified',
                [
                  r.details.domain_status.has_dkim ? 'DKIM' : '',
                  r.details.domain_status.has_spf ? 'SPF' : ''
                ].filter(Boolean).join(', ') || 'None',
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

export default ValidationResults;
