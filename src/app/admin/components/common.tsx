"use client";

import { AlertCircle, AlertTriangle,CheckCircle } from 'lucide-react';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

export const buttonStyles = {
  primary: 'px-3 py-1.5 text-sm font-medium bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700 text-white rounded-lg transition-colors',
  success: 'px-3 py-1.5 text-sm font-medium bg-green-600 hover:bg-green-700 dark:bg-green-600 dark:hover:bg-green-700 text-white rounded-lg transition-colors',
  danger: 'px-3 py-1.5 text-sm font-medium bg-red-600 hover:bg-red-700 dark:bg-red-600 dark:hover:bg-red-700 text-white rounded-lg transition-colors',
  secondary: 'px-3 py-1.5 text-sm font-medium bg-gray-600 hover:bg-gray-700 dark:bg-gray-600 dark:hover:bg-gray-700 text-white rounded-lg transition-colors',
  warning: 'px-3 py-1.5 text-sm font-medium bg-yellow-600 hover:bg-yellow-700 dark:bg-yellow-600 dark:hover:bg-yellow-700 text-white rounded-lg transition-colors',
  primarySmall: 'px-2 py-1 text-xs font-medium bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700 text-white rounded-md transition-colors',
  successSmall: 'px-2 py-1 text-xs font-medium bg-green-600 hover:bg-green-700 dark:bg-green-600 dark:hover:bg-green-700 text-white rounded-md transition-colors',
  dangerSmall: 'px-2 py-1 text-xs font-medium bg-red-600 hover:bg-red-700 dark:bg-red-600 dark:hover:bg-red-700 text-white rounded-md transition-colors',
  secondarySmall: 'px-2 py-1 text-xs font-medium bg-gray-600 hover:bg-gray-700 dark:bg-gray-600 dark:hover:bg-gray-700 text-white rounded-md transition-colors',
  warningSmall: 'px-2 py-1 text-xs font-medium bg-yellow-600 hover:bg-yellow-700 dark:bg-yellow-600 dark:hover:bg-yellow-700 text-white rounded-md transition-colors',
  roundedPrimary: 'inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 hover:bg-blue-200 dark:bg-blue-900/40 dark:hover:bg-blue-900/60 dark:text-blue-200 transition-colors',
  roundedSuccess: 'inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium bg-green-100 text-green-800 hover:bg-green-200 dark:bg-green-900/40 dark:hover:bg-green-900/60 dark:text-green-200 transition-colors',
  roundedDanger: 'inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium bg-red-100 text-red-800 hover:bg-red-200 dark:bg-red-900/40 dark:hover:bg-red-900/60 dark:text-red-200 transition-colors',
  roundedSecondary: 'inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 hover:bg-gray-200 dark:bg-gray-700/40 dark:hover:bg-gray-700/60 dark:text-gray-200 transition-colors',
  roundedWarning: 'inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 hover:bg-yellow-200 dark:bg-yellow-900/40 dark:hover:bg-yellow-900/60 dark:text-yellow-200 transition-colors',
  roundedPurple: 'inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 hover:bg-purple-200 dark:bg-purple-900/40 dark:hover:bg-purple-900/60 dark:text-purple-200 transition-colors',
  disabled: 'px-3 py-1.5 text-sm font-medium bg-gray-400 dark:bg-gray-600 cursor-not-allowed text-white rounded-lg transition-colors',
  disabledSmall: 'px-2 py-1 text-xs font-medium bg-gray-400 dark:bg-gray-600 cursor-not-allowed text-white rounded-md transition-colors',
  toggleOn: 'bg-green-600 dark:bg-green-600',
  toggleOff: 'bg-gray-200 dark:bg-gray-700',
  toggleThumb: 'bg-white',
  toggleThumbOn: 'translate-x-6',
  toggleThumbOff: 'translate-x-1',
  quickAction: 'px-3 py-1.5 text-xs font-medium text-gray-600 dark:text-gray-400 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-md transition-colors',
};

interface AlertModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'success' | 'error' | 'warning';
  title: string;
  message?: string;
  timer?: number;
  showConfirm?: boolean;
}

export const AlertModal = ({ isOpen, onClose, type, title, message, timer, showConfirm = false }: AlertModalProps) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
      if (timer) {
        const t = setTimeout(() => onClose(), timer);
        return () => clearTimeout(t);
      }
    } else {
      setIsVisible(false);
    }
  }, [isOpen, timer, onClose]);

  if (!isOpen) return null;

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-8 h-8 text-green-500" />;
      case 'error':
        return <AlertCircle className="w-8 h-8 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="w-8 h-8 text-yellow-500" />;
      default:
        return null;
    }
  };

  const getBgColor = () => {
    switch (type) {
      case 'success':
        return 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800';
      case 'error':
        return 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800';
      case 'warning':
        return 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800';
      default:
        return 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800';
    }
  };

  return createPortal(
    <div className={`fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4 transition-opacity duration-200 ${isVisible ? 'opacity-100' : 'opacity-0'}`}>
      <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-sm w-full border ${getBgColor()} transition-all duration-200 ${isVisible ? 'scale-100' : 'scale-95'}`}>
        <div className="p-6 text-center">
          <div className="flex justify-center mb-4">{getIcon()}</div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">{title}</h3>
          {message && <p className="text-gray-600 dark:text-gray-400 mb-4">{message}</p>}
          {showConfirm && (
            <button onClick={onClose} className={`px-4 py-2 text-sm font-medium ${buttonStyles.primary}`}>确定</button>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};

export const useAlertModal = () => {
  const [alertModal, setAlertModal] = useState<{ isOpen: boolean; type: 'success' | 'error' | 'warning'; title: string; message?: string; timer?: number; showConfirm?: boolean }>({ isOpen: false, type: 'success', title: '' });

  const showAlert = (config: Omit<typeof alertModal, 'isOpen'>) => setAlertModal({ ...config, isOpen: true });
  const hideAlert = () => setAlertModal(prev => ({ ...prev, isOpen: false }));
  return { alertModal, showAlert, hideAlert };
};
type AlertConfig = { type: 'success' | 'error' | 'warning'; title: string; message?: string; timer?: number; showConfirm?: boolean };

export const showError = (message: string, showAlert?: (config: AlertConfig) => void) => {
  if (showAlert) showAlert({ type: 'error', title: '错误', message, showConfirm: true });
  else {
    // eslint-disable-next-line no-console
    console.error(message);
  }
};

export const showSuccess = (message: string, showAlert?: (config: AlertConfig) => void) => {
  if (showAlert) showAlert({ type: 'success', title: '成功', message, timer: 2000 });
  else {
    // eslint-disable-next-line no-console
    console.log(message);
  }
};

export const useLoadingState = () => {
  const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>({});
  const setLoading = (key: string, loading: boolean) => setLoadingStates(prev => ({ ...prev, [key]: loading }));
  const isLoading = (key: string) => !!loadingStates[key];
  const withLoading = async (key: string, operation: () => Promise<unknown>): Promise<unknown> => {
    setLoading(key, true);
    try {
      const res = await operation();
      return res;
    } finally {
      setLoading(key, false);
    }
  };
  return { loadingStates, setLoading, isLoading, withLoading };
};
