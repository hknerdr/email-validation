// components/BounceRatePrediction.tsx
import React from 'react';

interface Props {
  predictedRate: number;
  totalEmails: number;
}

const BounceRatePrediction: React.FC<Props> = ({ predictedRate, totalEmails }) => {
  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <h3 className="text-lg font-semibold mb-4">Bounce Rate Prediction</h3>
      <p className="text-xl font-bold">{predictedRate}%</p>
      <p className="text-sm text-gray-500">{totalEmails} emails processed</p>
      {/* Ek UI öğeleri */}
    </div>
  );
};

export default BounceRatePrediction;
