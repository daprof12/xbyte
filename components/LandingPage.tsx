import { LogOut, ChevronDown, Moon, Sun, Menu, X, ArrowUpRight, Download } from 'lucide-react';
import Logo from './Logo';
import { useState, useRef, useEffect } from 'react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import PWAInstallModal from './PWAInstallModal';
import { storage, storageSync } from '../utils/platform';

// Coin icons
import imgBtc from "../assets/btc.png";
import imgEth from "../assets/eth.png";
import imgSol from "../assets/sol.png";
import imgBnb from "../assets/bnb.png";
import imgUsdt from "../assets/usdt.png";

// Cryptomus assets – downloaded locally
import paymentGatewayImg from "../assets/cryptomus/crms-payment-gateway.svg";
import cryptoCardsImg from "../assets/cryptomus/cryptocurrency-cards.png";
import tradingPlatformImg from "../assets/cryptomus/trading-platform.png";
import converterImg from "../assets/cryptomus/converter.png";
import p2pImg from "../assets/cryptomus/p2p.png";
import onRampImg from "../assets/cryptomus/on-ramp.png";
import amlCheckerImg from "../assets/cryptomus/aml-checker.png";
import explorerImg from "../assets/cryptomus/explorer.png";
import hotIconSvg from "../assets/cryptomus/hot-icon.svg";
import toolsInOneAppImg from "../assets/cryptomus/tools-in-one-app.png";
import unifiedForUseImg from "../assets/cryptomus/unified-for-use.png";

// Press logos
import pressBitcoin from "../assets/cryptomus/bitcoin.png";
import pressBloomberg from "../assets/cryptomus/bloomberg.png";
import pressYahoo from "../assets/cryptomus/yahoo.png";
import pressBenzinga from "../assets/cryptomus/benzinga.png";
import pressTon from "../assets/cryptomus/ton.png";
import usaSec from "../assets/cryptomus/usa.png";
import pressCointelegraph from "../assets/cryptomus/cointelegraph.png";
import pressMorningstar from "../assets/cryptomus/morningstar.png";
import pressBeincrypto from "../assets/cryptomus/beincrypto.png";
import pressMarketwatch from "../assets/cryptomus/marketwatch.png";
import pressDextools from "../assets/cryptomus/dextools.png";

interface LandingPageProps {
  onGetStarted: () => void;
  onAccessWallet: () => void;
  onImportWallet?: () => void;
  onAdminAccess: () => void;
  isLoggedIn?: boolean;
  userEmail?: string;
  onViewWallet?: () => void;
  onLogout?: () => void;
  onLogoClick?: () => void;
  darkMode?: boolean;
  onToggleDarkMode?: () => void;
  onPrivacyClick?: () => void;
  onPageChange?: (pageId: string) => void;
}

export default function LandingPage({
  onGetStarted,
  onAccessWallet,
  onImportWallet,
  onAdminAccess,
  isLoggedIn = false,
  userEmail = '',
  onViewWallet,
  onLogout,
  onLogoClick,
  darkMode: darkModeProp,
  onToggleDarkMode,
  onPrivacyClick,
  onPageChange
}: LandingPageProps) {
  const [showDropdown, setShowDropdown] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [showPWAModal, setShowPWAModal] = useState(false);

  const darkMode = darkModeProp !== undefined ? darkModeProp : (() => {
    const saved = storageSync.get('darkMode');
    return saved !== null ? saved : true;
  })();

  const toggleDarkMode = onToggleDarkMode || (() => {
    const newMode = !darkMode;
    storage.set('darkMode', newMode);
    if (newMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  });

  const { isInstalled, isIOS, installPWA, canInstall } = usePWAInstall();

  const handlePWAInstall = async () => {
    if (canInstall) {
      const installed = await installPWA();
      if (!installed) setShowPWAModal(true);
    } else {
      setShowPWAModal(true);
    }
  };

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

  // Data
  const pressLogos = [
    pressBitcoin, pressBloomberg, pressYahoo, pressBenzinga, pressTon, usaSec,
    pressCointelegraph, pressMorningstar, pressBeincrypto, pressMarketwatch, pressDextools
  ];

  const stakingAssets = [
    { symbol: 'BTC', img: imgBtc, apy: 5, hot: false },
    { symbol: 'ETH', img: imgEth, apy: 3, hot: false },
    { symbol: 'SOL', img: imgSol, apy: 20, hot: true },
    { symbol: 'BNB', img: imgBnb, apy: 3, hot: false },
    { symbol: 'USDT', img: imgUsdt, apy: 3, hot: false },
  ];

  const versatileTools = [
    { title: 'Converter', img: converterImg, desc: 'Swap assets in seconds without network fees' },
    { title: 'P2P Exchange', img: p2pImg, desc: 'Purchase crypto with lowest fees on the market' },
    { title: 'On-Ramp', img: onRampImg, desc: 'Buy crypto with fiat currency' },
    { title: 'AML Checker', img: amlCheckerImg, desc: 'Check wallets for sanctions and fraud' },
    { title: 'Explorer', img: explorerImg, desc: 'View transaction details on blockchain' },
  ];

  const navLinks = ['Wallet', 'P2P', 'Market Cap', 'Explorer', 'API', 'Blog'];

  const handleNavLinkClick = (link: string) => {
    if (!onPageChange) return;
    setMobileMenuOpen(false);
    if (link === 'Wallet') {
      if (isLoggedIn && onViewWallet) onViewWallet();
      else onAccessWallet();
    } else if (link === 'P2P') {
      onPageChange('p2p');
    } else if (link === 'Market Cap') {
      onPageChange('market');
    } else if (link === 'Explorer') {
      onPageChange('explorer');
    } else if (link === 'API') {
      onPageChange('api');
    } else if (link === 'Blog') {
      onPageChange('blog');
    }
  };

  // Color definitions for dark/light
  const bg = darkMode ? 'bg-[#0c0c0e]' : 'bg-white';
  const bgAlt = darkMode ? 'bg-[#141416]' : 'bg-[#f5f5f7]';
  const bgCard = darkMode ? 'bg-[#18181b]' : 'bg-[#f5f5f7]';
  const bgCardHover = darkMode ? 'hover:bg-[#1e1e22]' : 'hover:bg-[#ededf0]';
  const borderCol = darkMode ? 'border-[#27272a]' : 'border-[#e5e5e7]';
  const textPrimary = darkMode ? 'text-white' : 'text-[#18181b]';
  const textSecondary = darkMode ? 'text-[#a1a1aa]' : 'text-[#71717a]';
  const textTertiary = darkMode ? 'text-[#52525b]' : 'text-[#a1a1aa]';
  const btnPrimary = darkMode ? 'bg-white text-black hover:bg-gray-200' : 'bg-[#18181b] text-white hover:bg-black';
  const hoverTextPrimary = darkMode ? 'hover:text-white' : 'hover:text-black';

  return (
    <div className={`min-h-screen ${bg} ${textPrimary} transition-colors duration-300 font-sans ${darkMode ? 'dark' : ''}`}
      style={{ fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>

      {/* ====== HEADER ====== */}
      <header className={`sticky top-0 z-50 ${darkMode ? 'bg-[#0c0c0e]/90' : 'bg-white/90'} backdrop-blur-xl border-b ${borderCol}`}>
        <div className="max-w-[1440px] mx-auto px-6 h-16 flex items-center justify-between">
          {/* Left: Burger + Logo + Nav */}
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
              onClick={onLogoClick}
            />

            <nav className="hidden lg:flex items-center ml-6 gap-1">
              {navLinks.map((link) => (
                <button
                  key={link}
                  onClick={() => handleNavLinkClick(link)}
                  className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-colors ${textSecondary} ${darkMode ? 'hover:text-white hover:bg-white/5' : 'hover:text-[#18181b] hover:bg-black/5'}`}
                >
                  {link}
                </button>
              ))}
            </nav>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={toggleDarkMode}
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
                        onClick={() => { setShowDropdown(false); onViewWallet?.(); }}
                        className={`w-full px-4 py-2.5 text-left text-sm transition-colors ${darkMode ? 'hover:bg-white/5' : 'hover:bg-black/5'}`}
                      >
                        View Wallet
                      </button>
                      <button
                        onClick={() => { setShowDropdown(false); onLogout?.(); }}
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
                  key={link}
                  onClick={() => handleNavLinkClick(link)}
                  className={`w-full text-left px-4 py-3 rounded-xl text-sm font-medium transition-colors ${textSecondary} ${darkMode ? 'hover:bg-white/5' : 'hover:bg-black/5'}`}
                >
                  {link}
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

      <main>
        {/* ====== HERO SECTION ====== */}
        <section className={`relative overflow-hidden ${darkMode ? 'bg-gradient-to-b from-[#0c0c0e] via-[#0f0f18] to-[#0c0c0e]' : 'bg-gradient-to-b from-white via-[#f0eeff] to-white'}`}>
          <div className="max-w-[1440px] mx-auto px-6 pt-24 pb-20 md:pt-32 md:pb-28 text-center relative z-10">
            {/* Decorative glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full opacity-20 pointer-events-none"
              style={{ background: 'radial-gradient(circle, rgba(91, 65, 255, 0.3) 0%, transparent 70%)' }} />

            <h1 className={`text-[clamp(2.5rem,6vw,4.5rem)] font-extrabold leading-[1.1] tracking-tight mb-6 ${textPrimary}`}>
              The Ultimate All-in-One<br />
              Crypto Ecosystem
            </h1>
            <p className={`text-lg md:text-xl ${textSecondary} mb-10 max-w-xl mx-auto font-normal`}>
              Scale your business. Manage your wealth
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                onClick={onGetStarted}
                className={`h-14 px-10 rounded-2xl font-semibold text-base ${btnPrimary} transition-all hover:shadow-lg w-full sm:w-auto`}
              >
                Create Wallet
              </button>

              <button
                onClick={onImportWallet}
                className={`h-14 px-10 rounded-2xl font-semibold text-base transition-all border w-full sm:w-auto ${darkMode ? 'border-[#27272a] text-white hover:bg-white/5' : 'border-[#e5e5e7] text-[#18181b] hover:bg-black/5'}`}
              >
                Import Wallet
              </button>
            </div>
          </div>
        </section>

        {/* ====== PRESS MARQUEE ====== */}
        <div className={`py-8 border-y ${borderCol} ${bgAlt}`}>
          <div className="max-w-[1440px] mx-auto relative overflow-hidden">
            {/* Left fade */}
            <div className={`absolute left-0 top-0 w-32 md:w-48 h-full z-10 pointer-events-none bg-gradient-to-r ${darkMode ? 'from-[#141416]' : 'from-[#f5f5f7]'} to-transparent`} />
            {/* Right fade */}
            <div className={`absolute right-0 top-0 w-32 md:w-48 h-full z-10 pointer-events-none bg-gradient-to-l ${darkMode ? 'from-[#141416]' : 'from-[#f5f5f7]'} to-transparent`} />
            <div className="animate-marquee">
              {[...pressLogos, ...pressLogos].map((logo, i) => (
                <div key={i} className="flex items-center justify-center mx-8 md:mx-10 shrink-0">
                  <img
                    src={logo}
                    alt="Press"
                    className={`h-8 md:h-10 max-w-[160px] object-contain transition-opacity ${darkMode
                      ? 'brightness-0 invert opacity-40 hover:opacity-70'
                      : 'brightness-0 opacity-50 hover:opacity-80'
                      }`}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ====== CRYPTOCURRENCY PAYMENT GATEWAY ====== */}
        <section className="max-w-[1440px] mx-auto px-6 py-16 md:py-24">
          <div className={`rounded-3xl overflow-hidden border ${borderCol} ${bgCard} flex flex-col md:flex-row items-center`}>
            {/* Image */}
            <div className="flex-1 p-8 md:p-12 flex items-center justify-center">
              <img src={paymentGatewayImg} alt="Payment Gateway" className="w-full max-w-md" />
            </div>
            {/* Text */}
            <div className="flex-1 p-8 md:p-12">
              <h2 className={`text-3xl md:text-4xl font-bold mb-4 ${textPrimary}`}>
                Cryptocurrency payment gateway
              </h2>
              <p className={`text-lg mb-8 ${textSecondary}`}>
                Accept payments with fees as low as 0.4%
              </p>
              <div className="flex flex-wrap gap-3">
                <button onClick={onGetStarted} className={`h-12 px-7 rounded-xl font-semibold text-sm ${btnPrimary} transition-colors`}>
                  Try now
                </button>
                <button onClick={() => onPageChange?.('gateway')} className={`h-12 px-7 rounded-xl font-semibold text-sm border transition-colors ${darkMode ? 'border-[#27272a] hover:bg-white/5' : 'border-[#e5e5e7] hover:bg-black/5'}`}>
                  Learn more
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* ====== CRYPTOCURRENCY CARDS ====== */}
        <section className="max-w-[1440px] mx-auto px-6 pb-16 md:pb-24">
          <div className={`rounded-3xl overflow-hidden border ${borderCol} ${bgCard} flex flex-col md:flex-row-reverse items-center`}>
            {/* Image */}
            <div className="flex-1 p-8 md:p-12 flex items-center justify-center">
              <img src={cryptoCardsImg} alt="Cryptocurrency Cards" className="w-full max-w-md" />
            </div>
            {/* Text */}
            <div className="flex-1 p-8 md:p-12">
              <h2 className={`text-3xl md:text-4xl font-bold mb-4 ${textPrimary}`}>
                Cryptocurrency cards
              </h2>
              <p className={`text-lg mb-8 ${textSecondary}`}>
                Pay with crypto wherever you want. Get your card in 5 minutes
              </p>
              <div className="flex flex-wrap gap-3">
                <button onClick={onGetStarted} className={`h-12 px-7 rounded-xl font-semibold text-sm ${btnPrimary} transition-colors`}>
                  Try now
                </button>
                <button onClick={() => onPageChange?.('cards')} className={`h-12 px-7 rounded-xl font-semibold text-sm border transition-colors ${darkMode ? 'border-[#27272a] hover:bg-white/5' : 'border-[#e5e5e7] hover:bg-black/5'}`}>
                  Learn more
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* ====== TRADING PLATFORM ====== */}
        <section className="max-w-[1440px] mx-auto px-6 pb-16 md:pb-24">
          <div className={`rounded-3xl overflow-hidden border ${borderCol} ${bgCard} flex flex-col md:flex-row items-center`}>
            {/* Image */}
            <div className="flex-1 p-8 md:p-12 flex items-center justify-center">
              <img src={tradingPlatformImg} alt="Trading Platform" className="w-full max-w-md" />
            </div>
            {/* Text */}
            <div className="flex-1 p-8 md:p-12">
              <h2 className={`text-3xl md:text-4xl font-bold mb-4 ${textPrimary}`}>
                Trading platform
              </h2>
              <p className={`text-lg mb-4 ${textSecondary}`}>
                High liquidity and fees as low as 0.04%
              </p>
              <div className="flex flex-wrap gap-3 mt-8">
                <button onClick={onGetStarted} className={`h-12 px-7 rounded-xl font-semibold text-sm ${btnPrimary} transition-colors`}>
                  Try now
                </button>
                <button onClick={() => onPageChange?.('trading')} className={`h-12 px-7 rounded-xl font-semibold text-sm border transition-colors ${darkMode ? 'border-[#27272a] hover:bg-white/5' : 'border-[#e5e5e7] hover:bg-black/5'}`}>
                  Learn more
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* ====== 100+ CRYPTOCURRENCIES ====== */}
        <section className="max-w-[1440px] mx-auto px-6 pb-16 md:pb-24 text-center">
          <h2 className={`text-3xl md:text-4xl font-bold mb-10 ${textPrimary}`}>
            More than 100 cryptocurrencies supported
          </h2>
          <div className="flex flex-wrap justify-center gap-3">
            {[
              { img: imgBtc, name: 'BTC' },
              { img: imgEth, name: 'ETH' },
              { img: imgSol, name: 'SOL' },
              { img: imgBnb, name: 'BNB' },
              { img: imgUsdt, name: 'USDT' },
            ].map((coin) => (
              <div
                key={coin.name}
                className={`flex items-center gap-2.5 h-12 px-5 rounded-full border transition-colors ${bgCard} ${bgCardHover} ${borderCol}`}
              >
                <img src={coin.img} alt={coin.name} className="w-6 h-6 rounded-full" />
                <span className={`text-sm font-medium ${textSecondary}`}>{coin.name}</span>
              </div>
            ))}
            <div
              className={`flex items-center gap-2 h-12 px-5 rounded-full border ${bgCard} ${borderCol} ${textTertiary} text-sm font-medium`}
            >
              +95 more
            </div>
          </div>
        </section>

        {/* ====== EARN PASSIVE INCOME (STAKING) ====== */}
        <section className={`py-16 md:py-24 ${bgAlt}`}>
          <div className="max-w-[1440px] mx-auto px-6">
            <h2 className={`text-3xl md:text-4xl font-bold mb-10 ${textPrimary}`}>
              Earn passive income on crypto
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
              {stakingAssets.map((asset) => (
                <div
                  key={asset.symbol}
                  className={`relative rounded-2xl p-5 border transition-all cursor-pointer group ${bgCard} ${borderCol} ${darkMode ? 'hover:border-white' : 'hover:border-black'} hover:shadow-lg`}
                >
                  {asset.hot && (
                    <div className="absolute -top-2 right-4 flex items-center gap-1 bg-gradient-to-r from-orange-500 to-red-500 text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                      <img src={hotIconSvg} alt="" className="w-3 h-3" />
                      HOT
                    </div>
                  )}

                  <div className="flex items-center gap-3 mb-4">
                    <img src={asset.img} alt={asset.symbol} className="w-9 h-9 rounded-full" />
                    <span className={`font-semibold ${textPrimary}`}>{asset.symbol}</span>
                  </div>

                  <div className="flex items-center gap-1.5 text-[#3FC374] font-bold text-lg mb-1">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#3FC374" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="m23 6-9.5 9.5-5-5L1 18" /><path d="M17 6h6v6" />
                    </svg>
                    {asset.apy}% APY
                  </div>

                  <div className={`text-xs ${textTertiary} mb-4`}>
                    First rewards in <span className={textSecondary}>6 hours</span>
                  </div>

                  <button
                    onClick={onGetStarted}
                    className={`w-full h-9 rounded-lg text-sm font-semibold transition-colors border ${darkMode ? 'border-[#27272a] hover:bg-white/5 text-white' : 'border-[#e5e5e7] hover:bg-black/5 text-[#18181b]'}`}
                  >
                    Stake now
                  </button>
                </div>
              ))}
            </div>

            <div className="flex justify-center">
              <button onClick={() => onPageChange?.('staking')} className={`h-12 px-7 rounded-xl font-semibold text-sm border transition-colors ${darkMode ? 'border-[#27272a] hover:bg-white/5' : 'border-[#e5e5e7] hover:bg-black/5'}`}>
                Learn more
              </button>
            </div>
          </div>
        </section>

        {/* ====== VERSATILE SUITE OF CRYPTO TOOLS ====== */}
        <section className="max-w-[1440px] mx-auto px-6 py-16 md:py-24">
          <h2 className={`text-3xl md:text-4xl font-bold mb-10 ${textPrimary}`}>
            A versatile suite of crypto tools
          </h2>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {versatileTools.map((tool) => (
              <div
                key={tool.title}
                onClick={() => {
                  if (tool.title === 'P2P Exchange') onPageChange?.('p2p');
                  else if (tool.title === 'Explorer') onPageChange?.('explorer');
                  else if (tool.title === 'On-Ramp') onPageChange?.('gateway');
                  else if (tool.title === 'AML Checker' || tool.title === 'Converter') onPageChange?.('trading');
                }}
                className={`rounded-2xl overflow-hidden border transition-all group cursor-pointer ${bgCard} ${borderCol} hover:shadow-lg ${darkMode ? 'hover:border-[#3f3f46]' : 'hover:border-[#d4d4d8]'}`}
              >
                <div className={`aspect-[4/3] overflow-hidden ${darkMode ? 'bg-[#1e1e22]' : 'bg-[#eeeef0]'}`}>
                  <img
                    src={tool.img}
                    alt={tool.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                </div>
                <div className="p-4">
                  <div className="flex items-center justify-between mb-1.5">
                    <h4 className={`font-semibold ${textPrimary}`}>{tool.title}</h4>
                    <ArrowUpRight className={`w-4 h-4 ${textTertiary} group-${hoverTextPrimary} transition-colors`} />
                  </div>
                  <p className={`text-sm ${textSecondary} leading-relaxed`}>{tool.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ====== ALL TOOLS IN ONE APP + UNIFIED FOR USE ====== */}
        <section className="max-w-[1440px] mx-auto px-6 pb-16 md:pb-24">
          <div className="grid md:grid-cols-2 gap-4">
            {/* Tools in one app */}
            <div className={`rounded-3xl overflow-hidden border ${borderCol} ${bgCard} relative group`}>
              <div className="p-8 md:p-10 relative z-10">
                <h3 className={`text-2xl md:text-3xl font-bold mb-3 ${textPrimary}`}>All tools in one app</h3>
                <p className={`${textSecondary} max-w-sm`}>
                  Manage your crypto portfolio with our all-in-one mobile application
                </p>
                <div className="flex gap-3 mt-6">
                  <button onClick={handlePWAInstall} className={`h-11 px-6 rounded-xl font-semibold text-sm ${btnPrimary} transition-colors flex items-center gap-2`}>
                    <Download className="w-4 h-4" />
                    {isInstalled ? 'Installed' : 'Install App'}
                  </button>
                </div>
              </div>
              <div className="h-48 md:h-64 overflow-hidden">
                <img src={toolsInOneAppImg} alt="All tools" className="w-full h-full object-cover object-top group-hover:scale-[1.02] transition-transform duration-700" />
              </div>
            </div>

            {/* Unified for use */}
            <div className={`rounded-3xl overflow-hidden border ${borderCol} ${bgCard} relative group`}>
              <div className="p-8 md:p-10 relative z-10">
                <h3 className={`text-2xl md:text-3xl font-bold mb-3 ${textPrimary}`}>Unified for use</h3>
                <p className={`${textSecondary} max-w-sm`}>
                  One platform for all your crypto needs — send, receive, exchange, and manage assets
                </p>
              </div>
              <div className="h-48 md:h-64 overflow-hidden">
                <img src={unifiedForUseImg} alt="Unified" className="w-full h-full object-cover object-top group-hover:scale-[1.02] transition-transform duration-700" />
              </div>
            </div>
          </div>
        </section>

        {/* ====== CTA SECTION ====== */}
        <section className={`py-20 md:py-28 ${darkMode ? 'bg-gradient-to-b from-[#0c0c0e] via-[#100f1a] to-[#0c0c0e]' : 'bg-gradient-to-b from-white via-[#f0eeff] to-white'}`}>
          <div className="max-w-[1440px] mx-auto px-6 text-center">
            <h2 className={`text-3xl md:text-5xl font-bold mb-6 ${textPrimary}`}>
              Ready to get started?
            </h2>
            <p className={`text-lg ${textSecondary} mb-10 max-w-xl mx-auto`}>
              Join millions of users managing their crypto with Xbyte Wallet. Your security, our priority.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                onClick={onGetStarted}
                className={`h-14 px-10 rounded-2xl font-semibold text-base ${btnPrimary} transition-all hover:shadow-lg w-full sm:w-auto`}
              >
                Create Your Wallet
              </button>
              <button
                onClick={onAccessWallet}
                className={`h-14 px-10 rounded-2xl font-semibold text-base transition-all border w-full sm:w-auto ${darkMode ? 'border-[#27272a] text-white hover:bg-white/5' : 'border-[#e5e5e7] text-[#18181b] hover:bg-black/5'}`}
              >
                Import Existing Wallet
              </button>
            </div>
          </div>
        </section>
      </main>

      {/* ====== FOOTER ====== */}
      <footer className={`border-t ${borderCol} ${bg}`}>
        <div className="max-w-[1440px] mx-auto px-6 py-12 md:py-16">
          {/* Footer Top */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
            {/* Column 1 - Brand */}
            <div className="col-span-2 md:col-span-1">
              <Logo size="sm" showText={true} variant={darkMode ? 'default' : 'gradient-text'} textClassName={darkMode ? 'text-white text-lg font-bold' : 'text-lg font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent'} />
              <p className={`text-sm ${textSecondary} mt-4 leading-relaxed max-w-xs`}>
                All-in-one cryptocurrency platform with the lowest fees. Secure wallet with a convenient mobile app.
              </p>
            </div>

            {/* Column 2 - Products */}
            <div>
              <h4 className={`text-sm font-semibold ${textPrimary} mb-4 uppercase tracking-wider`}>Products</h4>
              <ul className="space-y-2.5">
                {[
                  { name: 'Payment Gateway', id: 'gateway' },
                  { name: 'Crypto Cards', id: 'cards' },
                  { name: 'Trading', id: 'trading' },
                  { name: 'Staking', id: 'staking' }
                ].map(item => (
                  <li key={item.name}>
                    <button onClick={() => onPageChange?.(item.id)} className={`text-sm ${textSecondary} ${hoverTextPrimary} transition-colors text-left`}>
                      {item.name}
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            {/* Column 3 - Resources */}
            <div>
              <h4 className={`text-sm font-semibold ${textPrimary} mb-4 uppercase tracking-wider`}>Resources</h4>
              <ul className="space-y-2.5">
                {[
                  { name: 'API Documentation', id: 'api' },
                  { name: 'Blog', id: 'blog' },
                  { name: 'Explorer', id: 'explorer' }
                ].map(item => (
                  <li key={item.name}>
                    <button onClick={() => onPageChange?.(item.id)} className={`text-sm ${textSecondary} ${hoverTextPrimary} transition-colors text-left`}>
                      {item.name}
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            {/* Column 4 - Wallet */}
            <div>
              <h4 className={`text-sm font-semibold ${textPrimary} mb-4 uppercase tracking-wider`}>Wallet</h4>
              <ul className="space-y-2.5">
                <li><button onClick={onGetStarted} className={`text-sm ${textSecondary} ${hoverTextPrimary} transition-colors`}>Create Wallet</button></li>
                <li><button onClick={onAccessWallet} className={`text-sm ${textSecondary} ${hoverTextPrimary} transition-colors`}>Open Wallet</button></li>
                <li><button onClick={onImportWallet} className={`text-sm ${textSecondary} ${hoverTextPrimary} transition-colors`}>Import Wallet</button></li>
                {onPrivacyClick && (
                  <li><button onClick={onPrivacyClick} className={`text-sm ${textSecondary} ${hoverTextPrimary} transition-colors`}>Privacy Policy</button></li>
                )}
              </ul>
            </div>
          </div>

          {/* Footer Bottom */}
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

      {/* PWA Install Modal */}
      <PWAInstallModal
        isOpen={showPWAModal}
        onClose={() => setShowPWAModal(false)}
        isIOS={isIOS}
      />
    </div>
  );
}