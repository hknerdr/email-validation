// components/LoadingState.tsx
import React from 'react';

const LoadingState: React.FC = () => (
  <div className="flex items-center justify-center p-8">
    <div className="relative">
      <div className="h-24 w-24">
        <div className="absolute h-16 w-16 animate-ping rounded-full bg-blue-400 opacity-75"></div>
        <div className="relative flex h-16 w-16 items-center justify-center rounded-full bg-blue-500">
          <svg className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z" />
          </svg>
        </div>
      </div>
      <div className="mt-4 text-center text-sm font-medium text-gray-500">
        Processing...
      </div>
    </div>
  </div>
);

export default LoadingState;