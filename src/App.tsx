// src/App.tsx
import React, { useState, useEffect } from 'react';
import { SerialProvider } from './contexts/SerialContext';
import { ConfigProvider, useConfig } from './contexts/ConfigContext';
import ConnectionPanel from './components/ConnectionPanel';
import ComputersPanel from './components/ComputersPanel';
import AutoSwitchPanel from './components/AutoSwitchPanel';
import ComputersConfigPanel from './components/ComputersConfigPanel';

// Main app content with tabs
const AppContent: React.FC = () => {
  const { config, loading, error } = useConfig();
  
  // Define tabs
  const [activeTab, setActiveTab] = useState<'remote' | 'settings'>('remote');
  
  // Handle initial state logic
  useEffect(() => {
    // If we're loading, don't do anything yet
    if (loading) return;
    
    // Set active tab based on configuration state
    if (!config || !config.configurationActive || config.computers.length < 2) {
      setActiveTab('settings');
    }
  }, [loading, config]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-gray-400">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-900/30 border border-red-800 text-red-300 p-4 rounded">
        <h2 className="text-lg font-semibold mb-2">Error Loading Configuration</h2>
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 border-b border-gray-700">
        <div className="flex">
          <button
            className={`px-4 py-2 font-medium ${
              activeTab === 'remote'
                ? 'border-b-2 border-blue-500 text-blue-400'
                : 'text-gray-400 hover:text-gray-300'
            }`}
            onClick={() => setActiveTab('remote')}
          >
            Remote
          </button>
          <button
            className={`px-4 py-2 font-medium ${
              activeTab === 'settings'
                ? 'border-b-2 border-blue-500 text-blue-400'
                : 'text-gray-400 hover:text-gray-300'
            }`}
            onClick={() => setActiveTab('settings')}
          >
            Settings
          </button>
        </div>
      </div>

      {activeTab === 'remote' ? (
        // Remote tab content
        <div>
          {(!config || !config.configurationActive || config.computers.length < 2) ? (
            <div className="bg-yellow-900/30 border border-yellow-800 text-yellow-300 p-4 rounded mb-6">
              <p>Please configure at least two computers in the Settings tab and activate the configuration.</p>
            </div>
          ) : (
            <>
              <ComputersPanel />
              <AutoSwitchPanel />
            </>
          )}
        </div>
      ) : (
        // Settings tab content
        <div>
          <ComputersConfigPanel />
          <ConnectionPanel />
        </div>
      )}
    </div>
  );
};

// Main app component with providers
const App: React.FC = () => {
  return (
    <ConfigProvider>
      <SerialProvider>
        <div className="container mx-auto px-4 py-8 max-w-xl">
          <header className="mb-8">
            <h1 className="text-3xl font-bold text-center text-gray-100">KVM Remote Control</h1>
            <p className="text-center text-gray-400 mt-2">Control your KVM switch via RS232</p>
          </header>
          
          <AppContent />
          
          <div className="text-sm text-gray-500 text-center mt-8">
            <p>
              KVM Control - Electron App
            </p>
          </div>
        </div>
      </SerialProvider>
    </ConfigProvider>
  );
};

export default App;