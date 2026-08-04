import { useState } from 'react';
import { supabase } from '../../utils/supabaseClient';
import { useAdminAdminUsers } from '../../hooks/useSupabaseData';
import { Shield, Plus, Edit2, Trash, Check, X, ShieldAlert, Key } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Badge } from '../ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';

interface AdminUsersTabProps {
  adminProfile: any;
  platformUsers: any[]; // Needed so super admin can assign specific users to regular admins
}

const AVAILABLE_TABS = [
  { id: 'users', label: 'User Management' },
  { id: 'assets', label: 'Assets Overview' },
  { id: 'fees', label: 'Fee Settings' },
  { id: 'messages', label: 'Message Settings' },
  { id: 'support', label: 'Support Tickets' },
  { id: 'chat', label: 'Live Chat' },
  { id: 'audit', label: 'Audit Logs' },
  { id: 'sync', label: 'Data Sync' }
];

export default function AdminUsersTab({ adminProfile, platformUsers }: AdminUsersTabProps) {
  const { adminUsers, setAdminUsers, loading, refetch } = useAdminAdminUsers();
  
  const [showModal, setShowModal] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState<any>(null);
  const [formData, setFormData] = useState({
    email: '',
    password: '', // Only for creation
    role: 'admin', // default to regular admin
    allowed_tabs: [] as string[],
    allowed_user_ids: [] as string[]
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleOpenCreate = () => {
    setEditingAdmin(null);
    setFormData({
      email: '',
      password: '',
      role: 'admin',
      allowed_tabs: ['users', 'support'], // defaults
      allowed_user_ids: []
    });
    setShowModal(true);
  };

  const handleOpenEdit = (admin: any) => {
    setEditingAdmin(admin);
    setFormData({
      email: admin.email,
      password: '', // Password update not handled here to keep it simple, but we could
      role: admin.role,
      allowed_tabs: admin.admin_permissions?.allowed_tabs || [],
      allowed_user_ids: admin.admin_permissions?.allowed_user_ids || []
    });
    setShowModal(true);
  };

  const handleDelete = async (adminId: string) => {
    if (confirm('Are you sure you want to remove this admin?')) {
      const { error } = await supabase.rpc('admin_delete_admin_user', {
        p_admin_id: adminId
      });
      
      if (!error) {
        // Log action
        await supabase.from('audit_logs').insert({
          admin_id: adminProfile.id,
          action: 'Delete Admin User',
          metadata: { details: `Deleted admin user with ID ${adminId}` },
          ip_address: '127.0.0.1'
        });
        
        alert('Admin removed successfully');
        refetch();
      } else {
        alert('Failed to remove admin: ' + (error?.message || 'Unknown error'));
      }
    }
  };

  const handleSubmit = async () => {
    if (!formData.email) {
      alert('Email is required');
      return;
    }
    
    setIsSubmitting(true);
    
    const permissions = {
      allowed_tabs: formData.role === 'super_admin' ? AVAILABLE_TABS.map(t => t.id) : formData.allowed_tabs,
      allowed_user_ids: formData.role === 'super_admin' ? [] : formData.allowed_user_ids
    };

    if (editingAdmin) {
      // Update
      const { error } = await supabase.rpc('admin_update_admin_user', {
        p_admin_id: editingAdmin.id,
        p_role: formData.role,
        p_permissions: permissions
      });
      
      if (!error) {
        // Log action
        await supabase.from('audit_logs').insert({
          admin_id: adminProfile.id,
          action: 'Edit Admin User',
          metadata: { details: `Updated permissions/role for admin ${formData.email}` },
          ip_address: '127.0.0.1'
        });
        
        alert('Admin updated successfully');
        setShowModal(false);
        refetch();
      } else {
        alert('Update failed: ' + error.message);
      }
    } else {
      // Create
      if (!formData.password) {
        alert('Password is required for new admin');
        setIsSubmitting(false);
        return;
      }
      
      const { error } = await supabase.rpc('admin_create_admin_user', {
        p_email: formData.email,
        p_password: formData.password,
        p_role: formData.role,
        p_permissions: permissions
      });
      
      if (!error) {
        // Log action
        await supabase.from('audit_logs').insert({
          admin_id: adminProfile.id,
          action: 'Create Admin User',
          metadata: { details: `Created new admin user ${formData.email} with role ${formData.role}` },
          ip_address: '127.0.0.1'
        });
        
        alert('Admin created successfully');
        setShowModal(false);
        refetch();
      } else {
        alert('Creation failed: ' + error.message);
      }
    }
    
    setIsSubmitting(false);
  };

  const toggleTab = (tabId: string) => {
    setFormData(prev => {
      const tabs = prev.allowed_tabs.includes(tabId)
        ? prev.allowed_tabs.filter(t => t !== tabId)
        : [...prev.allowed_tabs, tabId];
      return { ...prev, allowed_tabs: tabs };
    });
  };

  const toggleUserAssignment = (userId: string) => {
    setFormData(prev => {
      const users = prev.allowed_user_ids.includes(userId)
        ? prev.allowed_user_ids.filter(id => id !== userId)
        : [...prev.allowed_user_ids, userId];
      return { ...prev, allowed_user_ids: users };
    });
  };

  if (adminProfile?.role !== 'super_admin') {
    return (
      <div className="p-8 text-center text-red-500 bg-red-50 dark:bg-red-900/10 rounded-xl">
        <ShieldAlert className="w-12 h-12 mx-auto mb-4" />
        <h2 className="text-xl font-bold">Access Denied</h2>
        <p>You do not have permission to view this page.</p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm">
      <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
        <div>
          <h2 className="text-xl text-gray-900 dark:text-white flex items-center gap-2">
            <Shield className="w-5 h-5 text-purple-500" />
            Admin Users
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Manage admin access and role permissions.
          </p>
        </div>
        <Button onClick={handleOpenCreate}>
          <Plus className="w-4 h-4 mr-2" />
          Create Admin
        </Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Email</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Permissions</TableHead>
            <TableHead>Last Login</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading ? (
            <TableRow><TableCell colSpan={5} className="text-center py-8">Loading...</TableCell></TableRow>
          ) : adminUsers.map((admin) => (
            <TableRow key={admin.id}>
              <TableCell>{admin.email}</TableCell>
              <TableCell>
                <Badge variant={admin.role === 'super_admin' ? 'default' : 'secondary'} className={admin.role === 'super_admin' ? 'bg-purple-600 hover:bg-purple-700 text-white' : ''}>
                  {admin.role === 'super_admin' ? 'Super Admin' : 'Admin'}
                </Badge>
              </TableCell>
              <TableCell>
                {admin.role === 'super_admin' ? (
                  <span className="text-sm text-gray-500 dark:text-gray-400">Full Access</span>
                ) : (
                  <div className="text-xs text-gray-600 dark:text-gray-400">
                    <p>{admin.admin_permissions?.allowed_tabs?.length || 0} tabs enabled</p>
                    <p>{admin.admin_permissions?.allowed_user_ids?.length || 0} users assigned</p>
                  </div>
                )}
              </TableCell>
              <TableCell className="text-sm text-gray-500 dark:text-gray-400">
                {admin.last_login ? new Date(admin.last_login).toLocaleDateString() : 'Never'}
              </TableCell>
              <TableCell>
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" onClick={() => handleOpenEdit(admin)}>
                    <Edit2 className="w-4 h-4" />
                  </Button>
                  {admin.id !== adminProfile.id && (
                    <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20" onClick={() => handleDelete(admin.id)}>
                      <Trash className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {/* Modal for Create/Edit */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-2xl my-8">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl text-gray-900 dark:text-white">
                {editingAdmin ? 'Edit Admin User' : 'Create Admin User'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
                  <Input 
                    value={formData.email} 
                    onChange={e => setFormData({...formData, email: e.target.value})} 
                    disabled={!!editingAdmin}
                    placeholder="admin@xbyte.com"
                  />
                </div>
                {!editingAdmin && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Password</label>
                    <Input 
                      type="password"
                      value={formData.password} 
                      onChange={e => setFormData({...formData, password: e.target.value})} 
                      placeholder="••••••••"
                    />
                  </div>
                )}
                <div className={editingAdmin ? "col-span-2" : "col-span-2"}>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Role</label>
                  <Select value={formData.role} onValueChange={(v) => setFormData({...formData, role: v})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Admin (Restricted Access)</SelectItem>
                      <SelectItem value="super_admin">Super Admin (Full Access)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {formData.role === 'admin' && (
                <>
                  <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                    <h4 className="font-medium text-gray-900 dark:text-white mb-3">Tab Permissions</h4>
                    <div className="grid grid-cols-2 gap-3">
                      {AVAILABLE_TABS.map(tab => (
                        <label key={tab.id} className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 cursor-pointer">
                          <input 
                            type="checkbox" 
                            className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                            checked={formData.allowed_tabs.includes(tab.id)}
                            onChange={() => toggleTab(tab.id)}
                          />
                          {tab.label}
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                    <div className="flex justify-between items-center mb-3">
                      <h4 className="font-medium text-gray-900 dark:text-white">Assigned Users</h4>
                      <span className="text-xs text-gray-500">
                        {formData.allowed_user_ids.length} selected
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mb-3">
                      Select which users this admin can view and manage in the User Management tab.
                    </p>
                    <div className="max-h-48 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-lg p-2 space-y-1">
                      {platformUsers.length === 0 ? (
                        <p className="text-sm text-gray-500 p-2">No users available.</p>
                      ) : (
                        platformUsers.map(user => (
                          <label key={user.id} className="flex items-center gap-3 p-2 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded cursor-pointer">
                            <input 
                              type="checkbox" 
                              className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                              checked={formData.allowed_user_ids.includes(user.id)}
                              onChange={() => toggleUserAssignment(user.id)}
                            />
                            <div className="flex-1 min-w-0 text-sm">
                              <p className="text-gray-900 dark:text-white truncate">{user.email}</p>
                              <p className="text-gray-500 text-xs font-mono truncate">{user.id}</p>
                            </div>
                          </label>
                        ))
                      )}
                    </div>
                  </div>
                </>
              )}

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                <Button variant="outline" onClick={() => setShowModal(false)}>Cancel</Button>
                <Button onClick={handleSubmit} disabled={isSubmitting}>
                  {isSubmitting ? 'Saving...' : (editingAdmin ? 'Update Admin' : 'Create Admin')}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
