import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { KvmConfig } from '../types';

interface ConfigContextType {
  config: KvmConfig | null;
  loading: boolean;
  error: string | null;
  updateConfig: (newConfig: Partial<KvmConfig>) => Promise<void>;
  addComputer: (computer: Omit<KvmConfig['computers'][0], 'id'>) => Promise<string | null>;
  updateComputer: (id: string, computer: Partial<Omit<KvmConfig['computers'][0], 'id'>>) => Promise<boolean>;
  removeComputer: (id: string) => Promise<boolean>;
  reorderComputers: (orderedIds: string[]) => Promise<boolean>;
  refreshConfig: () => Promise<void>;
}

const ConfigContext = createContext<ConfigContextType | null>(null);

export const useConfig = () => {
  const context = useContext(ConfigContext);
  if (!context) {
    throw new Error('useConfig must be used within a ConfigProvider');
  }
  return context;
};

interface ConfigProviderProps {
  children: ReactNode;
}

export const ConfigProvider: React.FC<ConfigProviderProps> = ({ children }) => {
  const [config, setConfig] = useState<KvmConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load config on component mount
  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await window.configApi.getConfig();
      setConfig(result);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const refreshConfig = async () => {
    return loadConfig();
  };

  const updateConfig = async (newConfig: Partial<KvmConfig>) => {
    try {
      setLoading(true);
      setError(null);
      const result = await window.configApi.updateConfig(newConfig);
      if (result.success) {
        // Reload the config to get the updated state
        await loadConfig();
      } else if (result.error) {
        throw new Error(result.error);
      }
    } catch (err) {
      setError((err as Error).message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const addComputer = async (computer: Omit<KvmConfig['computers'][0], 'id'>) => {
    try {
      const result = await window.configApi.addComputer(computer);
      if (result.success && result.id) {
        await loadConfig();
        return result.id;
      } else if (result.error) {
        throw new Error(result.error);
      }
      return null;
    } catch (err) {
      setError((err as Error).message);
      throw err;
    }
  };

  const updateComputer = async (id: string, computer: Partial<Omit<KvmConfig['computers'][0], 'id'>>) => {
    try {
      const result = await window.configApi.updateComputer(id, computer);
      if (result.success) {
        await loadConfig();
        return true;
      } else if (result.error) {
        throw new Error(result.error);
      }
      return false;
    } catch (err) {
      setError((err as Error).message);
      throw err;
    }
  };

  const removeComputer = async (id: string) => {
    try {
      const result = await window.configApi.removeComputer(id);
      if (result.success) {
        await loadConfig();
        return true;
      } else if (result.error) {
        throw new Error(result.error);
      }
      return false;
    } catch (err) {
      setError((err as Error).message);
      throw err;
    }
  };

  const reorderComputers = async (orderedIds: string[]) => {
    try {
      const result = await window.configApi.reorderComputers(orderedIds);
      if (result.success) {
        await loadConfig();
        return true;
      } else if (result.error) {
        throw new Error(result.error);
      }
      return false;
    } catch (err) {
      setError((err as Error).message);
      throw err;
    }
  };

  const value = {
    config,
    loading,
    error,
    updateConfig,
    addComputer,
    updateComputer,
    removeComputer,
    reorderComputers,
    refreshConfig
  };

  return <ConfigContext.Provider value={value}>{children}</ConfigContext.Provider>;
};