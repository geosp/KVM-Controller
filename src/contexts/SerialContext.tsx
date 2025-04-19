import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { SerialPort, SerialPortOptions } from '../types';

interface SerialContextType {
  isConnected: boolean;
  connecting: boolean;
  error: string | null;
  selectedPort: string;
  availablePorts: SerialPort[];
  serialOptions: SerialPortOptions;
  activeComputer: number | null;
  lastCommand: string;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  refreshPorts: () => Promise<void>;
  updateSerialOptions: (options: Partial<SerialPortOptions>) => void;
  setSelectedPort: (path: string) => void;
  switchToComputer: (pcNumber: number) => Promise<void>;
}

const defaultSerialOptions: SerialPortOptions = {
  path: '',
  baudRate: 9600,
  dataBits: 8,
  parity: 'none',
  stopBits: 1
};

const SerialContext = createContext<SerialContextType | null>(null);

export const useSerial = () => {
  const context = useContext(SerialContext);
  if (!context) {
    throw new Error('useSerial must be used within a SerialProvider');
  }
  return context;
};

interface SerialProviderProps {
  children: ReactNode;
}

export const SerialProvider: React.FC<SerialProviderProps> = ({ children }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [availablePorts, setAvailablePorts] = useState<SerialPort[]>([]);
  const [selectedPort, setSelectedPort] = useState('');
  const [serialOptions, setSerialOptions] = useState<SerialPortOptions>(defaultSerialOptions);
  const [activeComputer, setActiveComputer] = useState<number | null>(null);
  const [lastCommand, setLastCommand] = useState('');
  
  // Setup event listener for errors
  useEffect(() => {
    const cleanup = window.serialApi.onError((errorMessage) => {
      setError(errorMessage);
      setIsConnected(false);
      setConnecting(false);
    });
    
    return cleanup;
  }, []);
  
  const refreshPorts = async () => {
    try {
      const result = await window.serialApi.listPorts();
      if (result.success && result.ports) {
        setAvailablePorts(result.ports);
        // Set the first port as selected if none is selected
        if (selectedPort === '' && result.ports.length > 0) {
          setSelectedPort(result.ports[0].path);
        }
      } else if (result.error) {
        setError(result.error);
      }
    } catch (err) {
      setError((err as Error).message);
    }
  };
  
  const connect = async () => {
    try {
      setConnecting(true);
      setError(null);
      
      if (!selectedPort) {
        throw new Error('No port selected');
      }
      
      const connectOptions = {
        ...serialOptions,
        path: selectedPort
      };
      
      const result = await window.serialApi.connect(connectOptions);
      if (result.success) {
        setIsConnected(true);
      } else if (result.error) {
        throw new Error(result.error);
      }
    } catch (err) {
      setError((err as Error).message);
      setIsConnected(false);
    } finally {
      setConnecting(false);
    }
  };
  
  const disconnect = async () => {
    try {
      const result = await window.serialApi.disconnect();
      if (result.success) {
        setIsConnected(false);
        setActiveComputer(null);
      } else if (result.error) {
        throw new Error(result.error);
      }
    } catch (err) {
      setError((err as Error).message);
    }
  };
  
  const updateSerialOptions = (options: Partial<SerialPortOptions>) => {
    setSerialOptions(prev => ({ ...prev, ...options }));
  };
  
  const switchToComputer = async (pcNumber: number) => {
    try {
      if (!isConnected) {
        throw new Error('Not connected to serial port');
      }
      
      // Generate the command
      const computerCode = pcNumber <= 9 ? pcNumber.toString() : 'A';
      const command = `X${computerCode},1$`;
      
      const result = await window.serialApi.write(command);
      if (result.success) {
        setActiveComputer(pcNumber);
        setLastCommand(command);
      } else if (result.error) {
        throw new Error(result.error);
      }
    } catch (err) {
      setError((err as Error).message);
    }
  };
  
  // Load available ports on first mount
  useEffect(() => {
    refreshPorts();
  }, []);
  
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