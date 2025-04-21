import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useConfig } from './ConfigContext';

interface ComputerStatus {
  [id: string]: boolean | undefined;
}

interface WolContextType {
  computerStatus: ComputerStatus;
  isChecking: boolean;
  wakeComputer: (macAddress: string) => Promise<boolean>;
  checkAllComputerStatus: () => Promise<void>;
  refreshComputerStatus: (id: string) => Promise<boolean>;
}

const WolContext = createContext<WolContextType | null>(null);

export const useWol = () => {
  const context = useContext(WolContext);
  if (!context) throw new Error('useWol must be used within a WolProvider');
  return context;
};

interface WolProviderProps {
  children: ReactNode;
}

export const WolProvider: React.FC<WolProviderProps> = ({ children }) => {
  const { config } = useConfig();
  const [computerStatus, setComputerStatus] = useState<ComputerStatus>({});
  const [isChecking, setIsChecking] = useState(false);
  
  // Check all computer statuses when config changes
  useEffect(() => {
    if (config && config.computers.length > 0) {
      checkAllComputerStatus();
    }
  }, [config]);
  
  // Set up periodic status checking (every 30 seconds)
  useEffect(() => {
    const interval = setInterval(() => {
      if (config && config.computers.length > 0) {
        checkAllComputerStatus();
      }
    }, 30000);
    
    return () => clearInterval(interval);
  }, [config]);
  
  const wakeComputer = async (macAddress: string): Promise<boolean> => {
    try {
      const result = await window.wolApi.wake(macAddress);
      return result.success;
    } catch (error) {
      console.error('Failed to wake computer:', error);
      return false;
    }
  };
  
  const refreshComputerStatus = async (id: string): Promise<boolean> => {
    const computer = config?.computers.find(c => c.id === id);
    if (!computer || !computer.fqdn) return false;
    
    try {
      const result = await window.wolApi.checkStatus(computer.fqdn);
      setComputerStatus(prev => ({
        ...prev,
        [id]: result.online
      }));
      return result.online;
    } catch (error) {
      console.error(`Failed to check status for ${computer.label}:`, error);
      return false;
    }
  };
  
  const checkAllComputerStatus = async (): Promise<void> => {
    if (!config || config.computers.length === 0) return;
    
    setIsChecking(true);
    
    try {
      const newStatus: ComputerStatus = {};
      
      // Check each computer with an FQDN
      for (const computer of config.computers) {
        if (computer.fqdn) {
          const result = await window.wolApi.checkStatus(computer.fqdn);
          newStatus[computer.id] = result.online;
        } else {
          newStatus[computer.id] = undefined; // Status unknown
        }
      }
      
      setComputerStatus(newStatus);
    } catch (error) {
      console.error('Failed to check computer statuses:', error);
    } finally {
      setIsChecking(false);
    }
  };
  
  const value = {
    computerStatus,
    isChecking,
    wakeComputer,
    checkAllComputerStatus,
    refreshComputerStatus
  };
  
  return <WolContext.Provider value={value}>{children}</WolContext.Provider>;
};