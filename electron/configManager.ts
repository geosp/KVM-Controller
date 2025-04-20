import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { KvmConfig } from '../shared/types';
import { generateDefaultCommandPayload } from '../shared/utils';

// Default configuration
const defaultConfig: KvmConfig = {
  version: '1.0',
  configurationActive: false,
  autoConnect: false,
  connection: {
    port: '',
    baudRate: 9600,
    dataBits: 8,
    parity: 'none',
    stopBits: 1
  },
  computers: [],
  autoSwitch: {
    enabled: false,
    interval: 30
  }
};

export class ConfigManager {
  private configPath: string;
  private config: KvmConfig;

  constructor() {
    this.configPath = this.getConfigPath();
    this.config = this.loadConfig();
  }

  // Get the appropriate config directory based on platform
  private getConfigPath(): string {
    let configDir: string;
    
    // Determine platform-specific config directory
    switch (os.platform()) {
      case 'win32':
        configDir = path.join(process.env.APPDATA || '', 'kvm-control');
        break;
      case 'darwin':
        configDir = path.join(os.homedir(), 'Library', 'Application Support', 'kvm-control');
        break;
      default: // Linux and others
        configDir = path.join(os.homedir(), '.config', 'kvm-control');
    }
    
    // Create directory if it doesn't exist
    if (!fs.existsSync(configDir)) {
      fs.mkdirSync(configDir, { recursive: true });
    }
    
    return path.join(configDir, 'config.json');
  }

  // Load config from disk, or create default if none exists
  private loadConfig(): KvmConfig {
    try {
      if (fs.existsSync(this.configPath)) {
        const rawData = fs.readFileSync(this.configPath, 'utf8');
        const parsedConfig = JSON.parse(rawData);
        
        // Basic validation
        if (!this.validateConfig(parsedConfig)) {
          console.warn('Invalid configuration file, using defaults');
          return { ...defaultConfig };
        }
        
        return parsedConfig;
      } else {
        // No config file exists, return default
        return { ...defaultConfig };
      }
    } catch (error) {
      console.error('Error loading configuration:', error);
      return { ...defaultConfig };
    }
  }

  // Basic config validation
  private validateConfig(config: any): boolean {
    // Check for required top-level properties
    if (!config.version || 
        typeof config.configurationActive !== 'boolean' ||
        !config.connection ||
        !Array.isArray(config.computers)) {
      return false;
    }
    
    // Minimum of 2 computers required for active configuration
    if (config.configurationActive && config.computers.length < 2) {
      config.configurationActive = false;
    }
    
    return true;
  }

  // Save config to disk
  public saveConfig(): void {
    try {
      // Validate before saving
      if (!this.validateConfig(this.config)) {
        throw new Error('Invalid configuration');
      }
      
      fs.writeFileSync(this.configPath, JSON.stringify(this.config, null, 2), 'utf8');
      console.log('Configuration saved successfully');
    } catch (error) {
      console.error('Error saving configuration:', error);
      throw error;
    }
  }

  // Get the current config
  public getConfig(): KvmConfig {
    return { ...this.config };
  }

  // Update the config
  public updateConfig(newConfig: Partial<KvmConfig>): void {
    this.config = { ...this.config, ...newConfig };
    
    // If configuration is being marked as active, ensure we have at least 2 computers
    if (newConfig.configurationActive && this.config.computers.length < 2) {
      this.config.configurationActive = false;
      console.warn('Cannot activate configuration with fewer than 2 computers');
    }
    
    this.saveConfig();
  }

  // Add a computer
  public addComputer(computer: Omit<KvmConfig['computers'][0], 'id'>): string {
    const id = Date.now().toString();
    
    // Add default commandPayload if not provided
    if (!computer.commandPayload) {
      computer.commandPayload = generateDefaultCommandPayload(computer.portNumber);
    }
    
    this.config.computers.push({
      id,
      ...computer
    });
    this.saveConfig();
    return id;
  }

  // Update a computer
  public updateComputer(id: string, computer: Partial<Omit<KvmConfig['computers'][0], 'id'>>): boolean {
    const index = this.config.computers.findIndex(c => c.id === id);
    if (index !== -1) {
      // If portNumber is updated but commandPayload isn't, update the default commandPayload
      if (computer.portNumber && !computer.commandPayload) {
        computer.commandPayload = generateDefaultCommandPayload(computer.portNumber);
      }
      
      this.config.computers[index] = {
        ...this.config.computers[index],
        ...computer
      };
      this.saveConfig();
      return true;
    }
    return false;
  }

  // Remove a computer
  public removeComputer(id: string): boolean {
    const initialLength = this.config.computers.length;
    this.config.computers = this.config.computers.filter(c => c.id !== id);
    
    // If we removed a computer and now have fewer than 2, deactivate config
    if (this.config.computers.length < 2 && this.config.configurationActive) {
      this.config.configurationActive = false;
    }
    
    this.saveConfig();
    return initialLength !== this.config.computers.length;
  }

  // Reorder computers
  public reorderComputers(orderedIds: string[]): boolean {
    // Ensure all IDs exist
    if (!orderedIds.every(id => this.config.computers.some(c => c.id === id))) {
      return false;
    }
    
    // Create a new ordered array
    const orderedComputers = orderedIds.map(id => 
      this.config.computers.find(c => c.id === id)!
    );
    
    // Assign and save
    this.config.computers = orderedComputers;
    this.saveConfig();
    return true;
  }
}