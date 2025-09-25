"use client";

import React, { useCallback, useMemo, useState } from 'react';

import { AdminConfig } from '@/lib/admin.types';
import { getAuthInfoFromBrowserCookie } from '@/lib/auth';

import { buttonStyles,showError, showSuccess, useAlertModal, useLoadingState } from './common';

interface UserConfigProps {
  config: AdminConfig | null;
  role: 'owner' | 'admin' | null;
  refreshConfig: () => Promise<void>;
}

const UserConfig = ({ config, role, refreshConfig }: UserConfigProps) => {
  const { alertModal: _alertModal, showAlert, hideAlert: _hideAlert } = useAlertModal();
  const { isLoading, withLoading } = useLoadingState();
  const [showAddUserForm, setShowAddUserForm] = useState(false);
  const [showChangePasswordForm, setShowChangePasswordForm] = useState(false);
  const [newUser, setNewUser] = useState({ username: '', password: '', userGroup: '' });
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());

  const currentUsername = getAuthInfoFromBrowserCookie()?.username || null;

  const selectAllUsers = useMemo(() => {
    const selectableUserCount = config?.UserConfig?.Users?.filter(user =>
      (role === 'owner' || (role === 'admin' && (user.role === 'user' || user.username === currentUsername)))
    ).length || 0;
    return selectedUsers.size === selectableUserCount && selectedUsers.size > 0;
  }, [selectedUsers.size, config?.UserConfig?.Users, role, currentUsername]);

  const handleUserAction = async (action: string, targetUsername: string, targetPassword?: string, userGroup?: string) => {
    try {
      const res = await fetch('/api/admin/user', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetUsername, ...(targetPassword ? { targetPassword } : {}), ...(userGroup ? { userGroup } : {}), action })
      });
      if (!res.ok) throw new Error('操作失败');
      await refreshConfig();
    } catch (err) {
      showError(err instanceof Error ? err.message : '操作失败', showAlert);
    }
  };

  const handleAddUser = async () => {
    if (!newUser.username || !newUser.password) return;
    await withLoading('addUser', async () => {
      await handleUserAction('add', newUser.username, newUser.password, newUser.userGroup);
      setNewUser({ username: '', password: '', userGroup: '' });
      setShowAddUserForm(false);
      showSuccess('添加用户成功', showAlert);
    });
  };

  const handleSelectUser = useCallback((username: string, checked: boolean) => {
    setSelectedUsers(prev => {
      const newSet = new Set(prev);
      if (checked) newSet.add(username); else newSet.delete(username);
      return newSet;
    });
  }, []);

  const handleSelectAllUsers = useCallback((checked: boolean) => {
    if (checked) {
      const selectableUsernames = config?.UserConfig?.Users?.filter(user => (role === 'owner' || (role === 'admin' && (user.role === 'user' || user.username === currentUsername)))).map(u => u.username) || [];
      setSelectedUsers(new Set(selectableUsernames));
    } else setSelectedUsers(new Set());
  }, [config?.UserConfig?.Users, role, currentUsername]);

  if (!config) return <div className='text-center text-gray-500 dark:text-gray-400'>加载中...</div>;

  return (
    <div className='space-y-4'>
      <div className='flex items-center justify-between mb-3'>
        <h4 className='text-sm font-medium text-gray-700 dark:text-gray-300'>用户列表</h4>
        <div className='flex items-center space-x-2'>
          <button onClick={() => { setShowAddUserForm(!showAddUserForm); if (showChangePasswordForm) setShowChangePasswordForm(false); }} className={showAddUserForm ? buttonStyles.secondary : buttonStyles.success}>{showAddUserForm ? '取消' : '添加用户'}</button>
        </div>
      </div>

      {showAddUserForm && (
        <div className='mb-4 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700'>
          <div className='space-y-4'>
            <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
              <input type='text' placeholder='用户名' value={newUser.username} onChange={(e) => setNewUser(prev => ({ ...prev, username: e.target.value }))} className='px-3 py-2 border rounded-lg' />
              <input type='password' placeholder='密码' value={newUser.password} onChange={(e) => setNewUser(prev => ({ ...prev, password: e.target.value }))} className='px-3 py-2 border rounded-lg' />
            </div>
            <div className='flex justify-end'>
              <button onClick={handleAddUser} disabled={!newUser.username || !newUser.password || isLoading('addUser')} className={!newUser.username || !newUser.password || isLoading('addUser') ? buttonStyles.disabled : buttonStyles.success}>{isLoading('addUser') ? '添加中...' : '添加'}</button>
            </div>
          </div>
        </div>
      )}

      <div className='border rounded-lg max-h-[20rem] overflow-y-auto'>
        <table className='min-w-full'>
          <thead className='sticky top-0 bg-gray-50 dark:bg-gray-900'>
            <tr>
              <th className='w-10 px-1 py-3 text-center'>
                <input type='checkbox' checked={selectAllUsers} onChange={(e) => handleSelectAllUsers(e.target.checked)} />
              </th>
              <th className='px-6 py-3 text-left text-xs'>用户名</th>
              <th className='px-6 py-3 text-left text-xs'>角色</th>
              <th className='px-6 py-3 text-right text-xs'>操作</th>
            </tr>
          </thead>
          <tbody>
            {config.UserConfig.Users.map((user) => (
              <tr key={user.username} className='hover:bg-gray-50'>
                <td className='px-2 py-3 text-center'>
                  <input type='checkbox' checked={selectedUsers.has(user.username)} onChange={(e) => handleSelectUser(user.username, e.target.checked)} />
                </td>
                <td className='px-6 py-3'>{user.username}</td>
                <td className='px-6 py-3'>{user.role}</td>
                <td className='px-6 py-3 text-right'>
                  {/* 仅简化版渲染，保持行为委托到 API */}
                  <button onClick={() => handleUserAction('ban', user.username)} className={buttonStyles.roundedDanger}>封禁</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

    </div>
  );
};

export default UserConfig;
