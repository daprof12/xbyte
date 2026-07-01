import { useState } from 'react';
import { ArrowLeft, Eye, EyeOff, Lock, Mail } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import Logo from './Logo';
import { storage } from '../utils/platform';
import { supabase } from '../utils/supabaseClient';
import { fetchUserWalletFromDB } from '../utils/supabaseHelpers';

interface UserLoginProps {
  onLoginSuccess: (walletData: any) => void;
  onBack: () => void;
  onGoToSignup: () => void;
  onLogoClick?: () => void;
}

export default function UserLogin({ onLoginSuccess, onBack, onGoToSignup, onLogoClick }: UserLoginProps) {
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
      // 1. Authenticate with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (authError) {
        throw authError;
      }

      if (!authData.user) {
        throw new Error('No user returned from authentication.');
      }

      // 2. Fetch complete wallet details from database
      const walletData = await fetchUserWalletFromDB(authData.user.id);

      // 3. Save to local storage for fast cached load
      await storage.set('xbyte_wallet', walletData);
      sessionStorage.setItem('xbyte_session_active', 'true');

      // 4. Trigger callback
      onLoginSuccess(walletData);
    } catch (err: any) {
      console.error('User login error:', err);
      setError(err.message || 'Invalid email or password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 opacity-30 pointer-events-none">
        <div className="absolute top-0 left-0 w-96 h-96 bg-gray-800 rounded-full filter blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-gray-700 rounded-full filter blur-3xl animate-pulse delay-1000"></div>
      </div>

      <div className="relative z-10 w-full max-w-md">
        {/* Back Button */}
        <button 
          onClick={onBack}
          className="absolute -top-16 left-0 flex items-center gap-2 text-white/80 hover:text-white transition-colors"
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
                size="md" 
                showText={false} 
                className="justify-center"
                onClick={onLogoClick}
              />
            </div>
            <h1 className="text-3xl text-white mb-2">Access Wallet</h1>
            <p className="text-gray-400">Log in to sync your multi-chain assets</p>
          </div>

          {/* Login Form */}
          <form onSubmit={handleLogin} className="space-y-5">
            {error && (
              <div className="bg-red-900/20 border border-red-800 rounded-xl p-4">
                <p className="text-sm text-red-200 text-center">{error}</p>
              </div>
            )}

            <div>
              <label className="block text-sm mb-2 text-gray-300">
                Email Address
              </label>
              <div className="relative">
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  required
                  className="bg-gray-800/50 border-gray-700 text-white placeholder:text-gray-500 pl-11 h-12 rounded-xl focus:border-gray-500 focus:ring-gray-500"
                />
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
              </div>
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
                  className="bg-gray-800/50 border-gray-700 text-white placeholder:text-gray-500 pl-11 pr-12 h-12 rounded-xl focus:border-gray-500 focus:ring-gray-500"
                />
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
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
              {loading ? 'Logging in...' : 'Sign In'}
            </Button>
          </form>

          {/* Navigation to Signup */}
          <div className="mt-8 pt-6 border-t border-gray-800 text-center">
            <p className="text-gray-400 text-sm">
              Don't have a wallet yet?{' '}
              <button
                onClick={onGoToSignup}
                className="text-white hover:text-gray-300 font-semibold transition-colors"
              >
                Create new wallet
              </button>
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-6">
          <p className="text-xs text-gray-500">
            © 2026 Xbyte Multi-Chain Wallet. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}
