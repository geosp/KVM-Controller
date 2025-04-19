import 'dotenv/config';

// Configuration for the application
interface Config {
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
  // Add other configuration categories as needed
}

// Default configuration
const config: Config = {
  devServer: {
    port: parseInt(process.env.DEV_SERVER_PORT || '3000', 10),
    host: process.env.DEV_SERVER_HOST || 'localhost',
  },
  window: {
    width: 800,
    height: 800,
    backgroundColor: '#111827',
  },
};

// Helper function to get full dev server URL
export const getDevServerUrl = (): string => {
  return `http://${config.devServer.host}:${config.devServer.port}`;
};

export default config;