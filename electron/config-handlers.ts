// electron/config-handlers.ts
import { ipcMain } from 'electron';
import { KvmConfig } from '../shared/types';
import { ConfigManager } from './configManager';

// Create a singleton instance of the config manager
const configManager = new ConfigManager();

// Register all the IPC handlers for configuration
export function registerConfigHandlers() {
  // Get the entire configuration
  ipcMain.handle('config:get', () => {
    return configManager.getConfig();
  });

  // Update the configuration
  ipcMain.handle('config:update', (_, config: Partial<KvmConfig>) => {
    try {
      configManager.updateConfig(config);
      return { success: true };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });

  // Add a computer
  ipcMain.handle('config:add-computer', (_, computer) => {
    try {
      const id = configManager.addComputer(computer);
      return { success: true, id };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });

  // Update a computer
  ipcMain.handle('config:update-computer', (_, id, computer) => {
    try {
      const success = configManager.updateComputer(id, computer);
      return { success };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });

  // Remove a computer
  ipcMain.handle('config:remove-computer', (_, id) => {
    try {
      const success = configManager.removeComputer(id);
      return { success };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });

  // Reorder computers
  ipcMain.handle('config:reorder-computers', (_, orderedIds) => {
    try {
      const success = configManager.reorderComputers(orderedIds);
      return { success };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });
}