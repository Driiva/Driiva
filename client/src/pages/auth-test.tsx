import { useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured, testSupabaseConnection } from '@/lib/supabase';
import { useLocation } from 'wouter';
import { ArrowLeft, CheckCircle, XCircle, Wifi, WifiOff, Database, User, Shield } from 'lucide-react';

interface TestResult {
  name: string;
  status: 'pending' | 'success' | 'error' | 'warning';
  message: string;
  details?: string;
}

export default function AuthTest() {
  const [, setLocation] = useLocation();
  const [status, setStatus] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<TestResult[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<'checking' | 'connected' | 'disconnected'>('checking');

  useEffect(() => {
    checkInitialConnection();
  }, []);

  const checkInitialConnection = async () => {
    setConnectionStatus('checking');
    const { connected } = await testSupabaseConnection();
    setConnectionStatus(connected ? 'connected' : 'disconnected');
  };

  const addStatus = (msg: string) => {
    setStatus(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);
    console.log(msg);
  };

  const updateResult = (name: string, status: TestResult['status'], message: string, details?: string) => {
    setResults(prev => {
      const existing = prev.findIndex(r => r.name === name);
      const result = { name, status, message, details };
      if (existing >= 0) {
        const updated = [...prev];
        updated[existing] = result;
        return updated;
      }
      return [...prev, result];
    });
  };

  const testSupabaseConnectionFull = async () => {
    setLoading(true);
    setStatus([]);
    setResults([]);
    
    try {
      // Test 1: Configuration Check
      addStatus('Checking Supabase configuration...');
      updateResult('Configuration', 'pending', 'Checking...');
      
      if (!isSupabaseConfigured) {
        updateResult('Configuration', 'error', 'Supabase not configured', 'Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY');
        addStatus('✗ Supabase not configured - check environment variables');
        return;
      }
      
      updateResult('Configuration', 'success', 'Environment variables loaded');
      addStatus('✓ Supabase configuration valid');
      
      // Test 2: Network Connectivity
      addStatus('Testing network connectivity...');
      updateResult('Network', 'pending', 'Testing connection...');
      
      const { connected, error: connError } = await testSupabaseConnection();
      
      if (!connected) {
        updateResult('Network', 'error', 'Cannot reach Supabase', connError || 'Connection failed');
        addStatus(`✗ Network test failed: ${connError || 'Unknown error'}`);
        setConnectionStatus('disconnected');
      } else {
        updateResult('Network', 'success', 'Connected to Supabase');
        addStatus('✓ Network connection successful');
        setConnectionStatus('connected');
      }
      
      // Test 3: Auth Service
      addStatus('Testing auth service...');
      updateResult('Auth Service', 'pending', 'Checking...');
      
      try {
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          updateResult('Auth Service', 'error', 'Auth service error', sessionError.message);
          addStatus(`✗ Auth service error: ${sessionError.message}`);
        } else {
          updateResult('Auth Service', 'success', sessionData.session ? 'Active session found' : 'Service available (no active session)');
          addStatus(`✓ Auth service responding${sessionData.session ? ' - session active' : ''}`);
        }
      } catch (authErr: any) {
        updateResult('Auth Service', 'error', 'Auth check failed', authErr.message);
        addStatus(`✗ Auth check error: ${authErr.message}`);
      }
      
      // Test 4: Database Connection (profiles table)
      addStatus('Testing database access...');
      updateResult('Database', 'pending', 'Checking profiles table...');
      
      try {
        const { data: profilesCheck, error: dbError } = await supabase
          .from('profiles')
          .select('id')
          .limit(1);
        
        if (dbError) {
          if (dbError.message.includes('permission') || dbError.code === '42501') {
            updateResult('Database', 'warning', 'RLS policies may restrict access', dbError.message);
            addStatus(`⚠ Database access restricted by RLS: ${dbError.message}`);
          } else if (dbError.message.includes('does not exist') || dbError.code === '42P01') {
            updateResult('Database', 'error', 'Profiles table not found', 'Run database migrations');
            addStatus(`✗ Profiles table missing: ${dbError.message}`);
          } else {
            updateResult('Database', 'error', 'Database error', dbError.message);
            addStatus(`✗ Database error: ${dbError.message}`);
          }
        } else {
          updateResult('Database', 'success', 'Profiles table accessible');
          addStatus('✓ Database connection successful');
        }
      } catch (dbErr: any) {
        updateResult('Database', 'error', 'Database check failed', dbErr.message);
        addStatus(`✗ Database check error: ${dbErr.message}`);
      }
      
      // Test 5: Test Signup (optional, creates test user)
      addStatus('Testing signup flow...');
      updateResult('Signup Flow', 'pending', 'Testing with dummy account...');
      
      const testEmail = `test-${Date.now()}@driiva.test`;
      const testPassword = 'TestPass123!';
      
      try {
        const { data: signupData, error: signupError } = await supabase.auth.signUp({
          email: testEmail,
          password: testPassword,
        });
        
        if (signupError) {
          if (signupError.message.includes('not allowed') || signupError.message.includes('disabled')) {
            updateResult('Signup Flow', 'warning', 'Signup may be disabled', signupError.message);
            addStatus(`⚠ Signup restriction: ${signupError.message}`);
          } else if (signupError.message.includes('Load failed') || signupError.message.includes('network')) {
            updateResult('Signup Flow', 'error', 'Network error during signup', signupError.message);
            addStatus(`✗ Signup network error: ${signupError.message}`);
          } else {
            updateResult('Signup Flow', 'error', 'Signup failed', signupError.message);
            addStatus(`✗ Signup failed: ${signupError.message}`);
          }
        } else if (signupData.user) {
          updateResult('Signup Flow', 'success', 'Signup working correctly');
          addStatus(`✓ Signup success! User ID: ${signupData.user.id}`);
          
          // Clean up - sign out test user
          await supabase.auth.signOut();
          addStatus('✓ Test user signed out');
        }
      } catch (signupErr: any) {
        updateResult('Signup Flow', 'error', 'Signup exception', signupErr.message);
        addStatus(`✗ Signup error: ${signupErr.message}`);
      }
      
      addStatus('--- Diagnostics complete ---');
      
    } catch (err: any) {
      addStatus(`✗ Unexpected error: ${err.message}`);
      updateResult('System', 'error', 'Unexpected error', err.message);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'success': return <CheckCircle className="w-5 h-5 text-green-400" />;
      case 'error': return <XCircle className="w-5 h-5 text-red-400" />;
      case 'warning': return <Shield className="w-5 h-5 text-yellow-400" />;
      default: return <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 p-4 sm:p-8">
      <div className="max-w-2xl mx-auto">
        <button
          onClick={() => setLocation('/signin')}
          className="flex items-center gap-2 text-white/70 hover:text-white mb-6 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Sign In
        </button>

        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-white">Supabase Diagnostics</h1>
          <div className="flex items-center gap-2">
            {connectionStatus === 'checking' ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : connectionStatus === 'connected' ? (
              <Wifi className="w-5 h-5 text-green-400" />
            ) : (
              <WifiOff className="w-5 h-5 text-red-400" />
            )}
            <span className={`text-sm ${connectionStatus === 'connected' ? 'text-green-400' : connectionStatus === 'disconnected' ? 'text-red-400' : 'text-white/60'}`}>
              {connectionStatus === 'checking' ? 'Checking...' : connectionStatus === 'connected' ? 'Connected' : 'Disconnected'}
            </span>
          </div>
        </div>
        
        <button
          onClick={testSupabaseConnectionFull}
          disabled={loading}
          className="px-6 py-3 bg-[#06B6D4] hover:bg-[#0891B2] text-white rounded-lg font-medium mb-6 disabled:opacity-50 transition-colors w-full sm:w-auto"
        >
          {loading ? 'Running Tests...' : 'Run Full Diagnostic'}
        </button>

        {results.length > 0 && (
          <div className="bg-gray-800/50 rounded-lg p-4 sm:p-6 mb-6">
            <h2 className="text-white font-bold mb-4 flex items-center gap-2">
              <Database className="w-5 h-5" />
              Test Results
            </h2>
            <div className="space-y-3">
              {results.map((result, i) => (
                <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-black/20">
                  {getStatusIcon(result.status)}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-white">{result.name}</span>
                      <span className={`text-sm ${
                        result.status === 'success' ? 'text-green-400' : 
                        result.status === 'error' ? 'text-red-400' : 
                        result.status === 'warning' ? 'text-yellow-400' :
                        'text-gray-400'
                      }`}>
                        {result.message}
                      </span>
                    </div>
                    {result.details && (
                      <p className="text-xs text-white/50 mt-1 break-words">{result.details}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        <div className="bg-gray-800/50 rounded-lg p-4 sm:p-6 font-mono text-sm">
          <h2 className="text-white font-bold mb-4 flex items-center gap-2">
            <User className="w-5 h-5" />
            Console Log
          </h2>
          {status.length === 0 ? (
            <p className="text-gray-400">Click "Run Full Diagnostic" to start tests</p>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {status.map((line, i) => (
                <div key={i} className={`text-xs sm:text-sm ${
                  line.includes('✓') ? 'text-green-400' : 
                  line.includes('✗') ? 'text-red-400' : 
                  line.includes('⚠') ? 'text-yellow-400' :
                  'text-gray-300'
                }`}>
                  {line}
                </div>
              ))}
            </div>
          )}
        </div>
        
        <div className="mt-6 bg-yellow-900/20 border border-yellow-500/30 rounded-lg p-4">
          <p className="text-yellow-400 text-sm">
            <strong>Common Issues:</strong><br/>
            <span className="text-yellow-400/80">
              • <strong>Network error / Load failed:</strong> Supabase project may be paused or unreachable<br/>
              • <strong>Permission denied:</strong> Row Level Security (RLS) policies need adjustment<br/>
              • <strong>Table not found:</strong> Run database migrations in Supabase dashboard<br/>
              • <strong>Invalid API key:</strong> Check VITE_SUPABASE_ANON_KEY in secrets
            </span>
          </p>
        </div>

        <div className="mt-4 bg-blue-900/20 border border-blue-500/30 rounded-lg p-4">
          <p className="text-blue-400 text-sm">
            <strong>Demo Mode Available:</strong><br/>
            <span className="text-blue-400/80">
              If Supabase is unavailable, use demo credentials: <code className="bg-black/30 px-2 py-0.5 rounded">driiva1 / driiva1</code>
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}
