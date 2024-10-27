// components/BounceRatePrediction.tsx
import React from 'react';
import { Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';

ChartJS.register(ArcElement, Tooltip, Legend);

interface Props {
  predictedRate: number;
  totalEmails: number;
}

export const BounceRatePrediction: React.FC<Props> = ({ predictedRate, totalEmails }) => {
  const predictedBounces = Math.round(totalEmails * (predictedRate / 100));
  
  const chartData = {
    labels: ['Delivered', 'Predicted Bounces'],
    datasets: [
      {
        data: [totalEmails - predictedBounces, predictedBounces],
        backgroundColor: [
          'rgba(34, 197, 94, 0.8)',
          'rgba(239, 68, 68, 0.8)'
        ],
        borderColor: [
          'rgba(34, 197, 94, 1)',
          'rgba(239, 68, 68, 1)'
        ],
        borderWidth: 1
      }
    ]
  };

  const getRiskLevel = (rate: number) => {
    if (rate <= 2) return { text: 'Low', color: 'text-green-600' };
    if (rate <= 5) return { text: 'Medium', color: 'text-yellow-600' };
    return { text: 'High', color: 'text-red-600' };
  };

  const risk = getRiskLevel(predictedRate);

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Bounce Rate Prediction</h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="relative h-48">
          <Doughnut
            data={chartData}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              cutout: '70%'
            }}
          />
        </div>

        <div className="space-y-4">
          <div>
            <p className="text-sm text-gray-500">Predicted Bounce Rate</p>
            <p className={`text-3xl font-bold ${risk.color}`}>{predictedRate}%</p>
          </div>

          <div>
            <p className="text-sm text-gray-500">Risk Level</p>
            <p className={`text-xl font-semibold ${risk.color}`}>{risk.text}</p>
          </div>

          <div className="text-sm">
            <p className="text-gray-500">Estimated Statistics:</p>
            <ul className="mt-2 space-y-1">
              <li>Successfully Delivered: {totalEmails - predictedBounces}</li>
              <li>Predicted Bounces: {predictedBounces}</li>
            </ul>
          </div>
        </div>
      </div>

      {predictedRate > 2 && (
        <div className="mt-6 bg-yellow-50 rounded-lg p-4">
          <h4 className="text-sm font-medium text-yellow-800 mb-2">Recommendations to Reduce Bounce Rate:</h4>
          <ul className="list-disc list-inside text-sm text-yellow-700 space-y-1">
            <li>Clean your email list regularly</li>
            <li>Implement double opt-in</li>
            <li>Monitor engagement metrics</li>
            <li>Remove inactive subscribers</li>
            {predictedRate > 5 && (
              <>
                <li>Verify emails before sending</li>
                <li>Segment your audience</li>
              </>
            )}
          </ul>
        </div>
      )}
    </div>
  );
};