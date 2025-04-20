import React, { useState, useRef, useEffect } from 'react';
import { useConfig } from '../contexts/ConfigContext';

interface ComputerFormData {
  label: string;
  portNumber: number;
  fqdn: string;
  macAddress: string;
  commandPayload: string;
}

const ComputersConfigPanel: React.FC = () => {
  const { config, loading, error, addComputer, updateComputer, removeComputer, updateConfig } = useConfig();
  
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<ComputerFormData>({
    label: '',
    portNumber: 1,
    fqdn: '',
    macAddress: '',
    commandPayload: ''
  });
  
  // Create a ref for the form element
  const formRef = useRef<HTMLDivElement>(null);
  
  // Effect to scroll to and focus the form when it appears
  useEffect(() => {
    if (showForm && formRef.current) {
      // Scroll the form into view
      formRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      
      // Find the first input element and focus it
      const firstInput = formRef.current.querySelector('input, select') as HTMLElement;
      if (firstInput) {
        setTimeout(() => firstInput.focus(), 300); // Small delay to ensure smooth scroll completes
      }
    }
  }, [showForm, editingId]);
  
  // Reset form data
  const resetForm = () => {
    setFormData({
      label: '',
      portNumber: 1,
      fqdn: '',
      macAddress: '',
      commandPayload: ''
    });
    setEditingId(null);
  };
  
  // Handle showing the add form
  const handleShowAddForm = () => {
    resetForm();
    setShowForm(true);
  };
  
  // Handle showing the edit form
  const handleShowEditForm = (id: string) => {
    const computer = config?.computers.find(c => c.id === id);
    if (computer) {
      setFormData({
        label: computer.label,
        portNumber: computer.portNumber,
        fqdn: computer.fqdn || '',
        macAddress: computer.macAddress || '',
        commandPayload: computer.commandPayload || ''
      });
      setEditingId(id);
      setShowForm(true);
    }
  };
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingId) {
        // Update existing computer
        await updateComputer(editingId, formData);
      } else {
        // Add new computer
        await addComputer(formData);
      }
      
      // Hide form and reset
      setShowForm(false);
      resetForm();
    } catch (err) {
      console.error('Failed to save computer:', err);
    }
  };
  
  // Handle removing a computer
  const handleRemoveComputer = async (id: string) => {
    if (window.confirm('Are you sure you want to remove this computer?')) {
      try {
        await removeComputer(id);
      } catch (err) {
        console.error('Failed to remove computer:', err);
      }
    }
  };
  
  // Handle toggling configuration active state
  const handleToggleActive = async () => {
    if (!config) return;
    
    try {
      await updateConfig({
        configurationActive: !config.configurationActive
      });
    } catch (err) {
      console.error('Failed to update configuration:', err);
    }
  };
  
  // Handle toggling auto-connect
  const handleToggleAutoConnect = async () => {
    if (!config) return;
    
    try {
      await updateConfig({
        autoConnect: !config.autoConnect
      });
    } catch (err) {
      console.error('Failed to update auto-connect setting:', err);
    }
  };
  
  // Validate MAC address format (basic validation)
  const isValidMac = (mac: string): boolean => {
    // Accept formats: XX:XX:XX:XX:XX:XX or XX-XX-XX-XX-XX-XX
    return /^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/.test(mac);
  };
  
  if (loading) {
    return <div className="text-gray-400 text-center py-4">Loading...</div>;
  }
  
  return (
    <div className="bg-gray-800 rounded-lg shadow-md p-6 mb-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-gray-100">Computers Configuration</h2>
        <div className="flex gap-2">
          <button 
            className="btn-primary"
            onClick={handleShowAddForm}
            disabled={showForm}
          >
            Add Computer
          </button>
        </div>
      </div>
      
      {/* Configuration controls */}
      <div className="mb-6 p-4 border border-gray-700 rounded bg-gray-750">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-medium text-gray-200">Configuration Status</h3>
            <p className="text-sm text-gray-400">
              {config?.configurationActive 
                ? 'Configuration is active' 
                : 'Configuration is inactive'}
            </p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input 
              type="checkbox" 
              className="sr-only peer"
              checked={config?.configurationActive || false}
              onChange={handleToggleActive}
              disabled={!config || config.computers.length < 2}
            />
            <div className={`
              w-11 h-6 rounded-full peer 
              peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 
              dark:peer-focus:ring-blue-800 peer-checked:after:translate-x-full 
              peer-checked:after:border-white after:content-[''] after:absolute 
              after:top-[2px] after:left-[2px] after:bg-gray-200 after:border-gray-500 
              after:border after:rounded-full after:h-5 after:w-5 after:transition-all
              ${config?.configurationActive ? 'bg-blue-600' : 'bg-gray-600'}
              ${(!config || config.computers.length < 2) ? 'opacity-50 cursor-not-allowed' : ''}
            `}></div>
          </label>
        </div>
        
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-medium text-gray-200">Auto-Connect</h3>
            <p className="text-sm text-gray-400">
              Automatically connect to KVM on startup
            </p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input 
              type="checkbox" 
              className="sr-only peer"
              checked={config?.autoConnect || false}
              onChange={handleToggleAutoConnect}
            />
            <div className={`
              w-11 h-6 rounded-full peer 
              peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 
              dark:peer-focus:ring-blue-800 peer-checked:after:translate-x-full 
              peer-checked:after:border-white after:content-[''] after:absolute 
              after:top-[2px] after:left-[2px] after:bg-gray-200 after:border-gray-500 
              after:border after:rounded-full after:h-5 after:w-5 after:transition-all
              ${config?.autoConnect ? 'bg-blue-600' : 'bg-gray-600'}
            `}></div>
          </label>
        </div>
      </div>
      
      {/* Add/Edit form */}
      {showForm && (
        <div ref={formRef} className="mb-6 p-4 border border-gray-700 rounded">
          <h3 className="text-lg font-medium text-gray-200 mb-4">
            {editingId ? 'Edit Computer' : 'Add Computer'}
          </h3>
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Label
                </label>
                <input 
                  type="text" 
                  className="w-full border border-gray-600 rounded px-3 py-2 bg-gray-700 text-gray-200"
                  value={formData.label}
                  onChange={(e) => setFormData({...formData, label: e.target.value})}
                  placeholder="My PC"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  KVM Port Number
                </label>
                <select
                  className="w-full border border-gray-600 rounded px-3 py-2 bg-gray-700 text-gray-200"
                  value={formData.portNumber}
                  onChange={(e) => setFormData({...formData, portNumber: parseInt(e.target.value)})}
                  required
                >
                  {Array.from({length: 10}, (_, i) => i + 1).map((num) => (
                    <option key={num} value={num}>PC {num}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Command Payload
                </label>
                <input 
                  type="text" 
                  className="w-full border border-gray-600 rounded px-3 py-2 bg-gray-700 text-gray-200"
                  value={formData.commandPayload}
                  onChange={(e) => setFormData({...formData, commandPayload: e.target.value})}
                  placeholder="X1,1$"
                />
                <p className="text-xs text-gray-400 mt-1">
                  Custom command format for KVM switch. Leave empty to use default format based on port number.
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  FQDN or IP Address
                </label>
                <input 
                  type="text" 
                  className="w-full border border-gray-600 rounded px-3 py-2 bg-gray-700 text-gray-200"
                  value={formData.fqdn}
                  onChange={(e) => setFormData({...formData, fqdn: e.target.value})}
                  placeholder="pc.local or 192.168.1.100"
                />
                <p className="text-xs text-gray-400 mt-1">
                  Required for Wake-on-LAN functionality
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  MAC Address
                </label>
                <input 
                  type="text" 
                  className={`w-full border rounded px-3 py-2 bg-gray-700 text-gray-200 ${
                    formData.macAddress && !isValidMac(formData.macAddress) 
                      ? 'border-red-500' 
                      : 'border-gray-600'
                  }`}
                  value={formData.macAddress}
                  onChange={(e) => setFormData({...formData, macAddress: e.target.value})}
                  placeholder="00:11:22:33:44:55"
                />
                {formData.macAddress && !isValidMac(formData.macAddress) && (
                  <p className="text-xs text-red-400 mt-1">
                    Invalid MAC format. Use XX:XX:XX:XX:XX:XX or XX-XX-XX-XX-XX-XX
                  </p>
                )}
                <p className="text-xs text-gray-400 mt-1">
                  Required for Wake-on-LAN functionality
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button 
                type="button"
                className="btn-secondary"
                onClick={() => {
                  setShowForm(false);
                  resetForm();
                }}
              >
                Cancel
              </button>
              <button 
                type="submit"
                className="btn-success"
                disabled={!!formData.macAddress && !isValidMac(formData.macAddress)}
              >
                {editingId ? 'Update' : 'Add'} Computer
              </button>
            </div>
          </form>
        </div>
      )}
      
      {/* Computers list */}
      <div className="space-y-3">
        <h3 className="text-lg font-medium text-gray-200 mb-2">Configured Computers</h3>
        
        {config?.computers.length === 0 ? (
          <div className="text-gray-400 text-center py-4">
            No computers configured yet. Click "Add Computer" to get started.
          </div>
        ) : (
          config?.computers.map((computer) => (
            <div 
              key={computer.id}
              className="p-3 border border-gray-700 rounded bg-gray-750 flex justify-between items-center"
            >
              <div>
                <div className="font-medium">{computer.label}</div>
                <div className="text-sm text-gray-400">KVM Port: PC {computer.portNumber}</div>
                {computer.commandPayload && (
                  <div className="text-sm text-gray-400">Command: {computer.commandPayload}</div>
                )}
                {computer.fqdn && (
                  <div className="text-sm text-gray-400">FQDN: {computer.fqdn}</div>
                )}
                {computer.macAddress && (
                  <div className="text-sm text-gray-400">MAC: {computer.macAddress}</div>
                )}
              </div>
              <div className="flex gap-2">
                <button 
                  className="text-xs bg-gray-600 hover:bg-gray-500 text-white px-2 py-1 rounded"
                  onClick={() => handleShowEditForm(computer.id)}
                >
                  Edit
                </button>
                <button 
                  className="text-xs bg-red-700 hover:bg-red-600 text-white px-2 py-1 rounded"
                  onClick={() => handleRemoveComputer(computer.id)}
                >
                  Remove
                </button>
              </div>
            </div>
          ))
        )}
        
        {config?.computers && config.computers.length > 0 && config.computers.length < 2 && (
          <div className="mt-4 text-yellow-400 text-sm">
            You need at least 2 computers configured to activate the configuration.
          </div>
        )}
      </div>
    </div>
  );
};

export default ComputersConfigPanel;