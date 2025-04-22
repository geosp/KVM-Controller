import { app, BrowserWindow, Menu, ipcMain } from 'electron';
import * as path from 'path';
import { SerialPort } from 'serialport';
import config, { getDevServerUrl } from './config';
import { registerConfigHandlers } from './config-handlers';
import { registerWolHandlers } from './wol-handler'; 
import { ConfigManager } from './configManager';

let mainWindow: BrowserWindow | null = null;

if (process.platform === 'linux' && process.env.NODE_ENV != 'development') {
  app.commandLine.appendSwitch('no-sandbox');
}

function createWindow() {
  mainWindow = new BrowserWindow({
    frame: true,
    fullscreenable: false,
    simpleFullscreen: false,
    minimizable: true,
    maximizable: true,
    resizable: true,
    titleBarStyle: 'customButtonsOnHover',
    autoHideMenuBar: true,
    width: config.window.width,
    height: config.window.height,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    },
    backgroundColor: config.window.backgroundColor
  });

  // In development, load from localhost, in production load from file
  console.log('▶ NODE_ENV is:', process.env.NODE_ENV);
  if (process.env.NODE_ENV === 'development') {
    // Load from webpack dev server in development using config
    mainWindow.loadURL(getDevServerUrl());
    // Open DevTools automatically in development
    mainWindow.webContents.openDevTools();
  } else {
    // Load from file in production
    mainWindow.loadFile(path.join(__dirname, '../index.html'));
  }
}

// Handle serial port listing
ipcMain.handle('serial:list-ports', async () => {
  try {
    const ports = await SerialPort.list();
    return { success: true, ports };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
});

// Open a serial port
let port: SerialPort | null = null;

ipcMain.handle('serial:connect', async (_, options) => {
  try {
    await connectToPort(options);
    return { success: true };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
});

// Write data to serial port
ipcMain.handle('serial:write', async (_, data) => {
  try {
    if (!port) {
      throw new Error('Serial port not connected');
    }
    
    await new Promise<void>((resolve, reject) => {
      port?.write(data, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
    
    return { success: true };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
});

ipcMain.handle('serial:is-connected', () => {
  return { connected: port !== null && port.isOpen };
});

// Disconnect serial port
ipcMain.handle('serial:disconnect', async () => {
  try {
    if (port) {
      await new Promise<void>((resolve) => {
        port?.close(() => resolve());
      });
      port = null;
    }
    return { success: true };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
});

ipcMain.handle('serial:is-auto-connected', () => {
  return { connected: port !== null };
});

function setupAutoConnect() {
  // Get the config
  const configManager = new ConfigManager();
  const config = configManager.getConfig();
  
  // If auto-connect is enabled and we have a port configured
  if (config.autoConnect && config.connection.port) {
    console.log('Auto-connect enabled, attempting to connect to', config.connection.port);
    
    // Use a small delay to ensure the renderer process is ready
    setTimeout(() => {
      if (mainWindow) {
        // Connect using the saved connection options
        const options = {
          path: config.connection.port,
          baudRate: config.connection.baudRate,
          dataBits: config.connection.dataBits,
          parity: config.connection.parity,
          stopBits: config.connection.stopBits
        };
        
        try {
          connectToPort(options)
            .then(() => {
              console.log('Auto-connect successful');
              mainWindow?.webContents.send('serial:auto-connected', true);
            })
            .catch(err => {
              console.error('Auto-connect failed:', err);
              mainWindow?.webContents.send('serial:auto-connected', false);
            });
        } catch (error) {
          console.error('Auto-connect error:', error);
          mainWindow?.webContents.send('serial:auto-connected', false);
        }
      }
    }, 1000);
  }
}

async function connectToPort(options: any) {
  if (port) {
    await new Promise<void>((resolve) => {
      port?.close(() => resolve());
    });
  }
  
  console.log('Connecting to port with options:', options);
  
  port = new SerialPort({
    path: options.path,
    baudRate: options.baudRate,
    dataBits: options.dataBits,
    parity: options.parity,
    stopBits: options.stopBits
  });
  
  port.on('error', (err) => {
    console.error('Serial port error:', err.message);
    mainWindow?.webContents.send('serial:error', err.message);
  });
  
  port.on('data', (data) => {
    mainWindow?.webContents.send('serial:data', data.toString());
  });
  
  return { success: true };
}


app.whenReady().then(() => {

  registerConfigHandlers();
  registerWolHandlers();
  
  createWindow();

  setupAutoConnect();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  // Close serial port before quitting
  if (port) {
    try {
      port.close();
      port = null;
    } catch (e) {
      console.error('Error closing port:', e);
    }
  }
  
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('quit', () => {
  if (port) {
    try {
      port.close();
      port = null;
    } catch (e) {
      console.error('Error closing port:', e);
    }
  }
});