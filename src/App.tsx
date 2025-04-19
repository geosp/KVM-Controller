import React from 'react';
import { SerialProvider } from './contexts/SerialContext';
import ConnectionPanel from './components/ConnectionPanel';
import ComputersPanel from './components/ComputersPanel';
import AutoSwitchPanel from './components/AutoSwitchPanel';

const App: React.FC = () => {
  return (
    <SerialProvider>
      <div className="container mx-auto px-4 py-8 max-w-xl">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-center text-gray-100">KVM Remote Control</h1>
          <p className="text-center text-gray-400 mt-2">Control your KVM switch via RS232</p>
        </header>
        
        <ConnectionPanel />
        <ComputersPanel />
        <AutoSwitchPanel />
        
        <div className="text-sm text-gray-500 text-center mt-8">
          <p>
            KVM Control - Electron App
          </p>
        </div>
      </div>
    </SerialProvider>
  );
};

export default App;