import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { SerialPort, SerialPortOptions } from '../types';
import { useConfig } from './ConfigContext';
import { generateDefaultCommandPayload } from '../../shared/utils';

interface SerialContextType {
  isConnected: boolean;
  connecting: boolean;
  error: string | null;
  selectedPort: string;
  availablePorts: SerialPort[];
  serialOptions: Omit<SerialPortOptions, 'path'>;
  activeComputer: number | null;
  lastCommand: string;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  refreshPorts: () => Promise<void>;
  updateSerialOptions: (options: Partial<Omit<SerialPortOptions, 'path'>>) => void;
  setSelectedPort: (path: string) => void;
  switchToComputer: (pcNumber: number) => Promise<void>;
}

const defaultSerialOptions: Omit<SerialPortOptions, 'path'> = {
  baudRate: 9600,
  dataBits: 8,
  parity: 'none',
  stopBits: 1
};

const SerialContext = createContext<SerialContextType | null>(null);

export const useSerial = () => {
  const context = useContext(SerialContext);
  if (!context) throw new Error('useSerial must be used within a SerialProvider');
  return context;
};

interface SerialProviderProps { children: ReactNode; }

export const SerialProvider: React.FC<SerialProviderProps> = ({ children }) => {
  const { config, loading: configLoading } = useConfig();

  const [isConnected, setIsConnected] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [availablePorts, setAvailablePorts] = useState<SerialPort[]>([]);
  const [selectedPort, setSelectedPort] = useState('');
  const [serialOptions, setSerialOptions] = useState(defaultSerialOptions);
  const [activeComputer, setActiveComputer] = useState<number | null>(null);
  const [lastCommand, setLastCommand] = useState('');

  // Load config values into state
  useEffect(() => {
    if (!configLoading && config?.connection) {
      if (config.connection.port) {
        setSelectedPort(config.connection.port);
      }
      setSerialOptions({
        baudRate: config.connection.baudRate,
        dataBits: config.connection.dataBits,
        parity: config.connection.parity,
        stopBits: config.connection.stopBits
      });
    }
  }, [configLoading, config]);

  // Once we have both autoConnect and a valid port, trigger connect
  useEffect(() => {
    if (!configLoading && config?.autoConnect && selectedPort) {
      const timer = setTimeout(() => {
        connect();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [configLoading, config?.autoConnect, selectedPort]);

  // Listen for serial errors
  useEffect(() => {
    const cleanup = window.serialApi.onError(err => {
      setError(err);
      setIsConnected(false);
      setConnecting(false);
    });
    return cleanup;
  }, []);

  // Check if there's an existing auto-connected port
  useEffect(() => {
    (async () => {
      try {
        const res = await window.serialApi.isAutoConnected();
        if (res.connected) setIsConnected(true);
      } catch (e) {
        console.error('Auto-connect check failed:', e);
      }
    })();
  }, []);

  // Refresh available ports once config has loaded
  useEffect(() => {
    if (!configLoading) refreshPorts();
  }, [configLoading]);

  const refreshPorts = async () => {
    try {
      const res = await window.serialApi.listPorts();
      if (res.success && res.ports) {
        setAvailablePorts(res.ports);
        // If there's a saved port in config and it's available, use it
        if (!selectedPort && config?.connection.port) {
          const saved = res.ports.find(p => p.path === config.connection.port);
          if (saved) return setSelectedPort(saved.path);
        }
        // Otherwise, if still no port selected, pick the first one
        if (!selectedPort && res.ports.length) {
          setSelectedPort(res.ports[0].path);
        }
      } else if (res.error) {
        setError(res.error);
      }
    } catch (e) {
      setError((e as Error).message);
    }
  };

  const connect = async () => {
    try {
      setConnecting(true);
      setError(null);
      if (!selectedPort) throw new Error('No port selected');
      const opts = { ...serialOptions, path: selectedPort };
      const res = await window.serialApi.connect(opts);
      if (res.success) setIsConnected(true);
      else if (res.error) throw new Error(res.error);
    } catch (e) {
      setError((e as Error).message);
      setIsConnected(false);
    } finally {
      setConnecting(false);
    }
  };

  const disconnect = async () => {
    try {
      const res = await window.serialApi.disconnect();
      if (res.success) {
        setIsConnected(false);
        setActiveComputer(null);
      } else if (res.error) throw new Error(res.error);
    } catch (e) {
      setError((e as Error).message);
      return Promise.reject(e);
    }
    return Promise.resolve();
  };

  const updateSerialOptions = (opts: Partial<Omit<SerialPortOptions, 'path'>>) => {
    setSerialOptions(prev => ({ ...prev, ...opts }));
  };

  const switchToComputer = async (pcNumber: number) => {
    try {
      if (!isConnected) throw new Error('Not connected');
      
      // Find the computer configuration for this port number
      const computerConfig = config?.computers.find(c => c.portNumber === pcNumber);
      
      if (!computerConfig) {
        throw new Error(`No configuration found for port ${pcNumber}`);
      }
      
      // Use the configured command payload, or fall back to the default format
      const cmd = computerConfig.commandPayload || generateDefaultCommandPayload(pcNumber);
      
      const res = await window.serialApi.write(cmd);
      if (res.success) {
        setActiveComputer(pcNumber);
        setLastCommand(cmd);
      } else if (res.error) throw new Error(res.error);
    } catch (e) {
      setError((e as Error).message);
    }
  };

  const value = {
    isConnected,
    connecting,
    error,
    selectedPort,
    availablePorts,
    serialOptions,
    activeComputer,
    lastCommand,
    connect,
    disconnect,
    refreshPorts,
    updateSerialOptions,
    setSelectedPort,
    switchToComputer
  };

  return <SerialContext.Provider value={value}>{children}</SerialContext.Provider>;
};
