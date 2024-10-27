// components/DeliverabilityMetrics.tsx
import React from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

interface Props {
  score: number;
  recommendations: string[];
  history?: { date: string; score: number }[];
}

export const DeliverabilityMetrics: React.FC<Props> = ({ score, recommendations, history = [] }) => {
  const chartData = {
    labels: history.map(h => h.date),
    datasets: [
      {
        label: 'Deliverability Score',
        data: history.map(h => h.score),
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.5)',
      }
    ]
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Deliverability Score</h3>
          <p className="text-sm text-gray-500">Based on domain reputation and authentication</p>
        </div>
        <div className={`text-4xl font-bold ${getScoreColor(score)}`}>
          {score}%
        </div>
      </div>

      {history.length > 0 && (
        <div className="h-48 mb-6">
          <Line
            data={chartData}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              scales: {
                y: {
                  beginAtZero: true,
                  max: 100
                }
              }
            }}
          />
        </div>
      )}

      {recommendations.length > 0 && (
        <div className="bg-blue-50 rounded-lg p-4">
          <h4 className="text-sm font-medium text-blue-800 mb-2">Recommendations</h4>
          <ul className="space-y-2">
            {recommendations.map((rec, index) => (
              <li key={index} className="flex items-start text-sm text-blue-700">
                <svg className="w-5 h-5 text-blue-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {rec}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};