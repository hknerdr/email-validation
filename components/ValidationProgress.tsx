import React from 'react';

interface ValidationProgressProps {
  totalEmails: number;
  processedEmails: number;
  errors: string[];
  logs: string[];
  isValidating: boolean;
}

const ValidationProgress: React.FC<ValidationProgressProps> = ({
  totalEmails,
  processedEmails,
  errors,
  logs,
  isValidating
}) => {
  const progress = (processedEmails / totalEmails) * 100;

  return (
    <div className="mt-6 space-y-4">
      {/* Modern Progress Bar */}
      <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
        <div className="mb-2 flex justify-between text-sm text-gray-600">
          <span className="font-medium">Validation Progress</span>
          <span className="font-semibold">{Math.round(progress)}%</span>
        </div>
        <div className="w-full bg-gray-100 rounded-full h-3">
          <div
            className="bg-gradient-to-r from-green-400 to-green-500 h-3 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          >
            <div className="animate-pulse bg-white/20 h-full rounded-full"></div>
          </div>
        </div>
        <div className="mt-2 text-sm text-gray-500">
          {processedEmails} of {totalEmails} emails processed
        </div>
      </div>

      {/* Terminal-like Log Display */}
      <div className="bg-gray-900 rounded-lg shadow-lg p-4 font-mono text-sm">
        <div className="flex items-center mb-2 pb-2 border-b border-gray-700">
          <div className="flex space-x-2">
            <div className="w-3 h-3 rounded-full bg-red-500"></div>
            <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
          </div>
          <span className="ml-4 text-gray-400">Validation Log</span>
        </div>
        <div className="max-h-60 overflow-y-auto space-y-1 text-gray-300">
          {logs.map((log, index) => (
            <div key={index} className="flex">
              <span className="text-green-400 mr-2">$</span>
              <span>{log}</span>
            </div>
          ))}
          {isValidating && (
            <div className="flex items-center">
              <span className="text-green-400 mr-2">$</span>
              <span className="animate-pulse">Processing...</span>
            </div>
          )}
        </div>
      </div>

      {/* Error Display */}
      {errors.length > 0 && (
        <div className="bg-red-50 border-l-4 border-red-500 rounded-lg p-4">
          <div className="flex items-center mb-2">
            <svg className="w-5 h-5 text-red-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <h4 className="text-red-800 font-semibold">Validation Errors</h4>
          </div>
          <div className="space-y-1">
            {errors.map((error, index) => (
              <p key={index} className="text-sm text-red-700">
                {error}
              </p>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ValidationProgress;