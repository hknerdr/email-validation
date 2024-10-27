// components/ValidationResults.tsx
import React from 'react';
import type { ValidationResult } from '../utils/types';

interface Props {
  results: ValidationResult[];
  stats: {
    total: number;
    valid: number;
    invalid: number;
    risk_levels: {
      high: number;
      medium: number;
      low: number;
      none: number;
    };
  };
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
          <div className="text-sm text-green-600">Valid</div>
          <div className="text-2xl font-bold text-green-600">{stats.valid}</div>
        </div>
        <div className="bg-red-50 rounded-xl shadow-sm p-4">
          <div className="text-sm text-red-600">Invalid</div>
          <div className="text-2xl font-bold text-red-600">{stats.invalid}</div>
        </div>
        <div className="bg-yellow-50 rounded-xl shadow-sm p-4">
          <div className="text-sm text-yellow-600">High Risk</div>
          <div className="text-2xl font-bold text-yellow-600">
            {stats.risk_levels.high}
          </div>
        </div>
      </div>

      {/* Risk Level Distribution */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Risk Distribution</h3>
        <div className="h-4 rounded-full bg-gray-100 overflow-hidden">
          {stats.total > 0 && (
            <div className="h-full flex">
              <div 
                className="bg-red-500 h-full transition-all duration-500"
                style={{ width: `${(stats.risk_levels.high / stats.total) * 100}%` }}
              />
              <div 
                className="bg-yellow-500 h-full transition-all duration-500"
                style={{ width: `${(stats.risk_levels.medium / stats.total) * 100}%` }}
              />
              <div 
                className="bg-blue-500 h-full transition-all duration-500"
                style={{ width: `${(stats.risk_levels.low / stats.total) * 100}%` }}
              />
              <div 
                className="bg-green-500 h-full transition-all duration-500"
                style={{ width: `${(stats.risk_levels.none / stats.total) * 100}%` }}
              />
            </div>
          )}
        </div>
        <div className="mt-2 flex justify-between text-sm text-gray-500">
          <span>High Risk ({stats.risk_levels.high})</span>
          <span>Medium ({stats.risk_levels.medium})</span>
          <span>Low ({stats.risk_levels.low})</span>
          <span>No Risk ({stats.risk_levels.none})</span>
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
                  Risk Level
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
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
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      result.is_valid 
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {result.is_valid ? 'Valid' : 'Invalid'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      result.risk === 'high' ? 'bg-red-100 text-red-800' :
                      result.risk === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                      result.risk === 'low' ? 'bg-blue-100 text-blue-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {result.risk.charAt(0).toUpperCase() + result.risk.slice(1)}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {result.reason || 
                     (result.suggestions?.length ? `Suggestion: ${result.suggestions[0]}` : 'No issues found')}
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

export default ValidationResults;