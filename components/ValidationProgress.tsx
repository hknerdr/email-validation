// components/ValidationProgress.tsx
import React from 'react';
import { Icons } from '../utils/icons';

interface Log {
  message: string;
  type: 'info' | 'success' | 'error' | 'warning';
  timestamp: string;
}

interface ValidationProgressProps {
  totalEmails: number;
  processedEmails: number;
  errors: string[];
  logs: Log[];
  isValidating: boolean;
}

const ValidationProgress: React.FC<ValidationProgressProps> = ({
  totalEmails,
  processedEmails,
  errors,
  logs,
  isValidating
}) => {
  const progress = Math.min((processedEmails / totalEmails) * 100, 100);

  const getLogIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <Icons.Check className="text-green-500" />;
      case 'error':
        return <Icons.Alert className="text-red-500" />;
      case 'warning':
        return <Icons.Alert className="text-yellow-500" />;
      default:
        return <Icons.Info className="text-blue-500" />;
    }
  };

  const getLogClass = (type: string) => {
    switch (type) {
      case 'success':
        return 'text-green-700 bg-green-50';
      case 'error':
        return 'text-red-700 bg-red-50';
      case 'warning':
        return 'text-yellow-700 bg-yellow-50';
      default:
        return 'text-blue-700 bg-blue-50';
    }
  };

  return (
    <div className="space-y-6">
      {/* Progress Bar */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="mb-4 flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-800">Validation Progress</h3>
          <span className="text-lg font-bold text-gray-900">{Math.round(progress)}%</span>
        </div>
        
        <div className="w-full bg-gray-100 rounded-full h-4 overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-green-400 to-green-500 transition-all duration-500 ease-out relative"
            style={{ width: `${progress}%` }}
          >
            <div className="absolute inset-0 bg-white/20"></div>
          </div>
        </div>

        <div className="mt-3 text-sm text-gray-600">
          {processedEmails} of {totalEmails} emails processed
        </div>
      </div>

      {/* Log Console */}
      <div className="bg-gray-900 rounded-xl shadow-lg">
        <div className="border-b border-gray-800 p-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-full bg-red-500"></div>
            <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
          </div>
          <span className="text-gray-400 text-sm">Validation Log</span>
        </div>
        
        <div className="p-4">
          <div className="max-h-80 overflow-y-auto space-y-2 font-mono text-sm">
            {logs.map((log, index) => (
              <div 
                key={index} 
                className={`flex items-center space-x-2 p-2 rounded ${getLogClass(log.type)}`}
              >
                {getLogIcon(log.type)}
                <span className="text-gray-500">[{log.timestamp}]</span>
                <span>{log.message}</span>
              </div>
            ))}
            {isValidating && (
              <div className="flex items-center space-x-2 p-2 text-blue-500">
                <Icons.Spinner />
                <span>Processing...</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Errors Display */}
      {errors.length > 0 && (
        <div className="bg-red-50 border-l-4 border-red-500 rounded-lg p-4">
          <div className="flex items-center mb-2">
            <Icons.Alert className="w-5 h-5 text-red-500 mr-2" />
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