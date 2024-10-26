import React from 'react';

interface ValidationProgressProps {
  totalEmails: number;
  processedEmails: number;
  errors: string[];
}

const ValidationProgress: React.FC<ValidationProgressProps> = ({
  totalEmails,
  processedEmails,
  errors,
}) => {
  const progress = (processedEmails / totalEmails) * 100;

  return (
    <div className="mt-4 w-full max-w-md">
      <div className="mb-2 flex justify-between text-sm">
        <span>Progress: {processedEmails} / {totalEmails} emails</span>
        <span>{Math.round(progress)}%</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2.5">
        <div
          className="bg-green-600 h-2.5 rounded-full transition-all duration-500"
          style={{ width: `${progress}%` }}
        ></div>
      </div>
      {errors.length > 0 && (
        <div className="mt-4">
          <h4 className="text-red-600 font-semibold mb-2">Errors:</h4>
          <div className="max-h-40 overflow-y-auto bg-red-50 p-3 rounded-md">
            {errors.map((error, index) => (
              <p key={index} className="text-sm text-red-700 mb-1">
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