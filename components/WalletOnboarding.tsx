import dataService from '../utils/dataService';
import { useState } from 'react';
import { ArrowLeft, Copy, Check, Eye, EyeOff, AlertTriangle } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Checkbox } from './ui/checkbox';
import { generateAllAddresses } from '../utils/addressGenerator';
import { copyToClipboard } from '../utils/clipboard';
import { supabase } from '../utils/supabaseClient';
import { saveWalletDataToDB } from '../utils/supabaseHelpers';

interface WalletOnboardingProps {
  onComplete: (walletData: any) => void;
  onBack: () => void;
  onImportAuth?: (existingWallet: any) => void;
  initialMode?: 'create' | 'import';
}

export default function WalletOnboarding({ onComplete, onBack, onImportAuth, initialMode = 'create' }: WalletOnboardingProps) {
  const [step, setStep] = useState(initialMode === 'import' ? 6 : 1);
  const [mode, setMode] = useState<'create' | 'import'>(initialMode);
  const [mnemonic, setMnemonic] = useState<string[]>([]);
  const [importMnemonic, setImportMnemonic] = useState('');
  const [confirmWords, setConfirmWords] = useState<{ [key: number]: string }>({});
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showMnemonic, setShowMnemonic] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [copiedMnemonic, setCopiedMnemonic] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  
  // Validation states
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');
  const [touched, setTouched] = useState({
    email: false,
    password: false,
    confirmPassword: false
  });

  // Generate mock mnemonic
  const generateMnemonic = () => {
    const words = [
      'abandon', 'ability', 'able', 'about', 'above', 'absent', 'absorb', 'abstract',
      'absurd', 'abuse', 'access', 'accident', 'account', 'accuse', 'achieve', 'acid',
      'acoustic', 'acquire', 'across', 'act', 'action', 'actor', 'actress', 'actual'
    ];
    const generated = Array(12).fill(0).map(() => words[Math.floor(Math.random() * words.length)]);
    setMnemonic(generated);
  };

  const handleModeSelect = (selectedMode: 'create' | 'import') => {
    setMode(selectedMode);
    if (selectedMode === 'create') {
      generateMnemonic();
      setStep(2);
    } else {
      setStep(6);
    }
  };

  const copyMnemonic = async () => {
    const success = await copyToClipboard(mnemonic.join(' '));
    if (success) {
      setCopiedMnemonic(true);
      setTimeout(() => setCopiedMnemonic(false), 2000);
    }
  };

  const verifyMnemonic = () => {
    const randomIndexes = [2, 5, 9]; // Verify words at positions 3, 6, 10
    const initialConfirm: { [key: number]: string } = {};
    randomIndexes.forEach(idx => initialConfirm[idx] = '');
    setConfirmWords(initialConfirm);
    setStep(3);
  };

  const checkMnemonicConfirmation = () => {
    const isValid = Object.entries(confirmWords).every(([idx, word]) => {
      return word.toLowerCase().trim() === mnemonic[parseInt(idx)];
    });
    
    if (isValid) {
      setStep(4);
    } else {
      alert('Incorrect words. Please try again.');
    }
  };

  // Validation functions
  const validateEmail = (value: string) => {
    if (!value) {
      return 'Email is required';
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      return 'Please enter a valid email address';
    }
    return '';
  };



  const validatePassword = (value: string) => {
    if (!value) {
      return 'Password is required';
    }
    if (value.length < 8) {
      return 'Password must be at least 8 characters';
    }
    if (!/[A-Z]/.test(value)) {
      return 'Password must contain at least one uppercase letter';
    }
    if (!/[a-z]/.test(value)) {
      return 'Password must contain at least one lowercase letter';
    }
    if (!/[0-9]/.test(value)) {
      return 'Password must contain at least one number';
    }
    return '';
  };

  const validateConfirmPassword = (value: string) => {
    if (!value) {
      return 'Please confirm your password';
    }
    if (value !== password) {
      return 'Passwords do not match';
    }
    return '';
  };

  const getPasswordStrength = (pwd: string) => {
    let strength = 0;
    if (pwd.length >= 8) strength++;
    if (pwd.length >= 12) strength++;
    if (/[a-z]/.test(pwd) && /[A-Z]/.test(pwd)) strength++;
    if (/[0-9]/.test(pwd)) strength++;
    if (/[^A-Za-z0-9]/.test(pwd)) strength++;
    return strength;
  };

  const getPasswordStrengthLabel = (strength: number) => {
    if (strength <= 1) return { label: 'Weak', color: 'bg-red-500' };
    if (strength <= 3) return { label: 'Fair', color: 'bg-yellow-500' };
    if (strength <= 4) return { label: 'Good', color: 'bg-blue-500' };
    return { label: 'Strong', color: 'bg-green-500' };
  };

  // Handle field changes with validation
  const handleEmailChange = (value: string) => {
    setEmail(value);
    if (touched.email) {
      setEmailError(validateEmail(value));
    }
  };

  const handlePasswordChange = (value: string) => {
    setPassword(value);
    if (touched.password) {
      setPasswordError(validatePassword(value));
    }
    if (touched.confirmPassword && confirmPassword) {
      setConfirmPasswordError(value !== confirmPassword ? 'Passwords do not match' : '');
    }
  };

  const handleConfirmPasswordChange = (value: string) => {
    setConfirmPassword(value);
    if (touched.confirmPassword) {
      setConfirmPasswordError(validateConfirmPassword(value));
    }
  };

  const handleUserInfoSubmit = () => {
    // Mark all fields as touched
    setTouched({
      email: true,
      password: true,
      confirmPassword: true
    });

    // Validate all fields
    const emailErr = validateEmail(email);
    const passwordErr = validatePassword(password);
    const confirmPasswordErr = validateConfirmPassword(confirmPassword);

    setEmailError(emailErr);
    setPasswordError(passwordErr);
    setConfirmPasswordError(confirmPasswordErr);

    // If any errors, don't proceed
    if (emailErr || passwordErr || confirmPasswordErr) {
      return;
    }
    
    setStep(5);
  };

  const handleImportWallet = async () => {
    const words = importMnemonic.trim().split(/\s+/);
    if (words.length !== 12) {
      alert('Please enter exactly 12 words');
      return;
    }
    
    const enteredMnemonic = words.join(' ');
    
    try {
      // Check database for user with this seed phrase
      const { data: userProfile, error: dbError } = await supabase
        .from('users')
        .select('*')
        .eq('seed_phrase', enteredMnemonic)
        .maybeSingle();

      if (dbError) throw dbError;

      if (userProfile) {
        // Construct walletData from userProfile
        const walletData = {
          id: userProfile.id,
          created_at: userProfile.created_at,
          email: userProfile.email || '',
          fullName: userProfile.full_name || userProfile.email.split('@')[0],
          mnemonic_encrypted: btoa(enteredMnemonic),
          password: btoa(userProfile.password_hash || ''), 
          addresses: userProfile.wallet_address || {},
          balances: userProfile.metadata?.balances || { BTC: '0', ETH: '0', SOL: '0', BNB: '0', USDT: '0.00' },
          transactions: userProfile.metadata?.transactions || [],
          twoFactorAuth: userProfile.metadata?.twoFactorAuth || { enabled: false },
          kyc_status: userProfile.metadata?.kyc_status || 'pending',
          blocked: userProfile.status === 'blocked',
          last_login: userProfile.last_login_at || new Date().toISOString()
        };

        // Wallet exists! Redirect to authentication
        if (onImportAuth) {
          onImportAuth(walletData);
        } else {
          alert('Wallet found! Please authenticate to access your wallet.');
        }
        return;
      }
    } catch (err: any) {
      console.error('Error looking up mnemonic in DB:', err);
    }
    
    // If no matching wallet found, ask to register a new one
    const confirmRegister = window.confirm(
      'No existing wallet found in the database with this recovery phrase.\n\n' +
      'Would you like to register a new account using this recovery phrase?'
    );

    if (confirmRegister) {
      setMnemonic(words);
      setStep(4); // Go to user info step
    }
  };

  const completeSetup = async () => {
    setIsRegistering(true);
    try {
      // 1. Sign up the user in Supabase
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: email,
        password: password,
        options: {
          data: {
            full_name: email.split('@')[0]
          }
        }
      });

      if (authError) {
        throw authError;
      }

      if (!authData.user) {
        throw new Error('Sign up failed: no user returned from database.');
      }

      const userId = authData.user.id;

      // 2. Generate valid-format addresses for all chains
      const walletData = {
        id: userId,
        created_at: new Date().toISOString(),
        email: email,
        fullName: email.split('@')[0], // Use email prefix as initial name
        mnemonic_encrypted: btoa(mnemonic.join(' ')), // Mock encryption
        password: btoa(password), // Store hashed password for authentication
        passwordLastChanged: new Date().toISOString(),
        addresses: generateAllAddresses(),
        balances: {
          BTC: '0',
          ETH: '0',
          SOL: '0',
          BNB: '0',
          USDT: '0.00'
        },
        transactions: [],
        twoFactorAuth: {
          enabled: false,
          preferredMethod: null,
          passcode: null,
          biometricEnabled: false,
          biometricData: null,
          setupDate: null
        },
        failedLoginAttempts: 0,
        accountLocked: false,
        kyc_status: 'pending', // New users start with pending KYC
        blocked: false,
        last_login: new Date().toISOString()
      };
      
      // 3. Save directly to database using saveWalletDataToDB
      await saveWalletDataToDB(walletData);

      // Save user data to admin's user list
      const existingUsers = JSON.parse(dataService.getItem('xbyte_admin_users') || '[]');
      const newUserForAdmin = {
        id: walletData.id,
        email: walletData.email,
        kyc_status: walletData.kyc_status,
        created_at: walletData.created_at,
        last_login: walletData.last_login,
        blocked: walletData.blocked,
        balances: walletData.balances,
        addresses: walletData.addresses,
        password: walletData.password,
        passwordLastChanged: walletData.passwordLastChanged,
        twoFactorAuth: walletData.twoFactorAuth
      };
      existingUsers.push(newUserForAdmin);
      dataService.setItem('xbyte_admin_users', JSON.stringify(existingUsers));
      
      onComplete(walletData);
    } catch (error: any) {
      console.error('Registration error:', error);
      alert(error.message || 'Failed to sign up with Supabase. Please try again.');
    } finally {
      setIsRegistering(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-white dark:bg-gray-800 rounded-3xl shadow-2xl p-8">
        {/* Header */}
        <div className="flex items-center mb-8">
          {step > 1 && (
            <button onClick={() => {
              // If on import screen (step 6), go back to mode selection (step 1) or landing
              if (step === 6 && mode === 'import') {
                if (initialMode === 'import') {
                  onBack();
                } else {
                  setStep(1);
                  setImportMnemonic(''); // Clear import data
                }
              } else {
                setStep(step - 1);
              }
            }} className="mr-4 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
              <ArrowLeft className="w-5 h-5 text-gray-700 dark:text-gray-300" />
            </button>
          )}
          {step === 1 && (
            <button onClick={onBack} className="mr-4 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
              <ArrowLeft className="w-5 h-5 text-gray-700 dark:text-gray-300" />
            </button>
          )}
          <div className="flex-1">
            <div className="flex gap-2 mb-2">
              {[1, 2, 3, 4, 5].map((s) => (
                <div
                  key={s}
                  className={`h-2 flex-1 rounded-full ${
                    s <= step ? 'bg-purple-600' : 'bg-gray-200 dark:bg-gray-700'
                  }`}
                />
              ))}
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Step {step} of 5</p>
          </div>
        </div>

        {/* Step 1: Welcome */}
        {step === 1 && (
          <div className="text-center">
            <h1 className="text-3xl mb-4 text-gray-900 dark:text-white">Welcome to Xbyte</h1>
            <p className="text-gray-600 dark:text-gray-300 mb-8">
              Let's get you started with your multi-chain wallet
            </p>
            <div className="space-y-4">
              <Button
                size="lg"
                className="w-full py-6 text-lg"
                onClick={() => handleModeSelect('create')}
              >
                Create New Wallet
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="w-full py-6 text-lg"
                onClick={() => handleModeSelect('import')}
              >
                Import Existing Wallet
              </Button>
            </div>
          </div>
        )}

        {/* Step 2: Show Mnemonic */}
        {step === 2 && mode === 'create' && (
          <div>
            <h2 className="text-2xl mb-4 text-gray-900 dark:text-white">Your Secret Recovery Phrase</h2>
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mb-6 flex gap-3">
              <AlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-500 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-yellow-800 dark:text-yellow-200">
                <p className="mb-2">Write down these 12 words in order and store them safely.</p>
                <p>Never share your recovery phrase. Anyone with these words can access your funds.</p>
              </div>
            </div>

            <div className="relative mb-6">
              <div className={`grid grid-cols-3 gap-4 ${!showMnemonic ? 'blur-sm' : ''}`}>
                {mnemonic.map((word, idx) => (
                  <div key={idx} className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <span className="text-gray-500 dark:text-gray-400 text-sm">{idx + 1}.</span>
                    <span className="text-gray-900 dark:text-white">{word}</span>
                  </div>
                ))}
              </div>
              {!showMnemonic && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <Button onClick={() => setShowMnemonic(true)} variant="default">
                    <Eye className="w-4 h-4 mr-2" />
                    Reveal Words
                  </Button>
                </div>
              )}
            </div>

            <div className="space-y-4">
              <Button
                variant="outline"
                className="w-full"
                onClick={copyMnemonic}
                disabled={!showMnemonic}
              >
                {copiedMnemonic ? (
                  <>
                    <Check className="w-4 h-4 mr-2" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 mr-2" />
                    Copy to Clipboard
                  </>
                )}
              </Button>

              <div className="flex items-start gap-3">
                <Checkbox
                  id="saved"
                  checked={agreedToTerms}
                  onCheckedChange={(checked) => setAgreedToTerms(checked as boolean)}
                />
                <label htmlFor="saved" className="text-sm text-gray-600 dark:text-gray-300 cursor-pointer">
                  I have written down my recovery phrase and stored it in a safe place
                </label>
              </div>

              <Button
                size="lg"
                className="w-full"
                onClick={verifyMnemonic}
                disabled={!agreedToTerms || !showMnemonic}
              >
                Continue
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Verify Mnemonic */}
        {step === 3 && (
          <div>
            <h2 className="text-2xl mb-4 text-gray-900 dark:text-white">Verify Your Recovery Phrase</h2>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              Please enter the following words from your recovery phrase to confirm you saved it correctly.
            </p>

            <div className="space-y-4 mb-6">
              {Object.keys(confirmWords).map((idx) => (
                <div key={idx}>
                  <label className="block text-sm mb-2 text-gray-700 dark:text-gray-300">
                    Word #{parseInt(idx) + 1}
                  </label>
                  <Input
                    placeholder="Enter word"
                    value={confirmWords[parseInt(idx)]}
                    onChange={(e) => setConfirmWords({ ...confirmWords, [parseInt(idx)]: e.target.value })}
                  />
                </div>
              ))}
            </div>

            <Button size="lg" className="w-full" onClick={checkMnemonicConfirmation}>
              Verify
            </Button>
          </div>
        )}

        {/* Step 4: User Information */}
        {step === 4 && (
          <div>
            <h2 className="text-2xl mb-4 text-gray-900 dark:text-white">User Information</h2>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              Enter your details to secure and recover your wallet
            </p>

            <div className="space-y-4 mb-6">
              {/* Email Field */}
              <div>
                <label className="block text-sm mb-2 text-gray-700 dark:text-gray-300">
                  Email Address <span className="text-red-500">*</span>
                </label>
                <Input
                  type="email"
                  placeholder="user@example.com"
                  value={email}
                  onChange={(e) => handleEmailChange(e.target.value)}
                  onBlur={() => setTouched({ ...touched, email: true })}
                  className={emailError && touched.email ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}
                />
                {emailError && touched.email && (
                  <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" />
                    {emailError}
                  </p>
                )}
              </div>

              {/* Password Field */}
              <div>
                <label className="block text-sm mb-2 text-gray-700 dark:text-gray-300">
                  Password <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Minimum 8 characters"
                    value={password}
                    onChange={(e) => handlePasswordChange(e.target.value)}
                    onBlur={() => setTouched({ ...touched, password: true })}
                    className={passwordError && touched.password ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                
                {/* Password Strength Indicator */}
                {password && (
                  <div className="mt-2">
                    <div className="flex gap-1 mb-1">
                      {[1, 2, 3, 4, 5].map((level) => {
                        const strength = getPasswordStrength(password);
                        const { color } = getPasswordStrengthLabel(strength);
                        return (
                          <div
                            key={level}
                            className={`h-1 flex-1 rounded-full ${
                              level <= strength ? color : 'bg-gray-300 dark:bg-gray-600'
                            }`}
                          />
                        );
                      })}
                    </div>
                    <p className={`text-xs ${passwordError && touched.password ? 'text-red-500' : 'text-gray-500 dark:text-gray-400'}`}>
                      {passwordError && touched.password ? (
                        <span className="flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" />
                          {passwordError}
                        </span>
                      ) : (
                        <span>Strength: {getPasswordStrengthLabel(getPasswordStrength(password)).label}</span>
                      )}
                    </p>
                  </div>
                )}
                
                {!password && (
                  <p className="text-gray-500 dark:text-gray-400 text-xs mt-1">
                    Must contain uppercase, lowercase, and number
                  </p>
                )}
              </div>

              {/* Confirm Password Field */}
              <div>
                <label className="block text-sm mb-2 text-gray-700 dark:text-gray-300">
                  Confirm Password <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Input
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="Re-enter password"
                    value={confirmPassword}
                    onChange={(e) => handleConfirmPasswordChange(e.target.value)}
                    onBlur={() => setTouched({ ...touched, confirmPassword: true })}
                    className={confirmPasswordError && touched.confirmPassword ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  >
                    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {confirmPasswordError && touched.confirmPassword && (
                  <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" />
                    {confirmPasswordError}
                  </p>
                )}
                {confirmPassword && !confirmPasswordError && touched.confirmPassword && (
                  <p className="text-green-500 text-sm mt-1 flex items-center gap-1">
                    <Check className="w-3 h-3" />
                    Passwords match
                  </p>
                )}
              </div>
            </div>

            <Button
              size="lg"
              className="w-full"
              onClick={handleUserInfoSubmit}
              disabled={
                !email || 
                !password || 
                !confirmPassword ||
                (touched.email && !!emailError) ||
                (touched.password && !!passwordError) ||
                (touched.confirmPassword && !!confirmPasswordError)
              }
            >
              Continue
            </Button>
          </div>
        )}

        {/* Step 5: Success */}
        {step === 5 && (
          <div className="text-center">
            <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
              <Check className="w-10 h-10 text-green-600 dark:text-green-400" />
            </div>
            <h2 className="text-3xl mb-4 text-gray-900 dark:text-white">Wallet Created!</h2>
            <p className="text-gray-600 dark:text-gray-300 mb-8">
              Your multi-chain wallet has been created successfully. 
              You can now manage BTC, ETH, SOL, BNB, and USDT from one place.
            </p>
            <Button size="lg" className="w-full" onClick={completeSetup} disabled={isRegistering}>
              {isRegistering ? 'Registering Account...' : 'Open Wallet'}
            </Button>
          </div>
        )}

        {/* Step 6: Import Wallet */}
        {step === 6 && mode === 'import' && (
          <div>
            <h2 className="text-2xl mb-4 text-gray-900 dark:text-white">Import Wallet</h2>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              Enter your 12-word recovery phrase to restore your wallet
            </p>

            <div className="mb-6">
              <textarea
                className="w-full p-4 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white min-h-[120px]"
                placeholder="word1 word2 word3 ..."
                value={importMnemonic}
                onChange={(e) => setImportMnemonic(e.target.value)}
              />
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                Separate each word with a space
              </p>
            </div>

            <Button
              size="lg"
              className="w-full"
              onClick={handleImportWallet}
              disabled={importMnemonic.trim().split(/\s+/).length !== 12}
            >
              Import Wallet
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}