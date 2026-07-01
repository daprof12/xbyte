import { useState, useEffect } from 'react';
import { supabase } from '../utils/supabaseClient';

export function useAdminUsers() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchUsers = async () => {
    setLoading(true);
    // Use SECURITY DEFINER RPC to bypass RLS
    const { data, error } = await supabase.rpc('admin_get_users');
    if (!error && data) {
      // Map back to expected format
      const mapped = data.map((u: any) => ({
        id: u.id,
        email: u.email,
        role: u.role,
        status: u.status,
        kyc_status: u.metadata?.kyc_status || 'pending',
        balances: u.metadata?.balances || { BTC: '0', ETH: '0', SOL: '0', BNB: '0', USDT: '0' },
        addresses: u.metadata?.addresses || u.wallet_address || {},
        twoFactorAuth: u.metadata?.twoFactorAuth || {},
        password: u.password_hash,
        created_at: u.created_at,
        last_login: u.last_login_at,
        blocked: u.status === 'blocked',
        customMessage: u.metadata?.customMessage || '',
        customMessageEnabled: u.metadata?.customMessageEnabled || false
      }));
      setUsers(mapped);
    } else if (error) {
      console.error('Error fetching users:', error.message);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  return { users, setUsers, loading, refetch: fetchUsers };
}

export function useAdminFees() {
  const [fees, setFees] = useState<any>({});
  const [loading, setLoading] = useState(true);

  const fetchFees = async () => {
    setLoading(true);
    // Use SECURITY DEFINER RPC to bypass RLS
    const { data, error } = await supabase.rpc('admin_get_fee_settings');
    if (!error && data) {
      const mapped: any = {};
      data.forEach((f: any) => {
        mapped[f.asset_symbol] = {
          withdraw_fee: f.withdraw_fee?.toString() || '0',
          percent: f.withdraw_fee_percent?.toString() || '0',
          deposit_enabled: true,
          gas_fee_enabled: f.gas_fee_enabled,
          gas_fee_type: f.gas_fee_type || 'fixed',
          gas_fee_fixed: f.gas_fee_fixed?.toString() || '0',
          gas_fee_percent: f.gas_fee_percent?.toString() || '0'
        };
      });
      setFees(mapped);
    } else if (error) {
      console.error('Error fetching fees:', error.message);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchFees();
  }, []);

  return { fees, setFees, loading, refetch: fetchFees };
}

export function useAdminActivities() {
  const [activities, setActivities] = useState<any>({});
  const [loading, setLoading] = useState(true);

  const fetchActivities = async () => {
    setLoading(true);
    // Use SECURITY DEFINER RPC to bypass RLS
    const { data, error } = await supabase.rpc('admin_get_transactions');
    if (!error && data) {
      const mapped: any = {};
      data.forEach((t: any) => {
        if (!mapped[t.user_id]) mapped[t.user_id] = [];
        mapped[t.user_id].push({
          id: t.id,
          type: t.type,
          asset: t.asset_symbol,
          amount: t.amount?.toString() || '0',
          timestamp: t.created_at,
          status: t.status,
          hash: t.hash,
          to: t.to_address,
          from: t.from_address,
          fee: t.fee?.toString() || '0',
          network: t.network,
          notes: t.notes || ''
        });
      });
      setActivities(mapped);
    } else if (error) {
      console.error('Error fetching activities:', error.message);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchActivities();
  }, []);

  return { activities, setActivities, loading, refetch: fetchActivities };
}

export function useAdminAuditLogs() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLogs = async () => {
    setLoading(true);
    // Use SECURITY DEFINER RPC to bypass RLS
    const { data, error } = await supabase.rpc('admin_get_audit_logs');
    if (!error && data) {
      const mapped = data.map((l: any) => ({
        id: l.id,
        admin: l.admin_id || 'System',
        action: l.action,
        details: l.metadata?.details || '',
        timestamp: l.created_at,
        ip: l.ip_address || 'unknown'
      }));
      setLogs(mapped);
    } else if (error) {
      console.error('Error fetching audit logs:', error.message);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  return { logs, setLogs, loading, refetch: fetchLogs };
}

export function useAdminTickets() {
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTickets = async () => {
    setLoading(true);
    // Directly query database to join users
    const { data: ticketsData, error: ticketsError } = await supabase
      .from('support_tickets')
      .select('*, users(full_name, email)')
      .order('created_at', { ascending: false });

    if (!ticketsError && ticketsData) {
      // Fetch all messages
      const { data: messagesData, error: messagesError } = await supabase
        .from('support_ticket_messages')
        .select('*, users(full_name)')
        .order('created_at', { ascending: true });

      if (!messagesError && messagesData) {
        const mapped = ticketsData.map((ticket: any) => {
          const ticketMessages = messagesData
            .filter((m: any) => m.ticket_id === ticket.id)
            .map((m: any) => ({
              sender: m.is_admin_reply ? 'admin' : 'user',
              senderName: m.is_admin_reply ? 'Support Team' : (m.users?.full_name || 'User'),
              message: m.message,
              timestamp: m.created_at
            }));

          return {
            id: ticket.id,
            ticketNumber: ticket.ticket_number,
            userId: ticket.user_id,
            userEmail: ticket.users?.email || 'Unknown',
            userName: ticket.users?.full_name || 'User',
            subject: ticket.subject,
            category: ticket.category,
            priority: ticket.priority,
            status: ticket.status === 'in_progress' ? 'in-progress' : ticket.status,
            created: ticket.created_at,
            updated: ticket.updated_at,
            messages: ticketMessages,
            responses: ticketMessages.filter(m => m.sender === 'admin').map(m => ({
              admin: 'Support Team',
              message: m.message,
              timestamp: m.timestamp
            }))
          };
        });
        setTickets(mapped);
      } else {
        setTickets(ticketsData.map((ticket: any) => ({
          id: ticket.id,
          ticketNumber: ticket.ticket_number,
          userId: ticket.user_id,
          userEmail: ticket.users?.email || 'Unknown',
          userName: ticket.users?.full_name || 'User',
          subject: ticket.subject,
          category: ticket.category,
          priority: ticket.priority,
          status: ticket.status === 'in_progress' ? 'in-progress' : ticket.status,
          created: ticket.created_at,
          updated: ticket.updated_at,
          messages: [],
          responses: []
        })));
      }
    } else if (ticketsError) {
      console.error('Error fetching tickets:', ticketsError.message);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  return { tickets, setTickets, loading, refetch: fetchTickets };
}

export function useAdminChats() {
  const [chats, setChats] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchChats = async () => {
    setLoading(true);
    const { data: chatsData, error: chatsError } = await supabase
      .from('live_chats')
      .select('*, users(full_name, email)')
      .order('started_at', { ascending: false });

    if (!chatsError && chatsData) {
      const { data: messagesData, error: messagesError } = await supabase
        .from('live_chat_messages')
        .select('*')
        .order('created_at', { ascending: true });

      if (!messagesError && messagesData) {
        const mapped = chatsData.map((chat: any) => {
          const chatMessages = messagesData
            .filter((m: any) => m.chat_id === chat.id)
            .map((m: any) => ({
              sender: m.is_admin ? 'admin' : 'user',
              senderName: m.is_admin ? 'Support Agent' : (chat.users?.full_name || 'User'),
              message: m.message,
              timestamp: m.created_at
            }));

          const unreadCount = messagesData.filter((m: any) => m.chat_id === chat.id && !m.is_admin && !m.is_read).length;

          return {
            id: chat.id,
            userId: chat.user_id,
            userEmail: chat.users?.email || 'Unknown',
            userName: chat.users?.full_name || 'User',
            status: chat.status,
            created: chat.started_at,
            updated: chat.ended_at || chat.started_at,
            messages: chatMessages,
            unread_count: unreadCount
          };
        });
        setChats(mapped);
      } else {
        setChats(chatsData.map((chat: any) => ({
          id: chat.id,
          userId: chat.user_id,
          userEmail: chat.users?.email || 'Unknown',
          userName: chat.users?.full_name || 'User',
          status: chat.status,
          created: chat.started_at,
          updated: chat.ended_at || chat.started_at,
          messages: [],
          unread_count: 0
        })));
      }
    } else if (chatsError) {
      console.error('Error fetching chats:', chatsError.message);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchChats();
  }, []);

  return { chats, setChats, loading, refetch: fetchChats };
}

export function useUserWallet(userId: string | null) {
  const [wallet, setWallet] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchWalletData = async () => {
    if (!userId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    
    // Use RPC to bypass RLS
    const { data: users } = await supabase.rpc('admin_get_users');
    const user = users?.find((u: any) => u.id === userId);
    
    if (user) {
      setWallet({
        id: user.id,
        email: user.email,
        phone: user.phone,
        balances: user.metadata?.balances || {},
        addresses: user.metadata?.addresses || {},
        transactions: user.metadata?.transactions || []
      });
    }
    
    setLoading(false);
  };

  useEffect(() => {
    fetchWalletData();
  }, [userId]);

  return { wallet, setWallet, loading, refetch: fetchWalletData };
}
