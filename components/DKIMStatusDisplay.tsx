// components/DKIMStatusDisplay.tsx
import React from 'react';

interface Props {
  domains: string[];
  // Eğer domain başına daha fazla bilgi gerekiyorsa, ek prop'lar ekleyebilirsiniz.
}

export const DKIMStatusDisplay: React.FC<Props> = ({ domains }) => {
  return (
    <div className="space-y-6">
      {domains.map(domain => (
        <div key={domain} className="bg-white rounded-lg shadow-sm p-4 border border-gray-100">
          <div className="flex items-center justify-between">
            <h4 className="text-lg font-medium text-gray-900">{domain}</h4>
            <span
              className={`px-2 py-1 text-sm font-medium rounded-full ${
                /* Burada DKIM durumunu belirlemek için gerekli mantığı ekleyebilirsiniz */
                false /* Örnek: DKIM yapılandırılmamış */
                  ? 'bg-green-100 text-green-800'
                  : 'bg-yellow-100 text-yellow-800'
              }`}
            >
              DKIM Not Configured
            </span>
          </div>
          {/* DKIM kayıtları veya ek bilgiler burada gösterilebilir */}
        </div>
      ))}
    </div>
  );
};

export default DKIMStatusDisplay;
