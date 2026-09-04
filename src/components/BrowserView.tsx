import React, { useState } from 'react';
import { StorageItem, MediaFile } from '../types';
import { 
  ArrowRight, Film, Music, Image as ImageIcon, FileText, 
  Play, Copy, QrCode, Tv, Folder, Check, LayoutGrid, List
} from 'lucide-react';

interface BrowserViewProps {
  storage: StorageItem;
  files: MediaFile[];
  onBackToDashboard: () => void;
  onOpenFileModal: (file: MediaFile) => void;
  onPlayInBrowser: (file: MediaFile) => void;
}

export const BrowserView: React.FC<BrowserViewProps> = ({
  storage,
  files,
  onBackToDashboard,
  onOpenFileModal,
  onPlayInBrowser,
}) => {
  const [sortKey, setSortKey] = useState<'name-asc' | 'name-desc' | 'size-desc' | 'size-asc' | 'type'>('name-asc');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Filter files belonging to this storage (or show all if matching)
  const storageFiles = files.filter(f => f.storageId === storage.id || files.length <= 8);

  const sortedFiles = [...storageFiles].sort((a, b) => {
    switch (sortKey) {
      case 'name-asc':
        return a.name.localeCompare(b.name);
      case 'name-desc':
        return b.name.localeCompare(a.name);
      case 'size-desc':
        return b.size - a.size;
      case 'size-asc':
        return a.size - b.size;
      case 'type':
        return a.type.localeCompare(b.type) || a.name.localeCompare(b.name);
      default:
        return 0;
    }
  });

  const handleCopyLink = (file: MediaFile) => {
    navigator.clipboard.writeText(file.streamUrl);
    setCopiedId(file.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-6" dir="rtl">
      
      {/* Navigation & Breadcrumb Bar - Elegant Dark */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-gray-800 bg-[#111111] p-4 shadow-xl">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <button
            onClick={onBackToDashboard}
            className="flex items-center gap-1.5 text-gray-500 hover:text-amber-400 transition-colors"
          >
            <span>🏠</span> خانه
          </button>
          <span className="text-gray-600">/</span>
          <span className="text-gray-400 font-normal">{storage.name}</span>
          <span className="text-gray-600">/</span>
          <span className="font-bold text-amber-500 flex items-center gap-1">
            <Folder className="h-4 w-4" />
            فایل‌های چندرسانه‌ای
          </span>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onBackToDashboard}
            className="flex items-center gap-1.5 rounded-xl border border-gray-700 bg-gray-800 hover:bg-gray-700 px-3.5 py-1.5 text-xs font-semibold text-gray-200 transition-all"
          >
            <ArrowRight className="h-3.5 w-3.5" />
            بازگشت به حافظه‌ها
          </button>

          {/* View Mode Toggle */}
          <div className="flex items-center rounded-lg border border-gray-700 bg-gray-900 p-0.5">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded text-xs transition-colors ${viewMode === 'grid' ? 'bg-amber-500 text-black font-bold' : 'text-gray-400 hover:text-gray-200'}`}
              title="نمایش کارتی / شبکه‌ای"
            >
              <LayoutGrid className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded text-xs transition-colors ${viewMode === 'list' ? 'bg-amber-500 text-black font-bold' : 'text-gray-400 hover:text-gray-200'}`}
              title="نمایش لیستی"
            >
              <List className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-gray-400">
            <select
              id="sort-select"
              value={sortKey}
              onChange={(e) => setSortKey(e.target.value as any)}
              className="rounded-lg border border-gray-700 bg-gray-900 px-3 py-1.5 text-xs text-gray-200 outline-none hover:border-amber-500 focus:border-amber-500 transition-colors"
            >
              <option value="name-asc">مرتب‌سازی: نام (الف تا ی)</option>
              <option value="name-desc">مرتب‌سازی: نام (ی تا الف)</option>
              <option value="size-desc">مرتب‌سازی: حجم (بیشترین)</option>
              <option value="size-asc">مرتب‌سازی: حجم (کمترین)</option>
              <option value="type">مرتب‌سازی: نوع فایل</option>
            </select>
          </div>
        </div>
      </div>

      {/* Storage Path & Info Banner - Elegant Dark */}
      <div className="rounded-xl border border-gray-800 bg-[#111111]/80 p-3.5 text-xs text-gray-400 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-gray-500">مسیر در حافظه تلویزیون:</span>
          <code className="rounded bg-gray-800 px-2 py-0.5 font-mono text-amber-200 border border-gray-700/60" dir="ltr">
            {storage.path}
          </code>
        </div>
        <div>
          <span>فضای آزاد: <strong className="text-gray-200 font-mono">{storage.freeStr}</strong> از کل <span className="font-mono">{storage.totalStr}</span></span>
        </div>
      </div>

      {/* Files List - Elegant Dark */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs font-bold text-gray-400">
          <span>فایل‌های چندرسانه‌ای موجود ({sortedFiles.length})</span>
          <span className="text-green-400 flex items-center gap-1">
            <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
            استریم مستقیم HTTP Range فعال است
          </span>
        </div>

        {sortedFiles.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-gray-800 p-12 text-center text-gray-500 bg-[#111111]">
            <Folder className="mx-auto h-12 w-12 text-gray-700 mb-2" />
            <p className="font-semibold text-sm text-gray-400">هیچ فایلی در این حافظه یافت نشد.</p>
            <p className="text-xs text-gray-600 mt-1">فیلم‌ها یا آهنگ‌های خود را در این مسیر قرار دهید.</p>
          </div>
        ) : viewMode === 'grid' ? (
          /* Grid View from Elegant Dark spec */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {sortedFiles.map((file) => (
              <div
                key={file.id}
                className="bg-gray-900/40 border border-gray-800 rounded-2xl p-4 hover:border-amber-500 group transition-all flex flex-col justify-between shadow-lg"
              >
                <div>
                  <div className="h-32 bg-gray-800 rounded-xl mb-3.5 flex items-center justify-center text-4xl group-hover:scale-105 transition-transform select-none">
                    {file.type === 'video' ? '🎬' : file.type === 'audio' ? '🎵' : file.type === 'image' ? '🖼️' : '📁'}
                  </div>

                  <h4 className="text-sm font-medium text-gray-200 truncate mb-1" title={file.name}>
                    {file.name}
                  </h4>

                  <p className="text-xs text-gray-500">
                    <span className="font-mono">{file.sizeStr}</span> &bull; {file.extension.toUpperCase()} {file.type === 'video' ? 'Video' : file.type === 'audio' ? 'Audio' : 'Media'}
                  </p>

                  {file.videoQuality && (
                    <div className="mt-2">
                      <span className="rounded bg-amber-500/10 text-amber-400 text-[10px] font-semibold px-2 py-0.5 border border-amber-500/20">
                        {file.videoQuality}
                      </span>
                    </div>
                  )}
                </div>

                <div className="mt-4 flex items-center gap-2">
                  <button
                    onClick={() => onOpenFileModal(file)}
                    className="flex-1 py-2 bg-amber-500/10 text-amber-500 border border-amber-500/20 rounded-lg text-xs font-bold hover:bg-amber-500 hover:text-black transition-all flex items-center justify-center gap-1.5"
                  >
                    <Play className="h-3.5 w-3.5 fill-current" />
                    پخش در VLC
                  </button>

                  <button
                    onClick={() => onOpenFileModal(file)}
                    className="w-10 h-8 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg flex items-center justify-center text-xs text-gray-300 transition-colors"
                    title="QR Code"
                  >
                    📱
                  </button>

                  <button
                    onClick={() => handleCopyLink(file)}
                    className="w-10 h-8 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg flex items-center justify-center text-xs text-gray-300 transition-colors"
                    title="کپی لینک"
                  >
                    {copiedId === file.id ? <Check className="h-3.5 w-3.5 text-green-400" /> : <Copy className="h-3.5 w-3.5" />}
                  </button>

                  <button
                    onClick={() => onPlayInBrowser(file)}
                    className="w-10 h-8 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg flex items-center justify-center text-xs text-gray-300 transition-colors"
                    title="پیش‌نمایش در مرورگر"
                  >
                    <Tv className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* Row List View */
          <div className="space-y-2.5">
            {sortedFiles.map((file) => (
              <div
                key={file.id}
                className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-xl border border-gray-800 bg-[#111111] p-4 transition-all hover:border-amber-500 group shadow-md"
              >
                {/* File Details */}
                <div className="flex items-center gap-3.5 min-w-0 flex-1">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gray-800 text-2xl group-hover:scale-105 transition-transform">
                    {file.type === 'video' ? '🎬' : file.type === 'audio' ? '🎵' : file.type === 'image' ? '🖼️' : '📁'}
                  </div>

                  <div className="min-w-0 flex-1">
                    <h4 className="text-sm font-bold text-gray-100 truncate" title={file.name}>
                      {file.name}
                    </h4>
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-gray-500">
                      <span className="rounded bg-gray-800 px-2 py-0.5 font-mono uppercase text-gray-300 border border-gray-700">
                        {file.extension}
                      </span>
                      <span className="rounded bg-gray-800 px-2 py-0.5 text-gray-300 border border-gray-700 font-mono">
                        {file.sizeStr}
                      </span>
                      {file.videoQuality && (
                        <span className="rounded bg-amber-500/10 text-amber-400 px-2 py-0.5 border border-amber-500/20">
                          {file.videoQuality}
                        </span>
                      )}
                      {file.duration && (
                        <span className="text-gray-500 font-mono">⏱️ {file.duration}</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex w-full sm:w-auto items-center justify-end gap-2 shrink-0">
                  <button
                    onClick={() => onOpenFileModal(file)}
                    className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black px-4 py-2 text-xs font-bold transition-all shadow-md shadow-amber-500/10"
                  >
                    <Play className="h-3.5 w-3.5 fill-black" />
                    پخش در VLC
                  </button>

                  <button
                    onClick={() => onOpenFileModal(file)}
                    className="rounded-xl border border-gray-700 bg-gray-800 p-2 text-gray-300 hover:bg-gray-700 transition-colors"
                    title="نمایش QR Code"
                  >
                    <QrCode className="h-4 w-4 text-amber-400" />
                  </button>

                  <button
                    onClick={() => handleCopyLink(file)}
                    className="rounded-xl border border-gray-700 bg-gray-800 p-2 text-gray-300 hover:bg-gray-700 transition-colors"
                    title="کپی لینک استریم"
                  >
                    {copiedId === file.id ? <Check className="h-4 w-4 text-green-400" /> : <Copy className="h-4 w-4" />}
                  </button>

                  <button
                    onClick={() => onPlayInBrowser(file)}
                    className="rounded-xl border border-gray-700 bg-gray-800 p-2 text-gray-300 hover:bg-gray-700 transition-colors"
                    title="پیش‌نمایش در مرورگر"
                  >
                    <Tv className="h-4 w-4" />
                  </button>
                </div>

              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
};
