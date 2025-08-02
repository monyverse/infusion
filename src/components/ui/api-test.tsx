import React, { useState } from 'react';
import { getBackendUrl } from '@/lib/config';

interface ApiTestProps {
  className?: string;
}

export const ApiTest: React.FC<ApiTestProps> = ({ className = '' }) => {
  const [url, setUrl] = useState('https://api.1inch.dev/fusion/orders/v1.0/1/order/active');
  const [response, setResponse] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const testProxy = async () => {
    setLoading(true);
    setError(null);
    setResponse(null);

    try {
      const response = await fetch(`${getBackendUrl()}/?url=${encodeURIComponent(url)}`);
      const data = await response.json();
      
      if (data.success) {
        setResponse(data);
      } else {
        setError(data.error || 'Request failed');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Network error');
    } finally {
      setLoading(false);
    }
  };

  const testHealth = async () => {
    setLoading(true);
    setError(null);
    setResponse(null);

    try {
      const response = await fetch(`${getBackendUrl()}/api/health`);
      const data = await response.json();
      setResponse(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Network error');
    } finally {
      setLoading(false);
    }
  };

  const testAiIntent = async () => {
    setLoading(true);
    setError(null);
    setResponse(null);

    try {
      const response = await fetch(`${getBackendUrl()}/api/ai/process-intent`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          intent: 'Test AI intent processing',
          context: {}
        }),
      });
      const data = await response.json();
      setResponse(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Network error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`bg-white rounded-xl shadow-lg border border-gray-200 p-6 ${className}`}>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">API Test Interface</h2>
      
      {/* URL Input */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Test URL (1inch API):
        </label>
        <div className="flex space-x-2">
          <input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="https://api.1inch.dev/..."
          />
          <button
            onClick={testProxy}
            disabled={loading || !url}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Testing...' : 'Test Proxy'}
          </button>
        </div>
      </div>

      {/* Quick Test Buttons */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">Quick Tests:</h3>
        <div className="flex space-x-2">
          <button
            onClick={testHealth}
            disabled={loading}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
          >
            Health Check
          </button>
          <button
            onClick={testAiIntent}
            disabled={loading}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
          >
            AI Intent
          </button>
        </div>
      </div>

      {/* Response Display */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <h4 className="text-lg font-semibold text-red-900 mb-2">Error:</h4>
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {response && (
        <div className="mb-6">
          <h4 className="text-lg font-semibold text-gray-900 mb-2">Response:</h4>
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <pre className="text-sm text-gray-700 overflow-x-auto">
              {JSON.stringify(response, null, 2)}
            </pre>
          </div>
        </div>
      )}

      {/* Example URLs */}
      <div className="mt-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">Example 1inch API URLs:</h3>
        <div className="space-y-2 text-sm text-gray-600">
          <div>
            <strong>Active Orders:</strong> https://api.1inch.dev/fusion/orders/v1.0/1/order/active
          </div>
          <div>
            <strong>Order History:</strong> https://api.1inch.dev/fusion/orders/v1.0/1/order/history
          </div>
          <div>
            <strong>Order Details:</strong> https://api.1inch.dev/fusion/orders/v1.0/1/order/0x1234...
          </div>
          <div>
            <strong>Supported Tokens:</strong> https://api.1inch.dev/swap/v6.0/1/tokens
          </div>
        </div>
      </div>
    </div>
  );
}; 