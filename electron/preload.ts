import { contextBridge, ipcRenderer } from 'electron';

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('serialApi', {
  listPorts: () => ipcRenderer.invoke('serial:list-ports'),
  connect: (options: any) => ipcRenderer.invoke('serial:connect', options),
  write: (data: string) => ipcRenderer.invoke('serial:write', data),
  disconnect: () => ipcRenderer.invoke('serial:disconnect'),
  onReceiveData: (callback: (data: string) => void) => {
    ipcRenderer.on('serial:data', (_, data) => callback(data));
    return () => {
      ipcRenderer.removeAllListeners('serial:data');
    };
  },
  onError: (callback: (error: string) => void) => {
    ipcRenderer.on('serial:error', (_, error) => callback(error));
    return () => {
      ipcRenderer.removeAllListeners('serial:error');
    };
  }
});