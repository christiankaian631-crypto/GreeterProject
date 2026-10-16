
import React, { useState, useEffect } from 'react';
import { Reservation, Backup } from '../types';
import { X, Save, RotateCcw, Trash2, Database, Clock, AlertTriangle, Loader2, CheckCircle } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  currentData: Reservation[];
  onRestore: (data: Reservation[]) => void;
  isDarkMode?: boolean;
  socket?: any;
  outlet?: string;
}

const BackupModal: React.FC<Props> = ({ isOpen, onClose, currentData, onRestore, isDarkMode, socket, outlet }) => {
  const [backups, setBackups] = useState<Backup[]>([]);
  const [serverBackups, setServerBackups] = useState<any[]>([]);
  const [labelInput, setLabelInput] = useState('');
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'cloud' | 'local'>('cloud');

  // Load backups on mount/open
  useEffect(() => {
    if (isOpen) {
      const saved = localStorage.getItem('app_backups');
      if (saved) {
        setBackups(JSON.parse(saved));
      }
      
      if (socket && outlet) {
        socket.emit('get-backups', outlet);
        socket.on('backups-list', (list: any[]) => {
          setServerBackups(list);
        });
      }
    }
    return () => {
      if (socket) {
        socket.off('backups-list');
      }
    };
  }, [isOpen, socket, outlet]);

  const saveBackupsToStorage = (newBackups: Backup[]) => {
    localStorage.setItem('app_backups', JSON.stringify(newBackups));
    setBackups(newBackups);
  };

  const handleManualSave = () => {
    if (currentData.length === 0 && !confirm("Warning: Saving an empty database. Continue?")) {
        return;
    }

    const label = labelInput.trim() || `Manual Save`;
    
    // Save locally
    const newBackup: Backup = {
      id: Date.now().toString(),
      timestamp: Date.now(),
      label: label,
      totalReservations: currentData.length,
      data: currentData
    };

    const updatedBackups = [newBackup, ...backups];
    saveBackupsToStorage(updatedBackups);

    // Save to Cloud if socket available
    if (socket && outlet) {
      socket.emit('create-backup', { outlet, label });
    }

    setLabelInput('');
  };

  const handleRestore = (backup: Backup) => {
    if (confirm(`WARNING: RESTORE DATABASE?\n\nThis will overwrite your current active data with the backup "${backup.label}" from ${new Date(backup.timestamp).toLocaleDateString()}.\n\nCurrent unsaved changes will be lost.`)) {
      setProcessingId(backup.id);
      
      // Simulate processing for better UX
      setTimeout(() => {
          onRestore(backup.data);
          setProcessingId(null);
          onClose();
      }, 800);
    }
  };

  const handleCloudRestore = (backup: any) => {
    if (confirm(`WARNING: RESTORE FROM CLOUD?\n\nThis will overwrite data for ${backup.outlet === 'GLOBAL' ? 'ALL OUTLETS' : 'THIS OUTLET'} with the cloud backup from ${backup.label}.\n\nContinue?`)) {
      setProcessingId(backup.id);
      if (socket && outlet) {
        socket.emit('restore-backup', { outlet, backupId: backup.id });
        setTimeout(() => {
          setProcessingId(null);
          onClose();
        }, 1000);
      }
    }
  };

  const handleDelete = (id: string) => {
    if (confirm('PERMANENTLY DELETE this backup file? This cannot be undone.')) {
      const updated = backups.filter(b => b.id !== id);
      saveBackupsToStorage(updated);
    }
  };

  if (!isOpen) return null;

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm p-4 animate-fade-in ${isDarkMode ? 'bg-black/90' : 'bg-black/50'}`}>
      <div className={`border rounded-lg shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col ${isDarkMode ? 'bg-dark-900 border-gold-800' : 'bg-white border-gray-200'}`}>
        
        {/* Header */}
        <div className={`p-6 border-b flex justify-between items-center ${isDarkMode ? 'bg-dark-800 border-gold-900' : 'bg-gray-50 border-gray-200'}`}>
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-full border ${isDarkMode ? 'bg-gold-500/20 border-gold-500' : 'bg-gold-50 border-gold-400'}`}>
               <Database size={20} className="text-gold-500" />
            </div>
            <div>
              <h2 className={`text-xl font-serif font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Database Management</h2>
              <p className="text-sm text-gold-600">Backup & Restore Points</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-white">
            <X size={24} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-8">
           
           {/* Tab Switcher */}
           <div className="flex p-1 bg-black/20 rounded-xl border border-white/5">
              <button 
                onClick={() => setActiveTab('cloud')}
                className={`flex-1 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${activeTab === 'cloud' ? 'bg-gold-500 text-black shadow-lg' : 'text-gray-500 hover:text-white'}`}
              >
                Cloud Backups (Server)
              </button>
              <button 
                onClick={() => setActiveTab('local')}
                className={`flex-1 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${activeTab === 'local' ? 'bg-gold-500 text-black shadow-lg' : 'text-gray-500 hover:text-white'}`}
              >
                Local History (Browser)
              </button>
           </div>

           {activeTab === 'cloud' ? (
             <div>
                <h3 className={`text-sm font-bold uppercase tracking-wider mb-4 flex items-center gap-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                   <Database size={16} className="text-emerald-500" /> Cloud Restore Points
                </h3>
                <p className="text-[10px] text-gray-500 mb-4 bg-emerald-500/5 p-3 rounded-lg border border-emerald-500/10">
                  Backups are automatically created every 5 minutes on the server. Restoring from Cloud will sync all connected devices.
                </p>
                
                {serverBackups.length === 0 ? (
                   <div className={`text-center py-8 italic border border-dashed rounded ${isDarkMode ? 'text-gray-500 border-dark-700' : 'text-gray-400 border-gray-200'}`}>
                      No cloud backups found yet.
                   </div>
                ) : (
                   <div className="space-y-3">
                      {serverBackups.map(backup => (
                         <div key={backup.id} className={`p-4 rounded border flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 transition-colors group ${isDarkMode ? 'bg-dark-800 border-dark-700 hover:border-gold-900' : 'bg-white border-gray-200 hover:border-gold-400'}`}>
                            <div className="flex-1">
                               <div className="flex items-center gap-2 mb-1">
                                  <span className={`font-bold text-base ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{backup.label}</span>
                                  <span className="text-[8px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-500 font-black uppercase">Server Side</span>
                               </div>
                               <p className="text-xs text-gray-500 flex items-center gap-1">
                                  <Clock size={10} /> {new Date(backup.time).toLocaleString()}
                               </p>
                            </div>
                            
                            <button 
                              onClick={() => handleCloudRestore(backup)}
                              disabled={processingId !== null}
                              className={`w-full sm:w-auto border px-6 py-2 rounded text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${isDarkMode ? 'bg-emerald-900/20 hover:bg-emerald-600 text-emerald-400 hover:text-white border-emerald-800/50' : 'bg-emerald-50 hover:bg-emerald-600 text-emerald-600 hover:text-white border-emerald-200'}`}
                            >
                               {processingId === backup.id ? <Loader2 size={14} className="animate-spin"/> : <RotateCcw size={14} />} 
                               {processingId === backup.id ? 'Restoring...' : 'Cloud Restore'}
                            </button>
                         </div>
                      ))}
                   </div>
                )}
             </div>
           ) : (
             <>
               {/* Section 1: Manual Save */}
               <div className={`border p-5 rounded-lg ${isDarkMode ? 'bg-dark-800/50 border-gold-900/50' : 'bg-gray-50 border-gray-200'}`}>
                  <h3 className={`text-sm font-bold uppercase tracking-wider mb-4 flex items-center gap-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                     <Save size={16} className="text-green-500" /> Create Local Snapshot
                  </h3>
                  <div className="flex gap-3">
                     <input 
                       type="text" 
                       value={labelInput}
                       onChange={(e) => setLabelInput(e.target.value)}
                       placeholder="Label (e.g. Before Closing, Shift 1)..."
                       className={`flex-1 border rounded px-4 py-2 text-sm focus:outline-none focus:border-green-500 ${isDarkMode ? 'bg-dark-900 border-gold-800 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
                     />
                     <button 
                       onClick={handleManualSave}
                       className="bg-green-700 hover:bg-green-600 text-white px-6 py-2 rounded font-bold uppercase tracking-wider text-xs flex items-center gap-2 transition-colors shadow-lg"
                     >
                       <Save size={14} /> Save
                     </button>
                  </div>
               </div>

               {/* Section 2: History List */}
               <div>
                  <h3 className={`text-sm font-bold uppercase tracking-wider mb-4 flex items-center gap-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                     <Clock size={16} className="text-blue-500" /> Local History
                  </h3>
                  
                  {backups.length === 0 ? (
                     <div className={`text-center py-8 italic border border-dashed rounded ${isDarkMode ? 'text-gray-500 border-dark-700' : 'text-gray-400 border-gray-200'}`}>
                        No local backup history found.
                     </div>
                  ) : (
                     <div className="space-y-3">
                        {backups.map(backup => (
                           <div key={backup.id} className={`p-4 rounded border flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 transition-colors group ${isDarkMode ? 'bg-dark-800 border-dark-700 hover:border-gold-900' : 'bg-white border-gray-200 hover:border-gold-400'}`}>
                              <div className="flex-1">
                                 <div className="flex items-center gap-2 mb-1">
                                    <span className={`font-bold text-base ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{backup.label}</span>
                                    <span className={`text-[10px] px-2 py-0.5 rounded border ${isDarkMode ? 'bg-dark-700 text-gray-400 border-dark-600' : 'bg-gray-100 text-gray-500 border-gray-200'}`}>
                                       {backup.totalReservations} Records
                                    </span>
                                 </div>
                                 <p className="text-xs text-gray-500 flex items-center gap-1">
                                    <Clock size={10} /> {new Date(backup.timestamp).toLocaleString()}
                                 </p>
                              </div>
                              
                              <div className="flex gap-2 w-full sm:w-auto">
                                 <button 
                                   onClick={() => handleRestore(backup)}
                                   disabled={processingId !== null}
                                   className={`flex-1 sm:flex-none border px-4 py-2 rounded text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all ${isDarkMode ? 'bg-blue-900/20 hover:bg-blue-800 text-blue-400 hover:text-white border-blue-800/50' : 'bg-blue-50 hover:bg-blue-600 text-blue-600 hover:text-white border-blue-200'}`}
                                 >
                                    {processingId === backup.id ? <Loader2 size={14} className="animate-spin"/> : <RotateCcw size={14} />} 
                                    {processingId === backup.id ? 'Restoring...' : 'Restore'}
                                 </button>
                                 <button 
                                   onClick={() => handleDelete(backup.id)}
                                   disabled={processingId !== null}
                                   className="p-2 text-gray-600 hover:text-red-500 hover:bg-red-900/20 rounded transition-colors border border-transparent hover:border-red-900/30"
                                   title="Delete Backup"
                                 >
                                    <Trash2 size={16} />
                                 </button>
                              </div>
                           </div>
                        ))}
                     </div>
                  )}
               </div>
             </>
           )}
        </div>

        {/* Footer */}
        <div className={`p-4 border-t text-xs text-gray-500 flex items-center gap-2 ${isDarkMode ? 'bg-dark-800 border-gold-900' : 'bg-gray-50 border-gray-200'}`}>
           <AlertTriangle size={14} className="text-orange-500 shrink-0" />
           <span><strong>Note:</strong> Restoring data will strictly replace all current active reservations with the snapshot data.</span>
        </div>

      </div>
    </div>
  );
};

export default BackupModal;
