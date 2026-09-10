import React, { useState, useEffect, useRef } from 'react';
import {
  Plus, Edit2, Trash2, Check, X, Send, Settings, FileText,
  Loader2, Bell, Eye, EyeOff, Smile,
} from 'lucide-react';

import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Badge } from '../ui/badge';
import dataService from '../../utils/dataService';
import { supabase } from '../../utils/supabaseClient';
import EmailBuilder from './EmailBuilder';

interface AdminMessagingProps {
  users: any[];
}

const EMOJIS = [
  '😀','😁','😂','🤣','😃','😄','😅','😆','😊','😍','🥰','😘','🤩','🥳',
  '👍','👎','🙏','🤝','✌️','🤞','💪','🎉','🔥','⭐','❤️','💯','✅','❌',
  '📧','📨','📩','💌','📢','📣','🔔','💡','🚀','🌟','💎','🏆','🎁','💰',
  '📊','📈','📉','🗓️','⏰','🔒','🔓','⚙️','🛠️','📱','💻','🌐','🔗',
];

export default function AdminMessaging({ users }: AdminMessagingProps) {
  const [activeTab, setActiveTab] = useState<'compose' | 'templates' | 'accounts' | 'notifications'>('compose');

  // ── SMTP ──────────────────────────────────────────────────────────────────
  const [smtpAccounts, setSmtpAccounts] = useState<any[]>([]);
  const [editingSmtp, setEditingSmtp] = useState<any>(null);

  // ── Templates ────────────────────────────────────────────────────────────
  const [messageTemplates, setMessageTemplates] = useState<any[]>([]);
  const [editingTemplate, setEditingTemplate] = useState<any>(null);

  // ── Compose ───────────────────────────────────────────────────────────────
  const [composeMessage, setComposeMessage] = useState({
    deliveryMethod: 'both',
    smtpAccountId: '',
    templateId: '',
    recipientsType: 'all',
    specificUserId: '',
    subject: '',
    body: ''
  });
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const bodyRef = useRef<HTMLTextAreaElement>(null);

  // ── Notifications ─────────────────────────────────────────────────────────
  const [notifications, setNotifications] = useState<any[]>([]);
  const [notifLoading, setNotifLoading] = useState(false);
  const [notifFilter, setNotifFilter] = useState('all');
  const [editingNotif, setEditingNotif] = useState<any>(null);

  useEffect(() => {
    const fetchData = async () => {
      const { data: smtpData } = await supabase.from('smtp_settings').select('*');
      if (smtpData) {
        setSmtpAccounts(smtpData.map(a => ({ ...a, fromEmail: a.from_email, fromName: a.from_name })));
      }
      const { data: templateData } = await supabase.from('message_templates').select('*').order('created_at', { ascending: true });
      if (templateData) setMessageTemplates(templateData);
    };
    fetchData();
  }, []);

  // Load notifications when tab opens
  useEffect(() => {
    if (activeTab !== 'notifications') return;
    loadNotifications();
  }, [activeTab]);

  const loadNotifications = async () => {
    setNotifLoading(true);
    try {
      const { data } = await supabase
        .from('user_notifications')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(200);
      if (data) setNotifications(data);
    } catch (e) {
      // fallback
    } finally {
      setNotifLoading(false);
    }
  };

  // ── SMTP Handlers ─────────────────────────────────────────────────────────
  const saveSmtpAccount = async () => {
    if (!editingSmtp.name || !editingSmtp.host || !editingSmtp.port || !editingSmtp.fromEmail) {
      alert('Please fill required fields (Name, Host, Port, From Email)'); return;
    }
    const dataToSave = {
      name: editingSmtp.name, host: editingSmtp.host, port: editingSmtp.port,
      username: editingSmtp.username, password: editingSmtp.password,
      from_email: editingSmtp.fromEmail, from_name: editingSmtp.fromName, secure: editingSmtp.secure
    };
    if (editingSmtp.isNew) {
      const { data, error } = await supabase.from('smtp_settings').insert(dataToSave).select().single();
      if (error) { alert('Error: ' + error.message); return; }
      if (data) { data.fromEmail = data.from_email; data.fromName = data.from_name; setSmtpAccounts([...smtpAccounts, data]); }
    } else {
      const { data, error } = await supabase.from('smtp_settings').update(dataToSave).eq('id', editingSmtp.id).select().single();
      if (error) { alert('Error: ' + error.message); return; }
      if (data) { data.fromEmail = data.from_email; data.fromName = data.from_name; setSmtpAccounts(smtpAccounts.map(a => a.id === data.id ? data : a)); }
    }
    setEditingSmtp(null);
  };

  const deleteSmtpAccount = async (id: string) => {
    if (confirm('Delete this SMTP account?')) {
      await supabase.from('smtp_settings').delete().eq('id', id);
      setSmtpAccounts(smtpAccounts.filter(a => a.id !== id));
    }
  };

  // ── Template Handlers ─────────────────────────────────────────────────────
  const saveTemplate = async () => {
    if (!editingTemplate.name || !editingTemplate.subject) { alert('Name and subject are required'); return; }
    const isNew = editingTemplate.isNew;
    const dataToSave = { ...editingTemplate }; delete dataToSave.isNew; delete dataToSave.id;
    if (isNew) {
      const { data, error } = await supabase.from('message_templates').insert(dataToSave).select().single();
      if (!error && data) setMessageTemplates([...messageTemplates, data]);
    } else {
      const { data, error } = await supabase.from('message_templates').update(dataToSave).eq('id', editingTemplate.id).select().single();
      if (!error && data) setMessageTemplates(messageTemplates.map(t => t.id === data.id ? data : t));
    }
    setEditingTemplate(null);
  };

  const deleteTemplate = async (id: string) => {
    if (confirm('Delete this template?')) {
      await supabase.from('message_templates').delete().eq('id', id);
      setMessageTemplates(messageTemplates.filter(t => t.id !== id));
    }
  };

  // ── Compose Handlers ──────────────────────────────────────────────────────
  const applyTemplate = (templateId: string) => {
    const tpl = messageTemplates.find(t => t.id === templateId);
    if (tpl) setComposeMessage(prev => ({ ...prev, templateId, subject: tpl.subject, body: tpl.body }));
    else setComposeMessage(prev => ({ ...prev, templateId: '' }));
  };

  const parseTemplateVariables = (text: string, user: any) => {
    if (!text) return '';
    return text
      .replace(/{{user_name}}/g, user.name || 'User')
      .replace(/{{user_email}}/g, user.email || '')
      .replace(/{{user_id}}/g, user.id || '')
      .replace(/{{total_balance}}/g, (Object.values(user.balances || {}).reduce((a: number, b: unknown) => a + parseFloat(String(b) || '0'), 0) as number).toString());
  };

  const insertEmoji = (emoji: string) => {
    if (bodyRef.current) {
      const { selectionStart, selectionEnd, value } = bodyRef.current;
      const next = value.slice(0, selectionStart) + emoji + value.slice(selectionEnd);
      setComposeMessage(prev => ({ ...prev, body: next }));
      setTimeout(() => {
        if (bodyRef.current) {
          bodyRef.current.selectionStart = bodyRef.current.selectionEnd = selectionStart + emoji.length;
          bodyRef.current.focus();
        }
      }, 0);
    } else {
      setComposeMessage(prev => ({ ...prev, body: prev.body + emoji }));
    }
    setShowEmojiPicker(false);
  };

  const handleSendMessage = async () => {
    if ((composeMessage.deliveryMethod === 'email' || composeMessage.deliveryMethod === 'both') && !composeMessage.smtpAccountId) {
      alert('Please select an SMTP account for email delivery'); return;
    }
    if (!composeMessage.subject || !composeMessage.body) { alert('Subject and body are required'); return; }

    const smtp = smtpAccounts.find(a => a.id === composeMessage.smtpAccountId);
    let targetUsers: any[] = composeMessage.recipientsType === 'all' ? users : [];
    if (composeMessage.recipientsType === 'specific') {
      const u = users.find(u => u.id === composeMessage.specificUserId);
      if (!u) { alert('Please select a valid user'); return; }
      targetUsers = [u];
    }
    if (targetUsers.length === 0) { alert('No users found'); return; }

    setIsSendingMessage(true);
    let errorMsg = '';
    try {
      if (composeMessage.deliveryMethod === 'email' || composeMessage.deliveryMethod === 'both') {
        try {
          const response = await fetch('http://localhost:3001/api/send-email', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              smtpConfig: smtp,
              recipients: targetUsers.map(u => ({ email: u.email, body: parseTemplateVariables(composeMessage.body, u) })),
              subject: composeMessage.subject
            })
          });
          const result = await response.json();
          if (!result.success) errorMsg = 'Failed to send emails: ' + result.message;
        } catch (e: any) { errorMsg = 'Email server error: ' + e.message; }
      }

      if (composeMessage.deliveryMethod === 'in_app' || composeMessage.deliveryMethod === 'both') {
        const { error } = await supabase.from('user_notifications').insert(
          targetUsers.map(u => ({
            user_id: u.id,
            title: composeMessage.subject,
            message: parseTemplateVariables(composeMessage.body, u),
            type: 'info',
            icon: 'Mail',
            is_visible: true
          }))
        );
        if (error) errorMsg += (errorMsg ? ' | ' : '') + 'In-app send failed: ' + error.message;
        else {
          // Also store in localStorage for offline access
          targetUsers.forEach(u => {
            const key = `xbyte_notifications_${u.id}`;
            const existing = JSON.parse(dataService.getItem(key) || '[]');
            existing.unshift({
              id: `notif_${Date.now()}`, title: composeMessage.subject,
              message: parseTemplateVariables(composeMessage.body, u),
              type: 'info', read: false, timestamp: new Date().toLocaleString()
            });
            dataService.setItem(key, JSON.stringify(existing));
          });
        }
      }

      const { data: authData } = await supabase.auth.getUser();
      await supabase.from('admin_sent_messages').insert({
        subject: composeMessage.subject, body: composeMessage.body,
        delivery_method: composeMessage.deliveryMethod, recipients_count: targetUsers.length,
        target_type: composeMessage.recipientsType,
        target_user_id: composeMessage.recipientsType === 'specific' ? composeMessage.specificUserId : null,
        sent_by: authData?.user?.id
      });

      if (!errorMsg) {
        alert(`Successfully sent to ${targetUsers.length} user(s)!`);
        setComposeMessage(prev => ({ ...prev, subject: '', body: '', templateId: '' }));
      } else { alert(errorMsg); }
    } catch (e: any) { alert('Unexpected error: ' + e.message); }
    finally { setIsSendingMessage(false); }
  };

  // ── Notification Handlers ─────────────────────────────────────────────────
  const toggleNotifVisibility = async (notif: any) => {
    const next = !notif.is_visible;
    await supabase.from('user_notifications').update({ is_visible: next }).eq('id', notif.id);
    setNotifications(notifications.map(n => n.id === notif.id ? { ...n, is_visible: next } : n));
  };

  const saveEditingNotif = async () => {
    if (!editingNotif) return;
    await supabase.from('user_notifications').update({ title: editingNotif.title, message: editingNotif.message }).eq('id', editingNotif.id);
    setNotifications(notifications.map(n => n.id === editingNotif.id ? { ...n, ...editingNotif } : n));
    setEditingNotif(null);
  };

  const deleteNotif = async (id: string) => {
    if (!confirm('Delete this notification?')) return;
    await supabase.from('user_notifications').delete().eq('id', id);
    setNotifications(notifications.filter(n => n.id !== id));
  };

  // ── Helpers ───────────────────────────────────────────────────────────────
  const isEmail = composeMessage.deliveryMethod === 'email' || composeMessage.deliveryMethod === 'both';

  const TAB_CONFIG = [
    { id: 'compose',       label: 'Compose',       icon: <Send className="w-4 h-4"/> },
    { id: 'templates',     label: 'Templates',     icon: <FileText className="w-4 h-4"/> },
    { id: 'accounts',      label: 'SMTP Accounts', icon: <Settings className="w-4 h-4"/> },
    { id: 'notifications', label: 'Notifications', icon: <Bell className="w-4 h-4"/> },
  ] as const;

  const filteredNotifs = notifications.filter(n => {
    if (notifFilter === 'visible')  return n.is_visible !== false;
    if (notifFilter === 'hidden')   return n.is_visible === false;
    if (notifFilter === 'unread')   return !n.read;
    return true;
  });

  const getUserEmail = (userId: string) => users.find(u => u.id === userId)?.email || userId?.substring(0,8) || 'Unknown';

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
      {/* Tab bar */}
      <div className="flex border-b border-gray-200 dark:border-gray-700">
        {TAB_CONFIG.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 py-4 flex items-center justify-center gap-2 text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? 'bg-zinc-50 dark:bg-zinc-900/40 text-zinc-900 dark:text-white border-b-2 border-zinc-700 dark:border-zinc-400'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700/50'
            }`}
          >
            {tab.icon} <span className="hidden sm:inline">{tab.label}</span>
          </button>
        ))}
      </div>

      <div className="p-6">
        {/* ═══════════════════════════════════════════════════════════════
             COMPOSE TAB
        ════════════════════════════════════════════════════════════════ */}
        {activeTab === 'compose' && (
          <div className="space-y-6 max-w-4xl">
            {/* Row 1: delivery + smtp + template */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm mb-2 text-gray-700 dark:text-gray-300">Delivery Method</label>
                <Select value={composeMessage.deliveryMethod} onValueChange={val => setComposeMessage({...composeMessage, deliveryMethod: val})}>
                  <SelectTrigger><SelectValue placeholder="Delivery Method"/></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="both">Both (In-App & Email)</SelectItem>
                    <SelectItem value="in_app">In-App Only</SelectItem>
                    <SelectItem value="email">Email Only</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {isEmail && (
                <div>
                  <label className="block text-sm mb-2 text-gray-700 dark:text-gray-300">From (SMTP Account)</label>
                  <Select value={composeMessage.smtpAccountId} onValueChange={val => setComposeMessage({...composeMessage, smtpAccountId: val})}>
                    <SelectTrigger><SelectValue placeholder="Select SMTP Account"/></SelectTrigger>
                    <SelectContent>
                      {smtpAccounts.map(a => <SelectItem key={a.id} value={a.id}>{a.name} ({a.fromEmail})</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div>
                <label className="block text-sm mb-2 text-gray-700 dark:text-gray-300">Load Template</label>
                <Select value={composeMessage.templateId} onValueChange={applyTemplate}>
                  <SelectTrigger><SelectValue placeholder="Select Template"/></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {messageTemplates.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Row 2: recipients */}
            <div>
              <label className="block text-sm mb-2 text-gray-700 dark:text-gray-300">To (Recipients)</label>
              <div className="flex gap-4">
                <Select value={composeMessage.recipientsType} onValueChange={val => setComposeMessage({...composeMessage, recipientsType: val, specificUserId: ''})}>
                  <SelectTrigger className="w-48"><SelectValue placeholder="Send to"/></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Users ({users.length})</SelectItem>
                    <SelectItem value="specific">Specific User</SelectItem>
                  </SelectContent>
                </Select>
                {composeMessage.recipientsType === 'specific' && (
                  <Select value={composeMessage.specificUserId} onValueChange={val => setComposeMessage({...composeMessage, specificUserId: val})}>
                    <SelectTrigger className="flex-1"><SelectValue placeholder="Select user"/></SelectTrigger>
                    <SelectContent>
                      {users.map((u: any) => <SelectItem key={u.id} value={u.id}>{u.email} ({u.id.substring(0,8)})</SelectItem>)}
                    </SelectContent>
                  </Select>
                )}
              </div>
            </div>

            {/* Row 3: subject */}
            <div>
              <label className="block text-sm mb-2 text-gray-700 dark:text-gray-300">Subject</label>
              <Input value={composeMessage.subject} onChange={e => setComposeMessage({...composeMessage, subject: e.target.value})} placeholder="Message Subject / Email Subject"/>
            </div>

            {/* Row 4: body — conditional editor */}
            {isEmail ? (
              /* Email builder canvas */
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm text-gray-700 dark:text-gray-300 font-medium">Email Design Canvas</label>
                  <span className="text-xs text-gray-500 dark:text-gray-400 bg-zinc-100 dark:bg-zinc-800 px-2 py-1 rounded-full">Newsletter Builder</span>
                </div>
                <div className="border border-gray-200 dark:border-gray-700 rounded-xl p-4 bg-gray-50 dark:bg-gray-900/30">
                  <EmailBuilder value={composeMessage.body} onChange={html => setComposeMessage(prev => ({ ...prev, body: html }))}/>
                </div>
                <p className="text-xs text-gray-500 mt-2">Variables: {'{{user_name}}'} {'{{user_email}}'} {'{{total_balance}}'}</p>
              </div>
            ) : (
              /* In-App plain text with emoji */
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm text-gray-700 dark:text-gray-300 font-medium">Message Body</label>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">In-App Plain Text</Badge>
                    <div className="relative">
                      <button
                        onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                        className="flex items-center gap-1 px-2 py-1 text-xs bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
                      >
                        <Smile className="w-3.5 h-3.5"/> Emoji
                      </button>
                      {showEmojiPicker && (
                        <div className="absolute z-50 right-0 top-9 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl p-3 w-64 grid grid-cols-8 gap-1">
                          {EMOJIS.map(em => (
                            <button key={em} onClick={() => insertEmoji(em)} className="text-lg hover:bg-gray-100 dark:hover:bg-gray-700 rounded p-0.5 transition-colors">{em}</button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <textarea
                  ref={bodyRef}
                  className="w-full h-48 p-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-zinc-500 resize-none"
                  value={composeMessage.body}
                  onChange={e => setComposeMessage({...composeMessage, body: e.target.value})}
                  placeholder="Write your in-app notification message... Use {{user_name}}, {{user_email}}, {{total_balance}} for dynamic fields."
                />
                <p className="text-xs text-gray-500 mt-1">Variables: {'{{user_name}}'} {'{{user_email}}'} {'{{user_id}}'} {'{{total_balance}}'}</p>
              </div>
            )}

            <Button
              size="lg"
              onClick={handleSendMessage}
              disabled={isSendingMessage || !composeMessage.subject || !composeMessage.body || (isEmail && !composeMessage.smtpAccountId)}
              className="bg-[#18181b] hover:bg-zinc-700 text-white border-0"
            >
              {isSendingMessage ? <><Loader2 className="w-4 h-4 mr-2 animate-spin"/>Sending...</> : <><Send className="w-4 h-4 mr-2"/>Send Message</>}
            </Button>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════
             TEMPLATES TAB
        ════════════════════════════════════════════════════════════════ */}
        {activeTab === 'templates' && (
          <div>
            {!editingTemplate ? (
              <div>
                <div className="flex justify-end mb-4">
                  <Button onClick={() => setEditingTemplate({ name: '', subject: '', body: '', delivery_mode: 'in_app', isNew: true })}>
                    <Plus className="w-4 h-4 mr-2"/> Create Template
                  </Button>
                </div>
                {messageTemplates.length === 0 ? (
                  <p className="text-gray-500 dark:text-gray-400 text-center py-8">No templates yet.</p>
                ) : (
                  <div className="grid gap-4">
                    {messageTemplates.map(t => (
                      <div key={t.id} className="border border-gray-200 dark:border-gray-700 rounded-xl p-4 flex justify-between items-center hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                        <div>
                          <h4 className="font-medium text-gray-900 dark:text-white">{t.name}</h4>
                          <p className="text-sm text-gray-500 dark:text-gray-400">Subject: {t.subject}</p>
                          {t.delivery_mode && <Badge variant="outline" className="text-xs mt-1">{t.delivery_mode === 'email' ? '📧 Email' : '🔔 In-App'}</Badge>}
                        </div>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" onClick={() => setEditingTemplate(t)}><Edit2 className="w-4 h-4"/></Button>
                          <Button variant="outline" size="sm" className="text-red-500 hover:text-red-700" onClick={() => deleteTemplate(t.id)}><Trash2 className="w-4 h-4"/></Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-5 max-w-4xl">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                    {editingTemplate.isNew ? 'Create Template' : 'Edit Template'}
                  </h3>
                  <Button variant="outline" size="sm" onClick={() => setEditingTemplate(null)}><X className="w-4 h-4 mr-1"/> Cancel</Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm mb-2 text-gray-700 dark:text-gray-300">Template Name</label>
                    <Input value={editingTemplate.name} onChange={e => setEditingTemplate({...editingTemplate, name: e.target.value})} placeholder="e.g. Welcome Email"/>
                  </div>
                  <div>
                    <label className="block text-sm mb-2 text-gray-700 dark:text-gray-300">Delivery Mode</label>
                    <Select value={editingTemplate.delivery_mode || 'in_app'} onValueChange={val => setEditingTemplate({...editingTemplate, delivery_mode: val})}>
                      <SelectTrigger><SelectValue/></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="in_app">🔔 In-App Notification</SelectItem>
                        <SelectItem value="email">📧 Email</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm mb-2 text-gray-700 dark:text-gray-300">Subject</label>
                  <Input value={editingTemplate.subject} onChange={e => setEditingTemplate({...editingTemplate, subject: e.target.value})} placeholder="Email Subject"/>
                </div>

                {editingTemplate.delivery_mode === 'email' ? (
                  <div>
                    <label className="block text-sm mb-2 text-gray-700 dark:text-gray-300">Email Design Canvas</label>
                    <div className="border border-gray-200 dark:border-gray-700 rounded-xl p-4 bg-gray-50 dark:bg-gray-900/30">
                      <EmailBuilder value={editingTemplate.body||''} onChange={html => setEditingTemplate({...editingTemplate, body: html})}/>
                    </div>
                  </div>
                ) : (
                  <div>
                    <label className="block text-sm mb-2 text-gray-700 dark:text-gray-300">Message Body</label>
                    <textarea
                      className="w-full h-40 p-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-zinc-500 resize-none"
                      value={editingTemplate.body||''}
                      onChange={e => setEditingTemplate({...editingTemplate, body: e.target.value})}
                      placeholder="Template body with {{user_name}}, {{user_email}} variables..."
                    />
                  </div>
                )}

                <Button onClick={saveTemplate} className="bg-[#18181b] hover:bg-zinc-700 text-white border-0">
                  <Check className="w-4 h-4 mr-2"/> Save Template
                </Button>
              </div>
            )}
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════
             SMTP ACCOUNTS TAB
        ════════════════════════════════════════════════════════════════ */}
        {activeTab === 'accounts' && (
          <div>
            {!editingSmtp ? (
              <div>
                <div className="flex justify-end mb-4">
                  <Button onClick={() => setEditingSmtp({ name:'', host:'', port:'587', username:'', password:'', fromEmail:'', fromName:'', secure:true, isNew:true })}>
                    <Plus className="w-4 h-4 mr-2"/> Add SMTP Account
                  </Button>
                </div>
                {smtpAccounts.length === 0 ? (
                  <p className="text-gray-500 dark:text-gray-400 text-center py-8">No SMTP accounts configured.</p>
                ) : (
                  <div className="grid gap-4">
                    {smtpAccounts.map(a => (
                      <div key={a.id} className="border border-gray-200 dark:border-gray-700 rounded-xl p-4 flex justify-between items-center">
                        <div>
                          <h4 className="font-medium text-gray-900 dark:text-white">{a.name}</h4>
                          <p className="text-sm text-gray-500 dark:text-gray-400">{a.host}:{a.port} · {a.fromEmail}</p>
                          <Badge variant="outline" className="text-xs mt-1">{a.secure ? '🔒 TLS/SSL' : '🔓 Plain'}</Badge>
                        </div>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" onClick={() => setEditingSmtp(a)}><Edit2 className="w-4 h-4"/></Button>
                          <Button variant="outline" size="sm" className="text-red-500 hover:text-red-700" onClick={() => deleteSmtpAccount(a.id)}><Trash2 className="w-4 h-4"/></Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4 max-w-2xl">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                    {editingSmtp.isNew ? 'Add SMTP Account' : 'Edit SMTP Account'}
                  </h3>
                  <Button variant="outline" size="sm" onClick={() => setEditingSmtp(null)}><X className="w-4 h-4 mr-1"/> Cancel</Button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm mb-2 text-gray-700 dark:text-gray-300">Account Name</label>
                    <Input placeholder="e.g. Primary Marketing" value={editingSmtp.name} onChange={e=>setEditingSmtp({...editingSmtp,name:e.target.value})}/>
                  </div>
                  <div>
                    <label className="block text-sm mb-2 text-gray-700 dark:text-gray-300">SMTP Host</label>
                    <Input placeholder="smtp.gmail.com" value={editingSmtp.host} onChange={e=>setEditingSmtp({...editingSmtp,host:e.target.value})}/>
                  </div>
                  <div>
                    <label className="block text-sm mb-2 text-gray-700 dark:text-gray-300">SMTP Port</label>
                    <Input placeholder="587" value={editingSmtp.port} onChange={e=>setEditingSmtp({...editingSmtp,port:e.target.value})}/>
                  </div>
                  <div>
                    <label className="block text-sm mb-2 text-gray-700 dark:text-gray-300">Username</label>
                    <Input placeholder="SMTP Username" value={editingSmtp.username} onChange={e=>setEditingSmtp({...editingSmtp,username:e.target.value})}/>
                  </div>
                  <div>
                    <label className="block text-sm mb-2 text-gray-700 dark:text-gray-300">Password</label>
                    <Input type="password" placeholder="SMTP Password" value={editingSmtp.password} onChange={e=>setEditingSmtp({...editingSmtp,password:e.target.value})}/>
                  </div>
                  <div>
                    <label className="block text-sm mb-2 text-gray-700 dark:text-gray-300">From Email</label>
                    <Input placeholder="noreply@domain.com" value={editingSmtp.fromEmail} onChange={e=>setEditingSmtp({...editingSmtp,fromEmail:e.target.value})}/>
                  </div>
                  <div>
                    <label className="block text-sm mb-2 text-gray-700 dark:text-gray-300">From Name</label>
                    <Input placeholder="Admin Team" value={editingSmtp.fromName} onChange={e=>setEditingSmtp({...editingSmtp,fromName:e.target.value})}/>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" checked={editingSmtp.secure} onChange={e=>setEditingSmtp({...editingSmtp,secure:e.target.checked})} className="sr-only peer"/>
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-zinc-500 dark:peer-focus:ring-zinc-600 rounded-full peer dark:bg-gray-600 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-zinc-600"></div>
                  </label>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">Use TLS/SSL</span>
                </div>
                <div className="flex gap-3">
                  <Button onClick={saveSmtpAccount} className="bg-[#18181b] hover:bg-zinc-700 text-white border-0">
                    <Check className="w-4 h-4 mr-2"/> Save Account
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════
             NOTIFICATIONS TAB
        ════════════════════════════════════════════════════════════════ */}
        {activeTab === 'notifications' && (
          <div>
            <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Notification Manager</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">Edit, hide, or delete system and admin-sent notifications</p>
              </div>
              <div className="flex gap-2">
                {(['all','visible','hidden','unread'] as const).map(f => (
                  <button
                    key={f}
                    onClick={() => setNotifFilter(f)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors ${notifFilter===f?'bg-zinc-800 text-white':'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'}`}
                  >{f}</button>
                ))}
                <button onClick={loadNotifications} className="px-3 py-1.5 rounded-lg text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">↻ Refresh</button>
              </div>
            </div>

            {notifLoading ? (
              <div className="flex items-center justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-gray-400"/></div>
            ) : filteredNotifs.length === 0 ? (
              <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                <Bell className="w-10 h-10 mx-auto mb-3 opacity-40"/>
                <p>No notifications found</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredNotifs.map(notif => (
                  <div key={notif.id} className={`border rounded-xl p-4 transition-all ${notif.is_visible===false?'opacity-50 border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/20':'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800'}`}>
                    {editingNotif?.id === notif.id ? (
                      <div className="space-y-3">
                        <Input value={editingNotif.title} onChange={e=>setEditingNotif({...editingNotif,title:e.target.value})} placeholder="Title"/>
                        <textarea className="w-full h-24 p-3 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-900 text-sm resize-none" value={editingNotif.message} onChange={e=>setEditingNotif({...editingNotif,message:e.target.value})} placeholder="Message"/>
                        <div className="flex gap-2">
                          <Button size="sm" onClick={saveEditingNotif} className="bg-[#18181b] hover:bg-zinc-700 text-white border-0"><Check className="w-3 h-3 mr-1"/> Save</Button>
                          <Button size="sm" variant="outline" onClick={()=>setEditingNotif(null)}>Cancel</Button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <h4 className="font-medium text-gray-900 dark:text-white text-sm truncate">{notif.title}</h4>
                            <Badge variant="outline" className="text-xs shrink-0">{notif.type || 'info'}</Badge>
                            {!notif.read && <span className="w-2 h-2 bg-blue-500 rounded-full shrink-0"/>}
                            {notif.is_visible === false && <Badge variant="secondary" className="text-xs shrink-0">Hidden</Badge>}
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2 line-clamp-2">{notif.message}</p>
                          <div className="flex items-center gap-3 text-xs text-gray-400 dark:text-gray-500">
                            <span>User: {getUserEmail(notif.user_id)}</span>
                            {notif.created_at && <span>{new Date(notif.created_at).toLocaleString()}</span>}
                          </div>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            onClick={() => toggleNotifVisibility(notif)}
                            className={`p-1.5 rounded-lg transition-colors ${notif.is_visible===false?'text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20':'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
                            title={notif.is_visible===false?'Make visible':'Hide from user'}
                          >
                            {notif.is_visible === false ? <Eye className="w-4 h-4"/> : <EyeOff className="w-4 h-4"/>}
                          </button>
                          <button onClick={()=>setEditingNotif({...notif})} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 transition-colors" title="Edit">
                            <Edit2 className="w-4 h-4"/>
                          </button>
                          <button onClick={()=>deleteNotif(notif.id)} className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500 transition-colors" title="Delete">
                            <Trash2 className="w-4 h-4"/>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
