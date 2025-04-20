import { contextBridge, ipcRenderer } from 'electron';

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('serialApi', {
  listPorts: () => ipcRenderer.invoke('serial:list-ports'),
  connect: (options: any) => ipcRenderer.invoke('serial:connect', options),
  write: (data: string) => ipcRenderer.invoke('serial:write', data),
  disconnect: () => ipcRenderer.invoke('serial:disconnect'),
  isAutoConnected: () => ipcRenderer.invoke('serial:is-connected'),
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
  },
  onAutoConnect: (callback: (success: boolean) => void) => {
    ipcRenderer.on('serial:auto-connected', (_, success) => callback(success));
    return () => {
      ipcRenderer.removeAllListeners('serial:auto-connected');
    };
  }
});

// Expose configuration API
contextBridge.exposeInMainWorld('configApi', {
  getConfig: () => ipcRenderer.invoke('config:get'),
  updateConfig: (config: any) => ipcRenderer.invoke('config:update', config),
  addComputer: (computer: any) => ipcRenderer.invoke('config:add-computer', computer),
  updateComputer: (id: string, computer: any) => ipcRenderer.invoke('config:update-computer', id, computer),
  removeComputer: (id: string) => ipcRenderer.invoke('config:remove-computer', id),
  reorderComputers: (orderedIds: string[]) => ipcRenderer.invoke('config:reorder-computers', orderedIds)
});