import React, { useState, useRef } from 'react';
import { useWol } from '../contexts/WolContext';
import { useSerial } from '../contexts/SerialContext';

interface ComputerButtonProps {
  id: string;
  label: string;
  portNumber: number;
  macAddress?: string;
  fqdn?: string;
  isActive: boolean;
}

const ComputerButton: React.FC<ComputerButtonProps> = ({
  id, 
  label, 
  portNumber, 
  macAddress,
  fqdn,
  isActive
}) => {
  const { wakeComputer, computerStatus, refreshComputerStatus } = useWol();
  const { switchToComputer, isConnected } = useSerial();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [isWaking, setIsWaking] = useState(false);
  
  // Ref for managing click-outside behavior
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  // Determine if computer is online
  const isOnline = computerStatus[id];
  
  // Handle waking the computer
  const handleWakeComputer = async () => {
    if (!macAddress) return;
    
    setIsWaking(true);
    try {
      await wakeComputer(macAddress);
      // Start checking status to update the UI after the WoL packet is sent
      setTimeout(() => refreshComputerStatus(id), 3000);
      setTimeout(() => refreshComputerStatus(id), 8000);
      setTimeout(() => refreshComputerStatus(id), 15000);
    } finally {
      setIsWaking(false);
      setDropdownOpen(false);
    }
  };
  
  // Toggle the dropdown menu
  const toggleDropdown = (e: React.MouseEvent) => {
    e.stopPropagation();
    setDropdownOpen(!dropdownOpen);
  };
  
  // Close the dropdown
  const closeDropdown = () => setDropdownOpen(false);
  
  // Click outside handler to close dropdown
  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }
    
    // Add event listener when dropdown is open
    if (dropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    
    // Clean up event listener
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [dropdownOpen]);
  
  return (
    <div className="relative" ref={dropdownRef}>
      <div className="flex">
        {/* Main button */}
        <button
          onClick={() => {
            if (isConnected) {
              switchToComputer(portNumber);
            }
            closeDropdown();
          }}
          disabled={!isConnected}
          className={`flex-grow px-4 py-2 text-sm font-medium rounded-l-md focus:outline-none ${
            isActive 
              ? 'bg-blue-600 hover:bg-blue-700 text-white' 
              : isOnline 
                ? 'bg-green-600 hover:bg-green-700 text-white' 
                : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
          } ${!isConnected ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <div className="flex items-center justify-center">
            <span>{label}</span>
            {isOnline && !isActive && (
              <span className="ml-2 relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
              </span>
            )}
            {isActive && (
              <span className="ml-2 text-xs">(Active)</span>
            )}
          </div>
        </button>
        
        {/* Dropdown button */}
        <button
          type="button"
          onClick={toggleDropdown}
          className={`inline-flex items-center p-2 rounded-r-md focus:outline-none ${
            isActive 
              ? 'bg-blue-600 hover:bg-blue-700 text-white' 
              : isOnline 
                ? 'bg-green-600 hover:bg-green-700 text-white' 
                : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
          } ${!isConnected ? 'opacity-50' : ''}`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </button>
      </div>
      
      {/* Dropdown menu */}
      {dropdownOpen && (
        <div 
          className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-gray-800 ring-1 ring-black ring-opacity-5 z-10"
          role="menu"
          aria-orientation="vertical"
        >
          <div className="py-1" role="none">
            {macAddress && (
              <button
                className={`flex items-center w-full px-4 py-2 text-sm ${
                  isOnline || isWaking
                    ? 'text-gray-500 cursor-not-allowed'
                    : 'text-white hover:bg-gray-700'
                }`}
                onClick={handleWakeComputer}
                disabled={isOnline || isWaking}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-3" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 3a1 1 0 00-1 1v5a1 1 0 102 0V4a1 1 0 00-1-1z" clipRule="evenodd" />
                  <path d="M10 12a2 2 0 100 4 2 2 0 000-4z" />
                </svg>
                {isWaking ? 'Waking...' : isOnline ? 'Online' : 'Wake Up'}
                {isOnline && (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-auto text-green-500" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                )}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ComputerButton;