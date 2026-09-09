import React, { useState, useEffect } from 'react';
import { StorageItem, MediaFile, ServerConfig } from './types';
import { INITIAL_STORAGES, INITIAL_FILES } from './data/mockStorageData';
import { DashboardView } from './components/DashboardView';
import { BrowserView } from './components/BrowserView';
import { SettingsView } from './components/SettingsView';
import { TermuxGuideView } from './components/TermuxGuideView';
import { VlcModal } from './components/VlcModal';
import { MediaPlayerModal } from './components/MediaPlayerModal';
import { TvRemoteOverlay } from './components/TvRemoteOverlay';
import { 
  Tv, HardDrive, Settings, Terminal, Sun, Moon, 
  Wifi, ShieldCheck, CheckCircle2 
} from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'browser' | 'settings' | 'termux'>('dashboard');
  const [storages, setStorages] = useState<StorageItem[]>(INITIAL_STORAGES);
  const [files, setFiles] = useState<MediaFile[]>(INITIAL_FILES);
  const [selectedStorage, setSelectedStorage] = useState<StorageItem>(INITIAL_STORAGES[0]);
  
  // Modals
  const [vlcModalFile, setVlcModalFile] = useState<MediaFile | null>(null);
  const [browserPlayerFile, setBrowserPlayerFile] = useState<MediaFile | null>(null);
  
  // Server Config
  const [config, setConfig] = useState<ServerConfig>({
    server_name: 'Android TV Media Server',
    port: 8080,
    host: '0.0.0.0',
    authentication: false,
    username: 'admin',
    password: 'adminpassword',
    show_hidden_files: false,
    chunk_size_kb: 1024,
    theme: 'dark',
    storages: [
      { name: 'Internal Storage', path: '/sdcard' },
      { name: 'Movies', path: '/sdcard/Movies' },
      { name: 'USB Flash Drive', path: '~/storage/external-1' },
      { name: 'External HDD (17F8-2C26)', path: '/storage/17F8-2C26' }
    ]
  });

  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [tvIp, setTvIp] = useState('192.168.1.100');

  // Handle storage refresh (simulates USB discovery in Termux)
  const handleRefreshStorages = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      // Check if new USB candidate exists
      const hasSecondaryUsb = storages.some(s => s.id === 'usb_secondary');
      if (!hasSecondaryUsb) {
        const newUsb: StorageItem = {
          id: 'usb_secondary',
          name: 'USB Flash 2 (فلش متصل شده جدید)',
          path: '~/storage/external-2',
          type: 'usb',
          accessible: true,
          totalBytes: 32 * 1024 * 1024 * 1024,
          usedBytes: 11.2 * 1024 * 1024 * 1024,
          freeBytes: 20.8 * 1024 * 1024 * 1024,
          totalStr: '32.0 GB',
          usedStr: '11.2 GB',
          freeStr: '20.8 GB',
          percentUsed: 35,
        };
        setStorages(prev => [...prev, newUsb]);
      }
      setIsRefreshing(false);
    }, 1200);
  };

  const handleSelectStorage = (st: StorageItem) => {
    setSelectedStorage(st);
    setActiveTab('browser');
  };

  const handleAddStorage = (name: string, path: string) => {
    const newStorageItem: StorageItem = {
      id: 'custom_' + Date.now(),
      name,
      path,
      type: path.includes('external') || path.includes('storage') ? 'usb' : 'folder',
      accessible: true,
      totalBytes: 64 * 1024 * 1024 * 1024,
      usedBytes: 20 * 1024 * 1024 * 1024,
      freeBytes: 44 * 1024 * 1024 * 1024,
      totalStr: '64.0 GB',
      usedStr: '20.0 GB',
      freeStr: '44.0 GB',
      percentUsed: 31,
    };
    setStorages(prev => [...prev, newStorageItem]);
    setConfig(prev => ({
      ...prev,
      storages: [...prev.storages, { name, path }]
    }));
  };

  const handleRemoveStorage = (id: string) => {
    const st = storages.find(s => s.id === id);
    if (!st) return;
    setStorages(prev => prev.filter(s => s.id !== id));
    setConfig(prev => ({
      ...prev,
      storages: prev.storages.filter(s => s.name !== st.name)
    }));
  };

  // Remote D-Pad Navigation Handler
  const handleRemoteNavigate = (direction: 'up' | 'down' | 'left' | 'right' | 'select' | 'back' | 'home') => {
    if (direction === 'home') {
      setActiveTab('dashboard');
      return;
    }
    if (direction === 'back') {
      if (activeTab === 'browser') setActiveTab('dashboard');
      if (vlcModalFile) setVlcModalFile(null);
      if (browserPlayerFile) setBrowserPlayerFile(null);
      return;
    }
    if (direction === 'right') {
      if (activeTab === 'dashboard') setActiveTab('browser');
      else if (activeTab === 'browser') setActiveTab('settings');
      else if (activeTab === 'settings') setActiveTab('termux');
    }
    if (direction === 'left') {
      if (activeTab === 'termux') setActiveTab('settings');
      else if (activeTab === 'settings') setActiveTab('browser');
      else if (activeTab === 'browser') setActiveTab('dashboard');
    }
  };

  return (
    <div className={`min-h-screen font-sans flex flex-col ${theme === 'dark' ? 'bg-[#0a0a0a] text-gray-200' : 'bg-slate-900 text-slate-100'}`} dir="rtl">
      
      {/* Elegant Dark Header / Nav */}
      <header className="sticky top-0 z-30 border-b border-gray-800 bg-[#111111] px-6 py-3 shadow-2xl backdrop-blur-md">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
          
          {/* Logo & Brand Info */}
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 bg-amber-500 rounded-xl flex items-center justify-center text-black font-black text-xl shadow-lg shadow-amber-500/20 shrink-0">
              M
            </div>
            <div>
              <h1 className="text-base sm:text-lg font-bold text-gray-100 leading-tight">
                {config.server_name}
              </h1>
              <p className="text-xs text-gray-500">Termux + Flask Engine &bull; Zero Transcoding</p>
            </div>
          </div>

          {/* Status & IP Indicators from Elegant Dark spec */}
          <div className="hidden md:flex items-center gap-6 border-x border-gray-800/80 px-6">
            <div className="text-center">
              <p className="text-[10px] uppercase tracking-widest text-gray-500 font-semibold">وضعیت سرور</p>
              <p className="text-xs sm:text-sm font-medium text-green-400 flex items-center justify-center gap-1.5 mt-0.5">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                آنلاین
              </p>
            </div>

            <div className="text-center">
              <p className="text-[10px] uppercase tracking-widest text-gray-500 font-semibold">IP Address</p>
              <p className="text-xs sm:text-sm font-mono text-amber-200 mt-0.5" dir="ltr">
                {tvIp}:{config.port}
              </p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="flex items-center gap-1.5 rounded-xl border border-gray-800 bg-[#0a0a0a] p-1 shadow-inner">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-bold transition-all ${
                activeTab === 'dashboard'
                  ? 'bg-amber-500 text-black font-bold shadow-md shadow-amber-500/20'
                  : 'text-gray-400 hover:text-gray-200 hover:bg-gray-850'
              }`}
            >
              <Tv className="h-3.5 w-3.5" />
              داشبورد
            </button>

            <button
              onClick={() => setActiveTab('browser')}
              className={`flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-bold transition-all ${
                activeTab === 'browser'
                  ? 'bg-amber-500 text-black font-bold shadow-md shadow-amber-500/20'
                  : 'text-gray-400 hover:text-gray-200 hover:bg-gray-850'
              }`}
            >
              <HardDrive className="h-3.5 w-3.5" />
              مرور فایل‌ها
            </button>

            <button
              onClick={() => setActiveTab('settings')}
              className={`flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-bold transition-all ${
                activeTab === 'settings'
                  ? 'bg-amber-500 text-black font-bold shadow-md shadow-amber-500/20'
                  : 'text-gray-400 hover:text-gray-200 hover:bg-gray-850'
              }`}
            >
              <Settings className="h-3.5 w-3.5" />
              تنظیمات
            </button>

            <button
              onClick={() => setActiveTab('termux')}
              className={`flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-bold transition-all ${
                activeTab === 'termux'
                  ? 'bg-amber-500 text-black font-bold shadow-md shadow-amber-500/20'
                  : 'text-amber-400/90 hover:text-amber-300 hover:bg-gray-850'
              }`}
            >
              <Terminal className="h-3.5 w-3.5" />
              راهنما و دانلود ZIP
            </button>
          </nav>

        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto p-4 sm:p-8 flex-1 w-full">
        {activeTab === 'dashboard' && (
          <DashboardView
            serverName={config.server_name}
            serverIp={tvIp}
            serverPort={config.port}
            storages={storages}
            files={files}
            onSelectStorage={handleSelectStorage}
            onOpenFileModal={(f) => setVlcModalFile(f)}
            onPlayInBrowser={(f) => setBrowserPlayerFile(f)}
            onRefreshStorages={handleRefreshStorages}
            isRefreshing={isRefreshing}
          />
        )}

        {activeTab === 'browser' && (
          <BrowserView
            storage={selectedStorage}
            files={files}
            onBackToDashboard={() => setActiveTab('dashboard')}
            onOpenFileModal={(f) => setVlcModalFile(f)}
            onPlayInBrowser={(f) => setBrowserPlayerFile(f)}
          />
        )}

        {activeTab === 'settings' && (
          <SettingsView
            config={config}
            storages={storages}
            onSaveConfig={(updated) => setConfig(updated)}
            onAddStorage={handleAddStorage}
            onRemoveStorage={handleRemoveStorage}
          />
        )}

        {activeTab === 'termux' && (
          <TermuxGuideView />
        )}
      </main>

      {/* VLC Stream Modal */}
      {vlcModalFile && (
        <VlcModal
          file={vlcModalFile}
          serverIp={tvIp}
          serverPort={config.port}
          onClose={() => setVlcModalFile(null)}
          onPlayInBrowser={(f) => {
            setVlcModalFile(null);
            setBrowserPlayerFile(f);
          }}
        />
      )}

      {/* Browser Media Player Modal */}
      {browserPlayerFile && (
        <MediaPlayerModal
          file={browserPlayerFile}
          onClose={() => setBrowserPlayerFile(null)}
          onSwitchToVlc={(f) => {
            setBrowserPlayerFile(null);
            setVlcModalFile(f);
          }}
        />
      )}

      {/* Interactive Android TV Remote Control Simulator */}
      <TvRemoteOverlay onNavigate={handleRemoteNavigate} />

      {/* Elegant Dark Footer from Spec */}
      <footer className="border-t border-gray-800 bg-black px-6 sm:px-8 py-3.5 flex flex-wrap items-center justify-between text-[11px] text-gray-500 gap-4 mt-auto">
        <div className="flex items-center gap-5">
          <span className="flex items-center gap-1.5"><span className="text-gray-400">CPU:</span> <strong className="text-gray-300 font-mono">14%</strong></span>
          <span className="text-gray-800">|</span>
          <span className="flex items-center gap-1.5"><span className="text-gray-400">RAM:</span> <strong className="text-gray-300 font-mono">420MB / 1.5GB</strong></span>
          <span className="text-gray-800">|</span>
          <span className="flex items-center gap-1.5"><span className="text-gray-400">فعال:</span> <strong className="text-amber-400 font-mono">2 کلاینت</strong></span>
        </div>
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5 text-gray-300">
            <span className="w-2 h-2 bg-amber-500 rounded-full animate-pulse"></span>
            HTTP Range Requests فعال (RFC 7233)
          </span>
          <span className="text-gray-800">|</span>
          <span className="text-gray-500">Powered by Flask on Android TV</span>
        </div>
      </footer>

    </div>
  );
}
