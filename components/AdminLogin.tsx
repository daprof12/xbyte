import { useState } from 'react';
import { ArrowLeft, Shield, Eye, EyeOff } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import Logo from './Logo';
import { storage } from '../utils/platform';
import { supabase } from '../utils/supabaseClient';

interface AdminLoginProps {
  onLogin: () => void;
  onBack: () => void;
  onLogoClick?: () => void;
}

export default function AdminLogin({ onLogin, onBack, onLogoClick }: AdminLoginProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Authenticate via Supabase Auth so auth.uid() is populated
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email: email,
        password: password
      });

      if (authError) {
        console.warn('Auth failed:', authError.message);
        throw authError;
      }

      // Verify admin status
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('is_admin, full_name, email, role, admin_permissions')
        .eq('id', data.user.id)
        .single();

      if (userError || !userData?.is_admin) {
        await supabase.auth.signOut();
        throw new Error('Access Denied: Admin privileges required');
      }

      await storage.set('xbyte_admin_session', {
        email: email,
        loginTime: new Date().toISOString(),
        sessionId: 'sess_' + Math.random().toString(36).substring(7),
        role: userData.role || 'admin',
        admin_permissions: userData.admin_permissions || { allowed_tabs: [], allowed_user_ids: [] },
        user: {
          id: data.user.id,
          email: userData.email,
          full_name: userData.full_name
        }
      });
      onLogin();

    } catch (err: any) {
      setError(err.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black flex items-center justify-center p-4">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-black/10 backdrop-blur-3xl"></div>
      
      <div className="relative w-full max-w-md">
        {/* Back Button */}
        <button 
          onClick={onBack}
          className="absolute -top-16 left-0 flex items-center gap-2 text-white hover:text-white/80 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Home
        </button>

        {/* Login Card */}
        <div className="bg-gray-900/50 backdrop-blur-xl rounded-3xl p-8 border border-gray-800 shadow-2xl">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <Logo 
                size="lg" 
                showText={false} 
                className="justify-center"
                onClick={onLogoClick}
              />
            </div>
            <h1 className="text-3xl text-white mb-2">Admin Portal</h1>
            <p className="text-gray-400">Sign in to manage Xbyte Wallet</p>
            <Badge variant="secondary" className="mt-3">Restricted Access</Badge>
          </div>

          {/* Login Form */}
          <form onSubmit={handleLogin} className="space-y-5">
            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
                <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
              </div>
            )}

            <div>
              <label className="block text-sm mb-2 text-gray-300">
                Admin Email
              </label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin3@pluto.com"
                required
                className="bg-gray-800/50 border-gray-700 text-white placeholder:text-gray-500 h-12 rounded-xl focus:border-gray-500 focus:ring-gray-500"
              />
            </div>

            <div>
              <label className="block text-sm mb-2 text-gray-300">
                Password
              </label>
              <div className="relative">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                  className="bg-gray-800/50 border-gray-700 text-white placeholder:text-gray-500 h-12 pr-12 rounded-xl focus:border-gray-500 focus:ring-gray-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-gray-500 hover:text-gray-300"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              size="lg"
              className="w-full h-12 bg-gradient-to-r from-gray-700 to-gray-600 hover:from-gray-600 hover:to-gray-500 text-white rounded-xl text-md font-semibold"
              disabled={loading}
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>

          {/* Demo Credentials */}
          <div className="hidden mt-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <p className="text-xs text-blue-800 dark:text-blue-200">
              <strong>Demo Credentials:</strong><br />
              Email: admin3@pluto.com<br />
              Password: password123
            </p>
          </div>

          {/* Security Notice */}
          <div className="mt-6 text-center">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              All admin actions are logged and monitored. Unauthorized access attempts will be reported.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-6">
          <p className="text-sm text-white/80">
            © 2025 Xbyte Multi-Chain Wallet. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}