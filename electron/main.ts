import { app, BrowserWindow, ipcMain } from 'electron';
import * as path from 'path';
import { SerialPort } from 'serialport';

let mainWindow: BrowserWindow | null = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    },
    backgroundColor: '#111827' // dark background to match the theme
  });

  // In development, load from localhost, in production load from file
  mainWindow.loadFile(path.join(__dirname, '../index.html'));
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
    if (port) {
      await new Promise<void>((resolve) => {
        port?.close(() => resolve());
      });
    }
    
    port = new SerialPort({
      path: options.path,
      baudRate: options.baudRate,
      dataBits: options.dataBits,
      parity: options.parity,
      stopBits: options.stopBits
    });
    
    port.on('error', (err) => {
      mainWindow?.webContents.send('serial:error', err.message);
    });
    
    port.on('data', (data) => {
      mainWindow?.webContents.send('serial:data', data.toString());
    });
    
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

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Clean up on quit
app.on('quit', () => {
  if (port) {
    port.close();
  }
});