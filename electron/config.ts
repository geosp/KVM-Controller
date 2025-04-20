// electron/config.ts
import 'dotenv/config';
import * as fs from 'fs';
import * as path from 'path';
import { app } from 'electron';

// Configuration for the application
export interface Config {
  // Development server settings
  devServer: {
    port: number;
    host: string;
  };
  // Application window settings
  window: {
    width: number;
    height: number;
    backgroundColor: string;
  };
  // Serial port settings
  serial: {
    portPath: string;
    baudRate: number;
    dataBits: number;
    parity: 'none' | 'even' | 'odd' | 'mark' | 'space';
    stopBits: number;
    autoConnect: boolean;
  };
  // Computer configurations
  computers: ComputerConfig[];
}

// Configuration for each computer
export interface ComputerConfig {
  id: number;
  name: string;
  macAddress: string;
  ipAddress: string;
  enabled: boolean;
}

// Default configuration
const defaultConfig: Config = {
  devServer: {
    port: parseInt(process.env.DEV_SERVER_PORT || '3000', 10),
    host: process.env.DEV_SERVER_HOST || 'localhost',
  },
  window: {
    width: 800,
    height: 800,
    backgroundColor: '#111827',
  },
  serial: {
    portPath: '',
    baudRate: 9600,
    dataBits: 8,
    parity: 'none',
    stopBits: 1,
    autoConnect: false,
  },
  computers: Array.from({ length: 10 }, (_, i) => ({
    id: i + 1,
    name: `PC ${i + 1}`,
    macAddress: '',
    ipAddress: '',
    enabled: true,
  })),
};

// Get user data directory for the app
const getUserDataPath = () => {
  if (process.env.NODE_ENV === 'development') {
    return path.join(__dirname, '../config');
  }
  return app.getPath('userData');
};

// Configuration file path
const getConfigFilePath = () => {
  return path.join(getUserDataPath(), 'config.json');
};

// Load configuration from file
export const loadConfig = (): Config => {
  try {
    // Create config directory if it doesn't exist
    const userDataPath = getUserDataPath();
    if (!fs.existsSync(userDataPath)) {
      fs.mkdirSync(userDataPath, { recursive: true });
    }
    
    const configPath = getConfigFilePath();
    if (!fs.existsSync(configPath)) {
      // If config file doesn't exist, create it with default values
      saveConfig(defaultConfig);
      return defaultConfig;
    }
    
    const configData = fs.readFileSync(configPath, 'utf8');
    const loadedConfig = JSON.parse(configData);
    
    // Merge with default config to ensure any new fields are present
    return mergeWithDefaultConfig(loadedConfig);
  } catch (error) {
    console.error('Error loading config:', error);
    return defaultConfig;
  }
};

// Merge loaded config with default to ensure all fields exist
const mergeWithDefaultConfig = (loadedConfig: Partial<Config>): Config => {
  const mergedConfig = { ...defaultConfig };
  
  // Merge top-level properties
  if (loadedConfig.devServer) {
    mergedConfig.devServer = { ...defaultConfig.devServer, ...loadedConfig.devServer };
  }
  
  if (loadedConfig.window) {
    mergedConfig.window = { ...defaultConfig.window, ...loadedConfig.window };
  }
  
  if (loadedConfig.serial) {
    mergedConfig.serial = { ...defaultConfig.serial, ...loadedConfig.serial };
  }
  
  // Merge computers array, preserving existing computer configs
  if (loadedConfig.computers && Array.isArray(loadedConfig.computers)) {
    // Create a map of default computers
    const defaultComputers = new Map(
      defaultConfig.computers.map(computer => [computer.id, computer])
    );
    
    // Merge loaded computers with defaults
    loadedConfig.computers.forEach(computer => {
      if (computer && computer.id && defaultComputers.has(computer.id)) {
        const defaultComputer = defaultComputers.get(computer.id)!;
        defaultComputers.set(computer.id, { ...defaultComputer, ...computer });
      }
    });
    
    // Convert back to array and sort by id
    mergedConfig.computers = Array.from(defaultComputers.values())
      .sort((a, b) => a.id - b.id);
  }
  
  return mergedConfig;
};

// Save configuration to file
export const saveConfig = (config: Config): void => {
  try {
    const userDataPath = getUserDataPath();
    if (!fs.existsSync(userDataPath)) {
      fs.mkdirSync(userDataPath, { recursive: true });
    }
    
    const configPath = getConfigFilePath();
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf8');
  } catch (error) {
    console.error('Error saving config:', error);
  }
};

// Update specific section of the configuration
export const updateConfig = (updates: Partial<Config>): Config => {
  const currentConfig = loadConfig();
  const updatedConfig = { ...currentConfig };
  
  // Update top-level properties
  if (updates.devServer) {
    updatedConfig.devServer = { ...currentConfig.devServer, ...updates.devServer };
  }
  
  if (updates.window) {
    updatedConfig.window = { ...currentConfig.window, ...updates.window };
  }
  
  if (updates.serial) {
    updatedConfig.serial = { ...currentConfig.serial, ...updates.serial };
  }
  
  // Update computers if provided
  if (updates.computers) {
    // Create a map of current computers
    const computerMap = new Map(
      currentConfig.computers.map(computer => [computer.id, computer])
    );
    
    // Update with provided computers
    updates.computers.forEach(computer => {
      if (computer && computer.id && computerMap.has(computer.id)) {
        computerMap.set(computer.id, {
          ...computerMap.get(computer.id)!,
          ...computer,
        });
      }
    });
    
    // Convert back to array and sort by id
    updatedConfig.computers = Array.from(computerMap.values())
      .sort((a, b) => a.id - b.id);
  }
  
  // Save updated config to file
  saveConfig(updatedConfig);
  return updatedConfig;
};

// Helper function to get full dev server URL
export const getDevServerUrl = (): string => {
  const config = loadConfig();
  return `http://${config.devServer.host}:${config.devServer.port}`;
};

// Export default configuration (for type checking)
export default loadConfig();