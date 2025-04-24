import React, { useState, useEffect } from 'react';
import { useSerial } from '../contexts/SerialContext';
import { useConfig } from '../contexts/ConfigContext';
import { useWol } from '../contexts/WolContext';

/**
 * An optimized auto-switch panel that only checks computer status
 * at the moment of switching, not continuously
 */
const AutoSwitchPanel: React.FC = () => {
  const { isConnected, activeComputer, switchToComputer } = useSerial();
  const { config } = useConfig();
  const { checkAllComputerStatus, computerStatus, refreshComputerStatus } = useWol();
  
  // Core state
  const [autoSwitchEnabled, setAutoSwitchEnabled] = useState(false);
  const [autoSwitchInterval, setAutoSwitchInterval] = useState(30); // seconds
  const [timeRemaining, setTimeRemaining] = useState(30);
  
  // Single timer reference
  const timerIdRef = React.useRef<number | null>(null);
  
  // Initialize from config
  useEffect(() => {
    if (config?.autoSwitch) {
      setAutoSwitchInterval(config.autoSwitch.interval);
      setTimeRemaining(config.autoSwitch.interval);
    }
  }, [config]);
  
  // Handle connection status changes
  useEffect(() => {
    if (!isConnected && autoSwitchEnabled) {
      // Disable auto-switching when disconnected
      setAutoSwitchEnabled(false);
    }
  }, [isConnected, autoSwitchEnabled]);
  
  // Find and switch to the next computer - with just-in-time status check
  const switchToNextComputer = async () => {
    if (!config || !isConnected) return;
    
    // Check computer status at the moment of switching
    await checkAllComputerStatus();
    
    // Get available computers based on the fresh status
    const availableComputers = [...config.computers]
      .filter(computer => {
        // If no FQDN/MAC, include it (can't check status)
        if (!computer.fqdn || !computer.macAddress) return true;
        
        // Otherwise, include only if it's online
        return computerStatus[computer.id] === true;
      })
      .sort((a, b) => a.portNumber - b.portNumber);
    
    if (availableComputers.length < 2) {
      console.log('Not enough available computers for switching');
      return;
    }
    
    // Find current computer in the available list
    const currentIndex = availableComputers.findIndex(c => c.portNumber === activeComputer);
    
    // Get next index with wraparound
    const nextIndex = (currentIndex === -1 || currentIndex === availableComputers.length - 1) 
      ? 0 : currentIndex + 1;
    
    // Switch to next computer
    if (nextIndex >= 0 && nextIndex < availableComputers.length) {
      const nextComputer = availableComputers[nextIndex].portNumber;
      switchToComputer(nextComputer);
    }
  };
  
  // Handle toggle 
  const handleToggleAutoSwitch = () => {
    const newState = !autoSwitchEnabled;
    setAutoSwitchEnabled(newState);
    setTimeRemaining(autoSwitchInterval);
  };
  
  // Main timer effect - simplified
  useEffect(() => {
    // Clear existing timer
    if (timerIdRef.current !== null) {
      window.clearInterval(timerIdRef.current);
      timerIdRef.current = null;
    }
    
    // Set up new timer if enabled
    if (autoSwitchEnabled && isConnected) {
      timerIdRef.current = window.setInterval(() => {
        setTimeRemaining(prevTime => {
          if (prevTime <= 1) {
            // Time to switch - call async function
            switchToNextComputer();
            return autoSwitchInterval;
          }
          return prevTime - 1;
        });
      }, 1000);
    }
    
    // Cleanup
    return () => {
      if (timerIdRef.current !== null) {
        window.clearInterval(timerIdRef.current);
        timerIdRef.current = null;
      }
    };
  }, [autoSwitchEnabled, isConnected, autoSwitchInterval, switchToNextComputer]);
  
  // Format time for display
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  
  // Check if we have at least 2 computers configured
  const hasEnoughComputers = config && config.computers && config.computers.length >= 2;
  
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
      
      {!isConnected && (
        <div className="text-yellow-500 text-sm mb-4">
          Connect to KVM switch to enable auto-switching
        </div>
      )}
      
      {isConnected && !hasEnoughComputers && (
        <div className="text-yellow-500 text-sm mb-4">
          Configure at least 2 computers to enable auto-switching
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