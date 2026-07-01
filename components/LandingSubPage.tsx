import { useState, useEffect, useRef } from 'react';
import { 
  Moon, Sun, Menu, X, ChevronDown, LogOut, Search, 
  Copy, Check, Layers, CheckCircle, Activity 
} from 'lucide-react';
import Logo from './Logo';
import { Button } from './ui/button';
import { Input } from './ui/input';

interface LandingSubPageProps {
  pageId: string;
  onPageChange: (pageId: string) => void;
  onBack: () => void;
  darkMode: boolean;
  onToggleDarkMode: () => void;
  onGetStarted: () => void;
  onAccessWallet: () => void;
  onImportWallet: () => void;
  onAdminAccess: () => void;
  isLoggedIn: boolean;
  userEmail: string;
  onViewWallet: () => void;
  onLogout: () => void;
}

export default function LandingSubPage({
  pageId,
  onPageChange,
  onBack,
  darkMode,
  onToggleDarkMode,
  onGetStarted,
  onAccessWallet,
  onImportWallet,
  onAdminAccess,
  isLoggedIn,
  userEmail,
  onViewWallet,
  onLogout
}: LandingSubPageProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };
    if (showDropdown) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showDropdown]);

  const getUserInitials = (email: string) => {
    if (!email) return 'U';
    return email.split('@')[0].substring(0, 2).toUpperCase();
  };

  // Shared theme styles matching LandingPage
  const bg = darkMode ? 'bg-[#0c0c0e]' : 'bg-white';
  const borderCol = darkMode ? 'border-[#27272a]' : 'border-[#e5e5e7]';
  const textPrimary = darkMode ? 'text-white' : 'text-[#18181b]';
  const textSecondary = darkMode ? 'text-[#a1a1aa]' : 'text-[#71717a]';
  const textTertiary = darkMode ? 'text-[#52525b]' : 'text-[#a1a1aa]';
  const btnPrimary = darkMode ? 'bg-white text-black hover:bg-gray-200' : 'bg-[#18181b] text-white hover:bg-black';
  const hoverTextPrimary = darkMode ? 'hover:text-white' : 'hover:text-black';

  const navLinks = [
    { label: 'Wallet', id: 'wallet-nav' },
    { label: 'P2P', id: 'p2p' },
    { label: 'Market Cap', id: 'market' },
    { label: 'Explorer', id: 'explorer' },
    { label: 'API', id: 'api' },
    { label: 'Blog', id: 'blog' }
  ];

  const handleNavClick = (id: string) => {
    setMobileMenuOpen(false);
    if (id === 'wallet-nav') {
      if (isLoggedIn) onViewWallet();
      else onAccessWallet();
    } else {
      onPageChange(id);
    }
  };

  return (
    <div className={`min-h-screen ${bg} ${textPrimary} transition-colors duration-300 font-sans ${darkMode ? 'dark' : ''}`}
      style={{ fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>

      {/* ====== HEADER ====== */}
      <header className={`sticky top-0 z-50 ${darkMode ? 'bg-[#0c0c0e]/90' : 'bg-white/90'} backdrop-blur-xl border-b ${borderCol}`}>
        <div className="max-w-[1440px] mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              className="lg:hidden p-1.5"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>

            <Logo
              size="sm"
              showText={true}
              variant={darkMode ? 'default' : 'gradient-text'}
              textClassName={darkMode ? 'text-white text-xl font-bold' : 'text-xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent'}
              onClick={onBack}
            />

            <nav className="hidden lg:flex items-center ml-6 gap-1">
              {navLinks.map((link) => (
                <button
                  key={link.label}
                  onClick={() => handleNavClick(link.id)}
                  className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-colors ${pageId === link.id ? (darkMode ? 'text-white bg-white/10' : 'text-black bg-black/5') : textSecondary} ${darkMode ? 'hover:text-white hover:bg-white/5' : 'hover:text-[#18181b] hover:bg-black/5'}`}
                >
                  {link.label}
                </button>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onToggleDarkMode}
              className={`p-2.5 rounded-xl transition-colors ${darkMode ? 'hover:bg-white/10' : 'hover:bg-black/5'}`}
              aria-label="Toggle dark mode"
            >
              {darkMode ? <Sun className="w-[18px] h-[18px] text-[#a1a1aa]" /> : <Moon className="w-[18px] h-[18px] text-[#71717a]" />}
            </button>

            {isLoggedIn ? (
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setShowDropdown(!showDropdown)}
                  className={`flex items-center gap-2 h-10 px-3 rounded-xl transition-all border ${darkMode ? 'border-[#27272a] hover:border-[#3f3f46]' : 'border-[#e5e5e7] hover:border-[#d4d4d8]'}`}
                >
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-white text-xs font-semibold">
                    {getUserInitials(userEmail)}
                  </div>
                  <ChevronDown className={`w-4 h-4 ${textSecondary} transition-transform ${showDropdown ? 'rotate-180' : ''}`} />
                </button>

                {showDropdown && (
                  <div className={`absolute right-0 mt-2 w-60 rounded-2xl shadow-2xl border overflow-hidden z-50 ${darkMode ? 'bg-[#18181b] border-[#27272a]' : 'bg-white border-[#e5e5e7]'}`}>
                    <div className={`px-4 py-3.5 border-b ${borderCol}`}>
                      <div className={`text-sm font-semibold ${textPrimary} truncate`}>{userEmail}</div>
                      <div className={`text-xs ${textSecondary} mt-0.5`}>Active Wallet</div>
                    </div>
                    <div className="py-1.5">
                      <button
                        onClick={() => { setShowDropdown(false); onViewWallet(); }}
                        className={`w-full px-4 py-2.5 text-left text-sm transition-colors ${darkMode ? 'hover:bg-white/5' : 'hover:bg-black/5'}`}
                      >
                        View Wallet
                      </button>
                      <button
                        onClick={() => { setShowDropdown(false); onLogout(); }}
                        className="w-full px-4 py-2.5 text-left text-sm text-red-500 hover:bg-red-500/10 transition-colors flex items-center gap-2"
                      >
                        <LogOut className="w-4 h-4" /> Log Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={onAccessWallet}
                  className={`hidden sm:flex h-10 px-5 rounded-xl text-sm font-semibold items-center transition-colors ${darkMode ? 'text-white hover:bg-white/10' : 'text-[#18181b] hover:bg-black/5'}`}
                >
                  Log in
                </button>
                <button
                  onClick={onGetStarted}
                  className={`h-10 px-5 rounded-xl text-sm font-semibold ${btnPrimary} transition-colors`}
                >
                  Sign up
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className={`lg:hidden border-t ${borderCol} ${darkMode ? 'bg-[#0c0c0e]' : 'bg-white'}`}>
            <div className="px-6 py-4 flex flex-col gap-1">
              {navLinks.map((link) => (
                <button
                  key={link.label}
                  onClick={() => handleNavClick(link.id)}
                  className={`w-full text-left px-4 py-3 rounded-xl text-sm font-medium transition-colors ${pageId === link.id ? (darkMode ? 'bg-white/5 text-white' : 'bg-black/5 text-black') : textSecondary} ${darkMode ? 'hover:bg-white/5' : 'hover:bg-black/5'}`}
                >
                  {link.label}
                </button>
              ))}
              <div className="flex gap-2 mt-4 pt-4 border-t border-dashed" style={{ borderColor: darkMode ? '#27272a' : '#e5e5e7' }}>
                <button onClick={onGetStarted} className={`flex-1 h-10 rounded-xl text-sm font-semibold ${btnPrimary}`}>Create Wallet</button>
                <button onClick={onImportWallet} className={`flex-1 h-10 rounded-xl text-sm font-semibold border ${borderCol}`}>Import Wallet</button>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* ====== SUBPAGE CONTENT ROUTING ====== */}
      <main className="min-h-[calc(100vh-16rem)]">
        {pageId === 'p2p' && <P2PPage darkMode={darkMode} onGetStarted={onGetStarted} />}
        {pageId === 'market' && <MarketCapPage darkMode={darkMode} onGetStarted={onGetStarted} />}
        {pageId === 'explorer' && <ExplorerPage darkMode={darkMode} />}
        {pageId === 'api' && <ApiDocsPage darkMode={darkMode} />}
        {pageId === 'blog' && <BlogPage darkMode={darkMode} />}
        {pageId === 'cards' && <CryptoCardsPage darkMode={darkMode} onGetStarted={onGetStarted} />}
        {pageId === 'staking' && <StakingPage darkMode={darkMode} onGetStarted={onGetStarted} />}
        {pageId === 'trading' && <TradingPage darkMode={darkMode} onGetStarted={onGetStarted} />}
        {pageId === 'gateway' && <PaymentGatewayPage darkMode={darkMode} onGetStarted={onGetStarted} />}
      </main>

      {/* ====== FOOTER ====== */}
      <footer className={`border-t ${borderCol} ${bg}`}>
        <div className="max-w-[1440px] mx-auto px-6 py-12 md:py-16">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
            <div className="col-span-2 md:col-span-1">
              <Logo size="sm" showText={true} variant={darkMode ? 'default' : 'gradient-text'} textClassName={darkMode ? 'text-white text-lg font-bold' : 'text-lg font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent'} />
              <p className={`text-sm ${textSecondary} mt-4 leading-relaxed max-w-xs`}>
                All-in-one cryptocurrency platform with the lowest fees. Secure wallet with a convenient mobile app.
              </p>
            </div>

            <div>
              <h4 className={`text-sm font-semibold ${textPrimary} mb-4 uppercase tracking-wider`}>Products</h4>
              <ul className="space-y-2.5">
                {[
                  { name: 'Payment Gateway', id: 'gateway' },
                  { name: 'Crypto Cards', id: 'cards' },
                  { name: 'Trading', id: 'trading' },
                  { name: 'Staking', id: 'staking' },
                ].map(item => (
                  <li key={item.name}>
                    <button onClick={() => onPageChange(item.id)} className={`text-sm ${textSecondary} ${hoverTextPrimary} transition-colors`}>{item.name}</button>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className={`text-sm font-semibold ${textPrimary} mb-4 uppercase tracking-wider`}>Resources</h4>
              <ul className="space-y-2.5">
                {[
                  { name: 'API Documentation', id: 'api' },
                  { name: 'Blog', id: 'blog' },
                  { name: 'Explorer', id: 'explorer' },
                ].map(item => (
                  <li key={item.name}>
                    <button onClick={() => onPageChange(item.id)} className={`text-sm ${textSecondary} ${hoverTextPrimary} transition-colors`}>{item.name}</button>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className={`text-sm font-semibold ${textPrimary} mb-4 uppercase tracking-wider`}>Wallet</h4>
              <ul className="space-y-2.5">
                <li><button onClick={onGetStarted} className={`text-sm ${textSecondary} ${hoverTextPrimary} transition-colors`}>Create Wallet</button></li>
                <li><button onClick={onAccessWallet} className={`text-sm ${textSecondary} ${hoverTextPrimary} transition-colors`}>Open Wallet</button></li>
                <li><button onClick={onImportWallet} className={`text-sm ${textSecondary} ${hoverTextPrimary} transition-colors`}>Import Wallet</button></li>
              </ul>
            </div>
          </div>

          <div className={`flex flex-col md:flex-row items-center justify-between gap-4 pt-8 border-t ${borderCol}`}>
            <p className={`text-sm ${textTertiary}`}>
              © 2026 Xbyte Wallet. All rights reserved.
            </p>
            <p
              onClick={onAdminAccess}
              className={`text-sm ${textTertiary} ${hoverTextPrimary} cursor-pointer transition-colors`}
            >
              Version 8.0 · Q2 2026
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

/* ============================================================================
   1. P2P EXCHANGE SUB-PAGE
   ============================================================================ */
function P2PPage({ darkMode, onGetStarted }: { darkMode: boolean; onGetStarted: () => void }) {
  const [p2pTab, setP2pTab] = useState<'buy' | 'sell'>('buy');
  const [p2pCoin, setP2pCoin] = useState<'USDT' | 'BTC' | 'ETH'>('USDT');
  const [tradeAmount, setTradeAmount] = useState('');
  const [selectedOffer, setSelectedOffer] = useState<any>(null);

  const offers = [
    { id: 1, type: 'buy', coin: 'USDT', seller: 'RevolutMaster', rate: 1.01, totalOrders: 4322, completion: 99.4, minLimit: 50, maxLimit: 2000, methods: ['Revolut', 'SEPA Bank Transfer'] },
    { id: 2, type: 'buy', coin: 'USDT', seller: 'PayFast_Instant', rate: 1.02, totalOrders: 1890, completion: 98.1, minLimit: 20, maxLimit: 500, methods: ['PayPal', 'Wise'] },
    { id: 3, type: 'buy', coin: 'USDT', seller: 'CoinFlow', rate: 1.00, totalOrders: 125, completion: 95.0, minLimit: 100, maxLimit: 5000, methods: ['SEPA Bank Transfer', 'Zen'] },
    { id: 4, type: 'buy', coin: 'BTC', seller: 'WhaleOTC', rate: 94850, totalOrders: 820, completion: 100, minLimit: 500, maxLimit: 50000, methods: ['Wire Transfer', 'Revolut'] },
    { id: 5, type: 'buy', coin: 'ETH', seller: 'EtherExpress', rate: 3240, totalOrders: 1543, completion: 97.8, minLimit: 100, maxLimit: 10000, methods: ['Revolut', 'Wise'] },
    { id: 6, type: 'sell', coin: 'USDT', seller: 'FiatBuyer', rate: 0.99, totalOrders: 2311, completion: 99.1, minLimit: 10, maxLimit: 1000, methods: ['Wise', 'Revolut'] },
    { id: 7, type: 'sell', coin: 'USDT', seller: 'FastCash_P2P', rate: 0.98, totalOrders: 604, completion: 96.5, minLimit: 50, maxLimit: 3000, methods: ['SEPA Bank Transfer'] },
    { id: 8, type: 'sell', coin: 'BTC', seller: 'KrakenShark', rate: 94100, totalOrders: 110, completion: 94.0, minLimit: 1000, maxLimit: 80000, methods: ['Wire Transfer'] },
  ];

  const filteredOffers = offers.filter(o => o.type === p2pTab && o.coin === p2pCoin);

  return (
    <div className="max-w-[1200px] mx-auto px-6 py-12">
      <div className="text-center max-w-2xl mx-auto mb-10">
        <span className="text-purple-500 font-semibold text-sm tracking-wider uppercase">P2P Exchange</span>
        <h1 className="text-3xl md:text-5xl font-extrabold mt-2 mb-4">Peer-to-Peer Trading Portal</h1>
        <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'} text-base md:text-lg`}>
          Buy and sell crypto locally using multiple payment methods with 0% trading fees.
        </p>
      </div>

      <div className={`p-6 rounded-2xl border ${darkMode ? 'bg-[#141416] border-[#27272a]' : 'bg-[#f8f9fa] border-gray-200'} shadow-lg mb-8`}>
        {/* Controls */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6 border-b pb-6" style={{ borderColor: darkMode ? '#27272a' : '#e5e7eb' }}>
          <div className="flex gap-2">
            <button 
              onClick={() => setP2pTab('buy')}
              className={`h-11 px-6 rounded-xl font-semibold transition-all ${p2pTab === 'buy' ? 'bg-green-500 text-white shadow-md' : (darkMode ? 'text-gray-300 hover:bg-white/5' : 'text-gray-600 hover:bg-black/5')}`}
            >
              Buy Crypto
            </button>
            <button 
              onClick={() => setP2pTab('sell')}
              className={`h-11 px-6 rounded-xl font-semibold transition-all ${p2pTab === 'sell' ? 'bg-red-500 text-white shadow-md' : (darkMode ? 'text-gray-300 hover:bg-white/5' : 'text-gray-600 hover:bg-black/5')}`}
            >
              Sell Crypto
            </button>
          </div>

          <div className="flex gap-2">
            {['USDT', 'BTC', 'ETH'].map(c => (
              <button
                key={c}
                onClick={() => setP2pCoin(c as any)}
                className={`h-10 px-4 rounded-lg text-sm font-bold border transition-colors ${p2pCoin === c ? (darkMode ? 'bg-white text-black border-white' : 'bg-black text-white border-black') : (darkMode ? 'border-[#27272a] hover:bg-white/5' : 'border-gray-300 hover:bg-black/5')}`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        {/* Offers list */}
        <div className="space-y-4">
          {filteredOffers.length === 0 ? (
            <div className="text-center py-10 text-gray-500">No active offers matching your filters.</div>
          ) : (
            filteredOffers.map(o => (
              <div 
                key={o.id} 
                className={`p-5 rounded-xl border flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition-all ${darkMode ? 'bg-[#18181b] border-[#27272a] hover:border-white/10' : 'bg-white border-gray-200 hover:border-black/10'}`}
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-lg">{o.seller}</span>
                    <span className="text-xs text-green-500 bg-green-500/10 px-2 py-0.5 rounded-full font-semibold">
                      {o.totalOrders} orders ({o.completion}%)
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {o.methods.map(m => (
                      <span key={m} className={`text-xs px-2.5 py-1 rounded-md font-medium ${darkMode ? 'bg-[#27272a] text-gray-300' : 'bg-gray-100 text-gray-700'}`}>
                        {m}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex flex-col md:items-end gap-1">
                  <span className="text-2xl font-black text-purple-500">
                    {o.rate.toLocaleString()} <span className="text-xs text-gray-500 font-normal">USD / {o.coin}</span>
                  </span>
                  <span className="text-xs text-gray-500">
                    Limits: ${o.minLimit.toLocaleString()} - ${o.maxLimit.toLocaleString()}
                  </span>
                </div>

                <button 
                  onClick={() => setSelectedOffer(o)}
                  className={`h-11 px-6 rounded-xl font-bold w-full md:w-auto ${p2pTab === 'buy' ? 'bg-green-500 hover:bg-green-600 text-white' : 'bg-red-500 hover:bg-red-600 text-white'}`}
                >
                  {p2pTab === 'buy' ? 'Buy' : 'Sell'} {o.coin}
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Trade Modal */}
      {selectedOffer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className={`w-full max-w-md p-6 rounded-2xl border shadow-2xl ${darkMode ? 'bg-[#18181b] border-[#27272a] text-white' : 'bg-white border-gray-200 text-black'}`}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-extrabold text-xl">Initiate P2P Order</h3>
              <button onClick={() => setSelectedOffer(null)} className="p-1 rounded-lg hover:bg-black/10 dark:hover:bg-white/10">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mb-6 space-y-3">
              <div className="flex justify-between border-b pb-2" style={{ borderColor: darkMode ? '#27272a' : '#e5e7eb' }}>
                <span className="text-gray-500">Advertiser</span>
                <span className="font-bold">{selectedOffer.seller}</span>
              </div>
              <div className="flex justify-between border-b pb-2" style={{ borderColor: darkMode ? '#27272a' : '#e5e7eb' }}>
                <span className="text-gray-500">Price Rate</span>
                <span className="font-bold text-purple-500">${selectedOffer.rate.toLocaleString()} USD</span>
              </div>
              <div className="flex justify-between border-b pb-2" style={{ borderColor: darkMode ? '#27272a' : '#e5e7eb' }}>
                <span className="text-gray-500">Order Limits</span>
                <span className="font-bold">${selectedOffer.minLimit.toLocaleString()} - ${selectedOffer.maxLimit.toLocaleString()}</span>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider mb-2 text-gray-500">I want to pay (USD)</label>
                <div className="relative">
                  <Input 
                    type="number"
                    value={tradeAmount}
                    onChange={(e) => setTradeAmount(e.target.value)}
                    placeholder={`Min ${selectedOffer.minLimit}`}
                    className="pr-16"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 font-bold text-sm text-gray-500">USD</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider mb-2 text-gray-500">I will receive ({selectedOffer.coin})</label>
                <div className="relative">
                  <Input 
                    type="text"
                    disabled
                    value={tradeAmount ? (parseFloat(tradeAmount) / selectedOffer.rate).toFixed(6) : '0.00'}
                    className="bg-black/5 dark:bg-white/5"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 font-bold text-sm text-gray-500">{selectedOffer.coin}</span>
                </div>
              </div>

              <div className="pt-4 flex gap-3">
                <Button 
                  onClick={() => {
                    alert('Order created successfully! Redirecting you to the secure Escrow chat page...');
                    setSelectedOffer(null);
                    onGetStarted();
                  }}
                  className="flex-1"
                  size="lg"
                  disabled={!tradeAmount || parseFloat(tradeAmount) < selectedOffer.minLimit || parseFloat(tradeAmount) > selectedOffer.maxLimit}
                >
                  Create Escrow Trade
                </Button>
                <Button variant="outline" size="lg" onClick={() => setSelectedOffer(null)}>Cancel</Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ============================================================================
   2. MARKET CAP SUB-PAGE
   ============================================================================ */
function MarketCapPage({ darkMode, onGetStarted }: { darkMode: boolean; onGetStarted: () => void }) {
  const [search, setSearch] = useState('');

  const cryptos = [
    { rank: 1, name: 'Bitcoin', symbol: 'BTC', price: 94850.25, change: 2.45, volume: 38240500000, marketCap: 1850400000000, chart: [35, 42, 38, 50, 48, 55, 60] },
    { rank: 2, name: 'Ethereum', symbol: 'ETH', price: 3240.80, change: -1.22, volume: 18900200000, marketCap: 388900000000, chart: [55, 52, 49, 47, 50, 48, 44] },
    { rank: 3, name: 'Solana', symbol: 'SOL', price: 188.45, change: 12.84, volume: 6450000000, marketCap: 87400000000, chart: [20, 25, 22, 35, 45, 52, 60] },
    { rank: 4, name: 'BNB', symbol: 'BNB', price: 585.12, change: 0.15, volume: 1200300000, marketCap: 86200000000, chart: [40, 41, 39, 42, 41, 40, 42] },
    { rank: 5, name: 'Cardano', symbol: 'ADA', price: 0.62, change: -3.50, volume: 450100000, marketCap: 22000000000, chart: [45, 42, 38, 35, 30, 28, 25] },
    { rank: 6, name: 'Ripple', symbol: 'XRP', price: 1.15, change: 4.88, volume: 2200000000, marketCap: 65000000000, chart: [30, 31, 35, 32, 38, 42, 45] },
    { rank: 7, name: 'Polkadot', symbol: 'DOT', price: 6.85, change: -0.45, volume: 180000000, marketCap: 8800000000, chart: [40, 39, 41, 38, 42, 40, 39] },
    { rank: 8, name: 'Dogecoin', symbol: 'DOGE', price: 0.38, change: 18.25, volume: 5400000000, marketCap: 52000000000, chart: [15, 20, 18, 30, 40, 55, 70] },
  ];

  const filtered = cryptos.filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase()) || 
    c.symbol.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="max-w-[1200px] mx-auto px-6 py-12">
      <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-6 mb-8">
        <div>
          <span className="text-purple-500 font-semibold text-sm tracking-wider uppercase">Market Cap</span>
          <h1 className="text-3xl md:text-5xl font-extrabold mt-2 mb-2">Live Crypto Prices</h1>
          <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'} text-sm md:text-base`}>
            Track the market volume, change, and charts of top digital assets.
          </p>
        </div>

        <div className="relative w-full md:w-80">
          <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <Input 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search assets..." 
            className="pl-10"
          />
        </div>
      </div>

      <div className={`border rounded-2xl overflow-hidden shadow-lg ${darkMode ? 'bg-[#141416] border-[#27272a]' : 'bg-white border-gray-200'}`}>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className={`text-xs font-semibold uppercase tracking-wider border-b ${darkMode ? 'bg-[#18181b] border-[#27272a] text-gray-400' : 'bg-gray-50 border-gray-200 text-gray-500'}`}>
                <th className="py-4 px-6 w-16">#</th>
                <th className="py-4 px-6">Name</th>
                <th className="py-4 px-6 text-right">Price</th>
                <th className="py-4 px-6 text-right">24h Change</th>
                <th className="py-4 px-6 text-right hidden lg:table-cell">24h Volume</th>
                <th className="py-4 px-6 text-right hidden md:table-cell">Market Cap</th>
                <th className="py-4 px-6 text-center w-36">Last 7 Days</th>
                <th className="py-4 px-6 text-center">Trade</th>
              </tr>
            </thead>
            <tbody className="divide-y" style={{ borderColor: darkMode ? '#27272a' : '#e5e7eb' }}>
              {filtered.map(c => (
                <tr key={c.rank} className={`text-sm ${darkMode ? 'hover:bg-white/5' : 'hover:bg-black/5'}`}>
                  <td className="py-4 px-6 text-gray-500 font-medium">{c.rank}</td>
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-purple-500/10 flex items-center justify-center font-bold text-purple-500">
                        {c.symbol.substring(0, 2)}
                      </div>
                      <div>
                        <div className="font-bold">{c.name}</div>
                        <div className="text-xs text-gray-500">{c.symbol}</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-6 text-right font-bold">${c.price.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                  <td className={`py-4 px-6 text-right font-semibold ${c.change > 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {c.change > 0 ? '+' : ''}{c.change}%
                  </td>
                  <td className="py-4 px-6 text-right text-gray-500 hidden lg:table-cell">${c.volume.toLocaleString()}</td>
                  <td className="py-4 px-6 text-right text-gray-500 hidden md:table-cell">${c.marketCap.toLocaleString()}</td>
                  <td className="py-4 px-6">
                    <div className="flex justify-center">
                      <svg width="100" height="30" viewBox="0 0 100 30" className="overflow-visible">
                        <polyline
                          fill="none"
                          stroke={c.change > 0 ? '#10B981' : '#EF4444'}
                          strokeWidth="2"
                          points={c.chart.map((val, index) => `${(index * 100) / 6},${30 - (val * 30) / 100}`).join(' ')}
                        />
                      </svg>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex justify-center">
                      <button 
                        onClick={onGetStarted}
                        className={`h-9 px-4 rounded-lg text-xs font-bold transition-all ${darkMode ? 'bg-white text-black hover:bg-gray-200' : 'bg-black text-white hover:bg-gray-800'}`}
                      >
                        Trade
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

/* ============================================================================
   3. BLOCKCHAIN EXPLORER SUB-PAGE
   ============================================================================ */
function ExplorerPage({ darkMode }: { darkMode: boolean }) {
  const [search, setSearch] = useState('');
  const [activeSearch, setActiveSearch] = useState<any>(null);

  const blocks = [
    { number: 18402120, time: '12s ago', txns: 145, validator: 'Lido Validator', size: '1.2 MB', reward: '2.14 ETH' },
    { number: 18402119, time: '24s ago', txns: 98, validator: 'Binance Pool', size: '890 KB', reward: '2.08 ETH' },
    { number: 18402118, time: '36s ago', txns: 201, validator: 'Coinbase Cloud', size: '1.8 MB', reward: '2.32 ETH' },
    { number: 18402117, time: '48s ago', txns: 122, validator: 'Ethermine', size: '1.1 MB', reward: '2.11 ETH' },
    { number: 18402116, time: '1m ago', txns: 167, validator: 'F2Pool', size: '1.4 MB', reward: '2.21 ETH' },
  ];

  const txs = [
    { hash: '0x3ef4...2f8a', from: '0x9923...0a92', to: '0xb234...99ea', amount: '4.50 ETH', fee: '$2.45', time: '12s ago' },
    { hash: '0x82f4...d1cc', from: '0x9923...0a92', to: '0xf41b...a9b2', amount: '0.08 BTC', fee: '$5.10', time: '24s ago' },
    { hash: '0xfa8d...881c', from: '0x221a...88ee', to: '0x9923...0a92', amount: '125.00 SOL', fee: '$0.01', time: '36s ago' },
    { hash: '0x31ba...ff2a', from: '0xc1b9...aa92', to: '0xda3f...91fa', amount: '1,500 USDT', fee: '$1.00', time: '48s ago' },
  ];

  const handleSearch = () => {
    if (!search) return;
    // Simulate Address or Tx Hash check
    if (search.startsWith('0x') && search.length > 20) {
      setActiveSearch({
        type: 'address',
        value: search,
        balance: '142.85 ETH',
        txCount: 42,
        transactions: [
          { hash: '0x3ef4...2f8a', to: '0xb234...99ea', amount: '4.50 ETH', direction: 'out', time: '12s ago' },
          { hash: '0xfa8d...881c', from: '0x221a...88ee', amount: '125.00 SOL', direction: 'in', time: '36s ago' }
        ]
      });
    } else {
      setActiveSearch({
        type: 'transaction',
        value: search,
        status: 'Success',
        block: 18402120,
        confirmations: 45,
        from: '0x9923...0a92',
        to: '0xb234...99ea',
        valueAmount: '4.50 ETH ($14,583.60)',
        txnFee: '0.00078 ETH ($2.53)'
      });
    }
  };

  return (
    <div className="max-w-[1200px] mx-auto px-6 py-12">
      <div className="text-center max-w-2xl mx-auto mb-10">
        <span className="text-purple-500 font-semibold text-sm tracking-wider uppercase">Multi-Chain Explorer</span>
        <h1 className="text-3xl md:text-5xl font-extrabold mt-2 mb-4">Decentralized Ledger Explorer</h1>
        <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'} text-base`}>
          Search and verify address balances, block info, or transaction hashes across multiple chains in real time.
        </p>
      </div>

      {/* Search Bar */}
      <div className="max-w-2xl mx-auto flex gap-2 mb-12">
        <div className="relative flex-1">
          <Search className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
          <Input 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="Search by Txn Hash, Address or Block..." 
            className="pl-11 h-12 rounded-xl text-base shadow-sm"
          />
        </div>
        <Button onClick={handleSearch} size="lg" className="h-12 rounded-xl px-6">Search</Button>
      </div>

      {/* Explorer Search Results */}
      {activeSearch ? (
        <div className={`p-6 rounded-2xl border mb-10 ${darkMode ? 'bg-[#141416] border-[#27272a]' : 'bg-white border-gray-200'} shadow-lg`}>
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-extrabold text-xl capitalize">{activeSearch.type} Details</h3>
            <Button variant="outline" size="sm" onClick={() => { setActiveSearch(null); setSearch(''); }}>Back to Overview</Button>
          </div>

          <div className="font-mono text-sm break-all bg-black/5 dark:bg-white/5 p-4 rounded-xl mb-6">
            {activeSearch.value}
          </div>

          {activeSearch.type === 'address' ? (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className={`p-4 rounded-xl border ${darkMode ? 'bg-[#18181b] border-[#27272a]' : 'bg-gray-50 border-gray-200'}`}>
                  <span className="text-xs text-gray-500 font-semibold uppercase tracking-wider block mb-1">Balance</span>
                  <span className="text-2xl font-black text-purple-500">{activeSearch.balance}</span>
                </div>
                <div className={`p-4 rounded-xl border ${darkMode ? 'bg-[#18181b] border-[#27272a]' : 'bg-gray-50 border-gray-200'}`}>
                  <span className="text-xs text-gray-500 font-semibold uppercase tracking-wider block mb-1">Transaction Count</span>
                  <span className="text-2xl font-black">{activeSearch.txCount} txs</span>
                </div>
              </div>

              <div>
                <h4 className="font-bold text-lg mb-4">Address History</h4>
                <div className="space-y-3">
                  {activeSearch.transactions.map((t: any, idx: number) => (
                    <div key={idx} className="flex justify-between items-center border-b pb-3" style={{ borderColor: darkMode ? '#27272a' : '#e5e7eb' }}>
                      <span className="font-mono text-xs text-purple-500">{t.hash}</span>
                      <div className="flex items-center gap-4">
                        <span className={`text-xs font-bold px-2 py-0.5 rounded ${t.direction === 'in' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                          {t.direction.toUpperCase()}
                        </span>
                        <span className="font-semibold">{t.amount}</span>
                        <span className="text-xs text-gray-500">{t.time}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex justify-between border-b pb-2" style={{ borderColor: darkMode ? '#27272a' : '#e5e7eb' }}>
                <span className="text-gray-500">Status</span>
                <span className="font-bold text-green-500 flex items-center gap-1">
                  <CheckCircle className="w-4 h-4" /> {activeSearch.status}
                </span>
              </div>
              <div className="flex justify-between border-b pb-2" style={{ borderColor: darkMode ? '#27272a' : '#e5e7eb' }}>
                <span className="text-gray-500">Block</span>
                <span className="font-mono">{activeSearch.block}</span>
              </div>
              <div className="flex justify-between border-b pb-2" style={{ borderColor: darkMode ? '#27272a' : '#e5e7eb' }}>
                <span className="text-gray-500">Confirmations</span>
                <span className="font-semibold">{activeSearch.confirmations} Confirmations</span>
              </div>
              <div className="flex justify-between border-b pb-2" style={{ borderColor: darkMode ? '#27272a' : '#e5e7eb' }}>
                <span className="text-gray-500">From</span>
                <span className="font-mono text-xs break-all">{activeSearch.from}</span>
              </div>
              <div className="flex justify-between border-b pb-2" style={{ borderColor: darkMode ? '#27272a' : '#e5e7eb' }}>
                <span className="text-gray-500">To</span>
                <span className="font-mono text-xs break-all">{activeSearch.to}</span>
              </div>
              <div className="flex justify-between border-b pb-2" style={{ borderColor: darkMode ? '#27272a' : '#e5e7eb' }}>
                <span className="text-gray-500">Value</span>
                <span className="font-bold">{activeSearch.valueAmount}</span>
              </div>
              <div className="flex justify-between border-b pb-2" style={{ borderColor: darkMode ? '#27272a' : '#e5e7eb' }}>
                <span className="text-gray-500">Transaction Fee</span>
                <span className="font-mono">{activeSearch.txnFee}</span>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Real-time Dashboard Grid */
        <div className="grid md:grid-cols-2 gap-8">
          {/* Latest Blocks */}
          <div className={`p-6 rounded-2xl border ${darkMode ? 'bg-[#141416] border-[#27272a]' : 'bg-white border-gray-200'} shadow-lg`}>
            <h3 className="font-extrabold text-xl mb-6 flex items-center gap-2">
              <Layers className="w-5 h-5 text-purple-500" /> Latest Blocks
            </h3>
            <div className="space-y-4">
              {blocks.map(b => (
                <div key={b.number} className="flex justify-between items-center border-b pb-3" style={{ borderColor: darkMode ? '#27272a' : '#e5e7eb' }}>
                  <div>
                    <span className="font-bold block text-purple-500">#{b.number}</span>
                    <span className="text-xs text-gray-500">{b.time} · {b.txns} txs</span>
                  </div>
                  <div className="text-right">
                    <span className="font-mono text-sm block">{b.validator}</span>
                    <span className="text-xs text-green-500 font-semibold">{b.reward}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Latest Transactions */}
          <div className={`p-6 rounded-2xl border ${darkMode ? 'bg-[#141416] border-[#27272a]' : 'bg-white border-gray-200'} shadow-lg`}>
            <h3 className="font-extrabold text-xl mb-6 flex items-center gap-2">
              <Activity className="w-5 h-5 text-purple-500" /> Latest Transactions
            </h3>
            <div className="space-y-4">
              {txs.map(t => (
                <div key={t.hash} className="flex justify-between items-center border-b pb-3" style={{ borderColor: darkMode ? '#27272a' : '#e5e7eb' }}>
                  <div>
                    <span className="font-mono text-sm block text-purple-500">{t.hash}</span>
                    <span className="text-xs text-gray-500">From {t.from} to {t.to}</span>
                  </div>
                  <div className="text-right">
                    <span className="font-bold block">{t.amount}</span>
                    <span className="text-xs text-gray-500">{t.time}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ============================================================================
   4. API DOCUMENTATION SUB-PAGE
   ============================================================================ */
function ApiDocsPage({ darkMode }: { darkMode: boolean }) {
  const [lang, setLang] = useState<'curl' | 'node' | 'python'>('curl');
  const [copied, setCopied] = useState(false);

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const codeSnippets = {
    curl: `curl -X POST https://api.xbytewallet.com/v1/payments \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "amount": "100.00",
    "currency": "USD",
    "payment_coin": "USDT",
    "order_id": "ORDER_12345",
    "callback_url": "https://yoursite.com/webhook"
  }'`,
    node: `const axios = require('axios');

axios.post('https://api.xbytewallet.com/v1/payments', {
  amount: '100.00',
  currency: 'USD',
  payment_coin: 'USDT',
  order_id: 'ORDER_12345',
  callback_url: 'https://yoursite.com/webhook'
}, {
  headers: { 'Authorization': 'Bearer YOUR_API_KEY' }
})
.then(res => console.log(res.data))
.catch(err => console.error(err));`,
    python: `import requests

url = "https://api.xbytewallet.com/v1/payments"
headers = {
    "Authorization": "Bearer YOUR_API_KEY",
    "Content-Type": "application/json"
}
payload = {
    "amount": "100.00",
    "currency": "USD",
    "payment_coin": "USDT",
    "order_id": "ORDER_12345",
    "callback_url": "https://yoursite.com/webhook"
}

response = requests.post(url, json=payload, headers=headers)
print(response.json())`
  };

  return (
    <div className="max-w-[1200px] mx-auto px-6 py-12">
      <div className="mb-10">
        <span className="text-purple-500 font-semibold text-sm tracking-wider uppercase">API Documentation</span>
        <h1 className="text-3xl md:text-5xl font-extrabold mt-2 mb-4">Integrate Digital Payments</h1>
        <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'} text-base md:text-lg max-w-3xl`}>
          A clean REST API allowing merchants to accept payments in Bitcoin, Ethereum, Solana, and USDT instantly with full webhooks.
        </p>
      </div>

      <div className="grid lg:grid-cols-12 gap-8">
        {/* Left Side: Documentation */}
        <div className="lg:col-span-7 space-y-8">
          <div>
            <h3 className="font-extrabold text-2xl mb-4 border-b pb-2" style={{ borderColor: darkMode ? '#27272a' : '#e5e7eb' }}>1. Authentication</h3>
            <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'} text-sm leading-relaxed`}>
              Authenticate your requests by passing your API Key in the <code className="px-1.5 py-0.5 rounded font-mono text-xs bg-purple-500/10 text-purple-500">Authorization</code> header. Make sure to keep your private key hidden from frontend clients.
            </p>
          </div>

          <div>
            <h3 className="font-extrabold text-2xl mb-4 border-b pb-2" style={{ borderColor: darkMode ? '#27272a' : '#e5e7eb' }}>2. Create Payment</h3>
            <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'} text-sm leading-relaxed mb-4`}>
              Trigger payment flow for checkout invoice creation. Your customer will be redirect to a hosted multi-chain checkout window.
            </p>

            <h4 className="font-bold text-sm text-gray-500 uppercase tracking-wider mb-2">Request Body Fields</h4>
            <div className="space-y-3">
              <div className="flex items-start justify-between border-b pb-2 text-xs" style={{ borderColor: darkMode ? '#27272a' : '#e5e7eb' }}>
                <div>
                  <span className="font-mono font-bold text-purple-500">amount</span>
                  <span className="text-gray-400 italic font-mono block">string (required)</span>
                </div>
                <span className="text-right text-gray-500 w-64">Fiat amount to charge. e.g. "100.00"</span>
              </div>
              <div className="flex items-start justify-between border-b pb-2 text-xs" style={{ borderColor: darkMode ? '#27272a' : '#e5e7eb' }}>
                <div>
                  <span className="font-mono font-bold text-purple-500">currency</span>
                  <span className="text-gray-400 italic font-mono block">string (required)</span>
                </div>
                <span className="text-right text-gray-500 w-64">Fiat ISO code. e.g. "USD", "EUR"</span>
              </div>
              <div className="flex items-start justify-between border-b pb-2 text-xs" style={{ borderColor: darkMode ? '#27272a' : '#e5e7eb' }}>
                <div>
                  <span className="font-mono font-bold text-purple-500">payment_coin</span>
                  <span className="text-gray-400 italic font-mono block">string (required)</span>
                </div>
                <span className="text-right text-gray-500 w-64">Acceptable token. e.g. "USDT", "BTC", "ETH"</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Code snippets playground */}
        <div className="lg:col-span-5">
          <div className="sticky top-20 rounded-2xl overflow-hidden shadow-2xl border border-gray-800 bg-[#0c0c0e]">
            {/* Header / Tabs */}
            <div className="bg-[#141416] px-4 py-3 flex justify-between items-center border-b border-gray-800">
              <div className="flex gap-2">
                {(['curl', 'node', 'python'] as const).map(l => (
                  <button 
                    key={l}
                    onClick={() => setLang(l)}
                    className={`px-3 py-1 rounded text-xs font-bold transition-all uppercase ${lang === l ? 'bg-purple-600 text-white shadow' : 'text-gray-500 hover:text-white'}`}
                  >
                    {l === 'node' ? 'NodeJS' : l}
                  </button>
                ))}
              </div>

              <button 
                onClick={() => handleCopy(codeSnippets[lang])}
                className="p-1.5 rounded-lg text-gray-500 hover:text-white transition-colors"
                title="Copy code"
              >
                {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>

            {/* Code Body */}
            <pre className="p-5 font-mono text-xs text-gray-300 leading-relaxed overflow-x-auto whitespace-pre">
              {codeSnippets[lang]}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ============================================================================
   5. BLOG SUB-PAGE
   ============================================================================ */
function BlogPage({ darkMode }: { darkMode: boolean }) {
  const blogPosts = [
    {
      id: 1,
      title: 'Security Notice: Keeping Your Seeds Safe',
      category: 'Security',
      date: 'June 28, 2026',
      readTime: '4 min read',
      excerpt: 'In this article, we outline best practices for cold backups and how to avoid online phishing campaigns targeting multi-chain wallets.',
      author: 'Security Team'
    },
    {
      id: 2,
      title: 'Solana Staking APY Boosted to 20%',
      category: 'Product Update',
      date: 'June 25, 2026',
      readTime: '3 min read',
      excerpt: 'We have updated our staking yield pools. Starting today, users staking SOL will earn a promotional yield of up to 20% APY.',
      author: 'Marketing Team'
    },
    {
      id: 3,
      title: 'An Introduction to Escrow P2P Trading',
      category: 'Guides',
      date: 'June 18, 2026',
      readTime: '6 min read',
      excerpt: 'Learn how to securely buy cryptocurrency from other users globally using our built-in smart escrow contract module.',
      author: 'Academy Team'
    },
    {
      id: 4,
      title: 'Accepting Crypto Payments as a Merchant',
      category: 'Business',
      date: 'June 10, 2026',
      readTime: '8 min read',
      excerpt: 'A comprehensive guide on integrating our payment API, setting up merchant credentials, and reducing payment processing fees.',
      author: 'Merchant Division'
    }
  ];

  return (
    <div className="max-w-[1200px] mx-auto px-6 py-12">
      <div className="text-center max-w-2xl mx-auto mb-12">
        <span className="text-purple-500 font-semibold text-sm tracking-wider uppercase">Official Blog</span>
        <h1 className="text-3xl md:text-5xl font-extrabold mt-2 mb-4">News & Academy Insights</h1>
        <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'} text-base md:text-lg`}>
          Stay updated with platform announcements, security guides, and cryptocurrency tutorials.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-8 mb-12">
        {blogPosts.map(post => (
          <article 
            key={post.id}
            className={`p-6 rounded-2xl border transition-all cursor-pointer group ${darkMode ? 'bg-[#141416] border-[#27272a] hover:border-white/10' : 'bg-[#f8f9fa] border-gray-200 hover:border-black/10'} shadow-md`}
          >
            <div className="flex items-center justify-between mb-3 text-xs">
              <span className="text-purple-500 font-bold uppercase tracking-wider bg-purple-500/10 px-2.5 py-1 rounded">
                {post.category}
              </span>
              <span className="text-gray-500">{post.readTime}</span>
            </div>

            <h3 className="font-extrabold text-xl md:text-2xl mb-3 group-hover:text-purple-500 transition-colors">
              {post.title}
            </h3>

            <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'} leading-relaxed mb-4`}>
              {post.excerpt}
            </p>

            <div className="flex justify-between items-center border-t pt-4 text-xs text-gray-500" style={{ borderColor: darkMode ? '#27272a' : '#e5e7eb' }}>
              <span>Published: {post.date}</span>
              <span>By: {post.author}</span>
            </div>
          </article>
        ))}
      </div>

      {/* Newsletter signup */}
      <div className={`p-8 rounded-3xl border text-center ${darkMode ? 'bg-[#18181b] border-[#27272a]' : 'bg-[#fafafa] border-gray-200'} max-w-xl mx-auto shadow-lg`}>
        <h3 className="font-extrabold text-xl mb-2">Subscribe to Our Newsletter</h3>
        <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'} mb-6`}>
          Receive weekly platform updates, safety alerts, and promotions directly to your inbox.
        </p>
        <div className="flex flex-col sm:flex-row gap-2">
          <Input placeholder="Enter your email" className="flex-1" />
          <Button onClick={() => alert('Thanks for subscribing!')}>Subscribe</Button>
        </div>
      </div>
    </div>
  );
}

/* ============================================================================
   6. CRYPTO CARDS SUB-PAGE
   ============================================================================ */
function CryptoCardsPage({ darkMode, onGetStarted }: { darkMode: boolean; onGetStarted: () => void }) {
  const [selectedStyle, setSelectedStyle] = useState<'black' | 'silver' | 'gold'>('black');

  const getCardStyle = () => {
    switch (selectedStyle) {
      case 'silver':
        return 'from-slate-300 via-slate-100 to-slate-400 text-slate-900 border-slate-200 shadow-slate-400/20';
      case 'gold':
        return 'from-yellow-600 via-yellow-200 to-yellow-700 text-yellow-950 border-yellow-300 shadow-yellow-600/20';
      default:
        return 'from-zinc-900 via-zinc-800 to-zinc-950 text-white border-zinc-700 shadow-purple-900/30';
    }
  };

  return (
    <div className="max-w-[1200px] mx-auto px-6 py-12">
      <div className="grid lg:grid-cols-12 gap-12 items-center">
        {/* Left Side: Text and Selector */}
        <div className="lg:col-span-7 space-y-6">
          <div>
            <span className="text-purple-500 font-semibold text-sm tracking-wider uppercase">Crypto Debit Cards</span>
            <h1 className="text-3xl md:text-5xl font-extrabold mt-2 mb-4 leading-tight">Pay Anywhere. <br />Instant Cashback.</h1>
            <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'} text-base md:text-lg leading-relaxed`}>
              Spend your crypto in the real world at over 80 million merchant locations. Your card converts crypto to local fiat instantly at checkout.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-4 border-y py-6" style={{ borderColor: darkMode ? '#27272a' : '#e5e7eb' }}>
            <div>
              <span className="block text-2xl font-black text-purple-500">Up to 8%</span>
              <span className="text-xs text-gray-500 font-semibold uppercase">Cashback Reward</span>
            </div>
            <div>
              <span className="block text-2xl font-black text-purple-500">Free</span>
              <span className="text-xs text-gray-500 font-semibold uppercase">Airport Lounges</span>
            </div>
            <div>
              <span className="block text-2xl font-black text-purple-500">Zero</span>
              <span className="text-xs text-gray-500 font-semibold uppercase">Monthly Fees</span>
            </div>
          </div>

          {/* Color Selector */}
          <div>
            <span className="text-sm text-gray-500 font-bold uppercase tracking-wider block mb-3">Choose Your Card Tier</span>
            <div className="flex gap-3">
              {(['black', 'silver', 'gold'] as const).map(color => (
                <button
                  key={color}
                  onClick={() => setSelectedStyle(color)}
                  className={`h-11 px-6 rounded-xl text-xs font-bold transition-all border capitalize ${selectedStyle === color ? (darkMode ? 'bg-white text-black border-white' : 'bg-black text-white border-black') : (darkMode ? 'border-[#27272a] hover:bg-white/5' : 'border-gray-300 hover:bg-black/5')}`}
                >
                  {color} Edition
                </button>
              ))}
            </div>
          </div>

          <div className="pt-2">
            <Button size="lg" onClick={onGetStarted}>Order Virtual Card</Button>
          </div>
        </div>

        {/* Right Side: Visualizing Card */}
        <div className="lg:col-span-5 flex flex-col items-center">
          {/* Card Frame */}
          <div className={`w-80 h-48 rounded-2xl bg-gradient-to-br border ${getCardStyle()} p-6 flex flex-col justify-between shadow-2xl relative overflow-hidden transition-all duration-500 hover:scale-105 hover:rotate-1`}>
            {/* Holographic Chip */}
            <div className="flex justify-between items-start">
              <div className="w-12 h-9 rounded-md bg-gradient-to-tr from-amber-200 to-amber-400 opacity-80" />
              <Logo size="sm" showText={false} variant="default" />
            </div>

            {/* Logo text & visa */}
            <div className="space-y-4">
              <span className="block font-mono tracking-widest text-lg">•••• •••• •••• 8295</span>
              <div className="flex justify-between items-end">
                <span className="text-xs uppercase tracking-wider font-semibold">XBYTE CARD</span>
                <span className="italic font-bold text-xl">VISA</span>
              </div>
            </div>
          </div>

          <span className="text-xs text-gray-500 mt-6 text-center max-w-xs">
            Holographic, Platinum and Metal Gold finishes. Request yours inside the App dashboard.
          </span>
        </div>
      </div>
    </div>
  );
}

/* ============================================================================
   7. STAKING CALCULATOR SUB-PAGE
   ============================================================================ */
function StakingPage({ darkMode, onGetStarted }: { darkMode: boolean; onGetStarted: () => void }) {
  const [stakeCoin, setStakeCoin] = useState<'SOL' | 'ETH' | 'BTC'>('SOL');
  const [stakeAmount, setStakeAmount] = useState('10');
  const [stakeDuration, setStakeDuration] = useState('12'); // in months

  const apys = {
    SOL: 20.0,
    ETH: 3.5,
    BTC: 5.0
  };

  const calculateReturn = () => {
    const amt = parseFloat(stakeAmount) || 0;
    const apy = apys[stakeCoin] / 100;
    const years = parseFloat(stakeDuration) / 12;
    // Compound interest simulation (simple compound for staking)
    return amt * Math.pow(1 + apy, years) - amt;
  };

  return (
    <div className="max-w-[1200px] mx-auto px-6 py-12">
      <div className="text-center max-w-2xl mx-auto mb-12">
        <span className="text-purple-500 font-semibold text-sm tracking-wider uppercase">Staking Calculator</span>
        <h1 className="text-3xl md:text-5xl font-extrabold mt-2 mb-4">Earn Dynamic Staking Yields</h1>
        <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'} text-base md:text-lg`}>
          Stake your idle cryptocurrencies directly from your wallet and secure blockchain networks.
        </p>
      </div>

      <div className="grid md:grid-cols-12 gap-8 items-stretch">
        {/* Left Side Calculator */}
        <div className={`md:col-span-7 p-6 rounded-2xl border flex flex-col justify-between ${darkMode ? 'bg-[#141416] border-[#27272a]' : 'bg-white border-gray-200'} shadow-lg`}>
          <div className="space-y-6">
            <h3 className="font-extrabold text-xl">Yield Configurator</h3>

            {/* Coin selection */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider mb-2 text-gray-500">Asset to Stake</label>
              <div className="flex gap-2">
                {(['SOL', 'ETH', 'BTC'] as const).map(c => (
                  <button
                    key={c}
                    onClick={() => setStakeCoin(c)}
                    className={`flex-1 h-12 rounded-xl font-bold border transition-colors ${stakeCoin === c ? (darkMode ? 'bg-white text-black border-white' : 'bg-black text-white border-black') : (darkMode ? 'border-[#27272a] hover:bg-white/5' : 'border-gray-300 hover:bg-black/5')}`}
                  >
                    {c} ({apys[c]}%)
                  </button>
                ))}
              </div>
            </div>

            {/* Input Amount */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider mb-2 text-gray-500">Stake Amount</label>
              <div className="relative">
                <Input 
                  type="number"
                  value={stakeAmount}
                  onChange={(e) => setStakeAmount(e.target.value)}
                  className="h-12 rounded-xl text-lg font-bold pr-16"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 font-bold text-gray-500">{stakeCoin}</span>
              </div>
            </div>

            {/* Slider Duration */}
            <div>
              <div className="flex justify-between items-center text-xs font-semibold uppercase tracking-wider mb-2 text-gray-500">
                <span>Duration</span>
                <span>{stakeDuration} Months</span>
              </div>
              <input 
                type="range" 
                min="1" 
                max="60" 
                value={stakeDuration} 
                onChange={(e) => setStakeDuration(e.target.value)}
                className="w-full accent-purple-500"
              />
            </div>
          </div>

          <div className="pt-6">
            <Button size="lg" className="w-full h-12 rounded-xl" onClick={onGetStarted}>Stake Now</Button>
          </div>
        </div>

        {/* Right Side Returns View */}
        <div className={`md:col-span-5 p-6 rounded-2xl border flex flex-col justify-between text-center ${darkMode ? 'bg-[#18181b] border-[#27272a] text-white shadow-purple-900/10' : 'bg-[#fafafa] border-gray-200 text-black shadow-lg'}`}>
          <div className="space-y-4 py-8">
            <span className="text-xs text-gray-500 font-bold uppercase tracking-wider block">Estimated Reward</span>
            <div className="text-4xl md:text-5xl font-black text-green-500">
              +{calculateReturn().toFixed(4)} <span className="text-sm font-normal text-gray-500">{stakeCoin}</span>
            </div>
            <p className="text-xs text-gray-500 max-w-xs mx-auto">
              Calculation based on simple compounding for {stakeDuration} months with {apys[stakeCoin]}% annual interest yield.
            </p>
          </div>

          <div className="border-t pt-6 text-left space-y-3" style={{ borderColor: darkMode ? '#27272a' : '#e5e7eb' }}>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Rewards Frequency</span>
              <span className="font-semibold">Every 6 Hours</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Principal Protected</span>
              <span className="font-semibold text-green-500">Yes (100%)</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Staked Principal</span>
              <span className="font-semibold">{stakeAmount} {stakeCoin}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ============================================================================
   8. TRADING TERMINAL SUB-PAGE
   ============================================================================ */
function TradingPage({ darkMode, onGetStarted }: { darkMode: boolean; onGetStarted: () => void }) {
  const [orderType, setOrderType] = useState<'buy' | 'sell'>('buy');
  const [tradingPrice, setTradingPrice] = useState('94850.00');
  const [tradingAmount, setTradingAmount] = useState('0.05');

  // Simulated order book
  const bids = [
    { price: 94849.50, size: 0.12 },
    { price: 94848.20, size: 0.85 },
    { price: 94847.00, size: 1.25 },
    { price: 94846.10, size: 0.50 },
    { price: 94845.00, size: 2.11 }
  ];

  const asks = [
    { price: 94850.50, size: 0.05 },
    { price: 94851.20, size: 0.44 },
    { price: 94852.00, size: 1.10 },
    { price: 94853.50, size: 0.22 },
    { price: 94855.00, size: 3.50 }
  ];

  return (
    <div className="max-w-[1440px] mx-auto px-6 py-12">
      <div className="text-center max-w-2xl mx-auto mb-10">
        <span className="text-purple-500 font-semibold text-sm tracking-wider uppercase">Spot Trading</span>
        <h1 className="text-3xl md:text-5xl font-extrabold mt-2 mb-4">Interactive Order Book Terminal</h1>
        <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'} text-sm md:text-base`}>
          Experience lightning-fast orders and low execution fees. Enter mock trade quantities to simulate buying/selling BTC.
        </p>
      </div>

      {/* Grid container */}
      <div className={`grid lg:grid-cols-12 gap-4 rounded-3xl overflow-hidden border p-4 bg-[#0c0c0e] border-gray-800 text-white shadow-2xl`}>
        {/* Candlestick Chart Mock */}
        <div className="lg:col-span-6 bg-[#141416] border border-gray-800 rounded-2xl p-4 flex flex-col justify-between min-h-[350px]">
          <div className="flex justify-between items-center border-b border-gray-800 pb-3">
            <span className="font-bold flex items-center gap-2 text-sm">
              <span className="w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse" />
              BTC/USDT Live Spot
            </span>
            <span className="font-black text-green-500 text-lg">$94,850.00</span>
          </div>

          <div className="flex-1 flex items-center justify-center p-6">
            {/* Drawing simulated candlestick vectors */}
            <svg width="100%" height="200" viewBox="0 0 300 200" className="overflow-visible opacity-80">
              <g stroke="#374151" strokeWidth="1" strokeDasharray="4 4">
                <line x1="0" y1="50" x2="300" y2="50" />
                <line x1="0" y1="100" x2="300" y2="100" />
                <line x1="0" y1="150" x2="300" y2="150" />
              </g>
              {/* Candlestick items */}
              <g>
                <line x1="40" y1="20" x2="40" y2="90" stroke="#10B981" strokeWidth="2" />
                <rect x="30" y="30" width="20" height="50" fill="#10B981" />

                <line x1="90" y1="40" x2="90" y2="110" stroke="#EF4444" strokeWidth="2" />
                <rect x="80" y="50" width="20" height="40" fill="#EF4444" />

                <line x1="140" y1="70" x2="140" y2="130" stroke="#10B981" strokeWidth="2" />
                <rect x="130" y="80" width="20" height="40" fill="#10B981" />

                <line x1="190" y1="60" x2="190" y2="150" stroke="#EF4444" strokeWidth="2" />
                <rect x="180" y="70" width="20" height="70" fill="#EF4444" />

                <line x1="240" y1="80" x2="240" y2="180" stroke="#10B981" strokeWidth="2" />
                <rect x="230" y="100" width="20" height="60" fill="#10B981" />
              </g>
            </svg>
          </div>

          <div className="flex justify-between text-xs text-gray-500 pt-3 border-t border-gray-800">
            <span>24h High: $95,240.00</span>
            <span>24h Low: $92,050.00</span>
            <span>24h Volume: 45,210 BTC</span>
          </div>
        </div>

        {/* Order Book Panel */}
        <div className="lg:col-span-3 bg-[#141416] border border-gray-800 rounded-2xl p-4 flex flex-col justify-between">
          <div className="space-y-4">
            <span className="font-bold text-xs uppercase tracking-wider text-gray-400">Order Book</span>

            {/* Asks (Sell Orders - Red) */}
            <div className="space-y-1">
              {asks.map((a, idx) => (
                <div key={idx} className="flex justify-between text-xs font-mono">
                  <span className="text-red-500">${a.price.toLocaleString()}</span>
                  <span className="text-gray-400">{a.size.toFixed(2)}</span>
                </div>
              ))}
            </div>

            {/* Current Price Divider */}
            <div className="border-y border-gray-800 py-1.5 text-center">
              <span className="font-black text-green-500">$94,850.00</span>
            </div>

            {/* Bids (Buy Orders - Green) */}
            <div className="space-y-1">
              {bids.map((b, idx) => (
                <div key={idx} className="flex justify-between text-xs font-mono">
                  <span className="text-green-500">${b.price.toLocaleString()}</span>
                  <span className="text-gray-400">{b.size.toFixed(2)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Trade Control */}
        <div className="lg:col-span-3 bg-[#141416] border border-gray-800 rounded-2xl p-4 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex gap-2">
              <button 
                onClick={() => setOrderType('buy')}
                className={`flex-1 h-9 rounded-lg text-xs font-bold transition-all ${orderType === 'buy' ? 'bg-green-500 text-white' : 'bg-gray-800 text-gray-400 hover:text-white'}`}
              >
                Buy
              </button>
              <button 
                onClick={() => setOrderType('sell')}
                className={`flex-1 h-9 rounded-lg text-xs font-bold transition-all ${orderType === 'sell' ? 'bg-red-500 text-white' : 'bg-gray-800 text-gray-400 hover:text-white'}`}
              >
                Sell
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1">Limit Price (USDT)</label>
                <Input 
                  value={tradingPrice}
                  onChange={(e) => setTradingPrice(e.target.value)}
                  className="bg-[#0c0c0e] border-gray-800 h-9 font-mono text-sm"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1">Amount (BTC)</label>
                <Input 
                  value={tradingAmount}
                  onChange={(e) => setTradingAmount(e.target.value)}
                  className="bg-[#0c0c0e] border-gray-800 h-9 font-mono text-sm"
                />
              </div>
            </div>
          </div>

          <div className="pt-6 space-y-3">
            <div className="flex justify-between text-xs text-gray-400">
              <span>Est. Total:</span>
              <span className="font-bold text-white font-mono">
                ${(parseFloat(tradingPrice) * parseFloat(tradingAmount) || 0).toLocaleString()} USDT
              </span>
            </div>
            <button 
              onClick={() => {
                alert(`Spot Limit order placed successfully!`);
                onGetStarted();
              }}
              className={`w-full h-11 rounded-xl text-sm font-bold ${orderType === 'buy' ? 'bg-green-500 hover:bg-green-600' : 'bg-red-500 hover:bg-red-600'} text-white`}
            >
              Place Limit {orderType.toUpperCase()}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ============================================================================
   9. PAYMENT GATEWAY SUB-PAGE
   ============================================================================ */
function PaymentGatewayPage({ darkMode, onGetStarted }: { darkMode: boolean; onGetStarted: () => void }) {
  return (
    <div className="max-w-[1200px] mx-auto px-6 py-12">
      <div className="grid md:grid-cols-12 gap-12 items-center mb-16">
        <div className="md:col-span-7 space-y-6">
          <span className="text-purple-500 font-semibold text-sm tracking-wider uppercase">API Payment Gateway</span>
          <h1 className="text-3xl md:text-5xl font-extrabold mt-2 mb-4 leading-tight">Accept Crypto Payments. <br />Grow Your Business.</h1>
          <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'} text-base md:text-lg leading-relaxed`}>
            Accept Bitcoin, Solana, Tether, and more at checkout. Settle transactions instantly with 0.4% processing fees, zero chargeback risk, and full developer API controls.
          </p>

          <div className="flex gap-4">
            <Button size="lg" onClick={onGetStarted}>Register Merchant</Button>
          </div>
        </div>

        <div className="md:col-span-5">
          {/* Dashboard Sandbox Simulation */}
          <div className={`p-5 rounded-2xl border shadow-2xl ${darkMode ? 'bg-[#141416] border-[#27272a]' : 'bg-[#f8f9fa] border-gray-200'}`}>
            <h3 className="font-extrabold text-sm mb-4 uppercase tracking-wider text-gray-500 flex items-center gap-2">
              <Activity className="w-4 h-4 text-purple-500" /> Sandbox Dashboard
            </h3>

            <div className="space-y-4">
              <div className="flex justify-between border-b pb-2 text-sm" style={{ borderColor: darkMode ? '#27272a' : '#e5e7eb' }}>
                <span className="text-gray-500">Gross Sales</span>
                <span className="font-bold">$4,850.00 USD</span>
              </div>
              <div className="flex justify-between border-b pb-2 text-sm" style={{ borderColor: darkMode ? '#27272a' : '#e5e7eb' }}>
                <span className="text-gray-500">Average Fee Paid</span>
                <span className="font-bold text-green-500">0.40% ($19.40)</span>
              </div>
              <div className="flex justify-between border-b pb-2 text-sm" style={{ borderColor: darkMode ? '#27272a' : '#e5e7eb' }}>
                <span className="text-gray-500">Successful Invoices</span>
                <span className="font-semibold">45 / 45 (100%)</span>
              </div>
              <div className="flex justify-between border-b pb-2 text-sm" style={{ borderColor: darkMode ? '#27272a' : '#e5e7eb' }}>
                <span className="text-gray-500">Webhook Status</span>
                <span className="font-bold text-green-500 flex items-center gap-1">
                  <CheckCircle className="w-3.5 h-3.5" /> Healthy
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
