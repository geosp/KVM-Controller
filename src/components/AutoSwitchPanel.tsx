import React, { useState, useEffect } from 'react';
import { useSerial } from '../contexts/SerialContext';
import { useConfig } from '../contexts/ConfigContext';
import { useWol } from '../contexts/WolContext';

const AutoSwitchPanel: React.FC = () => {
  const { isConnected, activeComputer, switchToComputer } = useSerial();
  const { config } = useConfig();
  const { computerStatus, checkAllComputerStatus } = useWol();
  
  const [autoSwitchEnabled, setAutoSwitchEnabled] = useState(false);
  const [autoSwitchInterval, setAutoSwitchInterval] = useState(30); // seconds
  const [timeRemaining, setTimeRemaining] = useState(autoSwitchInterval);
  
  // Initialize states from config when loaded
  useEffect(() => {
    if (config && config.autoSwitch) {
      setAutoSwitchInterval(config.autoSwitch.interval);
      // Don't auto-enable switching, just sync the interval
    }
  }, [config]);
  
  // Check computer statuses when auto-switch is enabled
  useEffect(() => {
    if (autoSwitchEnabled) {
      // Check statuses immediately when enabled
      checkAllComputerStatus();
      
      // Set up periodic checking when auto-switch is on
      const statusInterval = setInterval(() => {
        checkAllComputerStatus();
      }, 15000); // Check every 15 seconds
      
      return () => clearInterval(statusInterval);
    }
  }, [autoSwitchEnabled, checkAllComputerStatus]);
  
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    
    if (autoSwitchEnabled && isConnected) {
      interval = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            // Time to switch to next computer
            if (config && config.computers.length >= 2) {
              // Get list of configured computers sorted by port number
              // Filter for computers that are online (or have unknown status if no fqdn is set)
              const configuredComputers = [...config.computers]
                .filter(computer => {
                  // If computer has no fqdn set, we can't check its status
                  if (!computer.fqdn || !computer.macAddress) return true;
                  
                  // If we know computer is online, include it
                  return computerStatus[computer.id] === true;
                })
                .sort((a, b) => a.portNumber - b.portNumber);
              
              if (configuredComputers.length === 0) {
                console.log('No online computers available for auto-switching');
                return autoSwitchInterval;
              }
              
              // Find the index of current active computer
              const currentIndex = configuredComputers.findIndex(
                c => c.portNumber === activeComputer
              );
              
              // Calculate next index (with wrapping)
              const nextIndex = currentIndex === -1 || currentIndex === configuredComputers.length - 1
                ? 0  // Wrap back to first computer
                : currentIndex + 1;
              
              // Get the next computer and switch to it
              const nextComputer = configuredComputers[nextIndex].portNumber;
              
              console.log(`Auto-switching to computer ${nextComputer} (index ${nextIndex})`);
              
              switchToComputer(nextComputer);
            }
            return autoSwitchInterval;
          }
          return prev - 1;
        });
      }, 1000);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [autoSwitchEnabled, isConnected, autoSwitchInterval, activeComputer, switchToComputer, config]);
  
  // Disable auto switch when disconnected
  useEffect(() => {
    if (!isConnected && autoSwitchEnabled) {
      setAutoSwitchEnabled(false);
    }
  }, [isConnected, autoSwitchEnabled]);
  
  // Reset timer when interval changes
  useEffect(() => {
    setTimeRemaining(autoSwitchInterval);
  }, [autoSwitchInterval]);
  
  // Update config when auto switch settings change
  useEffect(() => {
    if (config) {
      // Update config only if values have changed and we're connected
      if (config.autoSwitch.interval !== autoSwitchInterval && isConnected) {
        // In a real implementation, we would call:
        // updateConfig({ autoSwitch: { ...config.autoSwitch, interval: autoSwitchInterval, enabled: autoSwitchEnabled } });
        // But we're not implementing that here to keep the change focused
      }
    }
  }, [autoSwitchInterval, autoSwitchEnabled, isConnected, config]);
  
  // Check if we have at least one online computer
  const hasOnlineComputers = (): boolean => {
    if (!config || config.computers.length < 2) return false;
    
    // Count online computers
    const onlineCount = config.computers.filter(computer => {
      // If no fqdn or mac, we can't check its status, so count it in
      if (!computer.fqdn || !computer.macAddress) return true;
      // Otherwise check if it's online
      return computerStatus[computer.id] === true;
    }).length;
    
    return onlineCount >= 2; // Need at least 2 for switching
  };
  
  const handleToggleAutoSwitch = () => {
    const newState = !autoSwitchEnabled;
    setAutoSwitchEnabled(newState);
    setTimeRemaining(autoSwitchInterval);
    
    // If enabling, check all computer statuses
    if (newState) {
      checkAllComputerStatus();
    }
  };
  
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  
  return (
    <div className="bg-gray-800 rounded-lg shadow-md p-6 mb-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-gray-100">Auto Switch</h2>
        <label className="relative inline-flex items-center cursor-pointer">
          <input 
            type="checkbox" 
            className="sr-only peer"
            checked={autoSwitchEnabled}
            onChange={handleToggleAutoSwitch}
            disabled={!isConnected || !config || config.computers.length < 2 || !hasOnlineComputers()}
          />
          <div className={`
            w-11 h-6 rounded-full peer 
            peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 
            dark:peer-focus:ring-blue-800 peer-checked:after:translate-x-full 
            peer-checked:after:border-white after:content-[''] after:absolute 
            after:top-[2px] after:left-[2px] after:bg-gray-200 after:border-gray-500 
            after:border after:rounded-full after:h-5 after:w-5 after:transition-all
            ${autoSwitchEnabled ? 'bg-blue-600' : 'bg-gray-600'}
            ${!isConnected || !config || config.computers.length < 2 || !hasOnlineComputers() ? 'opacity-50 cursor-not-allowed' : ''}
          `}></div>
        </label>
      </div>
      
      {autoSwitchEnabled && (
        <div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Auto Switch Interval (seconds)
            </label>
            <input 
              type="range" 
              min="5" 
              max="300" 
              value={autoSwitchInterval}
              onChange={(e) => setAutoSwitchInterval(parseInt(e.target.value))}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-gray-500">
              <span>5s</span>
              <span>{autoSwitchInterval}s</span>
              <span>5m</span>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-300">Next switch in:</span>
            <span className="font-mono text-lg font-semibold">{formatTime(timeRemaining)}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default AutoSwitchPanel;