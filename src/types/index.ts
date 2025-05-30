import { KvmConfig } from '../../shared/types';

export { KvmConfig }

export interface SerialPortOptions {
  path: string;
  baudRate: number;
  dataBits: number;
  parity: 'none' | 'even' | 'odd' | 'mark' | 'space';
  stopBits: number;
}

export interface SerialPort {
  path: string;
  manufacturer?: string;
  serialNumber?: string;
  pnpId?: string;
  locationId?: string;
  productId?: string;
  vendorId?: string;
}

// Define the api interface for TypeScript
export interface SerialApi {
  listPorts: () => Promise<{ success: boolean; ports?: SerialPort[]; error?: string }>;
  connect: (options: SerialPortOptions) => Promise<{ success: boolean; error?: string }>;
  write: (data: string) => Promise<{ success: boolean; error?: string }>;
  disconnect: () => Promise<{ success: boolean; error?: string }>;
  onReceiveData: (callback: (data: string) => void) => () => void;
  onError: (callback: (error: string) => void) => () => void;
  isAutoConnected: () => Promise<{ connected: boolean }>;
  onAutoConnect: (callback: (success: boolean) => void) => () => void;
}

export interface ConfigApi {
  getConfig: () => Promise<KvmConfig>;
  updateConfig: (config: Partial<KvmConfig>) => Promise<{ success: boolean; error?: string }>;
  addComputer: (computer: Omit<KvmConfig['computers'][0], 'id'>) => Promise<{ success: boolean; id?: string; error?: string }>;
  updateComputer: (id: string, computer: Partial<Omit<KvmConfig['computers'][0], 'id'>>) => Promise<{ success: boolean; error?: string }>;
  removeComputer: (id: string) => Promise<{ success: boolean; error?: string }>;
  reorderComputers: (orderedIds: string[]) => Promise<{ success: boolean; error?: string }>;
}

export interface WolApi {
  wake: (macAddress: string) => Promise<{ success: boolean; error?: string }>;
  checkStatus: (hostname: string) => Promise<{ online: boolean; error?: string }>;
}

// Extend Window interface
declare global {
  interface Window {
    serialApi: SerialApi;
    configApi: ConfigApi;
    wolApi: WolApi;
  }
}