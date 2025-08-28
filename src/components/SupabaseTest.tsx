import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export default function SupabaseTest() {
  const [status, setStatus] = useState<'loading' | 'connected' | 'error'>('loading');
  const [error, setError] = useState<string>('');

  useEffect(() => {
    async function testConnection() {
      try {
        // Test the connection by making a simple query
        const { error } = await supabase
          .from('user_profiles')
          .select('count')
          .limit(1);

        if (error) {
          console.error('Supabase connection error:', error);
          setError(error.message);
          setStatus('error');
        } else {
          console.log('Supabase connected successfully!');
          setStatus('connected');
        }
      } catch (err) {
        console.error('Connection test failed:', err);
        setError('Failed to connect to Supabase');
        setStatus('error');
      }
    }

    testConnection();
  }, []);

  return (
    <div className="p-4 border rounded-lg">
      <h3 className="text-lg font-semibold mb-2">Supabase Connection Status</h3>
      {status === 'loading' && (
        <div className="text-blue-600">Testing connection...</div>
      )}
      {status === 'connected' && (
        <div className="text-green-600">✅ Connected to Supabase successfully!</div>
      )}
      {status === 'error' && (
        <div className="text-red-600">
          ❌ Connection failed: {error}
          <div className="text-sm mt-2">
            Make sure you have set up your .env file with VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY
          </div>
        </div>
      )}
    </div>
  );
} 