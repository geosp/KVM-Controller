import React, { useState, useEffect, useRef } from 'react';
import { useSerial } from '../contexts/SerialContext';
import { useConfig } from '../contexts/ConfigContext';
import { useWol } from '../contexts/WolContext';

const AutoSwitchPanel: React.FC = () => {
  const { isConnected, activeComputer, switchToComputer } = useSerial();
  const { config, updateConfig } = useConfig();
  const { computerStatus, checkAllComputerStatus } = useWol();
  
  // Component state
  const [autoSwitchEnabled, setAutoSwitchEnabled] = useState(false);
  const [autoSwitchInterval, setAutoSwitchInterval] = useState(30);
  const [timeRemaining, setTimeRemaining] = useState(30);
  
  // References to hold timer IDs for cleanup
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const statusCheckRef = useRef<NodeJS.Timeout | null>(null);
  
  // References to current values to avoid stale closures
  const enabledRef = useRef(autoSwitchEnabled);
  const intervalRef = useRef(autoSwitchInterval);
  const activeComputerRef = useRef(activeComputer);
  
  // Update refs when values change
  useEffect(() => {
    enabledRef.current = autoSwitchEnabled;
    intervalRef.current = autoSwitchInterval;
    activeComputerRef.current = activeComputer;
  }, [autoSwitchEnabled, autoSwitchInterval, activeComputer]);
  
  // Initialize from config
  useEffect(() => {
    if (config?.autoSwitch) {
      setAutoSwitchInterval(config.autoSwitch.interval);
      setTimeRemaining(config.autoSwitch.interval);
    }
  }, [config]);
  
  // Handle toggle
  const handleToggleAutoSwitch = () => {
    const newState = !autoSwitchEnabled;
    setAutoSwitchEnabled(newState);
    setTimeRemaining(autoSwitchInterval);
    
    if (newState) {
      checkAllComputerStatus();
    }
  };
  
  // Manage countdown timer and switching
  useEffect(() => {
    // Clean up any existing timers
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    
    // Disable auto-switch if disconnected
    if (!isConnected) {
      if (autoSwitchEnabled) {
        setAutoSwitchEnabled(false);
      }
      return;
    }
    
    // No action if not enabled
    if (!autoSwitchEnabled) {
      return;
    }
    
    // Check status just once when enabling
    checkAllComputerStatus();
    
    // Countdown timer
    timerRef.current = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          // Time to switch - find next computer
          if (config && config.computers.length >= 2) {
            // Simple approach: always use all computers
            const computers = [...config.computers].sort((a, b) => a.portNumber - b.portNumber);
            
            if (computers.length === 0) return autoSwitchInterval;
            
            // Find current computer index
            const currentIndex = computers.findIndex(c => c.portNumber === activeComputerRef.current);
            
            // Get next index with wraparound
            const nextIndex = (currentIndex === -1 || currentIndex === computers.length - 1) 
              ? 0 
              : currentIndex + 1;
            
            // Switch to next computer
            const nextComputer = computers[nextIndex].portNumber;
            switchToComputer(nextComputer);
          }
          return autoSwitchInterval; // Reset timer
        }
        return prev - 1; // Decrement
      });
    }, 1000);
    
    // Cleanup
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [
    autoSwitchEnabled, 
    isConnected, 
    config, 
    switchToComputer,
    checkAllComputerStatus,
    autoSwitchInterval
  ]);
  
  // Format time display
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  
  // Check if we can enable auto-switch
  const canEnableAutoSwitch = isConnected && 
    config && 
    config.computers.length >= 2;
  
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
            disabled={!canEnableAutoSwitch}
          />
          <div className={`
            w-11 h-6 rounded-full peer 
            peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 
            dark:peer-focus:ring-blue-800 peer-checked:after:translate-x-full 
            peer-checked:after:border-white after:content-[''] after:absolute 
            after:top-[2px] after:left-[2px] after:bg-gray-200 after:border-gray-500 
            after:border after:rounded-full after:h-5 after:w-5 after:transition-all
            ${autoSwitchEnabled ? 'bg-blue-600' : 'bg-gray-600'}
            ${!canEnableAutoSwitch ? 'opacity-50 cursor-not-allowed' : ''}
          `}></div>
        </label>
      </div>
      
      {!canEnableAutoSwitch && (
        <div className="text-yellow-500 text-sm mb-4">
          {!isConnected 
            ? "Connect to KVM switch to enable auto-switching" 
            : "Configure at least 2 computers to enable auto-switching"}
        </div>
      )}
      
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