// components/DeliverabilityMetrics.tsx

import React from 'react';

interface Props {
  score: number;
  recommendations: string[];
}

export const DeliverabilityMetrics: React.FC<Props> = ({ score, recommendations }) => {
  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <h3 className="text-lg font-semibold mb-4">Deliverability Metrics</h3>
      <div className="flex items-center">
        <div className="w-16 h-16 rounded-full flex items-center justify-center bg-blue-100">
          <span className="text-3xl font-bold text-blue-600">{score}%</span>
        </div>
        <div className="ml-4">
          <p className="text-sm text-gray-600">Predicted Bounce Rate: {score}%</p>
          {recommendations.length > 0 && (
            <div className="mt-2">
              <p className="text-sm font-medium text-gray-700">Recommendations:</p>
              <ul className="list-disc list-inside text-sm text-gray-600">
                {recommendations.map((rec, index) => (
                  <li key={index}>{rec}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DeliverabilityMetrics;
