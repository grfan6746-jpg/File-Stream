import React, { useState } from 'react';
import { MediaFile } from '../types';
import { X, Copy, Check, ExternalLink, Play, QrCode, Tv } from 'lucide-react';

interface VlcModalProps {
  file: MediaFile;
  serverIp: string;
  serverPort: number;
  onClose: () => void;
  onPlayInBrowser: (file: MediaFile) => void;
}

export const VlcModal: React.FC<VlcModalProps> = ({
  file,
  serverIp,
  serverPort,
  onClose,
  onPlayInBrowser,
}) => {
  const [copied, setCopied] = useState(false);

  // Direct HTTP streaming URL
  const rawStreamUrl = `http://${serverIp}:${serverPort}/media/${encodeURIComponent(file.storageName)}/${encodeURIComponent(file.path)}`;
  
  // VLC custom scheme
  const vlcProtocolUrl = `vlc://${rawStreamUrl}`;

  // Android Intent scheme
  const noHttp = rawStreamUrl.replace(/^https?:\/\//, '');
  const intentUrl = `intent://${noHttp}#Intent;package=org.videolan.vlc;type=video/*;scheme=http;end`;

  // QR Code URL using high-contrast encoded endpoint
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(rawStreamUrl)}&margin=2`;

  const handleCopy = () => {
    navigator.clipboard.writeText(rawStreamUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-xs animate-in fade-in duration-200" dir="rtl">
      <div className="relative w-full max-w-lg rounded-2xl border border-gray-800 bg-[#111111] p-6 text-gray-200 shadow-2xl">
        
        {/* Header - Elegant Dark */}
        <div className="flex items-center justify-between border-b border-gray-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500 text-black font-black text-lg shadow-md shadow-amber-500/20">
              ▶
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-gray-100">پخش استریم در اپلیکیشن VLC</h3>
              <p className="text-xs text-gray-500">پروتکل HTTP Range (RFC 7233) بدون Transcoding</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-800 hover:text-gray-100 transition-colors"
            aria-label="بستن"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* File Details - Elegant Dark */}
        <div className="my-4 rounded-xl bg-gray-900/60 p-4 border border-gray-800">
          <div className="flex items-start justify-between gap-2">
            <p className="font-semibold text-sm text-amber-400 break-all">{file.name}</p>
          </div>
          <div className="mt-2.5 flex flex-wrap gap-2 text-xs text-gray-400">
            <span className="rounded bg-black px-2 py-0.5 border border-gray-800 uppercase font-mono text-gray-300">{file.extension}</span>
            <span className="rounded bg-black px-2 py-0.5 border border-gray-800 font-mono text-gray-300">{file.sizeStr}</span>
            {file.videoQuality && (
              <span className="rounded bg-amber-500/10 text-amber-400 px-2 py-0.5 border border-amber-500/30 font-semibold">{file.videoQuality}</span>
            )}
            {file.duration && (
              <span className="rounded bg-black px-2 py-0.5 border border-gray-800 font-mono">⏱️ {file.duration}</span>
            )}
            <span className="rounded bg-green-500/10 text-green-400 px-2 py-0.5 border border-green-500/20">✓ ۰٪ بار CPU تلویزیون</span>
          </div>
        </div>

        {/* QR Code & Mobile Scan - Elegant Dark */}
        <div className="my-4 flex flex-col items-center justify-center rounded-xl bg-[#0a0a0a] p-4 border border-gray-800">
          <div className="rounded-xl bg-white p-2.5 shadow-md">
            <img
              src={qrCodeUrl}
              alt="QR Code"
              className="h-36 w-36 object-contain"
              loading="eager"
            />
          </div>
          <div className="mt-2.5 text-center">
            <span className="flex items-center justify-center gap-1.5 text-xs font-medium text-gray-300">
              <QrCode className="h-3.5 w-3.5 text-amber-500" />
              اسکن با دوربین گوشی جهت باز شدن فوری استریم در VLC
            </span>
            <span className="text-[11px] text-gray-500">گوشی و تلویزیون باید به یک وای‌فای متصل باشند</span>
          </div>
        </div>

        {/* URL Input & Copy */}
        <div className="mb-4">
          <label className="mb-1.5 block text-xs font-semibold text-gray-400">لینک مستقیم استریم (Direct Stream URL):</label>
          <div className="flex gap-2">
            <input
              type="text"
              readOnly
              value={rawStreamUrl}
              className="w-full rounded-xl border border-gray-700 bg-black px-3.5 py-2 text-xs font-mono text-amber-200 outline-none select-all"
              dir="ltr"
            />
            <button
              onClick={handleCopy}
              className="flex shrink-0 items-center gap-1.5 rounded-xl bg-gray-800 hover:bg-gray-700 border border-gray-700 px-3.5 py-2 text-xs font-bold text-gray-200 transition-colors"
            >
              {copied ? (
                <>
                  <Check className="h-3.5 w-3.5 text-green-400" /> کپی شد
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5 text-amber-400" /> کپی
                </>
              )}
            </button>
          </div>
        </div>

        {/* Action Buttons - Elegant Dark */}
        <div className="flex flex-col gap-2.5">
          <a
            href={vlcProtocolUrl}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-sm px-4 py-3 transition-all shadow-lg shadow-amber-500/20"
          >
            <Play className="h-4 w-4 fill-black" /> باز کردن مستقیم در اپلیکیشن VLC (پروتکل vlc://)
          </a>

          <div className="grid grid-cols-2 gap-2.5">
            <a
              href={intentUrl}
              className="flex items-center justify-center gap-1.5 rounded-xl border border-gray-700 bg-gray-800 hover:bg-gray-700 px-3 py-2.5 text-xs font-semibold text-gray-200 transition-colors"
            >
              <ExternalLink className="h-3.5 w-3.5 text-gray-400" /> ارسال به Intent اندروید
            </a>

            <button
              onClick={() => onPlayInBrowser(file)}
              className="flex items-center justify-center gap-1.5 rounded-xl border border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20 px-3 py-2.5 text-xs font-semibold text-amber-400 transition-colors"
            >
              <Tv className="h-3.5 w-3.5" /> پیش‌نمایش در مرورگر
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
