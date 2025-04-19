import React from 'react';
import { useSerial } from '../contexts/SerialContext';

const ComputersPanel: React.FC = () => {
  const { isConnected, activeComputer, lastCommand, switchToComputer } = useSerial();
  
  // Generate a range of PC buttons from 1 to 10
  const pcButtons = Array.from({ length: 10 }, (_, i) => i + 1);
  
  return (
    <div className="bg-gray-800 rounded-lg shadow-md p-6 mb-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-gray-100">Computers</h2>
        <span className="bg-blue-100 text-blue-800 text-sm font-semibold px-3 py-1 rounded-full">
          {activeComputer ? `PC ${activeComputer}` : 'None'}
        </span>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 mb-4">
        {pcButtons.map((pcNumber) => (
          <button
            key={pcNumber}
            className={`
              ${pcNumber === activeComputer ? 'btn-active' : 'btn-secondary'}
              ${!isConnected ? 'btn-disabled' : ''}
            `}
            onClick={() => switchToComputer(pcNumber)}
            disabled={!isConnected}
          >
            PC {pcNumber}
          </button>
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