import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Check, X, Send, Mail, Settings, FileText, Loader2 } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import dataService from '../../utils/dataService';
import { supabase } from '../../utils/supabaseClient';

interface AdminMessagingProps {
  users: any[];
}

export default function AdminMessaging({ users }: AdminMessagingProps) {
  const [activeTab, setActiveTab] = useState<'compose' | 'accounts' | 'templates'>('compose');

  const [smtpAccounts, setSmtpAccounts] = useState<any[]>([]);
  const [messageTemplates, setMessageTemplates] = useState<any[]>([]);
  
  useEffect(() => {
    const fetchData = async () => {
      // Fetch SMTP accounts
      const { data: smtpData } = await supabase.from('smtp_settings').select('*');
      if (smtpData) {
        // Map snake_case to camelCase
        const mappedSmtp = smtpData.map(a => ({
          ...a,
          fromEmail: a.from_email,
          fromName: a.from_name
        }));
        setSmtpAccounts(mappedSmtp);
      }

      // Fetch templates
      const { data: templateData } = await supabase.from('message_templates').select('*').order('created_at', { ascending: true });
      if (templateData) setMessageTemplates(templateData);
    };
    fetchData();
  }, []);
  
  const [editingSmtp, setEditingSmtp] = useState<any>(null);
  const [editingTemplate, setEditingTemplate] = useState<any>(null);
  
  const [composeMessage, setComposeMessage] = useState({
    deliveryMethod: 'both', // 'in_app', 'email', 'both'
    smtpAccountId: '',
    templateId: '',
    recipientsType: 'all',
    specificUserId: '',
    subject: '',
    body: ''
  });
  const [isSendingMessage, setIsSendingMessage] = useState(false);

  // SMTP Handlers
  const saveSmtpAccount = async () => {
    if (!editingSmtp.name || !editingSmtp.host || !editingSmtp.port || !editingSmtp.fromEmail) {
      alert('Please fill required fields (Name, Host, Port, From Email)');
      return;
    }
    const isNew = editingSmtp.isNew;
    const dataToSave = { 
      name: editingSmtp.name,
      host: editingSmtp.host,
      port: editingSmtp.port,
      username: editingSmtp.username,
      password: editingSmtp.password,
      from_email: editingSmtp.fromEmail,
      from_name: editingSmtp.fromName,
      secure: editingSmtp.secure
    };
    
    if (isNew) {
      const { data, error } = await supabase.from('smtp_settings').insert(dataToSave).select().single();
      if (error) {
        alert('Error saving SMTP account: ' + error.message);
      } else if (data) {
        data.fromEmail = data.from_email;
        data.fromName = data.from_name;
        setSmtpAccounts([...smtpAccounts, data]);
      }
    } else {
      const { data, error } = await supabase.from('smtp_settings').update(dataToSave).eq('id', editingSmtp.id).select().single();
      if (error) {
        alert('Error updating SMTP account: ' + error.message);
      } else if (data) {
        data.fromEmail = data.from_email;
        data.fromName = data.from_name;
        setSmtpAccounts(smtpAccounts.map(a => a.id === data.id ? data : a));
      }
    }
    setEditingSmtp(null);
  };

  const deleteSmtpAccount = async (id: string) => {
    if (confirm('Delete this SMTP account?')) {
      await supabase.from('smtp_settings').delete().eq('id', id);
      setSmtpAccounts(smtpAccounts.filter(a => a.id !== id));
    }
  };

  // Template Handlers
  const saveTemplate = async () => {
    if (!editingTemplate.name || !editingTemplate.subject) {
      alert('Please provide a name and subject');
      return;
    }
    const isNew = editingTemplate.isNew;
    const dataToSave = { ...editingTemplate };
    delete dataToSave.isNew;
    delete dataToSave.id;
    
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

  // Compose Handlers
  const applyTemplate = (templateId: string) => {
    const tpl = messageTemplates.find(t => t.id === templateId);
    if (tpl) {
      setComposeMessage(prev => ({
        ...prev,
        templateId,
        subject: tpl.subject,
        body: tpl.body
      }));
    } else {
      setComposeMessage(prev => ({...prev, templateId: ''}));
    }
  };

  const parseTemplateVariables = (text: string, user: any) => {
    if (!text) return '';
    return text
      .replace(/{{user_name}}/g, user.name || 'User')
      .replace(/{{user_email}}/g, user.email || '')
      .replace(/{{user_id}}/g, user.id || '')
      .replace(/{{total_balance}}/g, Object.values(user.balances || {}).reduce((a:any, b:any) => parseFloat(a) + parseFloat(b), 0).toString());
  };

  const handleSendMessage = async () => {
    if ((composeMessage.deliveryMethod === 'email' || composeMessage.deliveryMethod === 'both') && !composeMessage.smtpAccountId) {
      alert('Please select an SMTP account for email delivery');
      return;
    }
    if (!composeMessage.subject || !composeMessage.body) {
      alert('Subject and body are required');
      return;
    }
    
    const smtp = smtpAccounts.find(a => a.id === composeMessage.smtpAccountId);

    let targetUsers = [];
    if (composeMessage.recipientsType === 'all') {
      targetUsers = users;
    } else {
      const u = users.find(u => u.id === composeMessage.specificUserId);
      if (!u) {
        alert('Please select a valid user');
        return;
      }
      targetUsers = [u];
    }

    if (targetUsers.length === 0) {
      alert('No users found to send message to');
      return;
    }

    setIsSendingMessage(true);
    let successCount = 0;
    let errorMsg = '';

    try {
      // 1. Send Emails if required
      if (composeMessage.deliveryMethod === 'email' || composeMessage.deliveryMethod === 'both') {
        const recipients = targetUsers.map(u => ({
          email: u.email,
          body: parseTemplateVariables(composeMessage.body, u)
        }));

        try {
          const response = await fetch('http://localhost:3001/api/send-email', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              smtpConfig: smtp,
              recipients: recipients,
              subject: composeMessage.subject
            })
          });

          const result = await response.json();
          if (!result.success) {
            errorMsg = 'Failed to send emails: ' + result.message;
          }
        } catch (e: any) {
          errorMsg = 'Error connecting to mail server: ' + e.message;
        }
      }

      // 2. Send In-App Notifications if required
      if (composeMessage.deliveryMethod === 'in_app' || composeMessage.deliveryMethod === 'both') {
        const notifications = targetUsers.map(u => ({
          user_id: u.id,
          title: composeMessage.subject,
          message: parseTemplateVariables(composeMessage.body, u),
          type: 'info',
          icon: 'Mail'
        }));
        
        const { error } = await supabase.from('user_notifications').insert(notifications);
        if (error) {
          errorMsg += (errorMsg ? ' | ' : '') + 'Failed to send in-app notifications: ' + error.message;
        }
      }

      // 3. Log sent message
      const { data: authData } = await supabase.auth.getUser();
      await supabase.from('admin_sent_messages').insert({
        subject: composeMessage.subject,
        body: composeMessage.body,
        delivery_method: composeMessage.deliveryMethod,
        recipients_count: targetUsers.length,
        target_type: composeMessage.recipientsType,
        target_user_id: composeMessage.recipientsType === 'specific' ? composeMessage.specificUserId : null,
        sent_by: authData?.user?.id
      });

      if (!errorMsg) {
        alert(`Successfully sent messages to ${targetUsers.length} user(s)!`);
        setComposeMessage(prev => ({ ...prev, subject: '', body: '', templateId: '' }));
      } else {
        alert(errorMsg);
      }
    } catch (e: any) {
      alert('An unexpected error occurred: ' + e.message);
    } finally {
      setIsSendingMessage(false);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
      <div className="flex border-b border-gray-200 dark:border-gray-700">
        <button 
          onClick={() => setActiveTab('compose')}
          className={`flex-1 py-4 flex items-center justify-center gap-2 font-medium ${activeTab === 'compose' ? 'bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 border-b-2 border-purple-600' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700/50'}`}
        >
          <Send className="w-4 h-4" /> Compose
        </button>
        <button 
          onClick={() => setActiveTab('templates')}
          className={`flex-1 py-4 flex items-center justify-center gap-2 font-medium ${activeTab === 'templates' ? 'bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 border-b-2 border-purple-600' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700/50'}`}
        >
          <FileText className="w-4 h-4" /> Templates
        </button>
        <button 
          onClick={() => setActiveTab('accounts')}
          className={`flex-1 py-4 flex items-center justify-center gap-2 font-medium ${activeTab === 'accounts' ? 'bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 border-b-2 border-purple-600' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700/50'}`}
        >
          <Settings className="w-4 h-4" /> SMTP Accounts
        </button>
      </div>

      <div className="p-6">
        {activeTab === 'compose' && (
          <div className="space-y-6 max-w-3xl">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm mb-2 text-gray-700 dark:text-gray-300">Delivery Method</label>
                <Select value={composeMessage.deliveryMethod} onValueChange={(val) => setComposeMessage({...composeMessage, deliveryMethod: val})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Delivery Method" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="both">Both (In-App & Email)</SelectItem>
                    <SelectItem value="in_app">In-App Notification Only</SelectItem>
                    <SelectItem value="email">Email Only</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {(composeMessage.deliveryMethod === 'email' || composeMessage.deliveryMethod === 'both') && (
                <div>
                  <label className="block text-sm mb-2 text-gray-700 dark:text-gray-300">From (SMTP Account)</label>
                  <Select value={composeMessage.smtpAccountId} onValueChange={(val) => setComposeMessage({...composeMessage, smtpAccountId: val})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select SMTP Account" />
                    </SelectTrigger>
                    <SelectContent>
                      {smtpAccounts.map(a => (
                        <SelectItem key={a.id} value={a.id}>{a.name} ({a.fromEmail})</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              
              <div className={composeMessage.deliveryMethod === 'in_app' ? 'md:col-span-2' : ''}>
                <label className="block text-sm mb-2 text-gray-700 dark:text-gray-300">Load Template</label>
                <Select value={composeMessage.templateId} onValueChange={applyTemplate}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Template" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {messageTemplates.map(t => (
                      <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <label className="block text-sm mb-2 text-gray-700 dark:text-gray-300">To (Recipients)</label>
              <div className="flex gap-4">
                <Select value={composeMessage.recipientsType} onValueChange={(val) => setComposeMessage({...composeMessage, recipientsType: val, specificUserId: ''})}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Send to" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Users</SelectItem>
                    <SelectItem value="specific">Specific User</SelectItem>
                  </SelectContent>
                </Select>

                {composeMessage.recipientsType === 'specific' && (
                  <Select value={composeMessage.specificUserId} onValueChange={(val) => setComposeMessage({...composeMessage, specificUserId: val})}>
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Select user" />
                    </SelectTrigger>
                    <SelectContent>
                      {users.map((u: any) => (
                        <SelectItem key={u.id} value={u.id}>{u.email} ({u.id.substring(0, 8)})</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm mb-2 text-gray-700 dark:text-gray-300">Subject</label>
              <Input 
                value={composeMessage.subject}
                onChange={(e) => setComposeMessage({...composeMessage, subject: e.target.value})}
                placeholder="Email Subject"
              />
            </div>

            <div>
              <label className="block text-sm mb-2 text-gray-700 dark:text-gray-300">Body (HTML supported)</label>
              <textarea 
                className="w-full h-64 p-3 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                value={composeMessage.body}
                onChange={(e) => setComposeMessage({...composeMessage, body: e.target.value})}
                placeholder="Write your message here... Use {{user_name}}, {{user_email}}, {{total_balance}} for dynamic fields."
              ></textarea>
              <p className="text-xs text-gray-500 mt-2">Available variables: {'{{user_name}}'}, {'{{user_email}}'}, {'{{user_id}}'}, {'{{total_balance}}'}</p>
            </div>

            <Button 
              size="lg" 
              onClick={handleSendMessage}
              disabled={isSendingMessage || !composeMessage.subject || !composeMessage.body || ((composeMessage.deliveryMethod === 'email' || composeMessage.deliveryMethod === 'both') && !composeMessage.smtpAccountId)}
            >
              {isSendingMessage ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
              {isSendingMessage ? 'Sending...' : 'Send Message'}
            </Button>
          </div>
        )}

        {activeTab === 'templates' && (
          <div>
            {!editingTemplate ? (
              <div>
                <div className="flex justify-end mb-4">
                  <Button onClick={() => setEditingTemplate({ name: '', subject: '', body: '', isNew: true })}>
                    <Plus className="w-4 h-4 mr-2" /> Create Template
                  </Button>
                </div>
                {messageTemplates.length === 0 ? (
                  <p className="text-gray-500 dark:text-gray-400 text-center py-8">No templates configured yet.</p>
                ) : (
                  <div className="grid gap-4">
                    {messageTemplates.map(t => (
                      <div key={t.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 flex justify-between items-center">
                        <div>
                          <h4 className="font-medium text-gray-900 dark:text-white">{t.name}</h4>
                          <p className="text-sm text-gray-500 dark:text-gray-400">Subject: {t.subject}</p>
                        </div>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" onClick={() => setEditingTemplate(t)}>
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button variant="outline" size="sm" className="text-red-500 hover:text-red-700" onClick={() => deleteTemplate(t.id)}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4 max-w-2xl">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                  {editingTemplate.isNew ? 'Create Template' : 'Edit Template'}
                </h3>
                <div>
                  <label className="block text-sm mb-2 text-gray-700 dark:text-gray-300">Template Name</label>
                  <Input 
                    value={editingTemplate.name}
                    onChange={(e) => setEditingTemplate({...editingTemplate, name: e.target.value})}
                    placeholder="e.g. Welcome Email"
                  />
                </div>
                <div>
                  <label className="block text-sm mb-2 text-gray-700 dark:text-gray-300">Subject</label>
                  <Input 
                    value={editingTemplate.subject}
                    onChange={(e) => setEditingTemplate({...editingTemplate, subject: e.target.value})}
                    placeholder="Email Subject"
                  />
                </div>
                <div>
                  <label className="block text-sm mb-2 text-gray-700 dark:text-gray-300">Body</label>
                  <textarea 
                    className="w-full h-64 p-3 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                    value={editingTemplate.body}
                    onChange={(e) => setEditingTemplate({...editingTemplate, body: e.target.value})}
                    placeholder="HTML Body with {{variables}}"
                  ></textarea>
                </div>
                <div className="flex gap-3">
                  <Button onClick={saveTemplate}><Check className="w-4 h-4 mr-2" /> Save</Button>
                  <Button variant="outline" onClick={() => setEditingTemplate(null)}>Cancel</Button>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'accounts' && (
          <div>
            {!editingSmtp ? (
              <div>
                <div className="flex justify-end mb-4">
                  <Button onClick={() => setEditingSmtp({ name: '', host: '', port: '587', username: '', password: '', fromEmail: '', fromName: '', secure: true, isNew: true })}>
                    <Plus className="w-4 h-4 mr-2" /> Add SMTP Account
                  </Button>
                </div>
                {smtpAccounts.length === 0 ? (
                  <p className="text-gray-500 dark:text-gray-400 text-center py-8">No SMTP accounts configured yet.</p>
                ) : (
                  <div className="grid gap-4">
                    {smtpAccounts.map(a => (
                      <div key={a.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 flex justify-between items-center">
                        <div>
                          <h4 className="font-medium text-gray-900 dark:text-white">{a.name}</h4>
                          <p className="text-sm text-gray-500 dark:text-gray-400">{a.host}:{a.port} ({a.fromEmail})</p>
                        </div>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" onClick={() => setEditingSmtp(a)}>
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button variant="outline" size="sm" className="text-red-500 hover:text-red-700" onClick={() => deleteSmtpAccount(a.id)}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4 max-w-2xl">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                  {editingSmtp.isNew ? 'Add SMTP Account' : 'Edit SMTP Account'}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm mb-2 text-gray-700 dark:text-gray-300">Account Name</label>
                    <Input 
                      placeholder="e.g. Primary Marketing" 
                      value={editingSmtp.name}
                      onChange={(e) => setEditingSmtp({...editingSmtp, name: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-sm mb-2 text-gray-700 dark:text-gray-300">SMTP Host</label>
                    <Input 
                      placeholder="e.g. smtp.gmail.com" 
                      value={editingSmtp.host}
                      onChange={(e) => setEditingSmtp({...editingSmtp, host: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-sm mb-2 text-gray-700 dark:text-gray-300">SMTP Port</label>
                    <Input 
                      placeholder="e.g. 587" 
                      value={editingSmtp.port}
                      onChange={(e) => setEditingSmtp({...editingSmtp, port: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-sm mb-2 text-gray-700 dark:text-gray-300">Username</label>
                    <Input 
                      placeholder="SMTP Username" 
                      value={editingSmtp.username}
                      onChange={(e) => setEditingSmtp({...editingSmtp, username: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-sm mb-2 text-gray-700 dark:text-gray-300">Password</label>
                    <Input 
                      type="password"
                      placeholder="SMTP Password" 
                      value={editingSmtp.password}
                      onChange={(e) => setEditingSmtp({...editingSmtp, password: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-sm mb-2 text-gray-700 dark:text-gray-300">From Email</label>
                    <Input 
                      placeholder="noreply@domain.com" 
                      value={editingSmtp.fromEmail}
                      onChange={(e) => setEditingSmtp({...editingSmtp, fromEmail: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-sm mb-2 text-gray-700 dark:text-gray-300">From Name</label>
                    <Input 
                      placeholder="Admin Team" 
                      value={editingSmtp.fromName}
                      onChange={(e) => setEditingSmtp({...editingSmtp, fromName: e.target.value})}
                    />
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editingSmtp.secure}
                      onChange={(e) => setEditingSmtp({...editingSmtp, secure: e.target.checked})}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 dark:peer-focus:ring-purple-800 rounded-full peer dark:bg-gray-600 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-purple-600"></div>
                  </label>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">Use TLS/SSL</span>
                </div>
                <div className="flex gap-3">
                  <Button onClick={saveSmtpAccount}><Check className="w-4 h-4 mr-2" /> Save Account</Button>
                  <Button variant="outline" onClick={() => setEditingSmtp(null)}>Cancel</Button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
