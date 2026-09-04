import React, { useState } from 'react';
import { StorageItem, MediaFile } from '../types';
import { 
  Tv, HardDrive, Folder, RefreshCw, Search, 
  Copy, Check, Film, Music, Image as ImageIcon,
  Play, ExternalLink, QrCode
} from 'lucide-react';

interface DashboardViewProps {
  serverName: string;
  serverIp: string;
  serverPort: number;
  storages: StorageItem[];
  files: MediaFile[];
  onSelectStorage: (storage: StorageItem) => void;
  onOpenFileModal: (file: MediaFile) => void;
  onRefreshStorages: () => void;
  isRefreshing: boolean;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  serverName,
  serverIp,
  serverPort,
  storages,
  files,
  onSelectStorage,
  onOpenFileModal,
  onRefreshStorages,
  isRefreshing,
}) => {
  const [copiedIp, setCopiedIp] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);

  const serverWebUrl = `http://${serverIp}:${serverPort}/`;
  const serverQrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=140x140&data=${encodeURIComponent(serverWebUrl)}&margin=2`;

  const handleCopyIp = () => {
    navigator.clipboard.writeText(serverIp);
    setCopiedIp(true);
    setTimeout(() => setCopiedIp(false), 2000);
  };

  const filteredFiles = searchQuery.trim()
    ? files.filter(f => f.name.toLowerCase().includes(searchQuery.toLowerCase().trim()))
    : [];

  return (
    <div className="space-y-6" dir="rtl">
      
      {/* Hero Status Banner - Elegant Dark */}
      <div className="rounded-2xl border border-gray-800 bg-[#111111] p-6 sm:p-7 shadow-2xl">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          
          <div className="flex-1 space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full bg-green-500/10 border border-green-500/20 px-3 py-1 text-xs font-semibold text-green-400">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
              </span>
              سرور محلی آنلاین است &bull; Port {serverPort}
            </div>

            <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-100 flex items-center gap-3">
              <span className="w-8 h-8 rounded-lg bg-amber-500 flex items-center justify-center text-black text-base font-black shrink-0">M</span>
              {serverName}
            </h2>
            
            <p className="text-xs sm:text-sm text-gray-400 max-w-2xl leading-relaxed">
              اشتراک‌گذاری مستقیم فیلم‌ها، آهنگ‌ها و تصاویر حافظه داخلی و هاردهای USB متصل به تلویزیون به اپلیکیشن VLC در گوشی بدون ترنسکودینگ و با صفر درصد بار پردازشی روی تلویزیون.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <div className="flex items-center gap-2.5 rounded-xl bg-gray-900/80 border border-gray-800 px-3.5 py-2 text-xs">
                <span className="text-gray-500 text-[11px] uppercase tracking-wider">آدرس IP:</span>
                <span className="font-mono font-bold text-amber-200" dir="ltr">{serverIp}</span>
                <button
                  onClick={handleCopyIp}
                  className="rounded-lg bg-gray-800 hover:bg-gray-700 px-2 py-0.5 text-[11px] text-gray-300 transition-colors flex items-center gap-1 border border-gray-700"
                >
                  {copiedIp ? <Check className="h-3 w-3 text-green-400" /> : <Copy className="h-3 w-3" />}
                  {copiedIp ? 'کپی شد' : 'کپی'}
                </button>
              </div>

              <div className="flex items-center gap-2 rounded-xl bg-gray-900/80 border border-gray-800 px-3.5 py-2 text-xs">
                <span className="text-gray-500 text-[11px] uppercase tracking-wider">پورت:</span>
                <span className="font-mono font-bold text-amber-200">{serverPort}</span>
              </div>

              <a
                href={serverWebUrl}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 rounded-xl bg-amber-500/10 border border-amber-500/30 px-3.5 py-2 text-xs font-semibold text-amber-400 hover:bg-amber-500/20 transition-colors"
                dir="ltr"
              >
                {serverWebUrl}
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </div>

          {/* Quick QR Code for Phone */}
          <div className="flex shrink-0 flex-col items-center justify-center rounded-2xl border border-gray-800 bg-[#0a0a0a] p-4 text-center">
            <div className="rounded-xl bg-white p-2 shadow-md">
              <img
                src={serverQrUrl}
                alt="Server QR"
                className="h-28 w-28 object-contain"
                loading="eager"
              />
            </div>
            <span className="mt-2.5 text-[11px] font-medium text-gray-400 flex items-center gap-1">
              <QrCode className="h-3.5 w-3.5 text-amber-500" />
              اسکن جهت ورود با گوشی
            </span>
          </div>

        </div>
      </div>

      {/* Global Search Bar - Elegant Dark */}
      <div className="relative">
        <div className="flex items-center rounded-2xl border border-gray-700 bg-gray-900/80 px-4 py-3 shadow-inner focus-within:border-amber-500 transition-colors">
          <Search className="h-4 w-4 text-gray-500 ml-3 shrink-0" />
          <input
            type="text"
            placeholder="جستجوی فیلم، موسیقی یا عکس در تمام حافظه‌ها و درایوهای USB (مثال: Oppenheimer یا Interstellar)..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setSearchOpen(e.target.value.trim().length > 0);
            }}
            className="w-full bg-transparent text-xs sm:text-sm text-gray-100 placeholder-gray-500 outline-none"
          />
          {searchQuery && (
            <button
              onClick={() => {
                setSearchQuery('');
                setSearchOpen(false);
              }}
              className="text-xs text-gray-400 hover:text-gray-200 px-2 py-1 rounded"
            >
              پاک کردن
            </button>
          )}
        </div>

        {/* Search Results Dropdown */}
        {searchOpen && (
          <div className="absolute left-0 right-0 top-full mt-2 z-30 max-h-96 overflow-y-auto rounded-2xl border border-gray-700 bg-[#111111] p-3.5 shadow-2xl">
            <div className="mb-2 flex items-center justify-between border-b border-gray-800 pb-2 text-xs font-semibold text-gray-400">
              <span>نتایج جستجو برای "{searchQuery}" ({filteredFiles.length} مورد)</span>
              <button
                onClick={() => setSearchOpen(false)}
                className="hover:text-gray-200 text-gray-500"
              >
                بستن &times;
              </button>
            </div>

            {filteredFiles.length === 0 ? (
              <div className="py-6 text-center text-xs text-gray-500">
                فایلی مطابق با عبارت جستجو شده پیدا نشد.
              </div>
            ) : (
              <div className="space-y-2">
                {filteredFiles.map((file) => (
                  <div
                    key={file.id}
                    className="flex items-center justify-between rounded-xl bg-gray-900/60 p-3 hover:bg-gray-800/60 border border-gray-800 hover:border-gray-700 transition-all"
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1 ml-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gray-800 text-amber-400 shrink-0">
                        {file.type === 'video' ? <Film className="h-4 w-4" /> : file.type === 'audio' ? <Music className="h-4 w-4" /> : <ImageIcon className="h-4 w-4" />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold text-gray-200 truncate">{file.name}</p>
                        <p className="text-[11px] text-gray-500">{file.storageName} &bull; {file.sizeStr}</p>
                      </div>
                    </div>

                    <button
                      onClick={() => onOpenFileModal(file)}
                      className="flex items-center gap-1.5 rounded-xl bg-amber-500/10 text-amber-500 border border-amber-500/20 px-3.5 py-1.5 text-xs font-bold hover:bg-amber-500 hover:text-black transition-all shrink-0"
                    >
                      <Play className="h-3 w-3 fill-current" /> پخش در VLC
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Storages Section Header */}
      <div className="flex items-center justify-between pt-2">
        <div>
          <h3 className="text-base sm:text-lg font-bold text-gray-100 flex items-center gap-2">
            <HardDrive className="h-5 w-5 text-amber-500" />
            حافظه‌های متصل و درایوهای USB ({storages.length})
          </h3>
          <p className="text-xs text-gray-500 mt-0.5">مسیرهای پیکربندی شده در حافظه تلویزیون</p>
        </div>

        <button
          onClick={onRefreshStorages}
          disabled={isRefreshing}
          className="flex items-center gap-2 rounded-xl bg-gray-800 hover:bg-gray-700 border border-gray-700 px-4 py-2 text-xs font-semibold text-gray-200 transition-all disabled:opacity-50"
        >
          <RefreshCw className={`h-3.5 w-3.5 text-amber-400 ${isRefreshing ? 'animate-spin' : ''}`} />
          {isRefreshing ? 'در حال اسکن USB...' : 'بروزرسانی لیست'}
        </button>
      </div>

      {/* Storages Grid - Elegant Dark Card Layout */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {storages.map((st) => (
          <div
            key={st.id}
            className="flex flex-col justify-between rounded-2xl border border-gray-800 bg-[#111111] p-5 transition-all hover:border-amber-500 group shadow-lg"
          >
            <div>
              <div className="flex items-start justify-between gap-2 mb-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gray-800/80 text-amber-400 border border-gray-700/60 group-hover:scale-105 transition-transform">
                    {st.type === 'usb' ? <HardDrive className="h-5 w-5" /> : <Folder className="h-5 w-5" />}
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-gray-200 line-clamp-1">{st.name}</h4>
                    <span className="font-mono text-[11px] text-gray-500 block mt-0.5" dir="ltr">{st.path}</span>
                  </div>
                </div>
              </div>

              {/* Disk usage bar from Elegant Dark spec */}
              <div className="space-y-1.5 mb-5">
                <div className="flex justify-between text-[11px] text-gray-400">
                  <span>مصرف شده: {st.usedStr}</span>
                  <span className="font-semibold text-amber-400">{st.percentUsed}%</span>
                </div>
                <div className="w-full bg-gray-700 h-1.5 rounded-full overflow-hidden">
                  <div
                    className="bg-amber-500 h-full rounded-full transition-all duration-500"
                    style={{ width: `${st.percentUsed}%` }}
                  />
                </div>
                <div className="flex justify-between text-[10px] text-gray-500 pt-0.5">
                  <span>آزاد: {st.freeStr}</span>
                  <span>کل: {st.totalStr}</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => onSelectStorage(st)}
              className="w-full py-2.5 bg-gray-800 hover:bg-amber-600 hover:text-black border border-gray-700 hover:border-amber-500 rounded-xl text-xs font-bold text-gray-200 transition-all flex items-center justify-center gap-2"
            >
              <Folder className="h-3.5 w-3.5" />
              مشاهده محتوا و فایل‌ها
            </button>
          </div>
        ))}
      </div>

      {/* VLC Quick Instructions - Elegant Dark */}
      <div className="rounded-2xl border border-gray-800 bg-[#111111] p-6 shadow-xl">
        <div className="flex items-center gap-3 mb-4">
          <span className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center font-black text-xs border border-amber-500/30">
            VLC
          </span>
          <h4 className="text-sm font-bold text-gray-200">راهنمای پخش مستقیم در VLC بدون دانلود فایل</h4>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-gray-400">
          <div className="flex items-start gap-3 rounded-xl bg-gray-900/60 p-4 border border-gray-800">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-amber-500 text-black font-extrabold text-[11px]">
              ۱
            </span>
            <p className="leading-relaxed">گوشی و تلویزیون را به <strong>یک شبکه Wi-Fi مشترک</strong> وصل کنید تا دستگاه‌ها یکدیگر را ببینند.</p>
          </div>

          <div className="flex items-start gap-3 rounded-xl bg-gray-900/60 p-4 border border-gray-800">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-amber-500 text-black font-extrabold text-[11px]">
              ۲
            </span>
            <p className="leading-relaxed">روی هر فایل ویدیویی دکمه <strong>«پخش در VLC»</strong> را بزنید تا مستقیماً با پروتکل <code>vlc://</code> اجرا شود.</p>
          </div>

          <div className="flex items-start gap-3 rounded-xl bg-gray-900/60 p-4 border border-gray-800">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-amber-500 text-black font-extrabold text-[11px]">
              ۳
            </span>
            <p className="leading-relaxed">همچنین با اسکن <strong>بارکد QR</strong> با دوربین گوشی، استریم آنی بدون هیچ تایپی آغاز می‌گردد.</p>
          </div>
        </div>
      </div>

    </div>
  );
};
