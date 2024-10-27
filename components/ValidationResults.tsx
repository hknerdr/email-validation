// components/ValidationResults.tsx
import React from 'react';
import type { SESValidationResult, ValidationStatistics } from '../utils/types';
import { Icons } from '../utils/icons';

interface Props {
  results: SESValidationResult[];
  stats: ValidationStatistics;
}

const ValidationResults: React.FC<Props> = ({ results, stats }) => {
  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="text-sm text-gray-500">Total</div>
          <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
        </div>
        <div className="bg-green-50 rounded-xl shadow-sm p-4">
          <div className="text-sm text-green-600">Verified</div>
          <div className="text-2xl font-bold text-green-600">{stats.verified}</div>
        </div>
        <div className="bg-red-50 rounded-xl shadow-sm p-4">
          <div className="text-sm text-red-600">Failed</div>
          <div className="text-2xl font-bold text-red-600">{stats.failed}</div>
        </div>
        <div className="bg-yellow-50 rounded-xl shadow-sm p-4">
          <div className="text-sm text-yellow-600">Pending</div>
          <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
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
                  DKIM
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Details
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {results.map((result, index) => (
                <tr key={index} className="hover:bg-gray-50">
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
                    {result.details.domain_status.has_dkim ? (
                      <span className="text-green-600">
                        <Icons.Check className="w-5 h-5" />
                      </span>
                    ) : (
                      <span className="text-red-600">
                        <Icons.Alert className="w-5 h-5" />
                      </span>
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

      {/* Deliverability Score */}
      {stats.deliverability && (
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Deliverability Score</h3>
          <div className="flex items-center mb-4">
            <div className="flex-1">
              <div className="h-4 bg-gray-200 rounded-full">
                <div 
                  className="h-4 rounded-full bg-gradient-to-r from-red-500 via-yellow-500 to-green-500"
                  style={{ width: `${stats.deliverability.score}%` }}
                />
              </div>
            </div>
            <span className="ml-4 text-2xl font-bold text-gray-900">
              {Math.round(stats.deliverability.score)}%
            </span>
          </div>

          {stats.deliverability.recommendations.length > 0 && (
            <div className="mt-4 bg-blue-50 rounded-lg p-4">
              <h4 className="text-sm font-medium text-blue-900 mb-2">Recommendations</h4>
              <ul className="list-disc list-inside space-y-1 text-sm text-blue-800">
                {stats.deliverability.recommendations.map((rec, index) => (
                  <li key={index}>{rec}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Domain Statistics */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Domain Statistics</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="text-sm text-gray-500">Total Domains</div>
            <div className="text-2xl font-bold text-gray-900">{stats.domains.total}</div>
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="text-sm text-gray-500">Verified Domains</div>
            <div className="text-2xl font-bold text-gray-900">{stats.domains.verified}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ValidationResults;