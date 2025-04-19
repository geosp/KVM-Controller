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
}

// Extend Window interface
declare global {
  interface Window {
    serialApi: SerialApi;
  }
}