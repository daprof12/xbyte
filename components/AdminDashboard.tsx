import dataService from '../utils/dataService';
import feeService, { UserFeeOverride, AssetFeeConfig } from '../utils/feeService';
import { useState, useEffect } from 'react';
import { supabase } from '../utils/supabaseClient';
import { fetchUserWalletFromDB } from '../utils/supabaseHelpers';
import { useAdminUsers, useAdminFees, useAdminActivities, useAdminAuditLogs, useAdminTickets, useAdminChats } from '../hooks/useSupabaseData';
import { Users, DollarSign, Settings, FileText, ArrowLeft, Shield, Search, MoreVertical, Edit, Edit2, Trash, Trash2, Lock, Unlock, Eye, EyeOff, Activity, Coins, TrendingUp, TrendingDown, ArrowUpRight, ArrowDownLeft, RefreshCw, Check, Copy, Headphones, MessageCircle, Send, Phone, Mail, Clock, AlertCircle, CheckCircle, XCircle, User, LogOut, LogIn, KeyRound, Moon, Sun, Database, FileCheck, ShieldCheck, ExternalLink, Image, Upload, Loader2, Bell, Plus, Minus, Globe, RotateCcw, CheckCircle2, UserCheck, Sliders } from 'lucide-react';

import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Badge } from './ui/badge';
import { Switch } from './ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import Logo from './Logo';
import { generateAllAddresses, generateAddressForCoin } from '../utils/addressGenerator';
import { validateAddress } from '../utils/addressValidation';
import { copyToClipboard } from '../utils/clipboard';
import EditFeeModal from './admin/EditFeeModal';
import { loadAssetConfig, saveAssetConfig, AssetConfig } from '../utils/assetConfig';
import { fetchCryptoPrices } from '../utils/priceService';
import { formatDecimal, formatPercentage, formatBalance } from '../utils/formatNumber';
import MigrationPanel from './MigrationPanel';
import AdminMessaging from './admin/AdminMessaging';
import AdminUsersTab from './admin/AdminUsersTab';
import { storage } from '../utils/platform';

interface AdminDashboardProps {
  onBack: () => void;
  darkMode?: boolean;
  onToggleDarkMode?: () => void;
}

export default function AdminDashboard({ onBack, darkMode = false, onToggleDarkMode }: AdminDashboardProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [showUserDetails, setShowUserDetails] = useState(false);
  const [editCustomMessage, setEditCustomMessage] = useState('');
  const [editCustomMessageEnabled, setEditCustomMessageEnabled] = useState(false);
  const [showEditBalance, setShowEditBalance] = useState(false);
  const [showUserActivities, setShowUserActivities] = useState(false);
  const [showTransactionReceipt, setShowTransactionReceipt] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<any>(null);
  const [showLoginDetailsEdit, setShowLoginDetailsEdit] = useState(false);
  const [editLoginData, setEditLoginData] = useState<any>({});
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState(false);
  const [editBalances, setEditBalances] = useState<any>({});
  const [editAddresses, setEditAddresses] = useState<any>({});
  const [addressErrors, setAddressErrors] = useState<{[key: string]: string}>({});
  const [cardAdjustAmounts, setCardAdjustAmounts] = useState<{ [symbol: string]: string }>({});
  const [adjustingAsset, setAdjustingAsset] = useState<string | null>(null);
  const [copiedModalAddress, setCopiedModalAddress] = useState<string | null>(null);
  const [quickAdjust, setQuickAdjust] = useState({ asset: '', action: 'add', amount: '', note: '' });
  const [isQuickAdjusting, setIsQuickAdjusting] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<any>(null);
  const [showTicketDetails, setShowTicketDetails] = useState(false);
  const [ticketResponse, setTicketResponse] = useState('');
  const [ticketStatusFilter, setTicketStatusFilter] = useState<'all' | 'open' | 'in-progress' | 'resolved' | 'closed'>('all');
  const [selectedChat, setSelectedChat] = useState<any>(null);
  const [showChatDetails, setShowChatDetails] = useState(false);
  const [chatMessage, setChatMessage] = useState('');
  const [notificationMethod, setNotificationMethod] = useState<'email' | 'sms' | 'both'>('both');
  const [showCreateUser, setShowCreateUser] = useState(false);
  const [activeTab, setActiveTab] = useState('users');
  const [newUser, setNewUser] = useState({
    email: '',
    password: '',
    kyc_status: 'pending',
    balances: { BTC: '0', ETH: '0', SOL: '0', BNB: '0', USDT: '0' },
    addresses: { BTC: '', ETH: '', SOL: '', BNB: '', USDT: '' }
  });
  const [newUserAddressErrors, setNewUserAddressErrors] = useState<{[key: string]: string}>({});
  
  // KYC Review & Management State
  const [showKycModal, setShowKycModal] = useState(false);
  const [selectedKycUser, setSelectedKycUser] = useState<any>(null);
  const [kycForm, setKycForm] = useState({
    status: 'pending',
    fullName: '',
    dateOfBirth: '',
    country: '',
    idType: 'national_id',
    idNumber: '',
    address: '',
    documentFrontUrl: '',
    documentBackUrl: '',
    selfieUrl: '',
    adminNotes: '',
    rejectionReason: '',
  });
  const [isSavingKyc, setIsSavingKyc] = useState(false);
  const [showAdminSettings, setShowAdminSettings] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [adminProfile, setAdminProfile] = useState({
    id: '',
    name: 'Super Admin',
    email: 'admin3@pluto.com',
    role: 'super_admin'
  });
  const [adminPermissions, setAdminPermissions] = useState({
    allowed_tabs: [] as string[],
    allowed_user_ids: [] as string[]
  });

  useEffect(() => {
    storage.get('xbyte_admin_session').then((session) => {
      if (session) {
        setAdminProfile({
          id: session.user?.id || '',
          name: session.user?.full_name || 'Admin',
          email: session.email || 'admin@xbyte.com',
          role: session.role || 'admin'
        });
        setAdminPermissions(session.admin_permissions || { allowed_tabs: [], allowed_user_ids: [] });
        
        // If regular admin, ensure their active tab is one they have access to
        if (session.role !== 'super_admin' && session.admin_permissions?.allowed_tabs?.length > 0) {
          if (!session.admin_permissions.allowed_tabs.includes(activeTab)) {
            setActiveTab(session.admin_permissions.allowed_tabs[0]);
          }
        }
      }
    });
  }, []);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [editingFee, setEditingFee] = useState<{
    asset: string;
    data: any;
    targetUser?: { id: string; name?: string; email?: string } | null;
  } | null>(null);
  const [feeScope, setFeeScope] = useState<'global' | 'user'>('global');
  const [selectedFeeUserId, setSelectedFeeUserId] = useState<string | null>(null);
  const [feeAssetSearch, setFeeAssetSearch] = useState('');
  const [feeUserSearchQuery, setFeeUserSearchQuery] = useState('');
  const [userFeeOverrides, setUserFeeOverrides] = useState<Record<string, UserFeeOverride>>(() => feeService.getAllUserFeeOverrides());
  const [copiedDepositAddresses, setCopiedDepositAddresses] = useState<{[key: string]: boolean}>({});

  // Synchronize fee overrides from storage events
  useEffect(() => {
    const syncOverrides = () => {
      setUserFeeOverrides(feeService.getAllUserFeeOverrides());
    };
    window.addEventListener('fees_updated', syncOverrides);
    return () => window.removeEventListener('fees_updated', syncOverrides);
  }, []);

  // Coin Management States
  const [showCoinModal, setShowCoinModal] = useState(false);
  const [editingCoin, setEditingCoin] = useState<any>(null);
  const [coinForm, setCoinForm] = useState({
    symbol: '',
    name: '',
    color: 'bg-blue-500',
    icon: '₿',
    logoUrl: '',
    coinGeckoId: ''
  });

  // Real-time price data from CoinGecko API
  const [prices, setPrices] = useState<{[key: string]: number}>({
    BTC: 45230.50,
    ETH: 3420.75,
    SOL: 98.32,
    BNB: 315.60,
    USDT: 1.00
  });

  const [priceChanges, setPriceChanges] = useState<{[key: string]: number}>({
    BTC: 2.4,
    ETH: -1.2,
    SOL: 5.8,
    BNB: 3.1,
    USDT: 0.0
  });

  const [pricesLoading, setPricesLoading] = useState(false);
  const [lastPriceUpdate, setLastPriceUpdate] = useState<Date | null>(null);

  // Asset configurations loaded from centralized config
  const [assetConfig, setAssetConfig] = useState<AssetConfig[]>(loadAssetConfig());

  // Persist asset config changes to localStorage
  useEffect(() => {
    saveAssetConfig(assetConfig);
  }, [assetConfig]);

  // Fetch real-time cryptocurrency prices from CoinGecko
  useEffect(() => {
    const updatePrices = async () => {
      setPricesLoading(true);
      try {
        const symbols = assetConfig.map(asset => asset.symbol);
        const priceData = await fetchCryptoPrices(symbols);
        
        // Update prices state
        const newPrices: {[key: string]: number} = {};
        const newPriceChanges: {[key: string]: number} = {};
        
        symbols.forEach(symbol => {
          if (priceData[symbol]) {
            newPrices[symbol] = priceData[symbol].usd;
            newPriceChanges[symbol] = priceData[symbol].usd_24h_change;
          }
        });
        
        setPrices(newPrices);
        setPriceChanges(newPriceChanges);
        setLastPriceUpdate(new Date());
        
      } catch (error) {
        console.error('Failed to fetch prices:', error);
      } finally {
        setPricesLoading(false);
      }
    };

    // Fetch prices immediately on mount
    updatePrices();

    // Update prices every 60 seconds
    const interval = setInterval(updatePrices, 60000);

    return () => clearInterval(interval);
  }, [assetConfig]);

  // Load users from Supabase DB
  const { users, setUsers, loading: usersLoading, refetch: refetchUsers } = useAdminUsers();

  // Load fees from Supabase DB
  const { fees, setFees, loading: feesLoading } = useAdminFees();

  // Load user activities from Supabase DB
  const { activities: userActivities, setActivities: setUserActivities, loading: activitiesLoading, refetch: refetchActivities } = useAdminActivities();

  const getUserActivities = (userId: string) => userActivities[userId] || [];
  
  // Update user activities
  const updateUserActivities = async (userId: string, activities: any[]) => {
    const updatedActivities = { ...userActivities, [userId]: activities };
    setUserActivities(updatedActivities);
  };
  
  // Delete a specific transaction
  const handleDeleteTransaction = async (userId: string, transactionId: string) => {
    if (confirm('Are you sure you want to delete this transaction?')) {
      await supabase.from('transactions').delete().eq('id', transactionId);
      const userTransactions = getUserActivities(userId);
      const updatedTransactions = userTransactions.filter((tx: any) => tx.id !== transactionId);
      updateUserActivities(userId, updatedTransactions);
    }
  };
  
  // Update transaction status
  const handleUpdateTransactionStatus = async (userId: string, transactionId: string, newStatus: string) => {
    await supabase.from('transactions').update({ status: newStatus }).eq('id', transactionId);
    const userTransactions = getUserActivities(userId);
    const updatedTransactions = userTransactions.map((tx: any) => 
      tx.id === transactionId ? { ...tx, status: newStatus } : tx
    );
    updateUserActivities(userId, updatedTransactions);
  };

  // Calculate total balance in USD
  const calculateTotalBalance = (balances: any) => {
    let total = 0;
    if (balances) {
      Object.entries(balances).forEach(([asset, balance]) => {
        const price = prices[asset as keyof typeof prices] || 0;
        total += parseFloat(balance as string) * price;
      });
    }
    return total;
  };

  // Calculate total platform assets
  const calculatePlatformAssets = () => {
    const totals: any = {};
    assetConfig.forEach((asset: any) => {
      totals[asset.symbol] = { total: 0, users: 0, value: 0 };
    });

    users.forEach((user: any) => {
      if (user.balances) {
        Object.entries(user.balances).forEach(([asset, balance]) => {
          if (totals[asset]) {
            totals[asset].total += parseFloat(balance as string);
            if (parseFloat(balance as string) > 0) totals[asset].users += 1;
            totals[asset].value += parseFloat(balance as string) * prices[asset as keyof typeof prices];
          }
        });
      }
    });

    return totals;
  };

  // Load support tickets from Supabase
  const { tickets, setTickets, loading: ticketsLoading } = useAdminTickets();

  // Handle ticket status change
  const handleTicketStatusChange = async (ticketId: string, newStatus: string) => {
    const dbStatus = newStatus === 'in-progress' ? 'in_progress' : newStatus;
    await supabase.from('support_tickets').update({ status: dbStatus }).eq('id', ticketId);
    const updatedTickets = tickets.map((ticket: any) => {
      if (ticket.id === ticketId) {
        return { ...ticket, status: newStatus, updated: new Date().toISOString() };
      }
      return ticket;
    });
    setTickets(updatedTickets);
  };

  // Handle admin reply to ticket
  const handleAdminReply = async (ticketId: string, message: string) => {
    if (!message.trim()) return;

    // Update ticket status to in_progress in Supabase
    await supabase
      .from('support_tickets')
      .update({ status: 'in_progress', updated_at: new Date().toISOString() })
      .eq('id', ticketId);

    // Insert reply message
    await supabase.from('support_ticket_messages').insert({
        ticket_id: ticketId,
        message: message.trim(),
        is_admin_reply: true
    });
    
    addAuditLog('Support Reply', `Replied to support ticket ${ticketId}`);

    const updatedTickets = tickets.map((ticket: any) => {
      if (ticket.id === ticketId) {
        const newMessage = {
          sender: 'admin',
          senderName: 'Support Team',
          message: message.trim(),
          timestamp: new Date().toISOString()
        };
        return { 
          ...ticket, 
          status: 'in_progress',
          updated: new Date().toISOString(), 
          messages: [...(ticket.messages || []), newMessage] 
        };
      }
      return ticket;
    });
    setTickets(updatedTickets);
    setTicketResponse('');
  };

  // Load live chats from Supabase
  const { chats, setChats, loading: chatsLoading } = useAdminChats();
  const [chatStatusFilter, setChatStatusFilter] = useState<'all' | 'active' | 'resolved'>('all');

  // Load audit logs from Supabase
  const { logs: auditLogs, setLogs: setAuditLogs, loading: logsLoading } = useAdminAuditLogs(adminProfile.role === 'super_admin' ? undefined : adminProfile.id);

  const addAuditLog = async (action: string, details: string) => {
    const logData = {
      admin_id: adminProfile.id || null,
      action,
      metadata: { details },
      ip_address: '127.0.0.1' // In a real app this would come from the server
    };
    const { data, error } = await supabase.from('audit_logs').insert(logData).select('*, users(email)').single();
    if (!error && data) {
      const mappedLog = {
        id: data.id,
        admin: data.users?.email || data.admin_id || 'System',
        action: data.action,
        details: data.metadata?.details || '',
        timestamp: data.created_at,
        ip: data.ip_address
      };
      setAuditLogs([mappedLog, ...auditLogs]);
    }
  };

  // Persist audit logs to localStorage whenever they change
  useEffect(() => {
    dataService.setItem('xbyte_admin_audit_logs', JSON.stringify(auditLogs));
  }, [auditLogs]);

  const handleLoginAsUser = async (user: any) => {
    try {
      // 1. Fetch full user wallet data
      const walletData = await fetchUserWalletFromDB(user.id);
      
      // 2. Set wallet in storage
      dataService.setItem('xbyte_wallet', JSON.stringify(walletData));
      
      // 3. Set auto-login flag
      localStorage.setItem('xbyte_auto_login', 'true');
      
      // 4. Open in new tab
      window.open(window.location.origin, '_blank');
    } catch (e: any) {
      console.error('Failed to login as user:', e);
      alert(`Error logging in as user: ${e.message}`);
    }
  };

  const handleViewDetails = (user: any) => {
    setSelectedUser(user);
    setEditCustomMessage(user.customMessage || '');
    setEditCustomMessageEnabled(user.customMessageEnabled || false);
    setShowUserDetails(true);
  };

  const handleSaveCustomMessage = () => {
    if (!selectedUser) return;
    const updatedUser = { 
      ...selectedUser, 
      customMessage: editCustomMessage, 
      customMessageEnabled: editCustomMessageEnabled 
    };
    const updatedUsers = users.map((u: any) => u.id === selectedUser.id ? updatedUser : u);
    setUsers(updatedUsers);
    dataService.setItem('xbyte_admin_users', JSON.stringify(updatedUsers));
    setSelectedUser(updatedUser);

    // Sync to Supabase metadata
    const newMetadata = {
      ...(selectedUser.metadata || {}),
      kyc_status: selectedUser.kyc_status || 'pending',
      kyc_data: selectedUser.kyc_data || (selectedUser.metadata && selectedUser.metadata.kyc_data) || null,
      balances: selectedUser.balances || {},
      addresses: selectedUser.addresses || {},
      twoFactorAuth: selectedUser.twoFactorAuth || {},
      customMessage: editCustomMessage,
      customMessageEnabled: editCustomMessageEnabled
    };

    supabase
      .from('users')
      .update({ metadata: newMetadata })
      .eq('id', selectedUser.id)
      .then(({ error }) => {
        if (error) {
          console.error('Error updating user metadata in Supabase:', error.message);
        }
      });

    alert('Custom message updated successfully!');
  };

  const handleOpenKycModal = (user: any) => {
    setSelectedKycUser(user);
    const kyc = user.kyc_data || (user.metadata && user.metadata.kyc_data) || {};
    setKycForm({
      status: user.kyc_status || user.metadata?.kyc_status || 'pending',
      fullName: kyc.fullName || kyc.full_name || user.full_name || '',
      dateOfBirth: kyc.dateOfBirth || kyc.date_of_birth || '',
      country: kyc.country || kyc.nationality || '',
      idType: kyc.idType || kyc.id_type || 'national_id',
      idNumber: kyc.idNumber || kyc.id_number || '',
      address: kyc.address || '',
      documentFrontUrl: kyc.documentFrontUrl || kyc.document_url || '',
      documentBackUrl: kyc.documentBackUrl || kyc.document_back_url || '',
      selfieUrl: kyc.selfieUrl || kyc.selfie_url || '',
      adminNotes: kyc.adminNotes || kyc.admin_notes || '',
      rejectionReason: kyc.rejectionReason || kyc.rejection_reason || ''
    });
    setShowKycModal(true);
  };

  const handleSaveKycData = async (overrideStatus?: string) => {
    if (!selectedKycUser) return;
    setIsSavingKyc(true);
    try {
      const finalStatus = overrideStatus || kycForm.status;
      const updatedKycData = {
        ...(selectedKycUser.kyc_data || (selectedKycUser.metadata && selectedKycUser.metadata.kyc_data) || {}),
        fullName: kycForm.fullName,
        full_name: kycForm.fullName,
        dateOfBirth: kycForm.dateOfBirth,
        date_of_birth: kycForm.dateOfBirth,
        country: kycForm.country,
        nationality: kycForm.country,
        idType: kycForm.idType,
        id_type: kycForm.idType,
        idNumber: kycForm.idNumber,
        id_number: kycForm.idNumber,
        address: kycForm.address,
        documentFrontUrl: kycForm.documentFrontUrl,
        document_url: kycForm.documentFrontUrl,
        documentBackUrl: kycForm.documentBackUrl,
        document_back_url: kycForm.documentBackUrl,
        selfieUrl: kycForm.selfieUrl,
        selfie_url: kycForm.selfieUrl,
        adminNotes: kycForm.adminNotes,
        admin_notes: kycForm.adminNotes,
        rejectionReason: kycForm.rejectionReason,
        rejection_reason: kycForm.rejectionReason,
        status: finalStatus,
        reviewed_at: new Date().toISOString()
      };

      const updatedUserMetadata = {
        ...(selectedKycUser.metadata || {}),
        kyc_status: finalStatus,
        kyc_data: updatedKycData,
        balances: selectedKycUser.balances || {},
        addresses: selectedKycUser.addresses || {},
        twoFactorAuth: selectedKycUser.twoFactorAuth || {},
        customMessage: selectedKycUser.customMessage || '',
        customMessageEnabled: selectedKycUser.customMessageEnabled || false
      };

      // 1. Update in-memory users state
      const updatedUsers = users.map((u: any) => 
        u.id === selectedKycUser.id 
          ? { 
              ...u, 
              kyc_status: finalStatus, 
              kyc_data: updatedKycData, 
              full_name: kycForm.fullName || u.full_name,
              metadata: updatedUserMetadata 
            } 
          : u
      );
      setUsers(updatedUsers);
      dataService.setItem('xbyte_admin_users', JSON.stringify(updatedUsers));

      // Also update selectedUser if user details modal is open
      if (selectedUser && selectedUser.id === selectedKycUser.id) {
        setSelectedUser({
          ...selectedUser,
          kyc_status: finalStatus,
          kyc_data: updatedKycData,
          full_name: kycForm.fullName || selectedUser.full_name,
          metadata: updatedUserMetadata
        });
      }

      // 2. Sync to Supabase
      const { error } = await supabase
        .from('users')
        .update({
          full_name: kycForm.fullName || undefined,
          metadata: updatedUserMetadata
        })
        .eq('id', selectedKycUser.id);

      if (error) {
        console.error('Error updating user KYC in Supabase:', error.message);
        alert(`Failed to save KYC to Supabase: ${error.message}`);
      } else {
        // Also update local wallet if the currently active wallet is this user
        const storedWallet = dataService.getItem('xbyte_wallet');
        if (storedWallet) {
          try {
            const parsed = JSON.parse(storedWallet);
            if (parsed.id === selectedKycUser.id) {
              const updatedWallet = {
                ...parsed,
                kyc_status: finalStatus,
                kyc_data: updatedKycData
              };
              dataService.setItem('xbyte_wallet', JSON.stringify(updatedWallet));
              window.dispatchEvent(new CustomEvent('walletDataUpdated', {
                detail: { walletData: updatedWallet }
              }));
            }
          } catch (e) {
            console.error('Error updating xbyte_wallet:', e);
          }
        }

        addAuditLog('Update KYC', `Updated KYC status to ${finalStatus} for ${selectedKycUser.email}`);
        alert(`KYC status updated to ${finalStatus.toUpperCase()} successfully!`);
        setShowKycModal(false);
      }
    } catch (err: any) {
      console.error('KYC update error:', err);
      alert(`Error updating KYC: ${err.message || err}`);
    } finally {
      setIsSavingKyc(false);
    }
  };

  const handleQuickUpdateKycStatus = async (user: any, newStatus: string) => {
    setSelectedKycUser(user);
    const kyc = user.kyc_data || (user.metadata && user.metadata.kyc_data) || {};
    const updatedKycData = {
      ...kyc,
      status: newStatus,
      reviewed_at: new Date().toISOString()
    };

    const updatedUserMetadata = {
      ...(user.metadata || {}),
      kyc_status: newStatus,
      kyc_data: updatedKycData,
      balances: user.balances || {},
      addresses: user.addresses || {},
      twoFactorAuth: user.twoFactorAuth || {},
      customMessage: user.customMessage || '',
      customMessageEnabled: user.customMessageEnabled || false
    };

    const updatedUsers = users.map((u: any) => 
      u.id === user.id ? { ...u, kyc_status: newStatus, kyc_data: updatedKycData, metadata: updatedUserMetadata } : u
    );
    setUsers(updatedUsers);
    dataService.setItem('xbyte_admin_users', JSON.stringify(updatedUsers));

    if (selectedUser && selectedUser.id === user.id) {
      setSelectedUser({
        ...selectedUser,
        kyc_status: newStatus,
        kyc_data: updatedKycData,
        metadata: updatedUserMetadata
      });
    }

    const { error } = await supabase
      .from('users')
      .update({ metadata: updatedUserMetadata })
      .eq('id', user.id);

    if (error) {
      console.error('Error updating KYC status in Supabase:', error.message);
      alert(`Failed to update status: ${error.message}`);
    } else {
      const storedWallet = dataService.getItem('xbyte_wallet');
      if (storedWallet) {
        try {
          const parsed = JSON.parse(storedWallet);
          if (parsed.id === user.id) {
            const updatedWallet = {
              ...parsed,
              kyc_status: newStatus,
              kyc_data: updatedKycData
            };
            dataService.setItem('xbyte_wallet', JSON.stringify(updatedWallet));
            window.dispatchEvent(new CustomEvent('walletDataUpdated', {
              detail: { walletData: updatedWallet }
            }));
          }
        } catch (e) {
          console.error('Error updating xbyte_wallet:', e);
        }
      }
      addAuditLog('Update KYC Status', `Quick-updated KYC to ${newStatus} for ${user.email}`);
      alert(`User KYC marked as ${newStatus.toUpperCase()}!`);
    }
  };

  const handleAdminKycFileUpload = (e: React.ChangeEvent<HTMLInputElement>, field: 'front' | 'back' | 'selfie') => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        if (field === 'front') setKycForm(prev => ({ ...prev, documentFrontUrl: result }));
        if (field === 'back') setKycForm(prev => ({ ...prev, documentBackUrl: result }));
        if (field === 'selfie') setKycForm(prev => ({ ...prev, selfieUrl: result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleEditBalance = (user: any) => {
    setSelectedUser(user);
    const initialBalances: { [key: string]: string } = {};
    const initialAddresses: { [key: string]: string } = {};
    assetConfig.forEach(a => {
      initialBalances[a.symbol] = user.balances?.[a.symbol] !== undefined ? String(user.balances[a.symbol]) : '0';
      initialAddresses[a.symbol] = user.addresses?.[a.symbol] || '';
    });
    if (user.balances) {
      Object.keys(user.balances).forEach(k => {
        if (!(k in initialBalances)) initialBalances[k] = String(user.balances[k]);
      });
    }
    if (user.addresses) {
      Object.keys(user.addresses).forEach(k => {
        if (!(k in initialAddresses)) initialAddresses[k] = String(user.addresses[k]);
      });
    }
    setEditBalances(initialBalances);
    setEditAddresses(initialAddresses);
    setAddressErrors({});
    setCardAdjustAmounts({});
    setShowEditBalance(true);
  };

  const handleCopyModalAddress = (asset: string, address: string) => {
    if (!address) return;
    copyToClipboard(address);
    setCopiedModalAddress(asset);
    setTimeout(() => setCopiedModalAddress(null), 2000);
  };

  const handleCardAdjustBalance = async (asset: string, action: 'add' | 'deduct') => {
    if (!selectedUser) return;
    const amountStr = cardAdjustAmounts[asset];
    if (!amountStr) {
      alert('Please enter an amount to adjust');
      return;
    }
    const amt = parseFloat(amountStr);
    if (isNaN(amt) || amt <= 0) {
      alert('Please enter a valid positive amount');
      return;
    }
    setAdjustingAsset(asset);
    try {
      const cur = parseFloat(editBalances[asset] || '0');
      const newBal = action === 'add' ? cur + amt : Math.max(0, cur - amt);
      const updated = { ...editBalances, [asset]: formatDecimal(newBal) };
      setEditBalances(updated);

      const note = action === 'add' 
        ? `Admin credited ${formatDecimal(amt)} ${asset}` 
        : `Admin debited ${formatDecimal(amt)} ${asset}`;
      
      const tx = {
        id: `txn_${Date.now()}_${asset}`,
        type: action === 'add' ? 'credit' : 'debit',
        asset: asset,
        amount: formatDecimal(amt),
        timestamp: new Date().toISOString(),
        status: 'completed',
        hash: `0x${Math.random().toString(16).substring(2, 66)}`,
        to: action === 'add' ? (editAddresses[asset] || selectedUser.addresses?.[asset] || 'User Wallet') : 'Admin Adjustment',
        from: action === 'add' ? 'Admin' : (editAddresses[asset] || selectedUser.addresses?.[asset] || 'User Wallet'),
        fee: '0',
        gasFee: '0',
        network: 'Unknown',
        confirmations: 15,
        requiredConfirmations: 15,
        notes: note
      };

      const allUsers = users.map(u => u.id === selectedUser.id ? { ...u, balances: updated } : u);
      dataService.setItem('xbyte_admin_users', JSON.stringify(allUsers));
      setUsers(allUsers);

      const userActivities = JSON.parse(dataService.getItem('xbyte_user_activities') || '{}');
      if (!userActivities[selectedUser.id]) userActivities[selectedUser.id] = [];
      userActivities[selectedUser.id].unshift(tx);
      dataService.setItem('xbyte_user_activities', JSON.stringify(userActivities));

      const userWallet = dataService.getItem('xbyte_wallet');
      if (userWallet) {
        const wd = JSON.parse(userWallet);
        if (wd.id === selectedUser.id) {
          const updatedWallet = { ...wd, balances: updated, transactions: [tx, ...(wd.transactions || [])] };
          dataService.setItem('xbyte_wallet', JSON.stringify(updatedWallet));
          window.dispatchEvent(new CustomEvent('walletDataUpdated', { detail: { walletData: updatedWallet } }));
        }
      }

      const { data: assetRows } = await supabase.from('assets').select('id,symbol');
      const { data: walletRow } = await supabase.from('wallets').select('id').eq('user_id', selectedUser.id).eq('is_primary', true).maybeSingle();
      if (walletRow && assetRows) {
        const a = assetRows.find((ar: any) => ar.symbol === asset);
        if (a) await supabase.from('wallet_balances').upsert({ wallet_id: walletRow.id, asset_id: a.id, balance: newBal }, { onConflict: 'wallet_id,asset_id' });
        await supabase.from('transactions').insert({
          wallet_id: walletRow.id,
          user_id: selectedUser.id,
          type: tx.type,
          status: 'completed',
          asset_id: a?.id || null,
          asset_symbol: asset,
          amount: amt,
          from_address: tx.from,
          to_address: tx.to,
          network: 'Unknown',
          hash: tx.hash,
          fee: 0,
          notes: note
        });
      }

      setCardAdjustAmounts(prev => ({ ...prev, [asset]: '' }));
      alert(`✅ ${action === 'add' ? 'Added' : 'Deducted'} ${formatDecimal(amt)} ${asset} ${action === 'add' ? 'to' : 'from'} ${selectedUser.email}`);
    } catch (e: any) {
      alert('Error adjusting balance: ' + (e?.message || e));
    } finally {
      setAdjustingAsset(null);
    }
  };

  const handleViewActivities = (user: any) => {
    setSelectedUser(user);
    setShowUserActivities(true);
  };

  const handleBlockUser = (userId: string) => {
    const userToUpdate = users.find(u => u.id === userId);
    if (!userToUpdate) return;
    const newBlocked = !userToUpdate.blocked;
    const newStatus = newBlocked ? 'blocked' : 'active';

    const updatedUsers = users.map(u => u.id === userId ? { ...u, blocked: newBlocked, status: newStatus } : u);
    setUsers(updatedUsers);
    dataService.setItem('xbyte_admin_users', JSON.stringify(updatedUsers));

    // Sync status update to Supabase
    supabase
      .from('users')
      .update({ status: newStatus })
      .eq('id', userId)
      .then(({ error }) => {
        if (error) {
          console.error('Error updating user status in Supabase:', error.message);
        } else {
          addAuditLog(newBlocked ? 'Block User' : 'Unblock User', `${newBlocked ? 'Blocked' : 'Unblocked'} user ${userToUpdate.email}`);
        }
      });
  };

  const handleDeleteUser = (userId: string) => {
    if (confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      const updatedUsers = users.filter(u => u.id !== userId);
      setUsers(updatedUsers);
      dataService.setItem('xbyte_admin_users', JSON.stringify(updatedUsers));

      // Sync delete to Supabase (cascades automatically depending on foreign keys)
      supabase
        .from('users')
        .delete()
        .eq('id', userId)
        .then(({ error }) => {
          if (error) {
            console.error('Error deleting user from Supabase:', error.message);
          } else {
            addAuditLog('Delete User', `Deleted user with ID ${userId}`);
          }
        });
    }
  };

  const handleAddressChange = (asset: string, value: string) => {
    setEditAddresses({ ...editAddresses, [asset]: value });
    
    // Validate address if not empty
    if (value && value.trim()) {
      const validation = validateAddress(value, asset);
      if (!validation.isValid) {
        setAddressErrors({ ...addressErrors, [asset]: validation.error || 'Invalid address' });
      } else {
        // Remove error if validation passes
        const newErrors = { ...addressErrors };
        delete newErrors[asset];
        setAddressErrors(newErrors);
      }
    } else {
      // Remove error if field is empty
      const newErrors = { ...addressErrors };
      delete newErrors[asset];
      setAddressErrors(newErrors);
    }
  };

  const handleUpdateBalance = () => {
    // Check if there are any validation errors
    if (Object.keys(addressErrors).length > 0) {
      alert('Please fix invalid addresses before saving');
      return;
    }

    // Get original balances before update to calculate differences
    const originalBalances = selectedUser.balances;
    const newBalances = editBalances;
    
    // Create transactions for each asset that changed
    const balanceChangeTransactions: any[] = [];
    const assets = loadAssetConfig();
    
    Object.keys(newBalances).forEach(asset => {
      const oldBalance = parseFloat(originalBalances[asset] || '0');
      const newBalance = parseFloat(newBalances[asset] || '0');
      const difference = newBalance - oldBalance;
      
      // Only create transaction if balance actually changed
      if (difference !== 0) {
        const assetInfo = assets.find(a => a.symbol === asset);
        const network = asset === 'BTC' ? 'Bitcoin' : 
                       asset === 'ETH' ? 'Ethereum' : 
                       asset === 'SOL' ? 'Solana' : 
                       asset === 'BNB' ? 'BNB Smart Chain' : 
                       asset === 'TRX' ? 'TRON' : 'Unknown';
        
        const transaction = {
          id: `txn_${Date.now()}_${asset}_${Math.random().toString(16).substring(2, 10)}`,
          type: difference > 0 ? 'credit' : 'debit',
          asset: asset,
          amount: formatDecimal(Math.abs(difference)),
          timestamp: new Date().toISOString(),
          status: 'completed',
          hash: `0x${Math.random().toString(16).substring(2, 66)}`,
          to: difference > 0 ? (editAddresses[asset] || selectedUser.addresses?.[asset] || 'User Wallet') : 'Admin Adjustment',
          from: difference > 0 ? 'Admin' : (editAddresses[asset] || selectedUser.addresses?.[asset] || 'User Wallet'),
          fee: '0',
          gasFee: '0',
          totalDeducted: difference < 0 ? formatDecimal(Math.abs(difference)) : undefined,
          network: network,
          confirmations: 15,
          requiredConfirmations: 15,
          notes: difference > 0 ? `Admin credited ${formatDecimal(Math.abs(difference))} ${asset}` : `Admin debited ${formatDecimal(Math.abs(difference))} ${asset}`
        };
        
        balanceChangeTransactions.push(transaction);
      }
    });

    const updatedUsers = users.map(u => 
      u.id === selectedUser.id ? { ...u, balances: editBalances, addresses: editAddresses } : u
    );
    setUsers(updatedUsers);
    
    // Persist to localStorage
    dataService.setItem('xbyte_admin_users', JSON.stringify(updatedUsers));
    
    // CRITICAL: Sync balance changes to user's wallet if they're currently logged in
    const userWallet = dataService.getItem('xbyte_wallet');
    if (userWallet) {
      const walletData = JSON.parse(userWallet);
      // Check if the updated user is the currently logged in user
      if (walletData.id === selectedUser.id) {
        // Add new transactions to the wallet
        const existingTransactions = walletData.transactions || [];
        const updatedTransactions = [...existingTransactions, ...balanceChangeTransactions];
        
        // Update the user's wallet with new balances, addresses, and transactions
        const updatedWallet = {
          ...walletData,
          balances: editBalances,
          addresses: editAddresses,
          transactions: updatedTransactions
        };
        dataService.setItem('xbyte_wallet', JSON.stringify(updatedWallet));
        
        // Dispatch custom event to notify user wallet to refresh (same-tab updates)
        window.dispatchEvent(new CustomEvent('walletDataUpdated', {
          detail: { walletData: updatedWallet }
        }));
        
        // Also dispatch storage event for cross-tab updates
        window.dispatchEvent(new StorageEvent('storage', {
          key: 'xbyte_wallet',
          newValue: JSON.stringify(updatedWallet),
          oldValue: userWallet,
          storageArea: localStorage,
          url: window.location.href
        }));
      }
    }
    
    // Update admin user activities with new transactions
    if (balanceChangeTransactions.length > 0) {
      const userActivities = JSON.parse(dataService.getItem('xbyte_user_activities') || '{}');
      if (!userActivities[selectedUser.id]) {
        userActivities[selectedUser.id] = [];
      }
      userActivities[selectedUser.id].push(...balanceChangeTransactions);
      dataService.setItem('xbyte_user_activities', JSON.stringify(userActivities));
    }

    // Sync to Supabase database in background
    (async () => {
      try {
        // 1. Always update users table metadata (balances + addresses + custom message)
        const updatedMetadata = {
          ...(selectedUser.metadata || {}),
          kyc_status: selectedUser.kyc_status || 'pending',
          kyc_data: selectedUser.kyc_data || (selectedUser.metadata && selectedUser.metadata.kyc_data) || null,
          balances: editBalances,
          addresses: editAddresses,
          twoFactorAuth: selectedUser.twoFactorAuth || {},
          customMessage: selectedUser.customMessage || '',
          customMessageEnabled: selectedUser.customMessageEnabled || false
        };
        
        const { error: userUpdateError } = await supabase
          .from('users')
          .update({
            wallet_address: editAddresses,
            metadata: updatedMetadata
          })
          .eq('id', selectedUser.id);
        
        if (userUpdateError) {
          console.error('Error updating users table:', userUpdateError.message);
        }

        // 2. Find or create wallet row
        let { data: wallet } = await supabase
          .from('wallets')
          .select('id')
          .eq('user_id', selectedUser.id)
          .eq('is_primary', true)
          .maybeSingle();

        if (!wallet) {
          // Auto-create a wallet row for this user
          const { data: newWallet, error: createError } = await supabase
            .from('wallets')
            .insert({
              user_id: selectedUser.id,
              name: 'Main Wallet',
              mnemonic_encrypted: '',
              encryption_salt: selectedUser.id,
              is_primary: true
            })
            .select()
            .single();
          
          if (createError) {
            console.error('Error creating wallet row:', createError.message);
            return;
          }
          wallet = newWallet;
        }

        const walletId = wallet.id;
        const { data: assets } = await supabase.from('assets').select('id, symbol');
        if (!assets) return;

        // 3. Sync balances in wallet_balances
        for (const [symbol, balance] of Object.entries(editBalances)) {
          const asset = assets.find(a => a.symbol === symbol);
          if (asset) {
            await supabase.from('wallet_balances').upsert({
              wallet_id: walletId,
              asset_id: asset.id,
              balance: parseFloat(balance as string) || 0
            }, { onConflict: 'wallet_id,asset_id' });
          }
        }

        // 4. Sync addresses in wallet_addresses
        for (const [symbol, address] of Object.entries(editAddresses)) {
          const asset = assets.find(a => a.symbol === symbol);
          if (asset && address) {
            await supabase.from('wallet_addresses').upsert({
              wallet_id: walletId,
              asset_id: asset.id,
              address: address as string,
              is_primary: true
            }, { onConflict: 'wallet_id,asset_id,address' });
          }
        }

        // 5. Sync new transactions to transactions table
        if (balanceChangeTransactions.length > 0) {
          for (const tx of balanceChangeTransactions) {
            const asset = assets.find(a => a.symbol === tx.asset);
            await supabase
              .from('transactions')
              .insert({
                wallet_id: walletId,
                user_id: selectedUser.id,
                type: tx.type,
                status: tx.status,
                asset_id: asset?.id || null,
                asset_symbol: tx.asset,
                amount: parseFloat(tx.amount) || 0,
                from_address: tx.from || null,
                to_address: tx.to || null,
                network: tx.network || '',
                hash: tx.hash,
                fee: tx.fee ? parseFloat(tx.fee) : 0,
                notes: tx.notes || ''
              });
          }
        }

        console.log('✅ Admin balance/address update synced to Supabase for user:', selectedUser.id);
        
        // Log the activity
        addAuditLog('Update User Balance', `Updated balance or addresses for user ${selectedUser.email}`);
        
        // Re-fetch activities from DB to ensure admin sees latest data
        refetchActivities();
      } catch (err) {
        console.error('Error syncing admin update to Supabase:', err);
      }
    })();
    
    setShowEditBalance(false);
    setSelectedUser(null);
    setAddressErrors({});
  };

  const handleEditLoginDetails = (user: any) => {
    setSelectedUser(user);
    setEditLoginData({
      password: '',
      newPassword: '',
      confirmPassword: '',
      twoFactorEnabled: user.twoFactorAuth?.enabled || false,
      twoFactorMethod: user.twoFactorAuth?.preferredMethod || 'passcode',
      passcode: user.twoFactorAuth?.passcode || '',
      biometricEnabled: user.twoFactorAuth?.biometricEnabled || false,
      accountLocked: user.accountLocked || false,
      failedLoginAttempts: user.failedLoginAttempts || 0
    });
    setShowLoginDetailsEdit(true);
  };

  const handleUpdateLoginDetails = () => {
    const updatedUser = { ...selectedUser };

    // Update password if new password is provided (local state only, password changes happen via GoTrue reset/client)
    if (editLoginData.newPassword && editLoginData.newPassword === editLoginData.confirmPassword) {
      updatedUser.password = editLoginData.newPassword;
      updatedUser.passwordLastChanged = new Date().toISOString();
    }

    // Validate 4-digit passcode if passcode method is selected and enabled
    if (editLoginData.twoFactorEnabled && editLoginData.twoFactorMethod === 'passcode') {
      if (!editLoginData.passcode || editLoginData.passcode.length !== 4) {
        alert('Passcode must be exactly 4 digits');
        return;
      }
    }

    // Update 2FA settings
    updatedUser.twoFactorAuth = {
      enabled: editLoginData.twoFactorEnabled,
      preferredMethod: editLoginData.twoFactorMethod,
      passcode: editLoginData.passcode,
      biometricEnabled: editLoginData.biometricEnabled,
      biometricData: editLoginData.biometricEnabled ? updatedUser.twoFactorAuth?.biometricData || 'admin_set_biometric' : null,
      setupDate: editLoginData.twoFactorEnabled ? (updatedUser.twoFactorAuth?.setupDate || new Date().toISOString()) : null
    };

    // Update account lock status
    updatedUser.accountLocked = editLoginData.accountLocked;
    updatedUser.failedLoginAttempts = editLoginData.failedLoginAttempts;

    // Update local state and storage
    const updatedUsers = users.map(u => u.id === selectedUser.id ? updatedUser : u);
    setUsers(updatedUsers);
    dataService.setItem('xbyte_admin_users', JSON.stringify(updatedUsers));

    // Sync to Supabase in background
    const newMetadata = {
      ...(selectedUser.metadata || {}),
      kyc_status: selectedUser.kyc_status || 'pending',
      kyc_data: selectedUser.kyc_data || (selectedUser.metadata && selectedUser.metadata.kyc_data) || null,
      balances: selectedUser.balances || {},
      addresses: selectedUser.addresses || {},
      twoFactorAuth: updatedUser.twoFactorAuth,
      customMessage: selectedUser.customMessage || '',
      customMessageEnabled: selectedUser.customMessageEnabled || false
    };

    supabase
      .from('users')
      .update({ metadata: newMetadata })
      .eq('id', selectedUser.id)
      .then(({ error }) => {
        if (error) {
          console.error('Error updating user login details in Supabase:', error.message);
        }
      });

    setShowLoginDetailsEdit(false);
    setSelectedUser(null);
    alert('Login & 2FA details updated successfully!');
  };

  const handleResetPassword = () => {
    if (!editLoginData.newPassword) {
      alert('Please enter a new password');
      return;
    }
    if (editLoginData.newPassword !== editLoginData.confirmPassword) {
      alert('Passwords do not match');
      return;
    }
    handleUpdateLoginDetails();
  };

  const handleViewTicket = (ticket: any) => {
    setSelectedTicket(ticket);
    setTicketResponse('');
    setShowTicketDetails(true);
  };

  const handleUpdateTicket = (ticketId: string, status: string) => {
    handleTicketStatusChange(ticketId, status);
    if (selectedTicket?.id === ticketId) {
      setSelectedTicket({ ...selectedTicket, status });
    }
  };

  const handleSendTicketResponse = () => {
    if (!ticketResponse.trim() || !selectedTicket) return;

    handleAdminReply(selectedTicket.id, ticketResponse);
    
    // Update selected ticket to show the new message immediately
    const updatedTicket = tickets.find(t => t.id === selectedTicket.id);
    if (updatedTicket) {
      setSelectedTicket(updatedTicket);
    }

    const response = {
      admin: 'admin3@pluto.com',
      message: ticketResponse,
      timestamp: new Date().toISOString()
    };

    setTickets(tickets.map(t => 
      t.id === selectedTicket.id 
        ? { 
            ...t, 
            responses: [...t.responses, response],
            status: 'in_progress',
            updated_at: new Date().toISOString()
          } 
        : t
    ));

    setSelectedTicket({
      ...selectedTicket,
      responses: [...selectedTicket.responses, response],
      status: 'in_progress'
    });

    // Simulate email/SMS notification
    sendNotification(selectedTicket, ticketResponse);

    setTicketResponse('');
    alert('Response sent successfully! User will be notified via ' + notificationMethod);
  };

  const sendNotification = (ticket: any, message: string) => {
    // This would integrate with actual email/SMS services
    console.log('Sending notification:', {
      method: notificationMethod,
      email: ticket.user_email,
      subject: `Update on your ticket: ${ticket.subject}`,
      message: message
    });
  };

  const handleViewChat = (chat: any) => {
    setSelectedChat(chat);
    setChatMessage('');
    setShowChatDetails(true);
    
    // Mark as read
    setChats(chats.map(c => 
      c.id === chat.id ? { ...c, unread_count: 0 } : c
    ));
  };

  const handleSendChatMessage = async () => {
    if (!chatMessage.trim() || !selectedChat) return;

    const msgText = chatMessage.trim();
    setChatMessage('');

    const { error } = await supabase.from('live_chat_messages').insert({
      chat_id: selectedChat.id,
      message: msgText,
      is_admin: true
    });

    if (error) {
      console.error('Error sending chat message from admin:', error.message);
      alert('Failed to send live chat message.');
      return;
    }

    // Refresh chat messages
    const { data: messagesData } = await supabase
      .from('live_chat_messages')
      .select('*')
      .eq('chat_id', selectedChat.id)
      .order('created_at', { ascending: true });

    if (messagesData) {
      const mappedMessages = messagesData.map((m: any) => ({
        sender: m.is_admin ? 'admin' : 'user',
        senderName: m.is_admin ? 'Support Agent' : (selectedChat.userName || 'User'),
        message: m.message,
        timestamp: m.created_at
      }));

      const updatedChat = {
        ...selectedChat,
        messages: mappedMessages,
        updated: new Date().toISOString()
      };

      setChats(chats.map(c => c.id === selectedChat.id ? updatedChat : c));
      setSelectedChat(updatedChat);
    }

    // Simulate WhatsApp/Telegram notification
    console.log(`📱 WhatsApp notification sent to ${selectedChat.userEmail || selectedChat.user_email}: "${msgText}"`);

    setChatMessage('');
  };

  const sendChatToIntegration = (chat: any, message: string) => {
    // This would integrate with WhatsApp Business API or Telegram Bot API

    if (chat.telegram_connected) {
      console.log('Sending to Telegram:', {
        user: chat.user_email,
        message: message
      });
    }
  };

  const handleCreateUser = () => {
    // Validate required fields
    if (!newUser.email || !newUser.password) {
      alert('Please fill in all required fields: Email and Password');
      return;
    }

    // Check if there are any address validation errors
    if (Object.keys(newUserAddressErrors).length > 0) {
      alert('Please fix invalid addresses before creating user');
      return;
    }
    
    // Auto-generate any missing addresses
    const finalAddresses = { ...newUser.addresses };
    Object.keys(finalAddresses).forEach(asset => {
      if (!finalAddresses[asset]) {
        finalAddresses[asset] = generateRandomAddress(asset);
      }
    });

    // Call Supabase RPC to create user in Auth and DB
    (async () => {
      try {
        const { data: newUserId, error: createError } = await supabase.rpc('admin_create_user', {
          p_email: newUser.email,
          p_password: newUser.password,
          p_kyc_status: newUser.kyc_status,
          p_balances: newUser.balances,
          p_addresses: finalAddresses
        });

        if (createError) {
          console.error('Error creating user in Supabase:', createError.message);
          alert(`Error creating user: ${createError.message}`);
          return;
        }

        console.log('✅ User created successfully in Supabase. ID:', newUserId);
        
        // Create new user object with the real UUID
        const userToCreate = {
          id: newUserId,
          email: newUser.email,
          kyc_status: newUser.kyc_status,
          created_at: new Date().toISOString(),
          last_login: new Date().toISOString(),
          blocked: false,
          balances: newUser.balances,
          addresses: finalAddresses,
          role: 'user'
        };

        // Add to users array
        const updatedUsers = [...users, userToCreate];
        setUsers(updatedUsers);
        
        // Persist to localStorage
        dataService.setItem('xbyte_admin_users', JSON.stringify(updatedUsers));

        // Reset form and close modal
        setNewUser({
          email: '',
          password: '',
          kyc_status: 'pending',
          balances: { BTC: '0', ETH: '0', SOL: '0', BNB: '0', USDT: '0' },
          addresses: { BTC: '', ETH: '', SOL: '', BNB: '', USDT: '' }
        });
        setNewUserAddressErrors({});
        setShowCreateUser(false);

        alert(`User created successfully!\n\nEmail: ${newUser.email}\nPassword: ${newUser.password}\n\nPlease save these credentials securely.`);
      } catch (err) {
        console.error('Failed to create user in Supabase:', err);
        alert('Failed to create user in database.');
      }
    })();
  };

  const generateRandomAddress = (asset: string) => {
    return generateAddressForCoin(asset);
  };

  const handleNewUserAddressChange = (asset: string, value: string) => {
    setNewUser({
      ...newUser,
      addresses: { ...newUser.addresses, [asset]: value }
    });
    
    // Validate address if not empty
    if (value && value.trim()) {
      const validation = validateAddress(value, asset);
      if (!validation.isValid) {
        setNewUserAddressErrors({ ...newUserAddressErrors, [asset]: validation.error || 'Invalid address' });
      } else {
        // Remove error if validation passes
        const newErrors = { ...newUserAddressErrors };
        delete newErrors[asset];
        setNewUserAddressErrors(newErrors);
      }
    } else {
      // Remove error if field is empty
      const newErrors = { ...newUserAddressErrors };
      delete newErrors[asset];
      setNewUserAddressErrors(newErrors);
    }
  };

  const handleEditFee = (asset: string, targetUser?: { id: string; name?: string; email?: string } | null) => {
    if (targetUser) {
      const effectiveData = feeService.getEffectiveAssetFee(asset, targetUser.id);
      setEditingFee({ asset, data: effectiveData, targetUser });
    } else {
      const globalFees = feeService.getGlobalFees();
      const currentAssetFee = fees[asset] || globalFees[asset] || feeService.getDefaultAssetFee(asset);
      setEditingFee({ asset, data: currentAssetFee, targetUser: null });
    }
  };

  const handleSaveFee = (asset: string, updatedFee: any) => {
    if (editingFee?.targetUser) {
      // User-specific fee save
      const targetUser = editingFee.targetUser;
      const currentOverride = feeService.getUserFeeOverride(targetUser.id) || {
        userId: targetUser.id,
        userEmail: targetUser.email,
        userName: targetUser.name,
        enabled: true,
        fees: {},
        updatedAt: new Date().toISOString()
      };

      const updatedOverride: UserFeeOverride = {
        ...currentOverride,
        enabled: true,
        userEmail: targetUser.email || currentOverride.userEmail,
        userName: targetUser.name || currentOverride.userName,
        fees: {
          ...currentOverride.fees,
          [asset]: updatedFee
        },
        updatedAt: new Date().toISOString()
      };

      feeService.saveUserFeeOverride(updatedOverride);
      setUserFeeOverrides(feeService.getAllUserFeeOverrides());
      addAuditLog('User Fee Update', `Updated ${asset} custom fee settings for user ${targetUser.email || targetUser.name || targetUser.id}`);
      setEditingFee(null);
      alert(`Custom ${asset} fee settings for ${targetUser.name || targetUser.email} updated successfully!`);
      return;
    }

    // Global fee update
    const currentGlobal = feeService.getGlobalFees();
    const updatedFees = {
      ...currentGlobal,
      ...fees,
      [asset]: updatedFee
    };
    setFees(updatedFees);
    feeService.saveGlobalFees(updatedFees);

    // Log activity
    addAuditLog('Fee Update', `Updated global ${asset} withdrawal fee and deposit settings`);

    // Sync to Supabase
    supabase
      .from('admin_fee_settings')
      .update({
        withdraw_fee: parseFloat(updatedFee.withdraw_fee) || 0,
        withdraw_fee_percent: parseFloat(updatedFee.percent) || 0,
        gas_fee_enabled: updatedFee.gas_fee_enabled,
        gas_fee_type: updatedFee.gas_fee_type,
        gas_fee_fixed: parseFloat(updatedFee.gas_fee_fixed) || 0,
        gas_fee_percent: parseFloat(updatedFee.gas_fee_percent) || 0
      })
      .eq('asset_symbol', asset)
      .then(({ error }) => {
        if (error) {
          console.error('Error updating fee settings in Supabase:', error.message);
        }
      });

    // Close modal
    setEditingFee(null);

    alert(`Global ${asset} fee settings updated successfully!`);
  };

  const handleToggleUserOverride = (user: any, enabled: boolean) => {
    const existing = feeService.getUserFeeOverride(user.id);
    if (existing) {
      const updated: UserFeeOverride = {
        ...existing,
        enabled,
        updatedAt: new Date().toISOString()
      };
      feeService.saveUserFeeOverride(updated);
    } else {
      // Create new override with global fees as baseline
      const globalFees = feeService.getGlobalFees();
      const newOverride: UserFeeOverride = {
        userId: user.id,
        userEmail: user.email,
        userName: user.name,
        enabled,
        fees: { ...globalFees },
        updatedAt: new Date().toISOString()
      };
      feeService.saveUserFeeOverride(newOverride);
    }
    setUserFeeOverrides(feeService.getAllUserFeeOverrides());
    addAuditLog('User Fee Toggle', `${enabled ? 'Enabled' : 'Disabled'} custom fee override for user ${user.email}`);
  };

  const handleCopyFromGlobalToUser = (user: any) => {
    const globalFees = feeService.getGlobalFees();
    const newOverride: UserFeeOverride = {
      userId: user.id,
      userEmail: user.email,
      userName: user.name,
      enabled: true,
      fees: { ...globalFees },
      updatedAt: new Date().toISOString()
    };
    feeService.saveUserFeeOverride(newOverride);
    setUserFeeOverrides(feeService.getAllUserFeeOverrides());
    addAuditLog('User Fee Sync', `Copied all global fee settings to user ${user.email}`);
    alert(`Copied current global fees to ${user.name || user.email}'s custom settings.`);
  };

  const handleResetUserToGlobal = (user: any) => {
    if (!confirm(`Are you sure you want to remove all custom fee overrides for ${user.name || user.email}? They will revert to platform global defaults.`)) {
      return;
    }
    feeService.deleteUserFeeOverride(user.id);
    setUserFeeOverrides(feeService.getAllUserFeeOverrides());
    addAuditLog('User Fee Reset', `Reset fee overrides for user ${user.email} to platform defaults`);
    alert(`${user.name || user.email} has been reverted to platform global defaults.`);
  };

  const handleResetUserAssetToGlobal = (user: any, assetSymbol: string) => {
    const existing = feeService.getUserFeeOverride(user.id);
    if (!existing || !existing.fees || !existing.fees[assetSymbol]) return;

    const newFees = { ...existing.fees };
    delete newFees[assetSymbol];

    const updated: UserFeeOverride = {
      ...existing,
      fees: newFees,
      updatedAt: new Date().toISOString()
    };

    feeService.saveUserFeeOverride(updated);
    setUserFeeOverrides(feeService.getAllUserFeeOverrides());
    addAuditLog('User Fee Coin Reset', `Reset ${assetSymbol} fee override for user ${user.email} to global default`);
  };

  const handleChangePassword = () => {
    // Validate form
    if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
      alert('Please fill in all fields');
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      alert('New passwords do not match');
      return;
    }

    if (passwordForm.newPassword.length < 8) {
      alert('Password must be at least 8 characters long');
      return;
    }

    // In production, this would verify currentPassword against stored hash
    // For now, we'll just simulate success
    alert('Password changed successfully!');
    
    // Reset form and close modal
    setPasswordForm({
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    });
    setShowChangePassword(false);
  };

  const handleLogout = () => {
    if (confirm('Are you sure you want to logout?')) {
      // In production, this would clear session/tokens
      // Redirect to admin login by calling onBack
      onBack();
    }
  };

  // Coin CRUD Handlers
  const handleAddCoin = () => {
    setEditingCoin(null);
    setCoinForm({
      symbol: '',
      name: '',
      color: 'bg-blue-500',
      icon: '₿',
      logoUrl: '',
      coinGeckoId: ''
    });
    setShowCoinModal(true);
  };

  const handleEditCoin = (coin: any) => {
    setEditingCoin(coin);
    setCoinForm({
      symbol: coin.symbol,
      name: coin.name,
      color: coin.color,
      icon: coin.icon,
      logoUrl: coin.logoUrl || ''
    });
    setShowCoinModal(true);
  };

  const handleDeleteCoin = (symbol: string) => {
    if (confirm(`Are you sure you want to delete ${symbol}? This will affect all users holding this asset.`)) {
      // Remove from asset config
      setAssetConfig(assetConfig.filter(a => a.symbol !== symbol));
      
      // Remove from prices
      const newPrices = { ...prices };
      delete newPrices[symbol];
      setPrices(newPrices);
      
      // Remove from price changes
      const newPriceChanges = { ...priceChanges };
      delete newPriceChanges[symbol];
      setPriceChanges(newPriceChanges);
      
      // Remove from fees
      const newFees = { ...fees };
      delete newFees[symbol];
      setFees(newFees);
      
      // Store fees in localStorage
      dataService.setItem('xbyte_admin_fees', JSON.stringify(newFees));
      
      // Remove from localStorage prices
      dataService.removeItem(`price_${symbol}`);
      
      // Remove from all user balances
      const updatedUsers = users.map(user => {
        const newBalances = { ...user.balances };
        delete newBalances[symbol];
        const newAddresses = { ...user.addresses };
        delete newAddresses[symbol];
        return {
          ...user,
          balances: newBalances,
          addresses: newAddresses
        };
      });
      setUsers(updatedUsers);
      
      // Update users in localStorage
      dataService.setItem('xbyte_admin_users', JSON.stringify(updatedUsers));
      
      // Update current wallet if exists
      const currentWallet = dataService.getItem('xbyte_wallet');
      if (currentWallet) {
        try {
          const walletData = JSON.parse(currentWallet);
          const newBalances = { ...walletData.balances };
          const newAddresses = { ...walletData.addresses };
          delete newBalances[symbol];
          delete newAddresses[symbol];
          
          const updatedWallet = {
            ...walletData,
            balances: newBalances,
            addresses: newAddresses
          };
          dataService.setItem('xbyte_wallet', JSON.stringify(updatedWallet));
          
          // Dispatch event to notify wallet components
          window.dispatchEvent(new CustomEvent('walletUpdated', {
            detail: { wallet: updatedWallet }
          }));
        } catch (e) {
          console.error('Error updating current wallet:', e);
        }
      }
      
      alert(`${symbol} has been deleted successfully!`);
    }
  };

  const handleToggleAssetEnabled = (symbol: string, enabled: boolean) => {
    const updated = assetConfig.map(a => a.symbol === symbol ? { ...a, enabled } : a);
    setAssetConfig(updated);
    saveAssetConfig(updated);
  };

  const handleSaveCoin = () => {
    // Validate form
    if (!coinForm.symbol || !coinForm.name) {
      alert('Please fill in Symbol and Name fields');
      return;
    }

    const symbol = coinForm.symbol.toUpperCase();

    if (editingCoin) {
      // Update existing coin
      setAssetConfig(assetConfig.map(a => 
        a.symbol === editingCoin.symbol 
          ? { ...a, ...coinForm, symbol } 
          : a
      ));
      
      // If symbol changed, update prices and fees keys
      if (editingCoin.symbol !== symbol) {
        // Update prices
        const newPrices = { ...prices };
        if (newPrices[editingCoin.symbol] !== undefined) {
          newPrices[symbol] = newPrices[editingCoin.symbol];
          delete newPrices[editingCoin.symbol];
        }
        setPrices(newPrices);
        
        // Update localStorage prices
        const oldPrice = dataService.getItem(`price_${editingCoin.symbol}`);
        if (oldPrice) {
          dataService.setItem(`price_${symbol}`, oldPrice);
          dataService.removeItem(`price_${editingCoin.symbol}`);
        }
        
        // Update price changes
        const newPriceChanges = { ...priceChanges };
        if (newPriceChanges[editingCoin.symbol] !== undefined) {
          newPriceChanges[symbol] = newPriceChanges[editingCoin.symbol];
          delete newPriceChanges[editingCoin.symbol];
        }
        setPriceChanges(newPriceChanges);
        
        // Update fees
        const newFees = { ...fees };
        if (newFees[editingCoin.symbol]) {
          newFees[symbol] = newFees[editingCoin.symbol];
          delete newFees[editingCoin.symbol];
        }
        setFees(newFees);
        
        // Store fees in localStorage
        dataService.setItem('xbyte_admin_fees', JSON.stringify(newFees));
        
        // Update all users' balances and addresses
        const updatedUsers = users.map(user => {
          const newBalances = { ...user.balances };
          const newAddresses = { ...user.addresses };
          
          if (newBalances[editingCoin.symbol] !== undefined) {
            newBalances[symbol] = newBalances[editingCoin.symbol];
            delete newBalances[editingCoin.symbol];
          }
          
          if (newAddresses[editingCoin.symbol] !== undefined) {
            newAddresses[symbol] = newAddresses[editingCoin.symbol];
            delete newAddresses[editingCoin.symbol];
          }
          
          return {
            ...user,
            balances: newBalances,
            addresses: newAddresses
          };
        });
        setUsers(updatedUsers);
        dataService.setItem('xbyte_admin_users', JSON.stringify(updatedUsers));
        
        // Update current wallet if exists
        const currentWallet = dataService.getItem('xbyte_wallet');
        if (currentWallet) {
          try {
            const walletData = JSON.parse(currentWallet);
            const newBalances = { ...walletData.balances };
            const newAddresses = { ...walletData.addresses };
            
            if (newBalances[editingCoin.symbol] !== undefined) {
              newBalances[symbol] = newBalances[editingCoin.symbol];
              delete newBalances[editingCoin.symbol];
            }
            
            if (newAddresses[editingCoin.symbol] !== undefined) {
              newAddresses[symbol] = newAddresses[editingCoin.symbol];
              delete newAddresses[editingCoin.symbol];
            }
            
            const updatedWallet = {
              ...walletData,
              balances: newBalances,
              addresses: newAddresses
            };
            dataService.setItem('xbyte_wallet', JSON.stringify(updatedWallet));
            
            // Dispatch event to notify wallet components
            window.dispatchEvent(new CustomEvent('walletUpdated', {
              detail: { wallet: updatedWallet }
            }));
          } catch (e) {
            console.error('Error updating current wallet:', e);
          }
        }
      }
      
      alert(`${symbol} has been updated successfully!`);
    } else {
      // Add new coin
      if (assetConfig.find(a => a.symbol === symbol)) {
        alert('A coin with this symbol already exists!');
        return;
      }
      
      setAssetConfig([...assetConfig, { ...coinForm, symbol }]);
      
      // Add default price
      const newPrices = { ...prices, [symbol]: 1.00 };
      setPrices(newPrices);
      setPriceChanges({ ...priceChanges, [symbol]: 0.0 });
      
      // Store price in localStorage for gas fee calculations
      dataService.setItem(`price_${symbol}`, '1.00');
      
      // Add default fees
      const newFees = {
        ...fees,
        [symbol]: {
          withdraw_fee: '0.001',
          percent: '0.5',
          deposit_address: generateRandomAddress(symbol),
          deposit_enabled: true,
          gas_fee_enabled: false,
          gas_fee_type: 'fixed',
          gas_fee_fixed: '0.0001',
          gas_fee_percent: '0.1'
        }
      };
      setFees(newFees);
      
      // Store fees in localStorage
      dataService.setItem('xbyte_admin_fees', JSON.stringify(newFees));
      
      // Add to all users with 0 balance
      const updatedUsers = users.map(user => ({
        ...user,
        balances: { ...user.balances, [symbol]: '0' },
        addresses: { ...user.addresses, [symbol]: generateRandomAddress(symbol) }
      }));
      setUsers(updatedUsers);
      
      // Update users in localStorage
      dataService.setItem('xbyte_admin_users', JSON.stringify(updatedUsers));
      
      // Update current logged-in user's wallet if exists
      const currentWallet = dataService.getItem('xbyte_wallet');
      if (currentWallet) {
        try {
          const walletData = JSON.parse(currentWallet);
          const updatedWallet = {
            ...walletData,
            balances: { ...walletData.balances, [symbol]: '0' },
            addresses: { ...walletData.addresses, [symbol]: generateRandomAddress(symbol) }
          };
          dataService.setItem('xbyte_wallet', JSON.stringify(updatedWallet));
          
          // Dispatch event to notify wallet components
          window.dispatchEvent(new CustomEvent('walletUpdated', {
            detail: { wallet: updatedWallet }
          }));
        } catch (e) {
          console.error('Error updating current wallet:', e);
        }
      }
      
      alert(`${symbol} has been added successfully!`);
    }
    
    setShowCoinModal(false);
    setEditingCoin(null);
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // In production, this would upload to storage
      // For now, we'll use a local URL
      const reader = new FileReader();
      reader.onloadend = () => {
        setCoinForm({ ...coinForm, logoUrl: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleViewTransaction = (transaction: any) => {
    setSelectedTransaction(transaction);
    setShowTransactionReceipt(true);
    setEditingTransaction(false);
  };

  const handleUpdateTransaction = async (userId: string, updatedTransaction: any) => {
    // 1. Sync updated transaction details to Supabase
    const { error } = await supabase
      .from('transactions')
      .update({
        type: updatedTransaction.type,
        status: updatedTransaction.status,
        asset_symbol: updatedTransaction.asset,
        amount: parseFloat(updatedTransaction.amount) || 0,
        from_address: updatedTransaction.from || null,
        to_address: updatedTransaction.to || null,
        network: updatedTransaction.network || '',
        hash: updatedTransaction.hash,
        fee: parseFloat(updatedTransaction.fee) || 0,
        notes: updatedTransaction.notes || ''
      })
      .eq('id', updatedTransaction.id);

    if (error) {
      console.error('Error updating transaction in Supabase:', error.message);
      alert(`Error saving transaction edits in database: ${error.message}`);
      return;
    }

    // 2. Update local state
    const updatedActivities = {
      ...userActivities,
      [userId]: (userActivities[userId] || []).map(txn =>
        txn.id === updatedTransaction.id ? updatedTransaction : txn
      )
    };
    setUserActivities(updatedActivities);
    
    // 3. Sync updated transaction to user's localStorage wallet so user sees changes immediately
    const userWallet = dataService.getItem('xbyte_wallet');
    if (userWallet) {
      try {
        const walletData = JSON.parse(userWallet);
        if (walletData.id === userId) {
          const updatedTransactions = (walletData.transactions || []).map((tx: any) =>
            tx.id === updatedTransaction.id ? updatedTransaction : tx
          );
          const updatedWallet = { ...walletData, transactions: updatedTransactions };
          dataService.setItem('xbyte_wallet', JSON.stringify(updatedWallet));
          
          // Notify user wallet in same tab
          window.dispatchEvent(new CustomEvent('walletDataUpdated', {
            detail: { walletData: updatedWallet }
          }));
          // Notify user wallet in other tabs
          window.dispatchEvent(new StorageEvent('storage', {
            key: 'xbyte_wallet',
            newValue: JSON.stringify(updatedWallet),
            oldValue: userWallet,
            storageArea: localStorage,
            url: window.location.href
          }));
        }
      } catch (e) {
        console.error('Error syncing transaction update to user wallet:', e);
      }
    }
    
    setSelectedTransaction(updatedTransaction);
    setEditingTransaction(false);
    alert('Transaction updated successfully in database!');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'processing':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'failed':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const filteredUsers = users.filter(u => {
    // If not super admin, check if user is in allowed list
    if (adminProfile.role !== 'super_admin' && adminPermissions.allowed_user_ids.length > 0) {
      if (!adminPermissions.allowed_user_ids.includes(u.id)) {
        return false;
      }
    }
    return u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
           u.id.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const platformAssets = calculatePlatformAssets();
  const totalPlatformValue = Object.values(platformAssets).reduce((sum: number, asset: any) => sum + asset.value, 0);

  const stats = [
    { label: 'Total Users', value: users.length, icon: Users, color: 'bg-blue-500' },
    { label: 'Open Tickets', value: tickets.filter(t => t.status === 'open').length, icon: Headphones, color: 'bg-red-500' },
    { label: 'Active Chats', value: chats.filter(c => c.status === 'active').length, icon: MessageCircle, color: 'bg-green-500' },
    { label: 'Platform Value', value: `$${totalPlatformValue.toLocaleString('en-US', { maximumFractionDigits: 0 })}`, icon: DollarSign, color: 'bg-zinc-700', isValue: true }
  ];

  const hasTabAccess = (tab: string) => adminProfile.role === 'super_admin' || adminPermissions.allowed_tabs.includes(tab);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Logo size="sm" showText={false} onClick={onBack} />
              <div>
                <h1 className="text-2xl text-gray-900 dark:text-white">Admin Dashboard</h1>
                <p className="text-sm text-gray-600 dark:text-gray-400">Xbyte Wallet Management</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant="secondary">{adminProfile.role}</Badge>
              
              {/* Admin Profile Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-3 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
                    <div className="text-right hidden sm:block">
                      <p className="text-sm text-gray-900 dark:text-white">{adminProfile.name}</p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">{adminProfile.email}</p>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-[#18181b] border border-zinc-700/60 shadow-md flex items-center justify-center text-white">
                      <User className="w-5 h-5" />
                    </div>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <div className="px-2 py-3">
                    <p className="text-sm text-gray-900 dark:text-white">{adminProfile.name}</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">{adminProfile.email}</p>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setShowAdminSettings(true)}>
                    <Settings className="w-4 h-4 mr-2" />
                    Admin Settings
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setShowChangePassword(true)}>
                    <KeyRound className="w-4 h-4 mr-2" />
                    Change Password
                  </DropdownMenuItem>
                  {onToggleDarkMode && (
                    <DropdownMenuItem onClick={onToggleDarkMode}>
                      {darkMode ? (
                        <>
                          <Sun className="w-4 h-4 mr-2" />
                          Light Mode
                        </>
                      ) : (
                        <>
                          <Moon className="w-4 h-4 mr-2" />
                          Dark Mode
                        </>
                      )}
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="text-red-600 dark:text-red-400">
                    <LogOut className="w-4 h-4 mr-2" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <div key={stat.label} className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">{stat.label}</p>
                    <p className="text-3xl text-gray-900 dark:text-white">{stat.value}</p>
                  </div>
                  <div className={`w-12 h-12 rounded-lg ${stat.color} flex items-center justify-center`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          {/* Mobile Select Dropdown */}
          <div className="md:hidden mb-6">
            <Select value={activeTab} onValueChange={setActiveTab}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {hasTabAccess('users') && <SelectItem value="users">User Management</SelectItem>}
                {hasTabAccess('assets') && <SelectItem value="assets">Assets Overview</SelectItem>}
                {hasTabAccess('fees') && <SelectItem value="fees">Fee Settings</SelectItem>}
                {hasTabAccess('messages') && <SelectItem value="messages">Message Settings</SelectItem>}
                {hasTabAccess('support') && (
                  <SelectItem value="support">
                    Support Tickets
                    {tickets.filter(t => t.status === 'open').length > 0 && ` (${tickets.filter(t => t.status === 'open').length})`}
                  </SelectItem>
                )}
                {hasTabAccess('chat') && (
                  <SelectItem value="chat">
                    Live Chat
                    {chats.reduce((sum, c) => sum + c.unread_count, 0) > 0 && ` (${chats.reduce((sum, c) => sum + c.unread_count, 0)})`}
                  </SelectItem>
                )}
                {hasTabAccess('audit') && <SelectItem value="audit">Audit Logs</SelectItem>}
                {hasTabAccess('sync') && <SelectItem value="sync">Data Sync</SelectItem>}
                {adminProfile.role === 'super_admin' && <SelectItem value="admin_users">Admin Users</SelectItem>}
              </SelectContent>
            </Select>
          </div>

          {/* Desktop Tab Buttons */}
          <TabsList className="mb-6 hidden md:flex">
            {hasTabAccess('users') && <TabsTrigger value="users">User Management</TabsTrigger>}
            {hasTabAccess('assets') && <TabsTrigger value="assets">Assets Overview</TabsTrigger>}
            {hasTabAccess('fees') && <TabsTrigger value="fees">Fee Settings</TabsTrigger>}
            {hasTabAccess('messages') && <TabsTrigger value="messages">Message Settings</TabsTrigger>}
            {hasTabAccess('support') && (
              <TabsTrigger value="support">
                <div className="flex items-center gap-2">
                  Support Tickets
                  {tickets.filter(t => t.status === 'open').length > 0 && (
                    <Badge variant="destructive" className="text-xs px-1.5 py-0">
                      {tickets.filter(t => t.status === 'open').length}
                    </Badge>
                  )}
                </div>
              </TabsTrigger>
            )}
            {hasTabAccess('chat') && (
              <TabsTrigger value="chat">
                <div className="flex items-center gap-2">
                  Live Chat
                  {chats.reduce((sum, c) => sum + c.unread_count, 0) > 0 && (
                    <Badge variant="destructive" className="text-xs px-1.5 py-0">
                      {chats.reduce((sum, c) => sum + c.unread_count, 0)}
                    </Badge>
                  )}
                </div>
              </TabsTrigger>
            )}
            {adminProfile.role === 'super_admin' && <TabsTrigger value="admin_users">Admin Users</TabsTrigger>}
            {hasTabAccess('audit') && <TabsTrigger value="audit">Audit Logs</TabsTrigger>}
            {hasTabAccess('sync') && (
              <TabsTrigger value="sync">
                <div className="flex items-center gap-2">
                  <Database className="w-4 h-4" />
                  Data Sync
                </div>
              </TabsTrigger>
            )}
          </TabsList>

          {/* Users Tab */}
          <TabsContent value="users">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl text-gray-900 dark:text-white">Users</h2>
                  <Button onClick={() => setShowCreateUser(true)}>
                    <Users className="w-4 h-4 mr-2" />
                    Create User
                  </Button>
                </div>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <Input
                    placeholder="Search by email or user ID..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User ID</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Total Balance (USD)</TableHead>
                    <TableHead>KYC Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((user) => {
                    const totalBalance = calculateTotalBalance(user.balances);
                    return (
                      <TableRow key={user.id}>
                        <TableCell className="font-mono text-sm">{user.id}</TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell className="font-semibold text-gray-900 dark:text-white">
                          ${totalBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </TableCell>
                        <TableCell>
                          <button
                            type="button"
                            onClick={() => handleOpenKycModal(user)}
                            className="inline-flex items-center gap-1.5 cursor-pointer group focus:outline-none"
                            title="Click to view and edit user's KYC data"
                          >
                            <Badge
                              variant={
                                user.kyc_status === 'verified'
                                  ? 'default'
                                  : user.kyc_status === 'pending'
                                  ? 'secondary'
                                  : 'destructive'
                              }
                              className={`transition-all group-hover:ring-2 group-hover:ring-zinc-400 ${
                                user.kyc_status === 'verified'
                                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                                  : user.kyc_status === 'in_review'
                                  ? 'bg-amber-500 hover:bg-amber-600 text-white'
                                  : ''
                              }`}
                            >
                              {user.kyc_status || 'pending'}
                            </Badge>
                            <Edit2 className="w-3 h-3 text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white transition-opacity opacity-60 group-hover:opacity-100" />
                          </button>
                        </TableCell>
                        <TableCell className="text-sm">
                          {new Date(user.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <Badge variant={user.blocked ? 'destructive' : 'default'}>
                            {user.blocked ? 'Blocked' : 'Active'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreVertical className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleViewDetails(user)}>
                                <Eye className="w-4 h-4 mr-2" />
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleOpenKycModal(user)}>
                                <FileCheck className="w-4 h-4 mr-2 text-indigo-500" />
                                Review KYC Data
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleLoginAsUser(user)}>
                                <LogIn className="w-4 h-4 mr-2" />
                                Login as User
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleEditBalance(user)}>
                                <Edit className="w-4 h-4 mr-2" />
                                Edit Balance
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleViewActivities(user)}>
                                <Activity className="w-4 h-4 mr-2" />
                                View Activities
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleBlockUser(user.id)}>
                                {user.blocked ? (
                                  <>
                                    <Unlock className="w-4 h-4 mr-2" />
                                    Unblock User
                                  </>
                                ) : (
                                  <>
                                    <Lock className="w-4 h-4 mr-2" />
                                    Block User
                                  </>
                                )}
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleDeleteUser(user.id)}
                                className="text-red-600 dark:text-red-400"
                              >
                                <Trash className="w-4 h-4 mr-2" />
                                Delete User
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          {/* Assets Tab */}
          <TabsContent value="assets">
            <div className="grid gap-6">
              {/* Platform Overview */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-xl text-gray-900 dark:text-white">Platform Assets Overview</h2>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      Total value locked across all user wallets
                      {lastPriceUpdate && (
                        <span className="ml-2 text-xs">
                          • Live prices {pricesLoading && '(updating...)'}
                        </span>
                      )}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-sm text-gray-600 dark:text-gray-400">Total Value</p>
                      <p className="text-3xl text-gray-900 dark:text-white">
                        ${totalPlatformValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </p>
                      {lastPriceUpdate && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          Updated {lastPriceUpdate.toLocaleTimeString()}
                        </p>
                      )}
                    </div>
                    <Button onClick={handleAddCoin} className="flex items-center gap-2">
                      <Coins className="w-4 h-4" />
                      Add New Coin
                    </Button>
                  </div>
                </div>

                <div className="grid gap-4">
                  {assetConfig.map((asset) => {
                    const assetData = platformAssets[asset.symbol];
                    const price = prices[asset.symbol as keyof typeof prices] || 0;
                    const change = priceChanges[asset.symbol as keyof typeof priceChanges] || 0;

                    return (
                      <div key={asset.symbol} className="p-4 bg-gray-50 dark:bg-gray-700 rounded-xl relative group">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            {asset.logoUrl ? (
                              <img src={asset.logoUrl} alt={asset.name} className="w-14 h-14 rounded-full object-cover" />
                            ) : (
                              <div className={`w-14 h-14 rounded-full ${asset.color} flex items-center justify-center text-white text-2xl`}>
                                {asset.icon}
                              </div>
                            )}
                            <div>
                              <h3 className="text-lg text-gray-900 dark:text-white">{asset.name}</h3>
                              <p className="text-sm text-gray-600 dark:text-gray-400">{asset.symbol}</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-4">
                            <div className="text-right">
                              <div className="flex items-center gap-2 justify-end mb-1">
                                <span className="text-lg text-gray-900 dark:text-white">
                                  ${price.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                </span>
                                <Badge variant={change >= 0 ? 'default' : 'destructive'} className="flex items-center gap-1">
                                  {change >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                                  {change >= 0 ? '+' : ''}{change.toFixed(1)}%
                                </Badge>
                              </div>
                              <p className="text-xs text-gray-500 dark:text-gray-400">24h Change</p>
                            </div>

                            {/* Toggle Asset Visibility on User Home */}
                            <div className="flex items-center gap-2 bg-white/80 dark:bg-gray-800/80 px-2.5 py-1.5 rounded-lg border border-gray-200 dark:border-gray-600">
                              <span className={`text-xs font-medium ${asset.enabled !== false ? 'text-green-600 dark:text-green-400' : 'text-gray-400 dark:text-gray-500'}`}>
                                {asset.enabled !== false ? 'Shown on Home' : 'Hidden on Home'}
                              </span>
                              <Switch
                                checked={asset.enabled !== false}
                                onCheckedChange={(checked) => handleToggleAssetEnabled(asset.symbol, checked)}
                                aria-label={`Toggle user home display for ${asset.name}`}
                              />
                            </div>
                            
                            {/* Edit/Delete Actions */}
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                  <MoreVertical className="w-4 h-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleEditCoin(asset)}>
                                  <Edit className="w-4 h-4 mr-2" />
                                  Edit Coin
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem 
                                  onClick={() => handleDeleteCoin(asset.symbol)}
                                  className="text-red-600 dark:text-red-400"
                                >
                                  <Trash className="w-4 h-4 mr-2" />
                                  Delete Coin
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>

                        <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-gray-200 dark:border-gray-600">
                          <div>
                            <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Total Balance</p>
                            <p className="text-sm text-gray-900 dark:text-white">
                              {assetData?.total?.toLocaleString('en-US', { maximumFractionDigits: 4 }) || '0'} {asset.symbol}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">USD Value</p>
                            <p className="text-sm text-gray-900 dark:text-white">
                              ${assetData?.value?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Holders</p>
                            <p className="text-sm text-gray-900 dark:text-white">
                              {assetData?.users || 0} users
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Asset Distribution */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
                <h2 className="text-xl mb-4 text-gray-900 dark:text-white">Asset Distribution</h2>
                <div className="space-y-3">
                  {assetConfig.map((asset) => {
                    const assetData = platformAssets[asset.symbol];
                    const percentage = (assetData.value / totalPlatformValue) * 100;

                    return (
                      <div key={asset.symbol}>
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            {asset.logoUrl ? (
                              <img src={asset.logoUrl} alt={asset.name} className="w-8 h-8 rounded-full object-cover" />
                            ) : (
                              <div className={`w-8 h-8 rounded-full ${asset.color} flex items-center justify-center text-white text-sm`}>
                                {asset.icon}
                              </div>
                            )}
                            <span className="text-sm text-gray-900 dark:text-white">{asset.name}</span>
                          </div>
                          <span className="text-sm text-gray-600 dark:text-gray-400">
                            {percentage.toFixed(1)}%
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                          <div
                            className={`${asset.color} h-2 rounded-full transition-all`}
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Fees Tab */}
          <TabsContent value="fees">
            <div className="space-y-6">
              {/* Header & Scope Selector */}
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-6 border border-gray-200 dark:border-gray-700">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-gray-200 dark:border-gray-700">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2.5">
                      Fee & Deposit Configuration
                    </h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      Configure withdrawal rates, gas fees, and deposit addresses across all assets in the Platform Assets Overview.
                    </p>
                  </div>

                  {/* Scope Selector Pills */}
                  <div className="inline-flex p-1 bg-gray-100 dark:bg-gray-700/80 rounded-xl border border-gray-200 dark:border-gray-600">
                    <button
                      type="button"
                      onClick={() => setFeeScope('global')}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
                        feeScope === 'global'
                          ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm'
                          : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                      }`}
                    >
                      <Globe className="w-3.5 h-3.5 text-blue-500" />
                      Global Platform Defaults
                    </button>

                    <button
                      type="button"
                      onClick={() => setFeeScope('user')}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
                        feeScope === 'user'
                          ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm'
                          : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                      }`}
                    >
                      <User className="w-3.5 h-3.5 text-emerald-500" />
                      User-Specific Configuration
                      {Object.keys(userFeeOverrides).length > 0 && (
                        <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-bold">
                          {Object.keys(userFeeOverrides).length}
                        </span>
                      )}
                    </button>
                  </div>
                </div>

                {/* Scope Context Description & Stats */}
                <div className="pt-4 flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-3 text-xs text-gray-600 dark:text-gray-300">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-zinc-100 dark:bg-zinc-700/60 font-medium">
                      <Coins className="w-3.5 h-3.5 text-zinc-500" />
                      {assetConfig.length} Assets Captured
                    </span>
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-zinc-100 dark:bg-zinc-700/60 font-medium">
                      <Users className="w-3.5 h-3.5 text-zinc-500" />
                      {Object.values(userFeeOverrides).filter(o => o.enabled).length} Active User Overrides
                    </span>
                  </div>

                  {/* Asset Search Filter */}
                  <div className="w-full sm:w-72 relative">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <Input
                      placeholder="Search coins by name or symbol..."
                      value={feeAssetSearch}
                      onChange={(e) => setFeeAssetSearch(e.target.value)}
                      className="pl-9 text-xs h-9 bg-gray-50 dark:bg-gray-900/50"
                    />
                    {feeAssetSearch && (
                      <button
                        onClick={() => setFeeAssetSearch('')}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs"
                      >
                        ×
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* ================= GLOBAL DEFAULTS VIEW ================= */}
              {feeScope === 'global' && (
                <div className="space-y-6">
                  {/* Global Mode Notification */}
                  <div className="p-4 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800/60 rounded-xl flex items-start gap-3">
                    <Globe className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                    <div className="text-xs text-blue-900 dark:text-blue-200">
                      <strong>Global Platform Defaults:</strong> These settings apply to all users across all supported assets by default. If a specific user requires customized rates or a dedicated deposit address, switch to <strong>User-Specific Configuration</strong> to set personalized overrides.
                    </div>
                  </div>

                  {/* Grid of all assets from Platform Assets Overview */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {assetConfig
                      .filter(asset => {
                        if (!feeAssetSearch.trim()) return true;
                        const q = feeAssetSearch.toLowerCase();
                        return (
                          asset.symbol.toLowerCase().includes(q) ||
                          asset.name.toLowerCase().includes(q) ||
                          (asset.network && asset.network.toLowerCase().includes(q))
                        );
                      })
                      .map((asset) => {
                        const globalFee = fees[asset.symbol] || feeService.getEffectiveAssetFee(asset.symbol);

                        const handleCopyDeposit = async () => {
                          const success = await copyToClipboard(globalFee.deposit_address);
                          if (success) {
                            setCopiedDepositAddresses(prev => ({ ...prev, [asset.symbol]: true }));
                            setTimeout(() => {
                              setCopiedDepositAddresses(prev => ({ ...prev, [asset.symbol]: false }));
                            }, 2000);
                          }
                        };

                        return (
                          <div
                            key={asset.symbol}
                            className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm flex flex-col justify-between"
                          >
                            <div>
                              {/* Asset Header */}
                              <div className="flex items-center justify-between mb-5 pb-4 border-b border-gray-100 dark:border-gray-700">
                                <div className="flex items-center gap-3">
                                  {asset.logoUrl ? (
                                    <img src={asset.logoUrl} alt={asset.name} className="w-11 h-11 rounded-full object-cover shadow-sm" />
                                  ) : (
                                    <div className={`w-11 h-11 rounded-full ${asset.color} flex items-center justify-center text-white text-lg font-bold shadow-sm`}>
                                      {asset.icon}
                                    </div>
                                  )}
                                  <div>
                                    <div className="flex items-center gap-2">
                                      <h3 className="text-base font-bold text-gray-900 dark:text-white">{asset.name}</h3>
                                      <span className="px-2 py-0.5 rounded text-[11px] font-mono font-semibold bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                                        {asset.symbol}
                                      </span>
                                    </div>
                                    {asset.network && (
                                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{asset.network}</p>
                                    )}
                                  </div>
                                </div>

                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleEditFee(asset.symbol, null)}
                                  className="h-8 text-xs font-semibold"
                                >
                                  <Edit className="w-3.5 h-3.5 mr-1.5" />
                                  Edit Global
                                </Button>
                              </div>

                              {/* Withdrawal Fees */}
                              <div className="mb-5">
                                <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2">
                                  Withdrawal Fees
                                </h4>
                                <div className="grid grid-cols-2 gap-3">
                                  <div className="p-2.5 bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-gray-100 dark:border-gray-800">
                                    <label className="block text-[11px] text-gray-500 dark:text-gray-400 mb-1">Fixed Fee</label>
                                    <p className="text-sm font-semibold font-mono text-gray-900 dark:text-white">
                                      {globalFee.withdraw_fee} {asset.symbol}
                                    </p>
                                  </div>
                                  <div className="p-2.5 bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-gray-100 dark:border-gray-800">
                                    <label className="block text-[11px] text-gray-500 dark:text-gray-400 mb-1">Percent Fee</label>
                                    <p className="text-sm font-semibold font-mono text-gray-900 dark:text-white">
                                      {globalFee.percent}%
                                    </p>
                                  </div>
                                </div>
                              </div>

                              {/* Estimated Gas Fees */}
                              <div className="mb-5">
                                <div className="flex items-center justify-between mb-2">
                                  <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                                    Estimated Gas Fees
                                  </h4>
                                  <Badge variant={globalFee.gas_fee_enabled ? 'default' : 'secondary'} className="text-[10px]">
                                    {globalFee.gas_fee_enabled ? 'Active' : 'Disabled'}
                                  </Badge>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                  <div className="p-2.5 bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-gray-100 dark:border-gray-800">
                                    <label className="block text-[11px] text-gray-500 dark:text-gray-400 mb-1">Fee Type</label>
                                    <p className="text-sm font-semibold text-gray-900 dark:text-white capitalize">
                                      {globalFee.gas_fee_type === 'fixed' ? 'Fixed Amount' : 'Percentage Rate'}
                                    </p>
                                  </div>
                                  <div className="p-2.5 bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-gray-100 dark:border-gray-800">
                                    <label className="block text-[11px] text-gray-500 dark:text-gray-400 mb-1">Rate / Value</label>
                                    <p className="text-sm font-semibold font-mono text-gray-900 dark:text-white">
                                      {globalFee.gas_fee_type === 'fixed' ? `${globalFee.gas_fee_fixed} ${asset.symbol}` : `${globalFee.gas_fee_percent}%`}
                                    </p>
                                  </div>
                                </div>
                              </div>

                              {/* Deposit Address */}
                              <div>
                                <div className="flex items-center justify-between mb-2">
                                  <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                                    Platform Deposit Address
                                  </h4>
                                  <Badge variant={globalFee.deposit_enabled ? 'default' : 'destructive'} className="text-[10px]">
                                    {globalFee.deposit_enabled ? 'Deposits Allowed' : 'Disabled'}
                                  </Badge>
                                </div>
                                <div className="bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800 rounded-lg p-2.5 flex items-center justify-between gap-2">
                                  <span className="font-mono text-xs text-gray-900 dark:text-white break-all select-all">
                                    {globalFee.deposit_address}
                                  </span>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={handleCopyDeposit}
                                    className="h-7 w-7 p-0 flex-shrink-0"
                                  >
                                    {copiedDepositAddresses[asset.symbol] ? (
                                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                                    ) : (
                                      <Copy className="w-3.5 h-3.5 text-gray-500" />
                                    )}
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                  </div>

                  {/* Active Overrides Registry Table */}
                  <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-6 border border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white">Active User-Specific Overrides</h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Users with custom withdrawal rates, gas fees, or deposit addresses.
                        </p>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => {
                          setFeeScope('user');
                          if (users.length > 0 && !selectedFeeUserId) {
                            setSelectedFeeUserId(users[0].id);
                          }
                        }}
                        className="text-xs h-8"
                      >
                        <UserCheck className="w-3.5 h-3.5 mr-1.5" />
                        Configure a User
                      </Button>
                    </div>

                    {Object.keys(userFeeOverrides).length === 0 ? (
                      <div className="text-center py-8 bg-gray-50 dark:bg-gray-900/30 rounded-xl border border-dashed border-gray-200 dark:border-gray-700">
                        <Users className="w-8 h-8 mx-auto text-gray-400 mb-2 opacity-60" />
                        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">No User Overrides Configured Yet</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 max-w-sm mx-auto">
                          All registered users are currently using platform global defaults. You can personalize rates for any user at any time.
                        </p>
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>User</TableHead>
                              <TableHead>Status</TableHead>
                              <TableHead>Custom Coins</TableHead>
                              <TableHead>Last Updated</TableHead>
                              <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {Object.values(userFeeOverrides).map((override) => {
                              const targetUser = users.find(u => u.id === override.userId);
                              const customCoinsCount = Object.keys(override.fees || {}).length;

                              return (
                                <TableRow key={override.userId}>
                                  <TableCell>
                                    <div>
                                      <p className="font-semibold text-sm text-gray-900 dark:text-white">
                                        {override.userName || targetUser?.name || 'Unnamed User'}
                                      </p>
                                      <p className="text-xs text-gray-500 font-mono">
                                        {override.userEmail || targetUser?.email || override.userId}
                                      </p>
                                    </div>
                                  </TableCell>
                                  <TableCell>
                                    <Badge variant={override.enabled ? 'default' : 'secondary'} className="text-[10px]">
                                      {override.enabled ? 'Active Override' : 'Disabled'}
                                    </Badge>
                                  </TableCell>
                                  <TableCell>
                                    <div className="flex flex-wrap gap-1">
                                      {customCoinsCount === 0 ? (
                                        <span className="text-xs text-gray-400">All Global</span>
                                      ) : (
                                        Object.keys(override.fees || {}).slice(0, 4).map(coin => (
                                          <Badge key={coin} variant="outline" className="text-[10px] font-mono">
                                            {coin}
                                          </Badge>
                                        ))
                                      )}
                                      {customCoinsCount > 4 && (
                                        <Badge variant="outline" className="text-[10px]">
                                          +{customCoinsCount - 4} more
                                        </Badge>
                                      )}
                                    </div>
                                  </TableCell>
                                  <TableCell className="text-xs text-gray-500">
                                    {override.updatedAt ? new Date(override.updatedAt).toLocaleDateString() : 'N/A'}
                                  </TableCell>
                                  <TableCell className="text-right">
                                    <div className="flex items-center justify-end gap-2">
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        className="h-7 text-xs"
                                        onClick={() => {
                                          setSelectedFeeUserId(override.userId);
                                          setFeeScope('user');
                                        }}
                                      >
                                        <Edit className="w-3 h-3 mr-1" />
                                        Configure
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        className="h-7 text-xs text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30"
                                        onClick={() => handleResetUserToGlobal({ id: override.userId, email: override.userEmail, name: override.userName })}
                                      >
                                        <RotateCcw className="w-3 h-3 mr-1" />
                                        Reset
                                      </Button>
                                    </div>
                                  </TableCell>
                                </TableRow>
                              );
                            })}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ================= USER-SPECIFIC CONFIGURATION VIEW ================= */}
              {feeScope === 'user' && (() => {
                const selectedFeeUser = users.find(u => u.id === selectedFeeUserId);
                const userOverride = selectedFeeUserId ? userFeeOverrides[selectedFeeUserId] : null;

                return (
                  <div className="space-y-6">
                    {/* User Selection Header Card */}
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-6 border border-gray-200 dark:border-gray-700">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex-1">
                          <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2">
                            Select Target User to Configure
                          </label>
                          <Select
                            value={selectedFeeUserId || ''}
                            onValueChange={(val) => setSelectedFeeUserId(val)}
                          >
                            <SelectTrigger className="w-full md:max-w-md bg-gray-50 dark:bg-gray-900">
                              <SelectValue placeholder="Select a user from directory..." />
                            </SelectTrigger>
                            <SelectContent>
                              {users.map((u) => {
                                const hasOverride = Boolean(userFeeOverrides[u.id]?.enabled);
                                return (
                                  <SelectItem key={u.id} value={u.id}>
                                    <div className="flex items-center gap-2">
                                      <span>{u.name || u.email}</span>
                                      <span className="text-xs text-gray-400">({u.email})</span>
                                      {hasOverride && (
                                        <span className="ml-1 text-[10px] px-1.5 py-0.2 bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 rounded font-semibold">
                                          Custom
                                        </span>
                                      )}
                                    </div>
                                  </SelectItem>
                                );
                              })}
                            </SelectContent>
                          </Select>
                        </div>

                        {selectedFeeUser && (
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleCopyFromGlobalToUser(selectedFeeUser)}
                              className="text-xs h-9"
                            >
                              <Copy className="w-3.5 h-3.5 mr-1.5" />
                              Copy from Global Defaults
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleResetUserToGlobal(selectedFeeUser)}
                              className="text-xs h-9 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30"
                            >
                              <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
                              Reset to Global
                            </Button>
                          </div>
                        )}
                      </div>

                      {/* Selected User Overview Banner */}
                      {selectedFeeUser && (
                        <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700 flex flex-col md:flex-row md:items-center justify-between gap-4">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-lg shadow-sm">
                              {selectedFeeUser.name ? selectedFeeUser.name.charAt(0).toUpperCase() : 'U'}
                            </div>
                            <div>
                              <div className="flex items-center gap-2.5">
                                <h3 className="text-base font-bold text-gray-900 dark:text-white">
                                  {selectedFeeUser.name || 'Registered User'}
                                </h3>
                                <Badge
                                  variant={userOverride?.enabled ? 'default' : 'secondary'}
                                  className={`text-xs ${
                                    userOverride?.enabled
                                      ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                                      : ''
                                  }`}
                                >
                                  {userOverride?.enabled ? 'Custom Overrides Active' : 'Using Global Defaults'}
                                </Badge>
                              </div>
                              <p className="text-xs text-gray-500 font-mono mt-0.5">
                                {selectedFeeUser.email} • ID: {selectedFeeUser.id.slice(0, 10)}...
                              </p>
                            </div>
                          </div>

                          {/* Enable Custom Fees Switch */}
                          <div className="flex items-center gap-3 bg-gray-50 dark:bg-gray-900/60 p-3 rounded-xl border border-gray-200 dark:border-gray-700">
                            <div>
                              <p className="text-xs font-semibold text-gray-900 dark:text-white">
                                Enable Custom Fees
                              </p>
                              <p className="text-[11px] text-gray-500">
                                Override platform defaults for this user
                              </p>
                            </div>
                            <Switch
                              checked={Boolean(userOverride?.enabled)}
                              onCheckedChange={(checked) => handleToggleUserOverride(selectedFeeUser, checked)}
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    {!selectedFeeUser ? (
                      /* Empty State: No user selected */
                      <div className="bg-white dark:bg-gray-800 rounded-2xl p-12 text-center border border-gray-200 dark:border-gray-700 shadow-sm">
                        <User className="w-12 h-12 mx-auto text-gray-400 mb-3 opacity-60" />
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">Select a User to Customize Fees</h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400 max-w-md mx-auto mb-6">
                          Choose any registered user from the dropdown above to configure custom withdrawal fees, gas fee policies, or unique deposit addresses.
                        </p>
                        <div className="flex flex-wrap justify-center gap-2 max-w-xl mx-auto">
                          {users.slice(0, 6).map(u => (
                            <Button
                              key={u.id}
                              variant="outline"
                              size="sm"
                              onClick={() => setSelectedFeeUserId(u.id)}
                              className="text-xs"
                            >
                              <User className="w-3 h-3 mr-1.5" />
                              {u.name || u.email}
                            </Button>
                          ))}
                        </div>
                      </div>
                    ) : (
                      /* Asset cards grid for selected user */
                      <div className="space-y-4">
                        <div className="flex items-center justify-between px-1">
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            Showing personalized rates for <strong>{selectedFeeUser.name || selectedFeeUser.email}</strong>. Coins without custom overrides automatically inherit Global Platform Defaults.
                          </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {assetConfig
                            .filter(asset => {
                              if (!feeAssetSearch.trim()) return true;
                              const q = feeAssetSearch.toLowerCase();
                              return (
                                asset.symbol.toLowerCase().includes(q) ||
                                asset.name.toLowerCase().includes(q) ||
                                (asset.network && asset.network.toLowerCase().includes(q))
                              );
                            })
                            .map((asset) => {
                              const isOverridden = Boolean(userOverride?.fees?.[asset.symbol]);
                              const effectiveFee = feeService.getEffectiveAssetFee(asset.symbol, selectedFeeUser.id);

                              const handleCopyDeposit = async () => {
                                const success = await copyToClipboard(effectiveFee.deposit_address);
                                if (success) {
                                  setCopiedDepositAddresses(prev => ({ ...prev, [`user_${asset.symbol}`]: true }));
                                  setTimeout(() => {
                                    setCopiedDepositAddresses(prev => ({ ...prev, [`user_${asset.symbol}`]: false }));
                                  }, 2000);
                                }
                              };

                              return (
                                <div
                                  key={asset.symbol}
                                  className={`bg-white dark:bg-gray-800 rounded-2xl p-6 border shadow-sm flex flex-col justify-between transition-all ${
                                    isOverridden
                                      ? 'border-blue-400 dark:border-blue-600 ring-1 ring-blue-400/20'
                                      : 'border-gray-200 dark:border-gray-700'
                                  }`}
                                >
                                  <div>
                                    {/* Card Header */}
                                    <div className="flex items-center justify-between mb-5 pb-4 border-b border-gray-100 dark:border-gray-700">
                                      <div className="flex items-center gap-3">
                                        {asset.logoUrl ? (
                                          <img src={asset.logoUrl} alt={asset.name} className="w-11 h-11 rounded-full object-cover shadow-sm" />
                                        ) : (
                                          <div className={`w-11 h-11 rounded-full ${asset.color} flex items-center justify-center text-white text-lg font-bold shadow-sm`}>
                                            {asset.icon}
                                          </div>
                                        )}
                                        <div>
                                          <div className="flex items-center gap-2">
                                            <h3 className="text-base font-bold text-gray-900 dark:text-white">{asset.name}</h3>
                                            <span className="px-2 py-0.5 rounded text-[11px] font-mono font-semibold bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                                              {asset.symbol}
                                            </span>
                                          </div>
                                          <div className="flex items-center gap-2 mt-1">
                                            {isOverridden ? (
                                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                                                Custom User Rate
                                              </span>
                                            ) : (
                                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400">
                                                Inheriting Global Default
                                              </span>
                                            )}
                                          </div>
                                        </div>
                                      </div>

                                      <div className="flex items-center gap-1.5">
                                        {isOverridden && (
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleResetUserAssetToGlobal(selectedFeeUser, asset.symbol)}
                                            className="h-8 text-[11px] text-gray-500 hover:text-red-600 px-2"
                                            title="Revert this coin to global default"
                                          >
                                            <RotateCcw className="w-3 h-3" />
                                          </Button>
                                        )}
                                        <Button
                                          variant={isOverridden ? 'default' : 'outline'}
                                          size="sm"
                                          onClick={() => handleEditFee(asset.symbol, selectedFeeUser)}
                                          className="h-8 text-xs font-semibold"
                                        >
                                          <Edit className="w-3.5 h-3.5 mr-1.5" />
                                          {isOverridden ? 'Edit Custom' : 'Set Override'}
                                        </Button>
                                      </div>
                                    </div>

                                    {/* Withdrawal Fees */}
                                    <div className="mb-5">
                                      <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2">
                                        Withdrawal Fees
                                      </h4>
                                      <div className="grid grid-cols-2 gap-3">
                                        <div className="p-2.5 bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-gray-100 dark:border-gray-800">
                                          <label className="block text-[11px] text-gray-500 dark:text-gray-400 mb-1">Fixed Fee</label>
                                          <p className="text-sm font-semibold font-mono text-gray-900 dark:text-white">
                                            {effectiveFee.withdraw_fee} {asset.symbol}
                                          </p>
                                        </div>
                                        <div className="p-2.5 bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-gray-100 dark:border-gray-800">
                                          <label className="block text-[11px] text-gray-500 dark:text-gray-400 mb-1">Percent Fee</label>
                                          <p className="text-sm font-semibold font-mono text-gray-900 dark:text-white">
                                            {effectiveFee.percent}%
                                          </p>
                                        </div>
                                      </div>
                                    </div>

                                    {/* Estimated Gas Fees */}
                                    <div className="mb-5">
                                      <div className="flex items-center justify-between mb-2">
                                        <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                                          Estimated Gas Fees
                                        </h4>
                                        <Badge variant={effectiveFee.gas_fee_enabled ? 'default' : 'secondary'} className="text-[10px]">
                                          {effectiveFee.gas_fee_enabled ? 'Active' : 'Disabled'}
                                        </Badge>
                                      </div>
                                      <div className="grid grid-cols-2 gap-3">
                                        <div className="p-2.5 bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-gray-100 dark:border-gray-800">
                                          <label className="block text-[11px] text-gray-500 dark:text-gray-400 mb-1">Fee Type</label>
                                          <p className="text-sm font-semibold text-gray-900 dark:text-white capitalize">
                                            {effectiveFee.gas_fee_type === 'fixed' ? 'Fixed Amount' : 'Percentage Rate'}
                                          </p>
                                        </div>
                                        <div className="p-2.5 bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-gray-100 dark:border-gray-800">
                                          <label className="block text-[11px] text-gray-500 dark:text-gray-400 mb-1">Rate / Value</label>
                                          <p className="text-sm font-semibold font-mono text-gray-900 dark:text-white">
                                            {effectiveFee.gas_fee_type === 'fixed' ? `${effectiveFee.gas_fee_fixed} ${asset.symbol}` : `${effectiveFee.gas_fee_percent}%`}
                                          </p>
                                        </div>
                                      </div>
                                    </div>

                                    {/* Deposit Address */}
                                    <div>
                                      <div className="flex items-center justify-between mb-2">
                                        <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                                          {isOverridden ? 'User-Specific Deposit Address' : 'Platform Deposit Address'}
                                        </h4>
                                        <Badge variant={effectiveFee.deposit_enabled ? 'default' : 'destructive'} className="text-[10px]">
                                          {effectiveFee.deposit_enabled ? 'Deposits Allowed' : 'Disabled'}
                                        </Badge>
                                      </div>
                                      <div className="bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800 rounded-lg p-2.5 flex items-center justify-between gap-2">
                                        <span className="font-mono text-xs text-gray-900 dark:text-white break-all select-all">
                                          {effectiveFee.deposit_address}
                                        </span>
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={handleCopyDeposit}
                                          className="h-7 w-7 p-0 flex-shrink-0"
                                        >
                                          {copiedDepositAddresses[`user_${asset.symbol}`] ? (
                                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                                          ) : (
                                            <Copy className="w-3.5 h-3.5 text-gray-500" />
                                          )}
                                        </Button>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          </TabsContent>

          {/* Message Settings Tab */}
          <TabsContent value="messages">
            <AdminMessaging users={users} />
          </TabsContent>

          {/* Support Tickets Tab */}
          <TabsContent value="support">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-xl text-gray-900 dark:text-white">Support Tickets</h2>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      Manage user support requests and send notifications
                    </p>
                  </div>
                </div>

                {/* Filter Badges */}
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Filter:</span>
                  <button
                    onClick={() => setTicketStatusFilter('all')}
                    className={`transition-all ${
                      ticketStatusFilter === 'all'
                        ? 'ring-2 ring-zinc-500 ring-offset-2 dark:ring-offset-zinc-900'
                        : ''
                    }`}
                  >
                    <Badge 
                      variant="outline" 
                      className={`cursor-pointer hover:bg-gray-100 dark:hover:bg-zinc-800 ${
                        ticketStatusFilter === 'all' ? 'bg-gray-100 dark:bg-zinc-800' : ''
                      }`}
                    >
                      All ({tickets.length})
                    </Badge>
                  </button>
                  <button
                    onClick={() => setTicketStatusFilter('open')}
                    className={`transition-all ${
                      ticketStatusFilter === 'open'
                        ? 'ring-2 ring-zinc-500 ring-offset-2 dark:ring-offset-gray-900'
                        : ''
                    }`}
                  >
                    <Badge 
                      variant="destructive" 
                      className={`cursor-pointer hover:opacity-80 ${
                        ticketStatusFilter === 'open' ? 'ring-2 ring-white' : ''
                      }`}
                    >
                      Open ({tickets.filter(t => t.status === 'open').length})
                    </Badge>
                  </button>
                  <button
                    onClick={() => setTicketStatusFilter('in-progress')}
                    className={`transition-all ${
                      ticketStatusFilter === 'in-progress'
                        ? 'ring-2 ring-zinc-500 ring-offset-2 dark:ring-offset-gray-900'
                        : ''
                    }`}
                  >
                    <Badge 
                      variant="default" 
                      className={`cursor-pointer hover:opacity-80 ${
                        ticketStatusFilter === 'in-progress' ? 'ring-2 ring-white' : ''
                      }`}
                    >
                      In Progress ({tickets.filter(t => t.status === 'in-progress' || t.status === 'in_progress').length})
                    </Badge>
                  </button>
                  <button
                    onClick={() => setTicketStatusFilter('resolved')}
                    className={`transition-all ${
                      ticketStatusFilter === 'resolved'
                        ? 'ring-2 ring-zinc-500 ring-offset-2 dark:ring-offset-gray-900'
                        : ''
                    }`}
                  >
                    <Badge 
                      variant="secondary" 
                      className={`cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-600 ${
                        ticketStatusFilter === 'resolved' ? 'bg-gray-200 dark:bg-gray-600' : ''
                      }`}
                    >
                      Resolved ({tickets.filter(t => t.status === 'resolved').length})
                    </Badge>
                  </button>
                  <button
                    onClick={() => setTicketStatusFilter('closed')}
                    className={`transition-all ${
                      ticketStatusFilter === 'closed'
                        ? 'ring-2 ring-zinc-500 ring-offset-2 dark:ring-offset-gray-900'
                        : ''
                    }`}
                  >
                    <Badge 
                      variant="outline" 
                      className={`cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 ${
                        ticketStatusFilter === 'closed' ? 'bg-gray-100 dark:bg-gray-700' : ''
                      }`}
                    >
                      Closed ({tickets.filter(t => t.status === 'closed').length})
                    </Badge>
                  </button>
                </div>
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Ticket ID</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tickets
                    .filter(ticket => {
                      if (ticketStatusFilter === 'all') return true;
                      if (ticketStatusFilter === 'in-progress') {
                        return ticket.status === 'in-progress' || ticket.status === 'in_progress';
                      }
                      return ticket.status === ticketStatusFilter;
                    })
                    .map((ticket) => (
                    <TableRow key={ticket.id}>
                      <TableCell className="font-mono text-sm">{ticket.id}</TableCell>
                      <TableCell>
                        <div>
                          <p className="text-sm text-gray-900 dark:text-white">
                            {ticket.userEmail || ticket.user_email || 'Unknown'}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {ticket.userName || ticket.user_name || ''}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell className="max-w-xs truncate">{ticket.subject}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">{ticket.category}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={
                            ticket.priority === 'high' || ticket.priority === 'urgent'
                              ? 'destructive' 
                              : ticket.priority === 'medium' 
                              ? 'default' 
                              : 'secondary'
                          }
                          className="capitalize"
                        >
                          {ticket.priority}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            ticket.status === 'open' 
                              ? 'destructive' 
                              : ticket.status === 'in-progress' || ticket.status === 'in_progress'
                              ? 'default' 
                              : ticket.status === 'closed'
                              ? 'outline'
                              : 'secondary'
                          }
                          className="capitalize"
                        >
                          {ticket.status === 'in-progress' || ticket.status === 'in_progress' ? 'In Progress' : ticket.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">
                        {new Date(ticket.created || ticket.created_at).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleViewTicket(ticket)}
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Empty State */}
              {tickets.filter(ticket => {
                if (ticketStatusFilter === 'all') return true;
                if (ticketStatusFilter === 'in-progress') {
                  return ticket.status === 'in-progress' || ticket.status === 'in_progress';
                }
                return ticket.status === ticketStatusFilter;
              }).length === 0 && (
                <div className="p-12 text-center">
                  <MessageCircle className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                  <h3 className="text-lg text-gray-900 dark:text-white mb-2">
                    No {ticketStatusFilter !== 'all' ? ticketStatusFilter : ''} tickets found
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {ticketStatusFilter !== 'all' 
                      ? `There are no tickets with status "${ticketStatusFilter}"`
                      : 'No support tickets have been created yet'}
                  </p>
                </div>
              )}
            </div>
          </TabsContent>

          {/* Live Chat Tab */}
          <TabsContent value="chat">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-xl text-gray-900 dark:text-white">Live Chat</h2>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      Chat with users in real-time (Messages synced with WhatsApp)
                    </p>
                  </div>
                </div>

                {/* Filter Badges */}
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Filter:</span>
                  <button
                    onClick={() => setChatStatusFilter('all')}
                    className={`transition-all ${
                      chatStatusFilter === 'all'
                        ? 'ring-2 ring-zinc-500 ring-offset-2 dark:ring-offset-gray-900'
                        : ''
                    }`}
                  >
                    <Badge 
                      variant="outline" 
                      className={`cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 ${
                        chatStatusFilter === 'all' ? 'bg-gray-100 dark:bg-gray-700' : ''
                      }`}
                    >
                      All ({chats.length})
                    </Badge>
                  </button>
                  <button
                    onClick={() => setChatStatusFilter('active')}
                    className={`transition-all ${
                      chatStatusFilter === 'active'
                        ? 'ring-2 ring-zinc-500 ring-offset-2 dark:ring-offset-gray-900'
                        : ''
                    }`}
                  >
                    <Badge 
                      variant="default" 
                      className={`cursor-pointer hover:opacity-80 ${
                        chatStatusFilter === 'active' ? 'ring-2 ring-white' : ''
                      }`}
                    >
                      Active ({chats.filter(c => c.status === 'active').length})
                    </Badge>
                  </button>
                  <button
                    onClick={() => setChatStatusFilter('resolved')}
                    className={`transition-all ${
                      chatStatusFilter === 'resolved'
                        ? 'ring-2 ring-zinc-500 ring-offset-2 dark:ring-offset-gray-900'
                        : ''
                    }`}
                  >
                    <Badge 
                      variant="secondary" 
                      className={`cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-600 ${
                        chatStatusFilter === 'resolved' ? 'bg-gray-200 dark:bg-gray-600' : ''
                      }`}
                    >
                      Resolved ({chats.filter(c => c.status === 'resolved').length})
                    </Badge>
                  </button>
                </div>
              </div>

              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {chats
                  .filter(chat => {
                    if (chatStatusFilter === 'all') return true;
                    return chat.status === chatStatusFilter;
                  })
                  .map((chat) => (
                  <div 
                    key={chat.id}
                    className="p-6 hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer transition-colors"
                    onClick={() => handleViewChat(chat)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 flex-1">
                        <div className="w-12 h-12 rounded-full bg-[#18181b] border border-zinc-700/60 flex items-center justify-center text-white text-lg">
                          {(chat.userName || chat.user_name || 'U').split(' ').map((n: string) => n[0]).join('').toUpperCase()}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="text-gray-900 dark:text-white">{chat.userName || chat.user_name || 'Unknown User'}</h3>
                            <Badge variant="outline" className="text-xs">
                              <Phone className="w-3 h-3 mr-1" />
                              WhatsApp
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">{chat.userEmail || chat.user_email || 'No email'}</p>
                          {chat.messages && chat.messages.length > 0 && (
                            <p className="text-sm text-gray-800 dark:text-gray-300 mt-1 truncate max-w-md">
                              {chat.messages[chat.messages.length - 1].message}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                          {new Date(chat.updated || chat.updated_at).toLocaleTimeString()}
                        </p>
                        <Badge 
                          variant={chat.status === 'active' ? 'default' : 'secondary'}
                          className="capitalize"
                        >
                          {chat.status}
                        </Badge>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                          {chat.messages ? chat.messages.length : 0} messages
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Empty State */}
              {chats.filter(chat => {
                if (chatStatusFilter === 'all') return true;
                return chat.status === chatStatusFilter;
              }).length === 0 && (
                <div className="p-12 text-center">
                  <MessageCircle className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                  <h3 className="text-lg text-gray-900 dark:text-white mb-2">
                    No {chatStatusFilter !== 'all' ? chatStatusFilter : ''} chats found
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {chatStatusFilter !== 'all' 
                      ? `There are no ${chatStatusFilter} chat conversations`
                      : 'No live chat conversations yet. Users can start a chat from their Support Center.'}
                  </p>
                </div>
              )}
            </div>
          </TabsContent>

          {/* Audit Logs Tab */}
          <TabsContent value="audit">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-xl text-gray-900 dark:text-white">Audit Logs</h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Complete history of all admin actions
                </p>
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Timestamp</TableHead>
                    <TableHead>Admin</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Details</TableHead>
                    <TableHead>IP Address</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {auditLogs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="text-sm">
                        {new Date(log.timestamp).toLocaleString()}
                      </TableCell>
                      <TableCell>{log.admin}</TableCell>
                      <TableCell>
                        <Badge>{log.action}</Badge>
                      </TableCell>
                      <TableCell className="text-sm text-gray-600 dark:text-gray-400">
                        {log.details}
                      </TableCell>
                      <TableCell className="font-mono text-sm">{log.ip}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          {/* Admin Users Tab */}
          {adminProfile.role === 'super_admin' && (
            <TabsContent value="admin_users">
              <AdminUsersTab adminProfile={adminProfile} platformUsers={users} />
            </TabsContent>
          )}

          {/* Data Sync Tab */}
          <TabsContent value="sync">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
              <div className="mb-6">
                <h2 className="text-xl text-gray-900 dark:text-white">Data Synchronization</h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Manage data migration from local storage to Supabase cloud database
                </p>
              </div>

              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
                <div className="flex gap-3">
                  <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm text-blue-900 dark:text-blue-100">
                      <span className="font-medium">Admin Access:</span> As an admin, you can migrate user data from local storage to Supabase for cloud synchronization.
                    </p>
                    <p className="text-xs text-blue-800 dark:text-blue-200 mt-2">
                      This operation will sync wallet data, transactions, notifications, support tickets, fee settings, and asset configurations to the cloud database.
                    </p>
                  </div>
                </div>
              </div>

              <MigrationPanel 
                userId="admin" 
                onMigrationComplete={() => {
                  console.log('Migration completed');
                }}
              />
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* User Details Modal */}
      {showUserDetails && selectedUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={() => setShowUserDetails(false)}>
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6 sticky top-0 bg-white dark:bg-gray-800 z-10 pb-4">
              <h2 className="text-2xl text-gray-900 dark:text-white">User Details</h2>
              <button onClick={() => setShowUserDetails(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
                <span className="text-gray-500 text-xl">×</span>
              </button>
            </div>

            {/* User Info */}
            <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4 mb-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">User ID</p>
                  <p className="text-sm font-mono text-gray-900 dark:text-white">{selectedUser.id}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Email</p>
                  <p className="text-sm text-gray-900 dark:text-white">{selectedUser.email}</p>
                </div>

                <div>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">KYC Status</p>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={
                        selectedUser.kyc_status === 'verified'
                          ? 'default'
                          : selectedUser.kyc_status === 'pending'
                          ? 'secondary'
                          : 'destructive'
                      }
                      className={
                        selectedUser.kyc_status === 'verified'
                          ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                          : selectedUser.kyc_status === 'in_review'
                          ? 'bg-amber-500 hover:bg-amber-600 text-white'
                          : ''
                      }
                    >
                      {(selectedUser.kyc_status || 'pending').toUpperCase()}
                    </Badge>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-6 text-xs px-2"
                      onClick={() => handleOpenKycModal(selectedUser)}
                    >
                      <FileCheck className="w-3 h-3 mr-1" />
                      Manage KYC
                    </Button>
                  </div>
                </div>
                <div>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Created</p>
                  <p className="text-sm text-gray-900 dark:text-white">
                    {new Date(selectedUser.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Last Login</p>
                  <p className="text-sm text-gray-900 dark:text-white">
                    {new Date(selectedUser.last_login).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>

            {/* Custom Fee & Deposit Settings Shortcut */}
            <div className="flex items-center justify-between p-4 bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 rounded-xl mb-6 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 flex items-center justify-center font-bold text-sm shadow-sm">
                  %
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">Fee & Deposit Configuration</p>
                    <Badge variant={userFeeOverrides[selectedUser.id]?.enabled ? 'default' : 'secondary'} className="text-[10px]">
                      {userFeeOverrides[selectedUser.id]?.enabled ? 'Custom Overrides Active' : 'Inheriting Global Defaults'}
                    </Badge>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-zinc-400 mt-0.5">
                    {userFeeOverrides[selectedUser.id]?.enabled
                      ? `${Object.keys(userFeeOverrides[selectedUser.id]?.fees || {}).length} custom asset rate(s) configured`
                      : 'Standard platform withdrawal and gas fee rates apply'}
                  </p>
                </div>
              </div>
              <Button
                size="sm"
                variant="outline"
                className="text-xs h-9 border-zinc-300 dark:border-zinc-600 hover:bg-zinc-100 dark:hover:bg-zinc-700"
                onClick={() => {
                  setShowUserDetails(false);
                  setSelectedFeeUserId(selectedUser.id);
                  setFeeScope('user');
                  setActiveTab('fees');
                }}
              >
                <Settings className="w-3.5 h-3.5 mr-1.5" />
                Configure Custom Fees
              </Button>
            </div>

            {/* Total Balance - Dark Glassmorphic tone #18181b */}
            <div className="relative overflow-hidden bg-[#18181b] bg-opacity-95 backdrop-blur-2xl border border-zinc-700/60 rounded-2xl p-6 mb-6 text-white shadow-2xl">
              <div className="absolute top-0 right-0 w-64 h-64 bg-zinc-800/40 rounded-full blur-3xl pointer-events-none -mr-16 -mt-16" />
              <div className="relative z-10">
                <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1">Total Balance (USD)</p>
                <p className="text-4xl font-bold tracking-tight text-white">
                  ${calculateTotalBalance(selectedUser.balances).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
              </div>
            </div>

            {/* KYC & Identity Verification Section */}
            <div className="p-4 bg-gray-50 dark:bg-gray-700/80 rounded-xl mb-6 border border-gray-200 dark:border-gray-600">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-zinc-700 dark:text-zinc-200" />
                  <h3 className="text-base font-semibold text-gray-900 dark:text-white">Identity & KYC Verification</h3>
                </div>
                <div className="flex items-center gap-2">
                  <Badge
                    variant={
                      selectedUser.kyc_status === 'verified'
                        ? 'default'
                        : selectedUser.kyc_status === 'pending'
                        ? 'secondary'
                        : 'destructive'
                    }
                    className={
                      selectedUser.kyc_status === 'verified'
                        ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                        : selectedUser.kyc_status === 'in_review'
                        ? 'bg-amber-500 hover:bg-amber-600 text-white'
                        : ''
                    }
                  >
                    {(selectedUser.kyc_status || 'pending').toUpperCase()}
                  </Badge>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleOpenKycModal(selectedUser)}
                    className="h-7 text-xs px-2.5"
                  >
                    <Edit2 className="w-3 h-3 mr-1" />
                    Review & Edit KYC
                  </Button>
                </div>
              </div>

              {/* KYC Details Preview */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm pt-3 border-t border-gray-200 dark:border-gray-600">
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Legal Name</p>
                  <p className="font-medium text-gray-900 dark:text-white truncate">
                    {selectedUser.kyc_data?.fullName || selectedUser.kyc_data?.full_name || selectedUser.full_name || 'Not provided'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Document Type</p>
                  <p className="font-medium text-gray-900 dark:text-white capitalize">
                    {(selectedUser.kyc_data?.idType || selectedUser.kyc_data?.id_type || 'N/A').replace('_', ' ')}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">ID Number</p>
                  <p className="font-mono text-gray-900 dark:text-white truncate">
                    {selectedUser.kyc_data?.idNumber || selectedUser.kyc_data?.id_number || 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Country</p>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {selectedUser.kyc_data?.country || selectedUser.kyc_data?.nationality || 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Date of Birth</p>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {selectedUser.kyc_data?.dateOfBirth || selectedUser.kyc_data?.date_of_birth || 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Documents Attached</p>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {selectedUser.kyc_data?.documentFrontUrl || selectedUser.kyc_data?.document_url ? 'Yes (Front attached)' : 'None'}
                  </p>
                </div>
              </div>

              {selectedUser.kyc_data?.rejectionReason && selectedUser.kyc_status === 'rejected' && (
                <div className="mt-3 p-2.5 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-xs text-red-700 dark:text-red-300">
                  <span className="font-semibold">Rejection Reason:</span> {selectedUser.kyc_data.rejectionReason}
                </div>
              )}

              {/* Quick Status Action Buttons */}
              <div className="flex gap-2 mt-3 pt-3 border-t border-gray-200 dark:border-gray-600">
                <Button
                  size="sm"
                  onClick={() => handleQuickUpdateKycStatus(selectedUser, 'verified')}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white h-8 text-xs"
                >
                  <Check className="w-3.5 h-3.5 mr-1" />
                  Approve / Verify
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleQuickUpdateKycStatus(selectedUser, 'in_review')}
                  className="flex-1 h-8 text-xs text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20"
                >
                  <Clock className="w-3.5 h-3.5 mr-1" />
                  Mark In Review
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => handleOpenKycModal(selectedUser)}
                  className="flex-1 h-8 text-xs"
                >
                  <XCircle className="w-3.5 h-3.5 mr-1" />
                  Reject / Feedback
                </Button>
              </div>
            </div>

            {/* Login & Security Details */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg text-gray-900 dark:text-white">Login & Security</h3>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleEditLoginDetails(selectedUser)}
                >
                  <Edit2 className="w-4 h-4 mr-1" />
                  Edit Login Details
                </Button>
              </div>
              
              <div className="space-y-3">
                <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-xl">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Password</p>
                      <p className="text-sm text-gray-900 dark:text-white">••••••••</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Password Last Changed</p>
                      <p className="text-sm text-gray-900 dark:text-white">
                        {selectedUser.passwordLastChanged ? new Date(selectedUser.passwordLastChanged).toLocaleDateString() : 'Never'}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-xl">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Two-Factor Authentication</p>
                      <p className="text-sm text-gray-900 dark:text-white">
                        {selectedUser.twoFactorAuth?.enabled ? 'Enabled' : 'Disabled'}
                      </p>
                    </div>
                    <Badge variant={selectedUser.twoFactorAuth?.enabled ? 'default' : 'secondary'}>
                      {selectedUser.twoFactorAuth?.enabled ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                  
                  {selectedUser.twoFactorAuth?.enabled && (
                    <div className="grid grid-cols-2 gap-4 pt-3 border-t border-gray-200 dark:border-gray-600">
                      <div>
                        <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Preferred Method</p>
                        <p className="text-sm text-gray-900 dark:text-white capitalize">
                          {selectedUser.twoFactorAuth.preferredMethod || 'None'}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Setup Date</p>
                        <p className="text-sm text-gray-900 dark:text-white">
                          {selectedUser.twoFactorAuth.setupDate ? new Date(selectedUser.twoFactorAuth.setupDate).toLocaleDateString() : 'N/A'}
                        </p>
                      </div>
                      {selectedUser.twoFactorAuth.passcode && (
                        <div>
                          <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Passcode</p>
                          <p className="text-sm text-gray-900 dark:text-white font-mono">
                            {selectedUser.twoFactorAuth.passcode}
                          </p>
                        </div>
                      )}
                      <div>
                        <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Biometric</p>
                        <p className="text-sm text-gray-900 dark:text-white">
                          {selectedUser.twoFactorAuth.biometricEnabled ? 'Enabled' : 'Disabled'}
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-xl">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Failed Login Attempts</p>
                      <p className="text-sm text-gray-900 dark:text-white">
                        {selectedUser.failedLoginAttempts || 0}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Account Locked</p>
                      <Badge variant={selectedUser.accountLocked ? 'destructive' : 'default'}>
                        {selectedUser.accountLocked ? 'Yes' : 'No'}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Custom Message Section */}
            <div className="mb-6">
              <h3 className="text-lg text-gray-900 dark:text-white mb-4">User Restrictions & Custom Message</h3>
              <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">Enable Custom Message</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      Show this message when the user attempts to withdraw or swap assets.
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editCustomMessageEnabled}
                      onChange={(e) => setEditCustomMessageEnabled(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-zinc-500 dark:peer-focus:ring-zinc-600 rounded-full peer dark:bg-gray-600 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-zinc-600"></div>
                  </label>
                </div>
                {editCustomMessageEnabled && (
                  <div>
                    <label className="block text-sm mb-2 text-gray-700 dark:text-gray-300">
                      Message Content
                    </label>
                    <textarea
                      value={editCustomMessage}
                      onChange={(e) => setEditCustomMessage(e.target.value)}
                      placeholder="e.g., Your account requires further verification before withdrawing funds."
                      className="w-full p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white h-24 resize-none"
                    />
                  </div>
                )}
                <Button 
                  size="sm" 
                  onClick={handleSaveCustomMessage}
                  className="w-full sm:w-auto"
                >
                  <Check className="w-4 h-4 mr-2" /> Save Custom Message
                </Button>
              </div>
            </div>

            {/* Assets */}
            <div>
              <h3 className="text-lg mb-4 text-gray-900 dark:text-white">Assets</h3>
              <div className="space-y-3">
                {assetConfig.map((asset) => {
                  const balance = parseFloat(selectedUser.balances[asset.symbol] || '0');
                  const price = prices[asset.symbol as keyof typeof prices] || 0;
                  const value = balance * price;
                  const change = priceChanges[asset.symbol as keyof typeof priceChanges] || 0;

                  return (
                    <div key={asset.symbol} className="p-4 bg-gray-50 dark:bg-gray-700 rounded-xl">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {asset.logoUrl ? (
                            <img src={asset.logoUrl} alt={asset.name} className="w-12 h-12 rounded-full object-cover" />
                          ) : (
                            <div className={`w-12 h-12 rounded-full ${asset.color} flex items-center justify-center text-white text-xl`}>
                              {asset.icon}
                            </div>
                          )}
                          <div>
                            <h4 className="text-gray-900 dark:text-white">{asset.name}</h4>
                            <p className="text-sm text-gray-600 dark:text-gray-400">{asset.symbol}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-gray-900 dark:text-white">
                            {formatBalance(balance)} {asset.symbol}
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            ${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </p>
                        </div>
                      </div>
                      <div className="mt-3 flex items-center justify-between text-xs">
                        <span className="text-gray-600 dark:text-gray-400">
                          Price: ${price.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </span>
                        <Badge variant={change >= 0 ? 'default' : 'destructive'} className="flex items-center gap-1">
                          {change >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                          {change >= 0 ? '+' : ''}{change.toFixed(1)}%
                        </Badge>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* KYC Review & Management Modal */}
      {showKycModal && selectedKycUser && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50" onClick={() => setShowKycModal(false)}>
          <div className="bg-white dark:bg-[#18181b] border border-gray-200 dark:border-zinc-700/60 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            {/* Modal Header */}
            <div className="flex items-center justify-between mb-6 sticky top-0 bg-white dark:bg-[#18181b] z-10 pb-4 border-b border-gray-200 dark:border-zinc-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-zinc-100 dark:bg-zinc-850 flex items-center justify-center text-zinc-900 dark:text-zinc-100 border border-zinc-200 dark:border-zinc-700">
                  <FileCheck className="w-5 h-5 text-zinc-700 dark:text-zinc-200" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">KYC Verification Review</h2>
                  <p className="text-xs text-gray-500 dark:text-zinc-400">User: {selectedKycUser.email} ({selectedKycUser.id.slice(0, 8)}...)</p>
                </div>
              </div>
              <button onClick={() => setShowKycModal(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg transition-colors">
                <span className="text-gray-500 dark:text-zinc-400 text-xl font-bold">×</span>
              </button>
            </div>

            {/* Status Selector Bar */}
            <div className="mb-6 p-4 bg-gray-50 dark:bg-zinc-900/60 rounded-xl border border-gray-200 dark:border-zinc-800">
              <p className="text-xs font-semibold text-gray-600 dark:text-zinc-400 mb-2">UPDATE STATUS</p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <button
                  type="button"
                  onClick={() => setKycForm({ ...kycForm, status: 'verified' })}
                  className={`py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                    kycForm.status === 'verified'
                      ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20 ring-2 ring-emerald-500 ring-offset-1 dark:ring-offset-zinc-900'
                      : 'bg-white dark:bg-zinc-800 text-gray-700 dark:text-zinc-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 border border-gray-200 dark:border-zinc-700'
                  }`}
                >
                  <Check className="w-3.5 h-3.5" />
                  Verified
                </button>
                <button
                  type="button"
                  onClick={() => setKycForm({ ...kycForm, status: 'in_review' })}
                  className={`py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                    kycForm.status === 'in_review'
                      ? 'bg-amber-500 text-white shadow-md shadow-amber-500/20 ring-2 ring-amber-400 ring-offset-1 dark:ring-offset-zinc-900'
                      : 'bg-white dark:bg-zinc-800 text-gray-700 dark:text-zinc-300 hover:bg-amber-50 dark:hover:bg-amber-950/30 border border-gray-200 dark:border-zinc-700'
                  }`}
                >
                  <Clock className="w-3.5 h-3.5" />
                  In Review
                </button>
                <button
                  type="button"
                  onClick={() => setKycForm({ ...kycForm, status: 'pending' })}
                  className={`py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                    kycForm.status === 'pending'
                      ? 'bg-zinc-600 text-white shadow-md shadow-zinc-600/20 ring-2 ring-zinc-500 ring-offset-1 dark:ring-offset-zinc-900'
                      : 'bg-white dark:bg-zinc-800 text-gray-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700 border border-gray-200 dark:border-zinc-700'
                  }`}
                >
                  <AlertCircle className="w-3.5 h-3.5" />
                  Pending
                </button>
                <button
                  type="button"
                  onClick={() => setKycForm({ ...kycForm, status: 'rejected' })}
                  className={`py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                    kycForm.status === 'rejected'
                      ? 'bg-red-600 text-white shadow-md shadow-red-600/20 ring-2 ring-red-500 ring-offset-1 dark:ring-offset-zinc-900'
                      : 'bg-white dark:bg-zinc-800 text-gray-700 dark:text-zinc-300 hover:bg-red-50 dark:hover:bg-red-950/30 border border-gray-200 dark:border-zinc-700'
                  }`}
                >
                  <XCircle className="w-3.5 h-3.5" />
                  Rejected
                </button>
              </div>
            </div>

            {/* KYC Form Fields */}
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-zinc-300 mb-1">Full Legal Name</label>
                  <Input
                    value={kycForm.fullName}
                    onChange={(e) => setKycForm({ ...kycForm, fullName: e.target.value })}
                    placeholder="User's legal full name"
                    className="dark:bg-zinc-800 dark:border-zinc-700"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-zinc-300 mb-1">Date of Birth</label>
                  <Input
                    type="date"
                    value={kycForm.dateOfBirth}
                    onChange={(e) => setKycForm({ ...kycForm, dateOfBirth: e.target.value })}
                    className="dark:bg-zinc-800 dark:border-zinc-700"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-zinc-300 mb-1">Country / Nationality</label>
                  <Input
                    value={kycForm.country}
                    onChange={(e) => setKycForm({ ...kycForm, country: e.target.value })}
                    placeholder="e.g. United States, Germany, Nigeria"
                    className="dark:bg-zinc-800 dark:border-zinc-700"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-zinc-300 mb-1">Document Type</label>
                  <select
                    value={kycForm.idType}
                    onChange={(e) => setKycForm({ ...kycForm, idType: e.target.value })}
                    className="w-full h-10 px-3 py-2 rounded-md border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-zinc-500"
                  >
                    <option value="national_id">National ID Card</option>
                    <option value="passport">International Passport</option>
                    <option value="drivers_license">Driver's License</option>
                    <option value="residence_permit">Residence Permit</option>
                    <option value="other">Other Official Document</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-zinc-300 mb-1">Document ID Number</label>
                  <Input
                    value={kycForm.idNumber}
                    onChange={(e) => setKycForm({ ...kycForm, idNumber: e.target.value })}
                    placeholder="e.g. A12345678"
                    className="font-mono dark:bg-zinc-800 dark:border-zinc-700"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-zinc-300 mb-1">Residential Address</label>
                  <Input
                    value={kycForm.address}
                    onChange={(e) => setKycForm({ ...kycForm, address: e.target.value })}
                    placeholder="User's residential street address"
                    className="dark:bg-zinc-800 dark:border-zinc-700"
                  />
                </div>
              </div>

              {/* Documents and Previews */}
              <div className="p-4 bg-gray-50 dark:bg-zinc-900/60 rounded-xl border border-gray-200 dark:border-zinc-800 space-y-3">
                <p className="text-xs font-semibold text-gray-600 dark:text-zinc-400">UPLOADED DOCUMENTS / PHOTOS</p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <p className="text-xs text-gray-500 dark:text-zinc-400 font-medium">Front of ID</p>
                    {kycForm.documentFrontUrl ? (
                      <div className="relative group border border-gray-300 dark:border-zinc-700 rounded-lg overflow-hidden bg-black/10 dark:bg-black/30 h-28 flex items-center justify-center">
                        <img src={kycForm.documentFrontUrl} alt="Document Front" className="w-full h-full object-cover" />
                        <a href={kycForm.documentFrontUrl} target="_blank" rel="noreferrer" className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-xs gap-1 transition-opacity">
                          <ExternalLink className="w-3.5 h-3.5" /> View Full
                        </a>
                      </div>
                    ) : (
                      <div className="border-2 border-dashed border-gray-300 dark:border-zinc-700 rounded-lg h-28 flex flex-col items-center justify-center text-xs text-gray-400">
                        <FileText className="w-6 h-6 mb-1 opacity-50" />
                        <span>No front image</span>
                      </div>
                    )}
                    <div className="flex items-center gap-1.5 mt-1">
                      <Input
                        value={kycForm.documentFrontUrl.startsWith('data:') ? 'Image uploaded (base64)' : kycForm.documentFrontUrl}
                        onChange={(e) => setKycForm({ ...kycForm, documentFrontUrl: e.target.value })}
                        placeholder="Image URL"
                        className="h-8 text-xs dark:bg-zinc-800 dark:border-zinc-700"
                      />
                      <label className="cursor-pointer h-8 px-2 bg-gray-200 dark:bg-zinc-700 hover:bg-gray-300 dark:hover:bg-zinc-600 rounded flex items-center justify-center text-xs text-gray-700 dark:text-zinc-200 flex-shrink-0" title="Upload image file">
                        <Upload className="w-3.5 h-3.5" />
                        <input type="file" accept="image/*,.pdf" className="hidden" onChange={(e) => handleAdminKycFileUpload(e, 'front')} />
                      </label>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <p className="text-xs text-gray-500 dark:text-zinc-400 font-medium">Back of ID (Optional)</p>
                    {kycForm.documentBackUrl ? (
                      <div className="relative group border border-gray-300 dark:border-zinc-700 rounded-lg overflow-hidden bg-black/10 dark:bg-black/30 h-28 flex items-center justify-center">
                        <img src={kycForm.documentBackUrl} alt="Document Back" className="w-full h-full object-cover" />
                        <a href={kycForm.documentBackUrl} target="_blank" rel="noreferrer" className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-xs gap-1 transition-opacity">
                          <ExternalLink className="w-3.5 h-3.5" /> View Full
                        </a>
                      </div>
                    ) : (
                      <div className="border-2 border-dashed border-gray-300 dark:border-zinc-700 rounded-lg h-28 flex flex-col items-center justify-center text-xs text-gray-400">
                        <FileText className="w-6 h-6 mb-1 opacity-50" />
                        <span>No back image</span>
                      </div>
                    )}
                    <div className="flex items-center gap-1.5 mt-1">
                      <Input
                        value={kycForm.documentBackUrl.startsWith('data:') ? 'Image uploaded (base64)' : kycForm.documentBackUrl}
                        onChange={(e) => setKycForm({ ...kycForm, documentBackUrl: e.target.value })}
                        placeholder="Image URL"
                        className="h-8 text-xs dark:bg-zinc-800 dark:border-zinc-700"
                      />
                      <label className="cursor-pointer h-8 px-2 bg-gray-200 dark:bg-zinc-700 hover:bg-gray-300 dark:hover:bg-zinc-600 rounded flex items-center justify-center text-xs text-gray-700 dark:text-zinc-200 flex-shrink-0" title="Upload image file">
                        <Upload className="w-3.5 h-3.5" />
                        <input type="file" accept="image/*,.pdf" className="hidden" onChange={(e) => handleAdminKycFileUpload(e, 'back')} />
                      </label>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <p className="text-xs text-gray-500 dark:text-zinc-400 font-medium">Selfie / Verification Photo</p>
                    {kycForm.selfieUrl ? (
                      <div className="relative group border border-gray-300 dark:border-zinc-700 rounded-lg overflow-hidden bg-black/10 dark:bg-black/30 h-28 flex items-center justify-center">
                        <img src={kycForm.selfieUrl} alt="Selfie" className="w-full h-full object-cover" />
                        <a href={kycForm.selfieUrl} target="_blank" rel="noreferrer" className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-xs gap-1 transition-opacity">
                          <ExternalLink className="w-3.5 h-3.5" /> View Full
                        </a>
                      </div>
                    ) : (
                      <div className="border-2 border-dashed border-gray-300 dark:border-zinc-700 rounded-lg h-28 flex flex-col items-center justify-center text-xs text-gray-400">
                        <User className="w-6 h-6 mb-1 opacity-50" />
                        <span>No selfie uploaded</span>
                      </div>
                    )}
                    <div className="flex items-center gap-1.5 mt-1">
                      <Input
                        value={kycForm.selfieUrl.startsWith('data:') ? 'Image uploaded (base64)' : kycForm.selfieUrl}
                        onChange={(e) => setKycForm({ ...kycForm, selfieUrl: e.target.value })}
                        placeholder="Image URL"
                        className="h-8 text-xs dark:bg-zinc-800 dark:border-zinc-700"
                      />
                      <label className="cursor-pointer h-8 px-2 bg-gray-200 dark:bg-zinc-700 hover:bg-gray-300 dark:hover:bg-zinc-600 rounded flex items-center justify-center text-xs text-gray-700 dark:text-zinc-200 flex-shrink-0" title="Upload image file">
                        <Upload className="w-3.5 h-3.5" />
                        <input type="file" accept="image/*,.pdf" className="hidden" onChange={(e) => handleAdminKycFileUpload(e, 'selfie')} />
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              {/* Rejection Reason (shown to user) */}
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-zinc-300 mb-1">
                  Rejection Reason <span className="text-gray-400 dark:text-zinc-500">(Visible to user on their dashboard if rejected)</span>
                </label>
                <Input
                  value={kycForm.rejectionReason}
                  onChange={(e) => setKycForm({ ...kycForm, rejectionReason: e.target.value })}
                  placeholder="e.g. Document image is blurry or expired. Please upload a valid, clear government-issued ID."
                  className="dark:bg-zinc-800 dark:border-zinc-700"
                />
              </div>

              {/* Admin Internal Notes */}
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-zinc-300 mb-1">
                  Admin Internal Notes <span className="text-gray-400 dark:text-zinc-500">(Only visible to administrators)</span>
                </label>
                <Textarea
                  value={kycForm.adminNotes}
                  onChange={(e) => setKycForm({ ...kycForm, adminNotes: e.target.value })}
                  placeholder="Internal audit notes regarding compliance verification, sanction check, etc."
                  rows={2}
                  className="dark:bg-zinc-800 dark:border-zinc-700 resize-none text-xs"
                />
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex gap-3 mt-6 pt-4 border-t border-gray-200 dark:border-zinc-800">
              <Button
                variant="outline"
                onClick={() => setShowKycModal(false)}
                className="flex-1"
                disabled={isSavingKyc}
              >
                Cancel
              </Button>
              <Button
                onClick={() => handleSaveKycData()}
                disabled={isSavingKyc}
                className="flex-1 bg-[#18181b] hover:bg-zinc-800 text-white border border-zinc-700/60 shadow-lg"
              >
                {isSavingKyc ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Saving KYC...
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4 mr-2" />
                    Save KYC Data
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Balance Modal */}
      {showEditBalance && selectedUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={() => setShowEditBalance(false)}>
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6 sticky top-0 bg-white dark:bg-gray-800 z-10 pb-4">
              <h2 className="text-2xl text-gray-900 dark:text-white">Edit Balance & Addresses</h2>
              <button onClick={() => setShowEditBalance(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
                <span className="text-gray-500 text-xl">×</span>
              </button>
            </div>

            <div className="space-y-4">
              <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">User</p>
                <p className="text-gray-900 dark:text-white">{selectedUser.email}</p>
              </div>

              {assetConfig.map((assetItem) => {
                const asset = assetItem.symbol;
                const currentBalance = editBalances[asset] ?? '0';
                const currentAddress = editAddresses[asset] || '';
                const adjustAmount = cardAdjustAmounts[asset] || '';
                const isThisAdjusting = adjustingAsset === asset;

                return (
                  <div key={asset} className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4 space-y-3.5 border border-gray-200/80 dark:border-gray-600/70">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {assetItem.logoUrl ? (
                          <img src={assetItem.logoUrl} alt={assetItem.name} className="w-10 h-10 rounded-full object-cover" />
                        ) : (
                          <div className={`w-10 h-10 rounded-full ${assetItem.color} flex items-center justify-center text-white font-bold`}>
                            {assetItem.icon || asset.charAt(0)}
                          </div>
                        )}
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-semibold text-gray-900 dark:text-white">{assetItem.name}</h4>
                            <span className="text-xs px-2 py-0.5 rounded bg-gray-200 dark:bg-gray-600 font-mono text-gray-700 dark:text-gray-300">
                              {asset}
                            </span>
                          </div>
                          {assetItem.network && (
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{assetItem.network}</p>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-xs text-gray-500 dark:text-gray-400 block">Current Balance</span>
                        <span className="text-sm font-semibold text-gray-900 dark:text-white">
                          {currentBalance} {asset}
                        </span>
                      </div>
                    </div>
                    
                    {/* Direct Balance Input */}
                    <div>
                      <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Balance
                      </label>
                      <Input
                        type="number"
                        step="any"
                        value={currentBalance}
                        placeholder="0.00"
                        onChange={(e) => setEditBalances({ ...editBalances, [asset]: e.target.value })}
                        className="bg-white dark:bg-gray-800"
                      />
                    </div>

                    {/* Quick Add / Deduct directly on this card */}
                    <div className="p-3 bg-white dark:bg-gray-800/80 rounded-lg border border-gray-200 dark:border-gray-600/70 space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-medium text-gray-600 dark:text-gray-400 flex items-center gap-1.5">
                          <Coins className="w-3.5 h-3.5 text-zinc-500" />
                          Adjust Balance (+ / -)
                        </label>
                      </div>
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          step="any"
                          min="0"
                          placeholder="Amount"
                          value={adjustAmount}
                          onChange={(e) => setCardAdjustAmounts({ ...cardAdjustAmounts, [asset]: e.target.value })}
                          className="flex-1 h-9 text-sm bg-gray-50 dark:bg-gray-700"
                          disabled={isThisAdjusting}
                        />
                        <Button
                          type="button"
                          size="sm"
                          disabled={!adjustAmount || isThisAdjusting}
                          onClick={() => handleCardAdjustBalance(asset, 'add')}
                          className="h-9 px-3 bg-green-600 hover:bg-green-700 text-white font-medium flex items-center gap-1 border-0"
                          title="Add to balance"
                        >
                          {isThisAdjusting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                          Add
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          disabled={!adjustAmount || isThisAdjusting}
                          onClick={() => handleCardAdjustBalance(asset, 'deduct')}
                          className="h-9 px-3 bg-red-600 hover:bg-red-700 text-white font-medium flex items-center gap-1 border-0"
                          title="Deduct from balance"
                        >
                          {isThisAdjusting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Minus className="w-3.5 h-3.5" />}
                          Deduct
                        </Button>
                      </div>
                    </div>

                    {/* Wallet Address with Copy Icon */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">
                          Wallet Address
                        </label>
                        <button
                          type="button"
                          onClick={() => {
                            const newAddress = generateRandomAddress(asset);
                            handleAddressChange(asset, newAddress);
                          }}
                          className="text-xs text-purple-600 dark:text-purple-400 hover:underline"
                        >
                          Generate Address
                        </button>
                      </div>
                      <div className="flex items-center gap-2">
                        <Input
                          type="text"
                          value={currentAddress}
                          placeholder={`Enter ${asset} address`}
                          className={`font-mono text-xs flex-1 bg-white dark:bg-gray-800 ${addressErrors[asset] ? 'border-red-500 dark:border-red-500' : ''}`}
                          onChange={(e) => handleAddressChange(asset, e.target.value)}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => handleCopyModalAddress(asset, currentAddress)}
                          disabled={!currentAddress}
                          className="h-9 px-2.5 shrink-0 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700"
                          title="Copy Wallet Address"
                        >
                          {copiedModalAddress === asset ? (
                            <Check className="w-4 h-4 text-green-600 dark:text-green-400" />
                          ) : (
                            <Copy className="w-4 h-4 text-gray-600 dark:text-gray-300" />
                          )}
                        </Button>
                      </div>
                      {addressErrors[asset] && (
                        <div className="flex items-center gap-1.5 mt-1.5 text-red-600 dark:text-red-400">
                          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                          <span className="text-xs">{addressErrors[asset]}</span>
                        </div>
                      )}
                      {!addressErrors[asset] && currentAddress && (
                        <div className="flex items-center gap-1.5 mt-1.5 text-green-600 dark:text-green-400">
                          <CheckCircle className="w-3.5 h-3.5 shrink-0" />
                          <span className="text-xs">Valid {asset} address</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}

              <Button size="lg" className="w-full mt-4 bg-[#18181b] hover:bg-zinc-700 text-white border-0" onClick={handleUpdateBalance}>
                <Check className="w-4 h-4 mr-2" />
                Update Balance & Addresses
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* User Activities Modal */}
      {showUserActivities && selectedUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 overflow-y-auto" onClick={() => setShowUserActivities(false)}>
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-3xl w-full p-6 my-8" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl text-gray-900 dark:text-white">User Activities</h2>
              <button onClick={() => setShowUserActivities(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
                <span className="text-gray-500 text-xl">×</span>
              </button>
            </div>

            <div className="space-y-4">
              <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">User</p>
                <p className="text-gray-900 dark:text-white">{selectedUser.email}</p>
              </div>

              <div className="space-y-3">
                {getUserActivities(selectedUser.id).length === 0 ? (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    No activities yet
                  </div>
                ) : (
                  getUserActivities(selectedUser.id).map((activity) => {
                    const asset = assetConfig.find(a => a.symbol === activity.asset);
                    const isPending = activity.status === 'pending' || activity.status === 'processing';
                    
                    return (
                      <div key={activity.id} className="p-4 bg-gray-50 dark:bg-gray-700 rounded-xl border-2 border-transparent hover:border-zinc-500 transition-all">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className={`w-12 h-12 rounded-full ${asset?.color} flex items-center justify-center text-white relative`}>
                              {activity.type === 'send' && <ArrowUpRight className="w-6 h-6" />}
                              {activity.type === 'receive' && <ArrowDownLeft className="w-6 h-6" />}
                              {activity.type === 'swap' && <RefreshCw className="w-6 h-6" />}
                              {activity.type === 'buy' && <DollarSign className="w-6 h-6" />}
                              {activity.type === 'deposit' && <ArrowDownLeft className="w-6 h-6" />}
                              {(activity.type === 'credit' || activity.type === 'admin_credit') && <ArrowDownLeft className="w-6 h-6" />}
                              {(activity.type === 'debit' || activity.type === 'admin_debit') && <ArrowUpRight className="w-6 h-6" />}
                              {isPending && (
                                <div className="absolute inset-0 rounded-full border-2 border-white border-t-transparent animate-spin" />
                              )}
                            </div>
                            <div>
                              <p className="text-gray-900 dark:text-white">
                                {(() => {
                                  const t = activity.type.replace(/^admin_/, '');
                                  return t.charAt(0).toUpperCase() + t.slice(1);
                                })()} {activity.asset}
                              </p>
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                {new Date(activity.timestamp).toLocaleString()}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className={`text-gray-900 dark:text-white ${
                              (activity.type === 'send' || activity.type === 'debit' || activity.type === 'admin_debit')
                                ? 'text-red-600 dark:text-red-400'
                                : 'text-green-600 dark:text-green-400'
                            }`}>
                              {(activity.type === 'send' || activity.type === 'debit' || activity.type === 'admin_debit') ? '-' : '+'}{activity.amount} {activity.asset}
                            </p>
                            <div className="flex items-center gap-2 justify-end mt-1">
                              <Badge className={getStatusColor(activity.status)}>
                                <div className="flex items-center gap-1">
                                  {isPending && (
                                    <div className="w-2 h-2 rounded-full bg-current animate-pulse" />
                                  )}
                                  {activity.status}
                                </div>
                              </Badge>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center justify-between pt-3 border-t border-gray-200 dark:border-gray-600">
                          <p className="text-xs text-gray-500 dark:text-gray-400 font-mono truncate flex-1 mr-2">
                            {activity.hash.substring(0, 20)}...{activity.hash.substring(activity.hash.length - 8)}
                          </p>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleViewTransaction(activity)}
                            className="shrink-0"
                          >
                            <Eye className="w-4 h-4 mr-1" />
                            View Receipt
                          </Button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Ticket Details Modal */}
      {showTicketDetails && selectedTicket && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={() => setShowTicketDetails(false)}>
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6 sticky top-0 bg-white dark:bg-gray-800 z-10 pb-4">
              <h2 className="text-2xl text-gray-900 dark:text-white">Ticket Details</h2>
              <button onClick={() => setShowTicketDetails(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
                <span className="text-gray-500 text-xl">×</span>
              </button>
            </div>

            {/* Ticket Info */}
            <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4 mb-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Ticket ID</p>
                  <p className="text-sm font-mono text-gray-900 dark:text-white">{selectedTicket.id}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">User</p>
                  <p className="text-sm text-gray-900 dark:text-white">
                    {selectedTicket.userEmail || selectedTicket.user_email || 'Unknown'}
                  </p>
                  {(selectedTicket.userName || selectedTicket.user_name) && (
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {selectedTicket.userName || selectedTicket.user_name}
                    </p>
                  )}
                </div>
                <div>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Created</p>
                  <p className="text-sm text-gray-900 dark:text-white">
                    {new Date(selectedTicket.created || selectedTicket.created_at).toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Last Updated</p>
                  <p className="text-sm text-gray-900 dark:text-white">
                    {new Date(selectedTicket.updated || selectedTicket.updated_at).toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Category</p>
                  <Badge variant="outline" className="capitalize">{selectedTicket.category}</Badge>
                </div>
                <div>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Priority</p>
                  <Badge 
                    variant={
                      selectedTicket.priority === 'high' || selectedTicket.priority === 'urgent'
                        ? 'destructive' 
                        : selectedTicket.priority === 'medium' 
                        ? 'default' 
                        : 'secondary'
                    }
                    className="capitalize"
                  >
                    {selectedTicket.priority}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Subject */}
            <div className="mb-4">
              <h3 className="text-lg text-gray-900 dark:text-white mb-2">{selectedTicket.subject}</h3>
              <div className="flex items-center gap-2">
                <Badge
                  variant={
                    selectedTicket.status === 'open' 
                      ? 'destructive' 
                      : selectedTicket.status === 'in-progress' || selectedTicket.status === 'in_progress'
                      ? 'default' 
                      : selectedTicket.status === 'closed'
                      ? 'outline'
                      : 'secondary'
                  }
                  className="capitalize"
                >
                  {selectedTicket.status === 'in-progress' || selectedTicket.status === 'in_progress' ? 'In Progress' : selectedTicket.status}
                </Badge>
              </div>
            </div>

            {/* Message Thread */}
            <div className="mb-6">
              <h3 className="text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                <MessageCircle className="w-4 h-4" />
                Conversation ({(selectedTicket.messages || []).length} messages)
              </h3>
              <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                {(selectedTicket.messages || []).map((msg: any, index: number) => (
                  <div 
                    key={index} 
                    className={`rounded-xl p-4 ${
                      msg.sender === 'user' 
                        ? 'bg-zinc-100 dark:bg-zinc-800/40 border border-zinc-200 dark:border-zinc-700 ml-8' 
                        : 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 mr-8'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          {msg.senderName || (msg.sender === 'user' ? 'User' : 'Support Team')}
                        </Badge>
                        {msg.sender === 'admin' && (
                          <span className="text-xs text-blue-600 dark:text-blue-400 font-medium">Admin Reply</span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {new Date(msg.timestamp).toLocaleString()}
                      </p>
                    </div>
                    <p className="text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap">{msg.message}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Response Form */}
            {selectedTicket.status === 'closed' && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
                <div className="flex items-center gap-2">
                  <XCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
                  <p className="text-sm text-red-800 dark:text-red-200 font-medium">
                    This ticket is closed. Users cannot reply to closed tickets.
                  </p>
                </div>
              </div>
            )}

            <div className="space-y-4">
              {selectedTicket.status !== 'closed' && (
                <>
                  <div>
                    <label className="block text-sm mb-2 text-gray-700 dark:text-gray-300">
                      Notification Method
                    </label>
                    <div className="flex gap-2">
                      <Button
                        variant={notificationMethod === 'email' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setNotificationMethod('email')}
                      >
                        <Mail className="w-4 h-4 mr-2" />
                        Email
                      </Button>
                      <Button
                        variant={notificationMethod === 'sms' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setNotificationMethod('sms')}
                      >
                        <Phone className="w-4 h-4 mr-2" />
                        SMS
                      </Button>
                      <Button
                        variant={notificationMethod === 'both' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setNotificationMethod('both')}
                      >
                        <Mail className="w-4 h-4 mr-2" />
                        Both
                      </Button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm mb-2 text-gray-700 dark:text-gray-300">
                      Your Response
                    </label>
                    <textarea
                      value={ticketResponse}
                      onChange={(e) => setTicketResponse(e.target.value)}
                      placeholder="Type your response to the user..."
                      className="w-full h-32 px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none focus:outline-none focus:ring-2 focus:ring-zinc-500"
                    />
                  </div>
                </>
              )}

              <div className="flex gap-2">
                {selectedTicket.status !== 'closed' && (
                  <Button 
                    size="lg" 
                    className="flex-1"
                    onClick={handleSendTicketResponse}
                    disabled={!ticketResponse.trim()}
                  >
                    <Send className="w-4 h-4 mr-2" />
                    Send Response
                  </Button>
                )}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="lg">
                      Update Status
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem onClick={() => handleUpdateTicket(selectedTicket.id, 'open')}>
                      <AlertCircle className="w-4 h-4 mr-2" />
                      Open
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleUpdateTicket(selectedTicket.id, 'in-progress')}>
                      <Clock className="w-4 h-4 mr-2" />
                      In Progress
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleUpdateTicket(selectedTicket.id, 'resolved')}>
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Resolved
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => handleUpdateTicket(selectedTicket.id, 'closed')} className="text-red-600 dark:text-red-400">
                      <XCircle className="w-4 h-4 mr-2" />
                      Close Ticket
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Chat Details Modal */}
      {showChatDetails && selectedChat && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={() => setShowChatDetails(false)}>
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-3xl w-full max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
            {/* Chat Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-[#18181b] border border-zinc-700/60 flex items-center justify-center text-white text-lg">
                  {(selectedChat.userName || selectedChat.user_name || 'U').split(' ').map((n: string) => n[0]).join('').toUpperCase()}
                </div>
                <div>
                  <h2 className="text-xl text-gray-900 dark:text-white">{selectedChat.userName || selectedChat.user_name || 'Unknown User'}</h2>
                  <div className="flex items-center gap-2 mt-1">
                    <p className="text-sm text-gray-600 dark:text-gray-400">{selectedChat.userEmail || selectedChat.user_email || 'No email'}</p>
                    <Badge variant="outline" className="text-xs">
                      <Phone className="w-3 h-3 mr-1" />
                      WhatsApp
                    </Badge>
                    <Badge 
                      variant={selectedChat.status === 'active' ? 'default' : 'secondary'}
                      className="text-xs capitalize"
                    >
                      {selectedChat.status}
                    </Badge>
                  </div>
                </div>
              </div>
              <button onClick={() => setShowChatDetails(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
                <span className="text-gray-500 text-xl">×</span>
              </button>
            </div>

            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {(selectedChat.messages || []).length === 0 ? (
                <div className="text-center py-8">
                  <MessageCircle className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                  <p className="text-gray-500 dark:text-gray-400">No messages yet. Start the conversation!</p>
                </div>
              ) : (
                (selectedChat.messages || []).map((msg: any, index: number) => (
                  <div 
                    key={index}
                    className={`flex ${msg.sender === 'admin' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`max-w-[70%] rounded-2xl px-4 py-3 ${
                      msg.sender === 'admin' 
                        ? 'bg-[#18181b] border border-zinc-600 text-white' 
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'
                    }`}>
                      <p className="text-xs mb-1 opacity-70">
                        {msg.sender === 'admin' ? (msg.senderName || 'Support Team') : (msg.senderName || selectedChat.userName || 'User')}
                      </p>
                      <p className="text-sm whitespace-pre-wrap">{msg.message}</p>
                      <p className={`text-xs mt-1 ${
                        msg.sender === 'admin' ? 'text-white/70' : 'text-gray-500 dark:text-gray-400'
                      }`}>
                        {new Date(msg.timestamp).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Integration Notice */}
            <div className="px-6 py-3 bg-blue-50 dark:bg-blue-900/20 border-t border-blue-200 dark:border-blue-800">
              <p className="text-xs text-blue-800 dark:text-blue-200 flex items-center gap-2">
                <Phone className="w-4 h-4" />
                <strong>WhatsApp Integration Active:</strong> Messages are synced with WhatsApp. User will receive instant notifications.
              </p>
            </div>

            {/* Chat Input */}
            <div className="p-6 border-t border-gray-200 dark:border-gray-700">
              <div className="flex gap-2 mb-3">
                <Button 
                  variant={selectedChat.status === 'active' ? 'outline' : 'default'}
                  size="sm"
                  onClick={() => {
                    const updatedStatus = selectedChat.status === 'active' ? 'resolved' : 'active';
                    const updatedChat = { ...selectedChat, status: updatedStatus };
                    const updatedChats = chats.map(c => c.id === selectedChat.id ? updatedChat : c);
                    setChats(updatedChats);
                    setSelectedChat(updatedChat);
                    dataService.setItem('xbyte_live_chats', JSON.stringify(updatedChats));
                  }}
                >
                  {selectedChat.status === 'active' ? (
                    <>
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Mark as Resolved
                    </>
                  ) : (
                    <>
                      <MessageCircle className="w-4 h-4 mr-2" />
                      Reopen Chat
                    </>
                  )}
                </Button>
              </div>
              <div className="flex gap-2">
                <textarea
                  value={chatMessage}
                  onChange={(e) => setChatMessage(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendChatMessage();
                    }
                  }}
                  placeholder="Type your message..."
                  className="flex-1 h-12 px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none focus:outline-none focus:ring-2 focus:ring-zinc-500"
                />
                <Button 
                  size="lg"
                  onClick={handleSendChatMessage}
                  disabled={!chatMessage.trim()}
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                Press Enter to send, Shift+Enter for new line
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Create User Modal */}
      {showCreateUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={() => setShowCreateUser(false)}>
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6 sticky top-0 bg-white dark:bg-gray-800 z-10 pb-4">
              <h2 className="text-2xl text-gray-900 dark:text-white">Create New User</h2>
              <button onClick={() => setShowCreateUser(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
                <span className="text-gray-500 text-xl">×</span>
              </button>
            </div>

            <div className="space-y-6">
              {/* User Credentials Section */}
              <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-6">
                <h3 className="text-lg text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  User Credentials
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm mb-2 text-gray-700 dark:text-gray-300">
                      Email Address <span className="text-red-500">*</span>
                    </label>
                    <Input
                      type="email"
                      value={newUser.email}
                      placeholder="user@example.com"
                      onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                    />
                  </div>



                  <div>
                    <label className="block text-sm mb-2 text-gray-700 dark:text-gray-300">
                      Initial Password <span className="text-red-500">*</span>
                    </label>
                    <Input
                      type="text"
                      value={newUser.password}
                      placeholder="Enter initial password"
                      onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      User can change this after first login
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm mb-2 text-gray-700 dark:text-gray-300">
                      KYC Status
                    </label>
                    <select
                      value={newUser.kyc_status}
                      onChange={(e) => setNewUser({ ...newUser, kyc_status: e.target.value })}
                      className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-zinc-500"
                    >
                      <option value="pending">Pending</option>
                      <option value="verified">Verified</option>
                      <option value="rejected">Rejected</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Asset Balances Section */}
              <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-6">
                <h3 className="text-lg text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <Coins className="w-5 h-5" />
                  Initial Balances & Wallet Addresses
                </h3>
                <div className="space-y-4">
                  {assetConfig.map((asset) => (
                    <div key={asset.symbol} className="bg-white dark:bg-gray-800 rounded-xl p-4">
                      <div className="flex items-center gap-3 mb-4">
                        <div className={`w-10 h-10 rounded-full ${asset.color} flex items-center justify-center text-white`}>
                          {asset.icon}
                        </div>
                        <div>
                          <h4 className="text-gray-900 dark:text-white">{asset.name}</h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400">{asset.symbol}</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm mb-2 text-gray-700 dark:text-gray-300">
                            Initial Balance
                          </label>
                          <Input
                            type="number"
                            value={newUser.balances[asset.symbol]}
                            placeholder="0.00"
                            onChange={(e) => setNewUser({
                              ...newUser,
                              balances: { ...newUser.balances, [asset.symbol]: e.target.value }
                            })}
                          />
                        </div>

                        <div>
                          <label className="block text-sm mb-2 text-gray-700 dark:text-gray-300 flex items-center justify-between">
                            Wallet Address
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                const randomAddr = generateRandomAddress(asset.symbol);
                                setNewUser({
                                  ...newUser,
                                  addresses: { ...newUser.addresses, [asset.symbol]: randomAddr }
                                });
                              }}
                              className="text-xs h-6"
                            >
                              Generate
                            </Button>
                          </label>
                          <Input
                            type="text"
                            value={newUser.addresses[asset.symbol]}
                            placeholder={`${asset.symbol} address`}
                            className={`font-mono text-sm ${newUserAddressErrors[asset.symbol] ? 'border-red-500 dark:border-red-500' : ''}`}
                            onChange={(e) => handleNewUserAddressChange(asset.symbol, e.target.value)}
                          />
                          {newUserAddressErrors[asset.symbol] && (
                            <div className="flex items-center gap-2 mt-2 text-red-600 dark:text-red-400">
                              <AlertCircle className="w-4 h-4" />
                              <span className="text-sm">{newUserAddressErrors[asset.symbol]}</span>
                            </div>
                          )}
                          {!newUserAddressErrors[asset.symbol] && newUser.addresses[asset.symbol] && (
                            <div className="flex items-center gap-2 mt-2 text-green-600 dark:text-green-400">
                              <CheckCircle className="w-4 h-4" />
                              <span className="text-sm">Valid {asset.symbol} address</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Info Notice */}
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  <strong>Note:</strong> User credentials will be displayed once after creation. Make sure to save them securely. The user will be able to log in immediately with these credentials. Wallet addresses can be generated automatically or entered manually.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <Button 
                  size="lg" 
                  className="flex-1"
                  onClick={handleCreateUser}
                >
                  <Users className="w-4 h-4 mr-2" />
                  Create User Account
                </Button>
                <Button 
                  size="lg" 
                  variant="outline"
                  onClick={() => setShowCreateUser(false)}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Admin Settings Modal */}
      {showAdminSettings && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={() => setShowAdminSettings(false)}>
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6 sticky top-0 bg-white dark:bg-gray-800 z-10 pb-4">
              <h2 className="text-2xl text-gray-900 dark:text-white">Admin Settings</h2>
              <button onClick={() => setShowAdminSettings(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
                <span className="text-gray-500 text-xl">×</span>
              </button>
            </div>

            <div className="space-y-6">
              {/* Profile Section */}
              <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-6">
                <h3 className="text-lg text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Profile Information
                </h3>
                <div className="space-y-4">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-20 h-20 rounded-full bg-[#18181b] border border-zinc-700/60 flex items-center justify-center text-white">
                      <User className="w-10 h-10" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Profile Picture</p>
                      <Button variant="outline" size="sm">
                        Change Avatar
                      </Button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm mb-2 text-gray-700 dark:text-gray-300">
                      Full Name
                    </label>
                    <Input
                      type="text"
                      value={adminProfile.name}
                      onChange={(e) => setAdminProfile({ ...adminProfile, name: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="block text-sm mb-2 text-gray-700 dark:text-gray-300">
                      Email Address
                    </label>
                    <Input
                      type="email"
                      value={adminProfile.email}
                      onChange={(e) => setAdminProfile({ ...adminProfile, email: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="block text-sm mb-2 text-gray-700 dark:text-gray-300">
                      Role
                    </label>
                    <Input
                      type="text"
                      value={adminProfile.role}
                      disabled
                      className="bg-gray-100 dark:bg-gray-600"
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Role cannot be changed
                    </p>
                  </div>
                </div>
              </div>

              {/* Security Section */}
              <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-6">
                <h3 className="text-lg text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  Security
                </h3>
                <div className="space-y-3">
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                    onClick={() => {
                      setShowAdminSettings(false);
                      setShowChangePassword(true);
                    }}
                  >
                    <KeyRound className="w-4 h-4 mr-2" />
                    Change Password
                  </Button>
                  <div className="bg-white dark:bg-gray-800 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-900 dark:text-white">Two-Factor Authentication</p>
                        <p className="text-xs text-gray-600 dark:text-gray-400">Add an extra layer of security</p>
                      </div>
                      <Badge variant="secondary">Coming Soon</Badge>
                    </div>
                  </div>
                </div>
              </div>

              {/* System Info */}
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  <strong>Last Login:</strong> {new Date().toLocaleString()}<br />
                  <strong>IP Address:</strong> 192.168.1.1<br />
                  <strong>Session ID:</strong> sess_7x9k2m4p
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <Button 
                  size="lg" 
                  className="flex-1"
                  onClick={() => {
                    alert('Settings saved successfully!');
                    setShowAdminSettings(false);
                  }}
                >
                  Save Changes
                </Button>
                <Button 
                  size="lg" 
                  variant="outline"
                  onClick={() => setShowAdminSettings(false)}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Change Password Modal */}
      {showChangePassword && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={() => setShowChangePassword(false)}>
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl text-gray-900 dark:text-white">Change Password</h2>
              <button onClick={() => setShowChangePassword(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
                <span className="text-gray-500 text-xl">×</span>
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm mb-2 text-gray-700 dark:text-gray-300">
                  Current Password
                </label>
                <Input
                  type="password"
                  value={passwordForm.currentPassword}
                  placeholder="Enter current password"
                  onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm mb-2 text-gray-700 dark:text-gray-300">
                  New Password
                </label>
                <Input
                  type="password"
                  value={passwordForm.newPassword}
                  placeholder="Enter new password"
                  onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Minimum 8 characters
                </p>
              </div>

              <div>
                <label className="block text-sm mb-2 text-gray-700 dark:text-gray-300">
                  Confirm New Password
                </label>
                <Input
                  type="password"
                  value={passwordForm.confirmPassword}
                  placeholder="Confirm new password"
                  onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                />
              </div>

              {/* Password Requirements */}
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                <p className="text-xs text-gray-700 dark:text-gray-300 mb-2">Password must contain:</p>
                <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
                  <li className="flex items-center gap-2">
                    <Check className={`w-3 h-3 ${passwordForm.newPassword.length >= 8 ? 'text-green-600' : 'text-gray-400'}`} />
                    At least 8 characters
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className={`w-3 h-3 ${/[A-Z]/.test(passwordForm.newPassword) ? 'text-green-600' : 'text-gray-400'}`} />
                    One uppercase letter
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className={`w-3 h-3 ${/[a-z]/.test(passwordForm.newPassword) ? 'text-green-600' : 'text-gray-400'}`} />
                    One lowercase letter
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className={`w-3 h-3 ${/[0-9]/.test(passwordForm.newPassword) ? 'text-green-600' : 'text-gray-400'}`} />
                    One number
                  </li>
                </ul>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-2">
                <Button 
                  size="lg" 
                  className="flex-1"
                  onClick={handleChangePassword}
                >
                  <KeyRound className="w-4 h-4 mr-2" />
                  Update Password
                </Button>
                <Button 
                  size="lg" 
                  variant="outline"
                  onClick={() => {
                    setPasswordForm({
                      currentPassword: '',
                      newPassword: '',
                      confirmPassword: ''
                    });
                    setShowChangePassword(false);
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Transaction Receipt Modal */}
      {showTransactionReceipt && selectedTransaction && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={() => setShowTransactionReceipt(false)}>
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto my-8 p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl text-gray-900 dark:text-white">Transaction Receipt</h2>
              <button onClick={() => setShowTransactionReceipt(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
                <span className="text-gray-500 text-xl">×</span>
              </button>
            </div>

            {editingTransaction ? (
              <div className="space-y-4">
                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                  <p className="text-sm text-yellow-800 dark:text-yellow-200">
                    <Shield className="w-4 h-4 inline mr-2" />
                    Admin Mode: Editing transaction details
                  </p>
                </div>

                {/* Transaction Type */}
                <div>
                  <label className="block text-sm text-gray-700 dark:text-gray-300 mb-2">Transaction Type</label>
                  <select
                    value={selectedTransaction.type}
                    onChange={(e) => setSelectedTransaction({ ...selectedTransaction, type: e.target.value })}
                    className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white"
                  >
                    <option value="send">Send</option>
                    <option value="receive">Receive</option>
                    <option value="swap">Swap</option>
                    <option value="buy">Buy</option>
                  </select>
                </div>

                {/* Status */}
                <div>
                  <label className="block text-sm text-gray-700 dark:text-gray-300 mb-2">Status</label>
                  <select
                    value={selectedTransaction.status}
                    onChange={(e) => setSelectedTransaction({ ...selectedTransaction, status: e.target.value })}
                    className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white"
                  >
                    <option value="pending">Pending</option>
                    <option value="processing">Processing</option>
                    <option value="completed">Completed</option>
                    <option value="failed">Failed</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {/* Asset */}
                  <div>
                    <label className="block text-sm text-gray-700 dark:text-gray-300 mb-2">Asset</label>
                    <select
                      value={selectedTransaction.asset}
                      onChange={(e) => setSelectedTransaction({ ...selectedTransaction, asset: e.target.value })}
                      className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white"
                    >
                      <option value="BTC">BTC</option>
                      <option value="ETH">ETH</option>
                      <option value="SOL">SOL</option>
                      <option value="BNB">BNB</option>
                      <option value="TRX">TRX</option>
                      <option value="USDT">USDT</option>
                      <option value="USDC">USDC</option>
                    </select>
                  </div>

                  {/* Amount */}
                  <div>
                    <label className="block text-sm text-gray-700 dark:text-gray-300 mb-2">Amount</label>
                    <Input
                      type="text"
                      value={selectedTransaction.amount}
                      onChange={(e) => setSelectedTransaction({ ...selectedTransaction, amount: e.target.value })}
                      placeholder="0.00"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {/* Network Fee */}
                  <div>
                    <label className="block text-sm text-gray-700 dark:text-gray-300 mb-2">Network Fee</label>
                    <Input
                      type="text"
                      value={selectedTransaction.fee}
                      onChange={(e) => setSelectedTransaction({ ...selectedTransaction, fee: e.target.value })}
                      placeholder="0.0001"
                    />
                  </div>

                  {/* Network */}
                  <div>
                    <label className="block text-sm text-gray-700 dark:text-gray-300 mb-2">Network</label>
                    <select
                      value={selectedTransaction.network || 'Ethereum Mainnet'}
                      onChange={(e) => setSelectedTransaction({ ...selectedTransaction, network: e.target.value })}
                      className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white"
                    >
                      <option value="Bitcoin Mainnet">Bitcoin Mainnet</option>
                      <option value="Ethereum Mainnet">Ethereum Mainnet</option>
                      <option value="Solana Mainnet">Solana Mainnet</option>
                      <option value="BNB Smart Chain">BNB Smart Chain</option>
                      <option value="TRON (TRC20)">TRON (TRC20)</option>
                    </select>
                  </div>
                </div>

                {/* Date & Time */}
                <div>
                  <label className="block text-sm text-gray-700 dark:text-gray-300 mb-2">Date & Time</label>
                  <Input
                    type="datetime-local"
                    value={selectedTransaction.timestamp ? new Date(selectedTransaction.timestamp).toISOString().slice(0, 16) : ''}
                    onChange={(e) => setSelectedTransaction({ ...selectedTransaction, timestamp: new Date(e.target.value).toISOString() })}
                  />
                </div>

                {/* Transaction ID */}
                <div>
                  <label className="block text-sm text-gray-700 dark:text-gray-300 mb-2">Transaction ID</label>
                  <Input
                    type="text"
                    value={selectedTransaction.id}
                    onChange={(e) => setSelectedTransaction({ ...selectedTransaction, id: e.target.value })}
                    className="font-mono text-sm"
                    placeholder="Transaction ID"
                  />
                </div>

                {/* Network Confirmations */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-700 dark:text-gray-300 mb-2">Current Confirmations</label>
                    <Input
                      type="number"
                      value={selectedTransaction.confirmations || 0}
                      onChange={(e) => setSelectedTransaction({ ...selectedTransaction, confirmations: parseInt(e.target.value) || 0 })}
                      min="0"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-700 dark:text-gray-300 mb-2">Required Confirmations</label>
                    <Input
                      type="number"
                      value={selectedTransaction.requiredConfirmations || 6}
                      onChange={(e) => setSelectedTransaction({ ...selectedTransaction, requiredConfirmations: parseInt(e.target.value) || 6 })}
                      min="1"
                    />
                  </div>
                </div>

                {/* From Address */}
                <div>
                  <label className="block text-sm text-gray-700 dark:text-gray-300 mb-2">From Address</label>
                  <Input
                    type="text"
                    value={selectedTransaction.from || ''}
                    onChange={(e) => setSelectedTransaction({ ...selectedTransaction, from: e.target.value })}
                    className="font-mono text-sm"
                    placeholder="0x..."
                  />
                </div>

                {/* To Address */}
                <div>
                  <label className="block text-sm text-gray-700 dark:text-gray-300 mb-2">To Address</label>
                  <Input
                    type="text"
                    value={selectedTransaction.to || ''}
                    onChange={(e) => setSelectedTransaction({ ...selectedTransaction, to: e.target.value })}
                    className="font-mono text-sm"
                    placeholder="0x..."
                  />
                </div>

                {/* Transaction Hash */}
                <div>
                  <label className="block text-sm text-gray-700 dark:text-gray-300 mb-2">Transaction Hash</label>
                  <Input
                    type="text"
                    value={selectedTransaction.hash}
                    onChange={(e) => setSelectedTransaction({ ...selectedTransaction, hash: e.target.value })}
                    className="font-mono text-sm"
                    placeholder="0x..."
                  />
                </div>

                {/* Swap-specific fields */}
                {selectedTransaction.type === 'swap' && (
                  <div className="grid grid-cols-2 gap-4 p-4 bg-orange-50 dark:bg-orange-900/20 rounded-xl border border-orange-200 dark:border-orange-800">
                    <div>
                      <label className="block text-sm text-gray-700 dark:text-gray-300 mb-2">To Asset</label>
                      <select
                        value={selectedTransaction.toAsset || 'ETH'}
                        onChange={(e) => setSelectedTransaction({ ...selectedTransaction, toAsset: e.target.value })}
                        className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white"
                      >
                        <option value="BTC">BTC</option>
                        <option value="ETH">ETH</option>
                        <option value="SOL">SOL</option>
                        <option value="BNB">BNB</option>
                        <option value="TRX">TRX</option>
                        <option value="USDT">USDT</option>
                        <option value="USDC">USDC</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm text-gray-700 dark:text-gray-300 mb-2">To Amount</label>
                      <Input
                        type="text"
                        value={selectedTransaction.toAmount || ''}
                        onChange={(e) => setSelectedTransaction({ ...selectedTransaction, toAmount: e.target.value })}
                        placeholder="0.00"
                      />
                    </div>
                  </div>
                )}

                {/* Buy-specific fields */}
                {selectedTransaction.type === 'buy' && (
                  <div className="grid grid-cols-2 gap-4 p-4 bg-zinc-50 dark:bg-zinc-900/40 rounded-xl border border-zinc-200 dark:border-zinc-700">
                    <div>
                      <label className="block text-sm text-gray-700 dark:text-gray-300 mb-2">Fiat Amount</label>
                      <Input
                        type="text"
                        value={selectedTransaction.fiatAmount || ''}
                        onChange={(e) => setSelectedTransaction({ ...selectedTransaction, fiatAmount: e.target.value })}
                        placeholder="$100.00"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-700 dark:text-gray-300 mb-2">Payment Method</label>
                      <select
                        value={selectedTransaction.paymentMethod || 'Credit Card'}
                        onChange={(e) => setSelectedTransaction({ ...selectedTransaction, paymentMethod: e.target.value })}
                        className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white"
                      >
                        <option value="Credit Card">Credit Card</option>
                        <option value="Debit Card">Debit Card</option>
                        <option value="Bank Transfer">Bank Transfer</option>
                        <option value="PayPal">PayPal</option>
                        <option value="Apple Pay">Apple Pay</option>
                        <option value="Google Pay">Google Pay</option>
                      </select>
                    </div>
                  </div>
                )}

                {/* Admin Notes */}
                <div>
                  <label className="block text-sm text-gray-700 dark:text-gray-300 mb-2">Admin Notes</label>
                  <Textarea
                    value={selectedTransaction.notes || ''}
                    onChange={(e) => setSelectedTransaction({ ...selectedTransaction, notes: e.target.value })}
                    placeholder="Add internal notes about this transaction..."
                    rows={3}
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <Button 
                    size="lg" 
                    className="flex-1 bg-[#18181b] hover:bg-zinc-800 text-white border border-zinc-700/60 shadow-md"
                    onClick={() => {
                      handleUpdateTransaction(selectedUser.id, selectedTransaction);
                    }}
                  >
                    <Check className="w-4 h-4 mr-2" />
                    Save Changes
                  </Button>
                  <Button 
                    size="lg" 
                    variant="outline"
                    onClick={() => setEditingTransaction(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Status Banner */}
                <div className={`p-4 rounded-xl border-2 ${
                  selectedTransaction.status === 'completed' ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' :
                  selectedTransaction.status === 'pending' ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800' :
                  selectedTransaction.status === 'processing' ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800' :
                  'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                }`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {selectedTransaction.status === 'pending' || selectedTransaction.status === 'processing' ? (
                        <div className="relative">
                          <div className="w-12 h-12 rounded-full bg-[#18181b] border border-zinc-700/60 flex items-center justify-center">
                            <RefreshCw className="w-6 h-6 text-white animate-spin" />
                          </div>
                        </div>
                      ) : selectedTransaction.status === 'completed' ? (
                        <div className="w-12 h-12 rounded-full bg-green-500 flex items-center justify-center">
                          <CheckCircle className="w-6 h-6 text-white" />
                        </div>
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-red-500 flex items-center justify-center">
                          <XCircle className="w-6 h-6 text-white" />
                        </div>
                      )}
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Transaction Status</p>
                        <p className="text-xl text-gray-900 dark:text-white capitalize">{selectedTransaction.status}</p>
                      </div>
                    </div>
                    <Badge className={getStatusColor(selectedTransaction.status)}>
                      {selectedTransaction.status}
                    </Badge>
                  </div>
                </div>

                {/* Transaction Details */}
                <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Transaction Type</p>
                      <p className="text-sm text-gray-900 dark:text-white capitalize">{selectedTransaction.type}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Asset</p>
                      <p className="text-sm text-gray-900 dark:text-white">{selectedTransaction.asset}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Amount</p>
                      <p className="text-sm text-gray-900 dark:text-white">{selectedTransaction.amount} {selectedTransaction.asset}</p>
                    </div>
                    {selectedTransaction.type === 'swap' && (
                      <div>
                        <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Received</p>
                        <p className="text-sm text-gray-900 dark:text-white">{selectedTransaction.toAmount} {selectedTransaction.toAsset}</p>
                      </div>
                    )}
                    {selectedTransaction.type === 'buy' && (
                      <>
                        <div>
                          <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Fiat Amount</p>
                          <p className="text-sm text-gray-900 dark:text-white">{selectedTransaction.fiatAmount}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Payment Method</p>
                          <p className="text-sm text-gray-900 dark:text-white">{selectedTransaction.paymentMethod}</p>
                        </div>
                      </>
                    )}
                    <div>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Network Fee</p>
                      <p className="text-sm text-gray-900 dark:text-white">{selectedTransaction.fee} {selectedTransaction.asset}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Network</p>
                      <p className="text-sm text-gray-900 dark:text-white">{selectedTransaction.network}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Date & Time</p>
                      <p className="text-sm text-gray-900 dark:text-white">{new Date(selectedTransaction.timestamp).toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Transaction ID</p>
                      <p className="text-sm text-gray-900 dark:text-white">{selectedTransaction.id}</p>
                    </div>
                  </div>

                  {(selectedTransaction.confirmations !== undefined) && (
                    <div className="pt-4 border-t border-gray-200 dark:border-gray-600">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-xs text-gray-600 dark:text-gray-400">Confirmations</p>
                        <p className="text-xs text-gray-900 dark:text-white">
                          {selectedTransaction.confirmations} / {selectedTransaction.requiredConfirmations}
                        </p>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                        <div 
                          className="bg-zinc-600 h-2 rounded-full transition-all duration-500"
                          style={{ width: `${Math.min((selectedTransaction.confirmations / selectedTransaction.requiredConfirmations) * 100, 100)}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {selectedTransaction.from && (
                    <div className="pt-4 border-t border-gray-200 dark:border-gray-600">
                      <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">From Address</p>
                      <div className="flex items-center gap-2">
                        <p className="text-xs text-gray-900 dark:text-white font-mono break-all flex-1">{selectedTransaction.from}</p>
                        <button
                          onClick={async () => {
                            const success = await copyToClipboard(selectedTransaction.from);
                            if (success) {
                              alert('Address copied!');
                            }
                          }}
                          className="p-2 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg shrink-0"
                        >
                          <Copy className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                        </button>
                      </div>
                    </div>
                  )}

                  {selectedTransaction.to && (
                    <div className="pt-4 border-t border-gray-200 dark:border-gray-600">
                      <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">To Address</p>
                      <div className="flex items-center gap-2">
                        <p className="text-xs text-gray-900 dark:text-white font-mono break-all flex-1">{selectedTransaction.to}</p>
                        <button
                          onClick={async () => {
                            const success = await copyToClipboard(selectedTransaction.to);
                            if (success) {
                              alert('Address copied!');
                            }
                          }}
                          className="p-2 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg shrink-0"
                        >
                          <Copy className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="pt-4 border-t border-gray-200 dark:border-gray-600">
                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Transaction Hash</p>
                    <div className="flex items-center gap-2">
                      <p className="text-xs text-gray-900 dark:text-white font-mono break-all flex-1">{selectedTransaction.hash}</p>
                      <button
                        onClick={async () => {
                          const success = await copyToClipboard(selectedTransaction.hash);
                          if (success) {
                            alert('Transaction hash copied!');
                          }
                        }}
                        className="p-2 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg shrink-0"
                      >
                        <Copy className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                      </button>
                    </div>
                  </div>

                  {selectedTransaction.notes && (
                    <div className="pt-4 border-t border-gray-200 dark:border-gray-600">
                      <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Admin Notes</p>
                      <p className="text-sm text-gray-900 dark:text-white">{selectedTransaction.notes}</p>
                    </div>
                  )}
                </div>

                {/* Admin Actions */}
                <div className="bg-zinc-50 dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-700 rounded-xl p-4">
                  <p className="text-sm text-zinc-800 dark:text-zinc-200 mb-4">
                    <Shield className="w-4 h-4 inline mr-2" />
                    Admin Actions
                  </p>
                  <div className="grid grid-cols-3 gap-3">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEditingTransaction(true)}
                    >
                      <Edit className="w-4 h-4 mr-2" />
                      Edit
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm">
                          <RefreshCw className="w-4 h-4 mr-2" />
                          Status
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuItem onClick={() => handleUpdateTransactionStatus(selectedUser.id, selectedTransaction.id, 'pending')}>
                          Set as Pending
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleUpdateTransactionStatus(selectedUser.id, selectedTransaction.id, 'processing')}>
                          Set as Processing
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleUpdateTransactionStatus(selectedUser.id, selectedTransaction.id, 'completed')}>
                          Set as Completed
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleUpdateTransactionStatus(selectedUser.id, selectedTransaction.id, 'failed')}>
                          Set as Failed
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                      onClick={() => {
                        if (confirm('Are you sure you want to delete this transaction? This action cannot be undone.')) {
                          handleDeleteTransaction(selectedUser.id, selectedTransaction.id);
                          setShowTransactionReceipt(false);
                        }
                      }}
                    >
                      <Trash className="w-4 h-4 mr-2" />
                      Delete
                    </Button>
                  </div>
                </div>

                {/* Report Transaction */}
                <div className="pt-4 border-t border-gray-200 dark:border-gray-600">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                    onClick={() => {
                      if (confirm('Are you sure you want to report this transaction as suspicious? This will flag it for review.')) {
                        alert('Transaction reported. An investigation will be initiated.');
                      }
                    }}
                  >
                    <AlertCircle className="w-4 h-4 mr-2" />
                    Report Transaction
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Edit Login Details Modal */}
      {showLoginDetailsEdit && selectedUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={() => setShowLoginDetailsEdit(false)}>
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6 sticky top-0 bg-white dark:bg-gray-800 z-10 pb-4">
              <h2 className="text-2xl text-gray-900 dark:text-white">Edit Login Details</h2>
              <button onClick={() => setShowLoginDetailsEdit(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
                <span className="text-gray-500 text-xl">×</span>
              </button>
            </div>

            <div className="space-y-6">
              {/* User Info */}
              <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Editing Login Details for:</p>
                <p className="text-lg text-gray-900 dark:text-white">{selectedUser.email}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">User ID: {selectedUser.id}</p>
              </div>

              {/* Password Section */}
              <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4 space-y-4">
                <h3 className="text-lg text-gray-900 dark:text-white mb-2">Password Management</h3>
                
                {/* Current Password Display */}
                <div>
                  <label className="block text-sm mb-2 text-gray-700 dark:text-gray-300">
                    Current Password
                  </label>
                  <div className="relative">
                    <Input
                      type={showCurrentPassword ? "text" : "password"}
                      value={selectedUser.password || 'Not set'}
                      readOnly
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                    >
                      {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    This is the user's current password (in plain text for admin view)
                  </p>
                </div>

                <div>
                  <label className="block text-sm mb-2 text-gray-700 dark:text-gray-300">
                    New Password
                  </label>
                  <Input
                    type="password"
                    value={editLoginData.newPassword || ''}
                    placeholder="Enter new password"
                    onChange={(e) => setEditLoginData({ ...editLoginData, newPassword: e.target.value })}
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Leave blank to keep current password
                  </p>
                </div>

                <div>
                  <label className="block text-sm mb-2 text-gray-700 dark:text-gray-300">
                    Confirm New Password
                  </label>
                  <Input
                    type="password"
                    value={editLoginData.confirmPassword || ''}
                    placeholder="Confirm new password"
                    onChange={(e) => setEditLoginData({ ...editLoginData, confirmPassword: e.target.value })}
                  />
                </div>

                <div className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-lg">
                  <div>
                    <p className="text-sm text-gray-900 dark:text-white">Password Last Changed</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      {selectedUser.passwordLastChanged ? new Date(selectedUser.passwordLastChanged).toLocaleDateString() : 'Never'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Two-Factor Authentication Section */}
              <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg text-gray-900 dark:text-white">Two-Factor Authentication</h3>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editLoginData.twoFactorEnabled}
                      onChange={(e) => setEditLoginData({ ...editLoginData, twoFactorEnabled: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-zinc-500 dark:peer-focus:ring-zinc-600 rounded-full peer dark:bg-gray-600 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-zinc-600"></div>
                    <span className="ml-3 text-sm text-gray-900 dark:text-white">
                      {editLoginData.twoFactorEnabled ? 'Enabled' : 'Disabled'}
                    </span>
                  </label>
                </div>

                {editLoginData.twoFactorEnabled && (
                  <div className="space-y-4 pt-4 border-t border-gray-200 dark:border-gray-600">
                    <div>
                      <label className="block text-sm mb-2 text-gray-700 dark:text-gray-300">
                        Preferred Method
                      </label>
                      <select
                        value={editLoginData.twoFactorMethod}
                        onChange={(e) => setEditLoginData({ ...editLoginData, twoFactorMethod: e.target.value })}
                        className="w-full p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white"
                      >
                        <option value="passcode">4-Digit Passcode</option>
                        <option value="biometric">Biometric</option>
                      </select>
                    </div>

                    {editLoginData.twoFactorMethod === 'passcode' && (
                      <div>
                        <label className="block text-sm mb-2 text-gray-700 dark:text-gray-300">
                          Passcode
                        </label>
                        <Input
                          type="text"
                          value={editLoginData.passcode}
                          placeholder="Enter 4-digit passcode"
                          maxLength={4}
                          onChange={(e) => {
                            const value = e.target.value.replace(/\D/g, '').slice(0, 4);
                            setEditLoginData({ ...editLoginData, passcode: value });
                          }}
                        />
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          Must be exactly 4 digits
                        </p>
                      </div>
                    )}

                    <div className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-lg">
                      <span className="text-sm text-gray-900 dark:text-white">Biometric Enabled</span>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={editLoginData.biometricEnabled}
                          onChange={(e) => setEditLoginData({ ...editLoginData, biometricEnabled: e.target.checked })}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-zinc-500 dark:peer-focus:ring-zinc-600 rounded-full peer dark:bg-gray-600 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-zinc-600"></div>
                      </label>
                    </div>
                  </div>
                )}
              </div>

              {/* Account Security Section */}
              <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4 space-y-4">
                <h3 className="text-lg text-gray-900 dark:text-white mb-2">Account Security</h3>
                
                <div className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-lg">
                  <div>
                    <p className="text-sm text-gray-900 dark:text-white">Account Locked</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">Lock/unlock user account</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editLoginData.accountLocked}
                      onChange={(e) => setEditLoginData({ ...editLoginData, accountLocked: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-red-300 dark:peer-focus:ring-red-800 rounded-full peer dark:bg-gray-600 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-red-600"></div>
                  </label>
                </div>

                <div>
                  <label className="block text-sm mb-2 text-gray-700 dark:text-gray-300">
                    Failed Login Attempts
                  </label>
                  <Input
                    type="number"
                    min="0"
                    value={editLoginData.failedLoginAttempts}
                    onChange={(e) => setEditLoginData({ ...editLoginData, failedLoginAttempts: parseInt(e.target.value) || 0 })}
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Reset to 0 to clear failed login attempts
                  </p>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setEditLoginData({ ...editLoginData, failedLoginAttempts: 0, accountLocked: false })}
                  className="w-full"
                >
                  Reset Security Settings
                </Button>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-600">
                <Button
                  variant="outline"
                  onClick={() => setShowLoginDetailsEdit(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleUpdateLoginDetails}
                  className="flex-1 bg-[#18181b] hover:bg-zinc-800 text-white border border-zinc-700/60 shadow-md"
                >
                  Save Changes
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Coin Management Modal */}
      {showCoinModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={() => setShowCoinModal(false)}>
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6 sticky top-0 bg-white dark:bg-gray-800 z-10 pb-4">
              <h2 className="text-2xl text-gray-900 dark:text-white">
                {editingCoin ? 'Edit Coin' : 'Add New Coin'}
              </h2>
              <button onClick={() => setShowCoinModal(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
                <span className="text-gray-500 text-xl">×</span>
              </button>
            </div>

            <div className="space-y-6">
              {/* Basic Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm mb-2 text-gray-700 dark:text-gray-300">
                    Symbol *
                  </label>
                  <Input
                    placeholder="BTC"
                    value={coinForm.symbol}
                    onChange={(e) => setCoinForm({ ...coinForm, symbol: e.target.value.toUpperCase() })}
                    disabled={!!editingCoin}
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {editingCoin ? 'Symbol cannot be changed' : 'Unique identifier (e.g., BTC, ETH)'}
                  </p>
                </div>

                <div>
                  <label className="block text-sm mb-2 text-gray-700 dark:text-gray-300">
                    Name *
                  </label>
                  <Input
                    placeholder="Bitcoin"
                    value={coinForm.name}
                    onChange={(e) => setCoinForm({ ...coinForm, name: e.target.value })}
                  />
                </div>
              </div>

              {/* CoinGecko ID */}
              <div>
                <label className="block text-sm mb-2 text-gray-700 dark:text-gray-300">
                  CoinGecko ID
                </label>
                <Input
                  placeholder="bitcoin"
                  value={coinForm.coinGeckoId}
                  onChange={(e) => setCoinForm({ ...coinForm, coinGeckoId: e.target.value.toLowerCase() })}
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Required for live price fetching. Find IDs at{' '}
                  <a 
                    href="https://www.coingecko.com/" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-zinc-500 dark:text-zinc-400 hover:underline"
                  >
                    coingecko.com
                  </a>
                  {' '}(e.g., bitcoin, ethereum, dogecoin)
                </p>
              </div>

              {/* Logo Upload */}
              <div>
                <label className="block text-sm mb-2 text-gray-700 dark:text-gray-300">
                  Logo
                </label>
                <div className="flex items-center gap-4">
                  {coinForm.logoUrl ? (
                    <div className="relative">
                      <img src={coinForm.logoUrl} alt="Logo preview" className="w-20 h-20 rounded-full object-cover" />
                      <button
                        onClick={() => setCoinForm({ ...coinForm, logoUrl: '' })}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600"
                      >
                        ×
                      </button>
                    </div>
                  ) : (
                    <div className={`w-20 h-20 rounded-full ${coinForm.color} flex items-center justify-center text-white text-2xl`}>
                      {coinForm.icon}
                    </div>
                  )}
                  
                  <div className="flex-1">
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={handleLogoUpload}
                      className="mb-2"
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Upload a custom logo or use the icon/color settings below
                    </p>
                  </div>
                </div>
              </div>

              {/* Icon & Color (if no logo uploaded) */}
              {!coinForm.logoUrl && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm mb-2 text-gray-700 dark:text-gray-300">
                      Icon Character
                    </label>
                    <Input
                      placeholder="₿"
                      value={coinForm.icon}
                      onChange={(e) => setCoinForm({ ...coinForm, icon: e.target.value })}
                      maxLength={2}
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Single character or emoji (e.g., ₿, Ξ, ◎)
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm mb-2 text-gray-700 dark:text-gray-300">
                      Background Color
                    </label>
                    <select
                      value={coinForm.color}
                      onChange={(e) => setCoinForm({ ...coinForm, color: e.target.value })}
                      className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white"
                    >
                      <option value="bg-orange-500">Orange</option>
                      <option value="bg-blue-500">Blue</option>
                      <option value="bg-blue-600">Dark Blue</option>
                      <option value="bg-purple-500">Purple</option>
                      <option value="bg-purple-600">Dark Purple</option>
                      <option value="bg-yellow-500">Yellow</option>
                      <option value="bg-green-500">Green</option>
                      <option value="bg-green-600">Dark Green</option>
                      <option value="bg-red-500">Red</option>
                      <option value="bg-pink-500">Pink</option>
                      <option value="bg-indigo-500">Indigo</option>
                      <option value="bg-gray-500">Gray</option>
                    </select>
                  </div>
                </div>
              )}

              {/* Preview */}
              <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4">
                <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">Preview</p>
                <div className="flex items-center gap-4">
                  {coinForm.logoUrl ? (
                    <img src={coinForm.logoUrl} alt="Preview" className="w-14 h-14 rounded-full object-cover" />
                  ) : (
                    <div className={`w-14 h-14 rounded-full ${coinForm.color} flex items-center justify-center text-white text-2xl`}>
                      {coinForm.icon}
                    </div>
                  )}
                  <div>
                    <h3 className="text-lg text-gray-900 dark:text-white">{coinForm.name || 'Coin Name'}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{coinForm.symbol || 'SYMBOL'}</p>
                  </div>
                </div>
              </div>

              {/* Info Note */}
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  <strong>Note:</strong> {editingCoin ? 'Updating this coin will reflect changes across all user wallets and fee settings.' : 'Adding a new coin will automatically create entries for all existing users with zero balance.'}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-600">
                <Button
                  variant="outline"
                  onClick={() => setShowCoinModal(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSaveCoin}
                  className="flex-1 bg-[#18181b] hover:bg-zinc-800 text-white border border-zinc-700/60 shadow-md"
                >
                  {editingCoin ? 'Update Coin' : 'Add Coin'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Fee Modal */}
      {editingFee && (() => {
        const assetInfo = assetConfig.find(a => a.symbol === editingFee.asset);
        return (
          <EditFeeModal
            asset={editingFee.asset}
            assetName={assetInfo?.name || editingFee.asset}
            assetIcon={assetInfo?.icon || '?'}
            assetColor={assetInfo?.color || 'bg-gray-500'}
            targetUser={editingFee.targetUser}
            feeData={editingFee.data}
            onSave={(updatedFee) => handleSaveFee(editingFee.asset, updatedFee)}
            onClose={() => setEditingFee(null)}
          />
        );
      })()}
    </div>
  );
}