import React, { useState, useEffect } from 'react';
import { useSerial } from '../contexts/SerialContext';

const AutoSwitchPanel: React.FC = () => {
  const { isConnected, activeComputer, switchToComputer } = useSerial();
  
  const [autoSwitchEnabled, setAutoSwitchEnabled] = useState(false);
  const [autoSwitchInterval, setAutoSwitchInterval] = useState(30); // seconds
  const [timeRemaining, setTimeRemaining] = useState(autoSwitchInterval);
  
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    
    if (autoSwitchEnabled && isConnected) {
      interval = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            // Time to switch to next computer
            const nextComputer = activeComputer ? (activeComputer % 10) + 1 : 1;
            switchToComputer(nextComputer);
            return autoSwitchInterval;
          }
          return prev - 1;
        });
      }, 1000);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [autoSwitchEnabled, isConnected, autoSwitchInterval, activeComputer, switchToComputer]);
  
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
  
  const handleToggleAutoSwitch = () => {
    setAutoSwitchEnabled((prev) => !prev);
    setTimeRemaining(autoSwitchInterval);
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
            disabled={!isConnected}
          />
          <div className={`
            w-11 h-6 rounded-full peer 
            peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 
            dark:peer-focus:ring-blue-800 peer-checked:after:translate-x-full 
            peer-checked:after:border-white after:content-[''] after:absolute 
            after:top-[2px] after:left-[2px] after:bg-gray-200 after:border-gray-500 
            after:border after:rounded-full after:h-5 after:w-5 after:transition-all
            ${autoSwitchEnabled ? 'bg-blue-600' : 'bg-gray-600'}
            ${!isConnected ? 'opacity-50 cursor-not-allowed' : ''}
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