import React from 'react';
import { useSerial } from '../contexts/SerialContext';
import { useConfig } from '../contexts/ConfigContext';
import ComputerButton from './ComputerButton';

const ComputersPanel: React.FC = () => {
  const { isConnected, activeComputer, lastCommand } = useSerial();
  const { config } = useConfig();
  
  // If no configuration or no computers, show a message
  if (!config || config.computers.length === 0) {
    return (
      <div className="bg-gray-800 rounded-lg shadow-md p-6 mb-6">
        <div className="text-center text-gray-400">
          No computers configured. Please add computers in the Settings tab.
        </div>
      </div>
    );
  }
  
  return (
    <div className="bg-gray-800 rounded-lg shadow-md p-6 mb-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-gray-100">Computers</h2>
        <span className="bg-blue-100 text-blue-800 text-sm font-semibold px-3 py-1 rounded-full">
          {activeComputer ? 
            (config.computers.find(c => c.portNumber === activeComputer)?.label || `PC ${activeComputer}`) : 
            'None'}
        </span>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-4">
        {config.computers.map((computer) => (
          <ComputerButton
            key={computer.id}
            id={computer.id}
            label={computer.label}
            portNumber={computer.portNumber}
            macAddress={computer.macAddress}
            fqdn={computer.fqdn}
            isActive={computer.portNumber === activeComputer}
          />
        ))}
      </div>
      {lastCommand && (
        <div className="text-sm text-gray-400 mt-2">
          Last command: <span className="font-mono">{lastCommand}</span>
        </div>
      )}
    </div>
  );
};

export default ComputersPanel;