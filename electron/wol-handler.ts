// electron/wol-handler.ts - completely revised
import { ipcMain } from 'electron';
import * as dgram from 'dgram';
import * as net from 'net';
import * as dns from 'dns';
import { promisify } from 'util';

// Promisify DNS lookup
const dnsLookup = promisify(dns.lookup);

/**
 * Creates a magic packet for Wake-on-LAN
 * @param macAddress MAC address of the target computer
 * @returns Buffer containing the magic packet
 */
function createMagicPacket(macAddress: string): Buffer {
  // Normalize MAC address format to remove colons or hyphens
  const mac = macAddress.replace(/[:-]/g, '').toLowerCase();
  
  if (!/^[0-9a-f]{12}$/i.test(mac)) {
    throw new Error('Invalid MAC address format');
  }
  
  // Create a buffer for the magic packet
  const buffer = Buffer.alloc(102);
  
  // Fill the first 6 bytes with 0xFF
  for (let i = 0; i < 6; i++) {
    buffer[i] = 0xFF;
  }
  
  // Convert the MAC address to a buffer and repeat it 16 times
  const macBuffer = Buffer.from(mac, 'hex');
  for (let i = 0; i < 16; i++) {
    macBuffer.copy(buffer, 6 + i * 6, 0, 6);
  }
  
  return buffer;
}

/**
 * Send a Wake-on-LAN magic packet
 * @param macAddress MAC address to wake up
 * @returns Promise resolving to true if successful
 */
async function sendWakeOnLan(macAddress: string): Promise<boolean> {
  const packet = createMagicPacket(macAddress);
  
  return new Promise<boolean>((resolve) => {
    // Create a new socket for each wake request
    const socket = dgram.createSocket({
      type: 'udp4',
      reuseAddr: true,
    });
    
    let done = false;
    
    // Handle errors
    socket.on('error', (err) => {
      console.error('Socket error:', err);
      if (!done) {
        done = true;
        try {
          socket.close();
        } catch (e) {
          console.error('Error closing socket:', e);
        }
        resolve(false);
      }
    });
    
    // Send on both common WoL ports: 7 and 9
    const sendToPort = (port: number) => {
      socket.send(packet, 0, packet.length, port, '255.255.255.255', (err) => {
        if (err) {
          console.error(`Error sending to port ${port}:`, err);
        }
      });
    };
    
    // Only set broadcast and bind once socket is ready
    socket.on('listening', () => {
      try {
        socket.setBroadcast(true);
        // Send to the two common WoL ports
        sendToPort(7);
        sendToPort(9);
        
        // Close the socket after a short delay
        setTimeout(() => {
          if (!done) {
            done = true;
            try {
              socket.close();
            } catch (e) {
              console.error('Error closing socket:', e);
            }
            resolve(true);
          }
        }, 100);
      } catch (err) {
        console.error('Error in listening handler:', err);
        if (!done) {
          done = true;
          try {
            socket.close();
          } catch (e) {
            console.error('Error closing socket:', e);
          }
          resolve(false);
        }
      }
    });
    
    // Bind to any available port
    try {
      socket.bind(0);
    } catch (err) {
      console.error('Error binding socket:', err);
      if (!done) {
        done = true;
        try {
          socket.close();
        } catch (e) {
          console.error('Error closing socket:', e);
        }
        resolve(false);
      }
    }
    
    // Set a timeout just in case
    setTimeout(() => {
      if (!done) {
        done = true;
        try {
          socket.close();
        } catch (e) {
          console.error('Error closing socket:', e);
        }
        resolve(false);
      }
    }, 1000);
  });
}

/**
 * Check if a host is online by attempting to connect to commonly open ports
 * @param hostname Hostname or IP address to check
 * @returns Promise resolving to true if the host is online
 */
async function isHostOnline(hostname: string): Promise<boolean> {
  if (!hostname) return false;
  
  try {
    // Try to resolve the hostname first (if it's not an IP)
    const { address } = await dnsLookup(hostname).catch(() => ({ address: hostname }));
    
    // Common ports to try: 22 (SSH), 3389 (RDP), 80 (HTTP), 445 (SMB)
    const ports = [3389, 22, 80, 445];
    
    // Try to connect to each port
    for (const port of ports) {
      const isOpen = await checkPort(address, port);
      if (isOpen) return true;
    }
    
    return false;
  } catch (error) {
    console.error('Error checking host status:', error);
    return false;
  }
}

/**
 * Check if a specific port is open on a host
 * @param host Hostname or IP address
 * @param port Port number to check
 * @returns Promise resolving to true if the port is open
 */
function checkPort(host: string, port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    let resolved = false;
    
    // Set a short timeout
    socket.setTimeout(500);
    
    socket.on('connect', () => {
      if (!resolved) {
        resolved = true;
        socket.destroy();
        resolve(true);
      }
    });
    
    socket.on('timeout', () => {
      if (!resolved) {
        resolved = true;
        socket.destroy();
        resolve(false);
      }
    });
    
    socket.on('error', () => {
      if (!resolved) {
        resolved = true;
        socket.destroy();
        resolve(false);
      }
    });
    
    socket.connect(port, host);
  });
}

/**
 * Register WoL handlers for IPC communication
 */
export function registerWolHandlers() {
  // Send Wake-on-LAN magic packet
  ipcMain.handle('wol:wake', async (_, macAddress: string) => {
    try {
      const success = await sendWakeOnLan(macAddress);
      return { success };
    } catch (error) {
      console.error('Error in wol:wake handler:', error);
      return { success: false, error: (error as Error).message };
    }
  });
  
  // Check if a computer is online
  ipcMain.handle('wol:check-status', async (_, hostname: string) => {
    try {
      const online = await isHostOnline(hostname);
      return { online };
    } catch (error) {
      console.error('Error in wol:check-status handler:', error);
      return { online: false, error: (error as Error).message };
    }
  });
}