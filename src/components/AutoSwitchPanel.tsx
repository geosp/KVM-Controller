import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useSerial } from '../contexts/SerialContext';
import { useConfig } from '../contexts/ConfigContext';
import { useWol } from '../contexts/WolContext';

const AutoSwitchPanel: React.FC = () => {
  const { isConnected, activeComputer, switchToComputer } = useSerial();
  const { config, updateConfig } = useConfig();
  const { computerStatus, checkAllComputerStatus } = useWol();
  
  const [autoSwitchEnabled, setAutoSwitchEnabled] = useState(false);
  const [autoSwitchInterval, setAutoSwitchInterval] = useState(30); // seconds
  const [timeRemaining, setTimeRemaining] = useState(autoSwitchInterval);
  
  // Use refs to avoid recreating interval functions
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const statusCheckRef = useRef<NodeJS.Timeout | null>(null);
  
  // Store mutable values in refs to avoid dependency issues in effects
  const enabledRef = useRef(autoSwitchEnabled);
  const intervalRef = useRef(autoSwitchInterval);
  const activeRef = useRef(activeComputer);
  
  // Update refs when state changes
  useEffect(() => {
    enabledRef.current = autoSwitchEnabled;
    intervalRef.current = autoSwitchInterval;
    activeRef.current = activeComputer;
  }, [autoSwitchEnabled, autoSwitchInterval, activeComputer]);
  
  // Initialize states from config when loaded (only once)
  useEffect(() => {
    if (config?.autoSwitch) {
      setAutoSwitchInterval(config.autoSwitch.interval);
    }
  }, [config]);
  
  // Memoize online computer check
  const onlineComputers = React.useMemo(() => {
    if (!config?.computers || config.computers.length === 0) return [];
    
    return config.computers
      .filter(computer => {
        // Include computers without FQDN/MAC or those that are online
        return (!computer.fqdn || !computer.macAddress) || computerStatus[computer.id] === true;
      })
      .sort((a, b) => a.portNumber - b.portNumber);
  }, [config, computerStatus]);
  
  // Optimized function to find next computer
  const findNextComputer = useCallback(() => {
    if (!onlineComputers.length) return null;
    
    const currentIndex = onlineComputers.findIndex(c => c.portNumber === activeRef.current);
    const nextIndex = currentIndex === -1 || currentIndex === onlineComputers.length - 1 ? 0 : currentIndex + 1;
    
    return onlineComputers[nextIndex]?.portNumber || null;
  }, [onlineComputers]);
  
  // Combined interval effect that handles both timers
  useEffect(() => {
    // Clear any existing intervals
    if (timerRef.current) clearInterval(timerRef.current);
    if (statusCheckRef.current) clearInterval(statusCheckRef.current);
    
    if (!isConnected) {
      if (autoSwitchEnabled) setAutoSwitchEnabled(false);
      return;
    }
    
    if (autoSwitchEnabled) {
      // Check statuses immediately
      checkAllComputerStatus();
      
      // Status check interval (less frequent)
      statusCheckRef.current = setInterval(() => {
        if (enabledRef.current && isConnected) {
          checkAllComputerStatus();
        }
      }, 15000);
      
      // Countdown timer (more frequent)
      timerRef.current = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            // Time to switch
            const nextComputer = findNextComputer();
            if (nextComputer !== null) {
              switchToComputer(nextComputer);
            }
            return intervalRef.current; // Reset timer
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      // Reset timer when disabled
      setTimeRemaining(autoSwitchInterval);
    }
    
    // Cleanup function
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (statusCheckRef.current) clearInterval(statusCheckRef.current);
    };
  }, [autoSwitchEnabled, isConnected, findNextComputer, switchToComputer, checkAllComputerStatus]);
  
  // Reset timer when interval changes
  useEffect(() => {
    setTimeRemaining(autoSwitchInterval);
  }, [autoSwitchInterval]);
  
  // Update config when auto switch settings change (debounced)
  useEffect(() => {
    if (!config || !isConnected) return;
    
    const shouldUpdate = 
      config.autoSwitch.interval !== autoSwitchInterval ||
      config.autoSwitch.enabled !== autoSwitchEnabled;
    
    if (shouldUpdate) {
      const timer = setTimeout(() => {
        updateConfig({
          autoSwitch: {
            interval: autoSwitchInterval,
            enabled: autoSwitchEnabled
          }
        });
      }, 500); // Debounce config updates
      
      return () => clearTimeout(timer);
    }
  }, [autoSwitchInterval, autoSwitchEnabled, isConnected, config, updateConfig]);
  
  const handleToggleAutoSwitch = () => {
    const newState = !autoSwitchEnabled;
    setAutoSwitchEnabled(newState);
    setTimeRemaining(autoSwitchInterval);
    
    if (newState) {
      checkAllComputerStatus();
    }
  };
  
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  
  // Determine if there are enough online computers for switching
  const hasEnoughComputers = onlineComputers.length >= 2;
  
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
            disabled={!isConnected || !hasEnoughComputers}
          />
          <div className={`
            w-11 h-6 rounded-full peer 
            peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 
            dark:peer-focus:ring-blue-800 peer-checked:after:translate-x-full 
            peer-checked:after:border-white after:content-[''] after:absolute 
            after:top-[2px] after:left-[2px] after:bg-gray-200 after:border-gray-500 
            after:border after:rounded-full after:h-5 after:w-5 after:transition-all
            ${autoSwitchEnabled ? 'bg-blue-600' : 'bg-gray-600'}
            ${!isConnected || !hasEnoughComputers ? 'opacity-50 cursor-not-allowed' : ''}
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