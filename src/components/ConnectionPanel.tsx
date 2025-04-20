import React, { useState, useEffect } from 'react';
import { useSerial } from '../contexts/SerialContext';
import { useConfig } from '../contexts/ConfigContext';
import _ from 'lodash';

const ConnectionPanel: React.FC = () => {
  const {
    isConnected,
    connecting,
    error,
    availablePorts,
    selectedPort,
    serialOptions,
    connect,
    disconnect,
    refreshPorts,
    updateSerialOptions,
    setSelectedPort
  } = useSerial();
  
  const { config, updateConfig } = useConfig();
  
  const [showSettings, setShowSettings] = useState(false);
  
  // When selectedPort or serialOptions change, update the configuration
  useEffect(() => {
    if (!config) return;
  
    // build the new connection object
    const newConn = {
      ...config.connection,
      port:      selectedPort,
      baudRate:  serialOptions.baudRate,
      dataBits:  serialOptions.dataBits,
      parity:    serialOptions.parity,
      stopBits:  serialOptions.stopBits,
    };
  
    // only update if it’s actually changed
    if (!_.isEqual(config.connection, newConn)) {
      updateConfig({ connection: newConn });
    }
  
  }, [selectedPort, serialOptions]);
  
  const handleConnect = () => {
    if (isConnected) {
      disconnect();
    } else {
      connect();
    }
  };
  
  const handleApplySettings = () => {
    if (isConnected) {
      disconnect().then(() => {
        connect();
      });
    }
  };
  
  return (
    <div className="bg-gray-800 rounded-lg shadow-md p-6 mb-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-gray-100">Connection</h2>
        <div className="flex gap-2">
          <button 
            className="text-sm text-gray-300 bg-gray-700 hover:bg-gray-600 py-1 px-2 rounded"
            onClick={() => refreshPorts()}
          >
            Refresh
          </button>
          <button 
            className={`btn-primary ${connecting ? 'opacity-50 cursor-not-allowed' : ''}`}
            onClick={handleConnect}
            disabled={connecting}
          >
            {connecting ? 'Connecting...' : isConnected ? 'Disconnect' : 'Connect'}
          </button>
        </div>
      </div>
      
      <div className="text-gray-300 mb-2">
        {error ? (
          <div className="text-red-400">{error}</div>
        ) : (
          <div>{isConnected ? 'Connected' : 'Not connected'}</div>
        )}
      </div>
      
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-300 mb-1">Port</label>
        <select 
          className="w-full border border-gray-600 rounded px-3 py-2 bg-gray-700 text-gray-200"
          value={selectedPort}
          onChange={(e) => setSelectedPort(e.target.value)}
          disabled={isConnected}
        >
          {availablePorts.length === 0 && (
            <option value="">No ports available</option>
          )}
          {availablePorts.map((port) => (
            <option key={port.path} value={port.path}>
              {port.path} {port.manufacturer ? `(${port.manufacturer})` : ''}
            </option>
          ))}
        </select>
      </div>
      
      <div className="flex items-center mb-4">
        <button 
          className="text-sm text-gray-300 hover:text-white"
          onClick={() => setShowSettings(!showSettings)}
        >
          {showSettings ? 'Hide Settings' : 'Show Settings'}
        </button>
      </div>
      
      {showSettings && (
        <div className="mt-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Baud Rate</label>
              <select 
                className="w-full border border-gray-600 rounded px-3 py-2 bg-gray-700 text-gray-200"
                value={serialOptions.baudRate}
                onChange={(e) => updateSerialOptions({ baudRate: parseInt(e.target.value) })}
                disabled={isConnected}
              >
                <option value="1200">1200</option>
                <option value="2400">2400</option>
                <option value="4800">4800</option>
                <option value="9600">9600</option>
                <option value="19200">19200</option>
                <option value="38400">38400</option>
                <option value="57600">57600</option>
                <option value="115200">115200</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Data Bits</label>
              <select 
                className="w-full border border-gray-600 rounded px-3 py-2 bg-gray-700 text-gray-200"
                value={serialOptions.dataBits}
                onChange={(e) => updateSerialOptions({ dataBits: parseInt(e.target.value) })}
                disabled={isConnected}
              >
                <option value="7">7</option>
                <option value="8">8</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Parity</label>
              <select 
                className="w-full border border-gray-600 rounded px-3 py-2 bg-gray-700 text-gray-200"
                value={serialOptions.parity}
                onChange={(e) => updateSerialOptions({ parity: e.target.value as 'none' | 'even' | 'odd' | 'mark' | 'space' })}
                disabled={isConnected}
              >
                <option value="none">None</option>
                <option value="even">Even</option>
                <option value="odd">Odd</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Stop Bits</label>
              <select 
                className="w-full border border-gray-600 rounded px-3 py-2 bg-gray-700 text-gray-200"
                value={serialOptions.stopBits}
                onChange={(e) => updateSerialOptions({ stopBits: parseInt(e.target.value) })}
                disabled={isConnected}
              >
                <option value="1">1</option>
                <option value="2">2</option>
              </select>
            </div>
          </div>
          <div className="mt-4">
            <button 
              className={`btn-success ${!isConnected ? 'opacity-50 cursor-not-allowed' : ''}`}
              onClick={handleApplySettings}
              disabled={!isConnected}
            >
              Apply Settings
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ConnectionPanel;