// Keep existing imports and add:
import { useCredentials } from '../context/CredentialsContext';
import AWSCredentialsForm from '../components/AWSCredentialsForm';

export default function Home() {
  // Keep existing state declarations
  const { credentials, isVerified, clearCredentials } = useCredentials();
  const [credentialError, setCredentialError] = useState<string | null>(null);

  // Add credential handler
  const handleCredentialSubmit = async (creds: { accessKeyId: string; secretAccessKey: string; region: string }) => {
    try {
      const response = await fetch('/api/test-credentials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(creds),
      });

      const data = await response.json();
      if (!data.success) {
        setCredentialError(data.error || 'Failed to verify credentials');
      } else {
        setCredentialError(null);
      }
    } catch (err) {
      setCredentialError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  if (!credentials || !isVerified) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-8">
        <div className="max-w-lg mx-auto">
          <div className="bg-white rounded-xl shadow-sm p-6 space-y-6">
            <h1 className="text-2xl font-bold text-gray-900">AWS Credentials Required</h1>
            <p className="text-gray-600">Please enter your AWS credentials to use the email validator.</p>
            {credentialError && (
              <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded">
                <p className="text-red-700">{credentialError}</p>
              </div>
            )}
            <AWSCredentialsForm onCredentialsSubmit={handleCredentialSubmit} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Email Validator</title>
        <meta name="description" content="Validate emails effectively" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <header className="bg-white/30 backdrop-blur-sm border-b border-gray-200/50 sticky top-0 z-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex justify-between items-center">
              <h1 className="text-3xl font-bold text-gray-900">
                Email Validator
              </h1>
              <div className="flex items-center space-x-4">
                <button
                  onClick={clearCredentials}
                  className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900"
                >
                  Clear Credentials
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Rest of your existing JSX */}
        
      </div>
    </>
  );
}