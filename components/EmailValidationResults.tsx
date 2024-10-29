// components/EmailValidationResults.tsx
import React from 'react';
import { DomainVerificationStatus } from './DomainVerificationStatus';
import { DeliverabilityMetrics } from './DeliverabilityMetrics';
import type { SESValidationResult, ValidationStatistics } from '../utils/types';

interface Props {
  results: SESValidationResult[];
  stats: ValidationStatistics;
}

const EmailValidationResults: React.FC<Props> = ({ results, stats }) => {
  const domains = Array.from(new Set(results.map(r => r.email.split('@')[1])));

  return (
    <div className="space-y-6">
      {/* Genel İstatistik Kartları */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-sm font-medium text-gray-500">Toplam İşlenen</h3>
          <p className="text-3xl font-bold text-gray-900 mt-2">{stats.total}</p>
        </div>
        
        <div className="bg-green-50 rounded-xl shadow-sm p-6">
          <h3 className="text-sm font-medium text-green-600">Doğrulandı</h3>
          <p className="text-3xl font-bold text-green-700 mt-2">{stats.verified}</p>
        </div>
        
        <div className="bg-red-50 rounded-xl shadow-sm p-6">
          <h3 className="text-sm font-medium text-red-600">Başarısız</h3>
          <p className="text-3xl font-bold text-red-700 mt-2">{stats.failed}</p>
        </div>
        
        <div className="bg-yellow-50 rounded-xl shadow-sm p-6">
          <h3 className="text-sm font-medium text-yellow-600">Domainler</h3>
          <p className="text-3xl font-bold text-yellow-700 mt-2">{stats.domains.total}</p>
          <p className="text-sm text-yellow-600 mt-1">
            {stats.domains.verified} doğrulandı
          </p>
        </div>
      </div>

      {/* Domain Durumları */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h3 className="text-lg font-semibold mb-4">Domain Doğrulama Durumu</h3>
        <div className="space-y-4">
          {domains.map(domain => (
            <DomainVerificationStatus
              key={domain}
              domain={domain}
              results={results.filter(r => r.email.endsWith(`@${domain}`))}
            />
          ))}
        </div>
      </div>

      {/* Deliverability Skoru */}
      {stats.deliverability && (
        <DeliverabilityMetrics 
          score={stats.deliverability.score}
          recommendations={stats.deliverability.recommendations}
        />
      )}

      {/* Detaylı Sonuçlar Tablosu */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  E-posta
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Durum
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  MX Kayıtları
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  SMTP Doğrulama
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Detaylar
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {results.map((result, index) => (
                <tr key={index}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {result.email}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        result.is_valid
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                      aria-label={`Doğrulama durumu: ${result.is_valid ? 'Geçerli' : 'Geçersiz'}`}
                    >
                      {result.is_valid ? 'Geçerli' : 'Geçersiz'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {result.details.domain_status.has_mx_records ? (
                      <span className="text-green-600" aria-label="MX Kayıtları Mevcut">✓</span>
                    ) : (
                      <span className="text-red-600" aria-label="MX Kayıtları Eksik">✗</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {result.details.recipient_accepted ? (
                      <span className="text-green-600" aria-label="SMTP Doğrulama Başarılı">✓</span>
                    ) : (
                      <span className="text-red-600" aria-label="SMTP Doğrulama Başarısız">✗</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {result.reason || 'Sorun bulunmadı'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Export Butonu */}
      <div className="flex justify-end">
        <button
          onClick={() => {
            const csv = [
              ['E-posta', 'Durum', 'MX Kayıtları', 'SMTP Doğrulama', 'Detaylar'],
              ...results.map(r => [
                r.email,
                r.is_valid ? 'Geçerli' : 'Geçersiz',
                r.details.domain_status.has_mx_records ? '✓' : '✗',
                r.details.recipient_accepted ? '✓' : '✗',
                r.reason || 'Sorun bulunmadı'
              ])
            ].map(row => row.join(',')).join('\n');

            const blob = new Blob([csv], { type: 'text/csv' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.setAttribute('hidden', '');
            a.setAttribute('href', url);
            a.setAttribute('download', 'doğrulama-sonuçları.csv');
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
          }}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Sonuçları Dışa Aktar
        </button>
      </div>
    </div>
  );
};

export default EmailValidationResults;
