
export interface KvmConfig {
  version: string;
  configurationActive: boolean;
  autoConnect: boolean;
  connection: {
    port: string;
    baudRate: number;
    dataBits: number;
    parity: 'none' | 'even' | 'odd' | 'mark' | 'space';
    stopBits: number;
  };
  computers: Array<{
    id: string;
    label: string;
    portNumber: number;
    fqdn?: string;
    macAddress?: string;
    commandPayload?: string; // Added command payload field
  }>;
  autoSwitch: {
    enabled: boolean;
    interval: number; // seconds
  };
}