import React, { useState } from 'react';
import { ServerConfig, StorageItem } from '../types';
import { Settings, Save, Plus, Trash2, Eye, EyeOff, Check, ShieldCheck } from 'lucide-react';

interface SettingsViewProps {
  config: ServerConfig;
  storages: StorageItem[];
  onSaveConfig: (updated: ServerConfig) => void;
  onAddStorage: (name: string, path: string) => void;
  onRemoveStorage: (id: string) => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  config,
  storages,
  onSaveConfig,
  onAddStorage,
  onRemoveStorage,
}) => {
  const [formData, setFormData] = useState<ServerConfig>({ ...config });
  const [showPassword, setShowPassword] = useState(false);
  const [newStorageName, setNewStorageName] = useState('');
  const [newStoragePath, setNewStoragePath] = useState('');
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveConfig(formData);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const handleAddCustomStorage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStorageName.trim() || !newStoragePath.trim()) return;
    const cleanName = newStorageName.trim().replace(/\//g, '-').replace(/\\/g, '-');
    onAddStorage(cleanName, newStoragePath.trim());
    setNewStorageName('');
    setNewStoragePath('');
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto" dir="rtl">
      
      {/* Header - Elegant Dark */}
      <div className="flex items-center justify-between border-b border-gray-800 pb-4">
        <div>
          <h2 className="text-xl font-bold text-gray-100 flex items-center gap-2.5">
            <Settings className="h-6 w-6 text-amber-500" />
            تنظیمات مدیا سرور خانگی
          </h2>
          <p className="text-xs text-gray-500 mt-1">پیکربندی پورت، امنیت، رمز عبور و مدیریت حافظه‌های متصل به Android TV</p>
        </div>

        {savedSuccess && (
          <div className="flex items-center gap-1.5 rounded-xl bg-green-500/10 border border-green-500/30 px-3.5 py-1.5 text-xs text-green-400">
            <Check className="h-4 w-4" /> ذخیره شد!
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Main Server Settings Form - Elegant Dark */}
        <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl border border-gray-800 bg-[#111111] p-6 shadow-xl">
          <h3 className="text-sm font-bold text-gray-200 border-b border-gray-800 pb-3 flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-amber-500" />
            مشخصات پایه و شبکه
          </h3>

          <div>
            <label className="mb-1.5 block text-xs font-semibold text-gray-300">نام سرور (Server Name):</label>
            <input
              type="text"
              value={formData.server_name}
              onChange={(e) => setFormData({ ...formData, server_name: e.target.value })}
              className="w-full rounded-xl border border-gray-700 bg-black px-3.5 py-2.5 text-xs text-gray-200 outline-none focus:border-amber-500 transition-colors"
              required
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold text-gray-300">پورت شبکه (Port):</label>
            <input
              type="number"
              value={formData.port}
              onChange={(e) => setFormData({ ...formData, port: parseInt(e.target.value) || 8080 })}
              className="w-full rounded-xl border border-gray-700 bg-black px-3.5 py-2.5 text-xs font-mono text-amber-200 outline-none focus:border-amber-500 transition-colors"
              min={1024}
              max={65535}
              required
            />
            <span className="text-[11px] text-gray-500 mt-1 block">پیش‌فرض: 8080 (در Termux بدون روت اجرا می‌شود)</span>
          </div>

          {/* Password Protection Toggle */}
          <div className="pt-2 border-t border-gray-800">
            <div className="flex items-center justify-between mb-3">
              <div>
                <label className="text-xs font-bold text-gray-200">حفاظت با رمز عبور (Authentication)</label>
                <p className="text-[11px] text-gray-500">نیاز به لاگین برای دسترسی به فایل‌های استریم</p>
              </div>
              <input
                type="checkbox"
                checked={formData.authentication}
                onChange={(e) => setFormData({ ...formData, authentication: e.target.checked })}
                className="h-4 w-4 rounded accent-amber-500"
              />
            </div>

            {formData.authentication && (
              <div className="space-y-3 rounded-xl bg-black p-3.5 border border-gray-800">
                <div>
                  <label className="mb-1 block text-xs text-gray-400">نام کاربری:</label>
                  <input
                    type="text"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    className="w-full rounded-lg border border-gray-700 bg-gray-900 px-3 py-1.5 text-xs text-gray-200 outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs text-gray-400">رمز عبور:</label>
                  <div className="flex gap-2">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className="w-full rounded-lg border border-gray-700 bg-gray-900 px-3 py-1.5 text-xs text-gray-200 outline-none focus:border-amber-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="rounded-lg border border-gray-700 bg-gray-800 px-2.5 text-gray-400 hover:text-gray-200"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-gray-800">
            <div>
              <span className="text-xs font-semibold text-gray-300">نمایش فایل‌های مخفی (Hidden Files)</span>
              <p className="text-[11px] text-gray-500">فایل‌های آغاز شده با نقطه (.nomedia)</p>
            </div>
            <input
              type="checkbox"
              checked={formData.show_hidden_files}
              onChange={(e) => setFormData({ ...formData, show_hidden_files: e.target.checked })}
              className="h-4 w-4 rounded accent-amber-500"
            />
          </div>

          <button
            type="submit"
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-amber-500 hover:bg-amber-400 py-3 text-xs font-bold text-black transition-all shadow-md shadow-amber-500/20"
          >
            <Save className="h-4 w-4" />
            ذخیره تنظیمات در config.json
          </button>
        </form>

        {/* Storages List & Add Storage - Elegant Dark */}
        <div className="space-y-4">
          
          {/* Add Storage Box */}
          <div className="rounded-2xl border border-gray-800 bg-[#111111] p-6 space-y-3 shadow-xl">
            <h3 className="text-sm font-bold text-gray-200 border-b border-gray-800 pb-3 flex items-center gap-2">
              <Plus className="h-4 w-4 text-amber-500" />
              افزودن درایو USB یا پوشه جدید
            </h3>

            <form onSubmit={handleAddCustomStorage} className="space-y-3">
              <div>
                <label className="mb-1 block text-xs font-semibold text-gray-300">نام نمایشی درایو:</label>
                <input
                  type="text"
                  placeholder="مثال: Flash Kingston 128GB"
                  value={newStorageName}
                  onChange={(e) => setNewStorageName(e.target.value)}
                  className="w-full rounded-xl border border-gray-700 bg-black px-3.5 py-2 text-xs text-gray-200 outline-none focus:border-amber-500"
                  required
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-gray-300">مسیر در اندروید / Termux:</label>
                <input
                  type="text"
                  placeholder="مثال: ~/storage/external-1 یا /storage/1234-ABCD"
                  value={newStoragePath}
                  onChange={(e) => setNewStoragePath(e.target.value)}
                  className="w-full rounded-xl border border-gray-700 bg-black px-3.5 py-2 text-xs font-mono text-amber-200 outline-none focus:border-amber-500"
                  dir="ltr"
                  required
                />
              </div>

              {/* Path Suggestion Chips */}
              <div className="space-y-1.5 pt-1">
                <span className="text-[11px] text-gray-500">مسیرهای متداول USB در Termux:</span>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      setNewStorageName('USB Drive 1');
                      setNewStoragePath('~/storage/external-1');
                    }}
                    className="rounded-lg bg-gray-800 hover:bg-gray-700 px-2.5 py-1 text-[11px] text-gray-300 border border-gray-700"
                    dir="ltr"
                  >
                    ~/storage/external-1
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setNewStorageName('USB Drive 2');
                      setNewStoragePath('~/storage/external-2');
                    }}
                    className="rounded-lg bg-gray-800 hover:bg-gray-700 px-2.5 py-1 text-[11px] text-gray-300 border border-gray-700"
                    dir="ltr"
                  >
                    ~/storage/external-2
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setNewStorageName('External HDD (17F8-2C26)');
                      setNewStoragePath('/storage/17F8-2C26');
                    }}
                    className="rounded-lg bg-emerald-950/60 hover:bg-emerald-900/80 px-2.5 py-1 text-[11px] text-emerald-300 border border-emerald-700/60 font-medium"
                    dir="ltr"
                  >
                    /storage/17F8-2C26 (هارد اکسترنال شما)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setNewStorageName('Android USB Direct');
                      setNewStoragePath('/storage/17F8-2C26');
                    }}
                    className="rounded-lg bg-gray-800 hover:bg-gray-700 px-2.5 py-1 text-[11px] text-gray-300 border border-gray-700"
                    dir="ltr"
                  >
                    /storage/XXXX-XXXX
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="w-full rounded-xl bg-gray-800 hover:bg-amber-500 hover:text-black border border-gray-700 hover:border-amber-500 py-2.5 text-xs font-bold text-gray-200 transition-all"
              >
                + ثبت و افزودن حافظه
              </button>
            </form>
          </div>

          {/* Current Storages List */}
          <div className="rounded-2xl border border-gray-800 bg-[#111111] p-6 space-y-3 shadow-xl">
            <h3 className="text-sm font-bold text-gray-200 border-b border-gray-800 pb-3">
              حافظه‌های فعال فعلی ({storages.length})
            </h3>

            <div className="space-y-2">
              {storages.map((st) => (
                <div
                  key={st.id}
                  className="flex items-center justify-between rounded-xl border border-gray-800 bg-black p-3.5 text-xs hover:border-gray-700 transition-colors"
                >
                  <div>
                    <p className="font-bold text-gray-200">{st.name}</p>
                    <span className="font-mono text-gray-500 text-[11px] mt-0.5 block" dir="ltr">{st.path}</span>
                  </div>
                  {storages.length > 1 && (
                    <button
                      onClick={() => onRemoveStorage(st.id)}
                      className="rounded-lg p-1.5 text-rose-400 hover:bg-rose-500/20 hover:text-rose-300 transition-colors"
                      title="حذف حافظه"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};
