"use client";
import React from 'react';

import { AdminConfig } from '@/lib/admin.types';

import { buttonStyles, showSuccess, useAlertModal, useLoadingState } from './common';

const ConfigFileComponent = ({ config, refreshConfig }: { config: AdminConfig | null; refreshConfig: () => Promise<void> }) => {
  const { alertModal: _alertModal, showAlert, hideAlert: _hideAlert } = useAlertModal();
  const { isLoading, withLoading } = useLoadingState();
  const [configContent, setConfigContent] = React.useState<string>('');
  React.useEffect(() => { if (config?.ConfigFile) setConfigContent(config.ConfigFile); }, [config]);

  const handleSave = async () => {
    await withLoading('saveConfig', async () => {
      const resp = await fetch('/api/admin/config_file', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ configFile: configContent }) });
      if (!resp.ok) throw new Error('保存失败');
      showSuccess('配置文件保存成功', showAlert);
      await refreshConfig();
    });
  };

  if (!config) return <div className='text-center text-gray-500'>加载中...</div>;

  return (
    <div className='space-y-4'>
      <textarea value={configContent} onChange={(e) => setConfigContent(e.target.value)} rows={12} className='w-full border rounded-lg font-mono' />
      <div className='flex justify-end'>
        <button onClick={handleSave} disabled={isLoading('saveConfig')} className={isLoading('saveConfig') ? buttonStyles.disabled : buttonStyles.success}>{isLoading('saveConfig') ? '保存中…' : '保存'}</button>
      </div>
    </div>
  );
};

export default ConfigFileComponent;
