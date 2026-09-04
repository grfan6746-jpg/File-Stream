import React from 'react';
import { MediaFile } from '../types';
import { X, Play, Volume2, Image as ImageIcon } from 'lucide-react';

interface MediaPlayerModalProps {
  file: MediaFile;
  onClose: () => void;
}

export const MediaPlayerModal: React.FC<MediaPlayerModalProps> = ({ file, onClose }) => {
  const sampleVideoUrl = 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4';
  const sampleAudioUrl = 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3';
  const sampleImageUrl = 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1200&q=80';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-xs animate-in fade-in duration-200" dir="rtl">
      <div className="relative w-full max-w-2xl rounded-2xl border border-gray-800 bg-[#111111] p-6 text-gray-200 shadow-2xl">
        
        {/* Header - Elegant Dark */}
        <div className="flex items-center justify-between border-b border-gray-800 pb-3.5 mb-4">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500 text-black font-bold">
              {file.type === 'video' ? <Play className="h-4 w-4 fill-black" /> : file.type === 'audio' ? <Volume2 className="h-4 w-4" /> : <ImageIcon className="h-4 w-4" />}
            </span>
            <div>
              <h3 className="text-base font-bold text-gray-100">{file.name}</h3>
              <p className="text-xs text-gray-500">{file.storageName} &bull; {file.sizeStr}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-800 hover:text-gray-100 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Player Container */}
        <div className="overflow-hidden rounded-xl bg-black border border-gray-800 flex items-center justify-center min-h-[260px]">
          {file.type === 'video' && (
            <video
              controls
              autoPlay
              className="w-full max-h-[380px] object-contain rounded-lg"
              src={sampleVideoUrl}
            >
              مرورگر شما از تگ ویدیو پشتیبانی نمی‌کند.
            </video>
          )}

          {file.type === 'audio' && (
            <div className="flex flex-col items-center justify-center p-8 w-full">
              <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 animate-pulse">
                <Volume2 className="h-10 w-10" />
              </div>
              <p className="text-sm font-semibold mb-4 text-gray-300">{file.name}</p>
              <audio controls autoPlay className="w-full max-w-md" src={sampleAudioUrl}>
                مرورگر شما از تگ صوتی پشتیبانی نمی‌کند.
              </audio>
            </div>
          )}

          {file.type === 'image' && (
            <img
              src={sampleImageUrl}
              alt={file.name}
              className="max-h-[380px] w-full object-contain"
            />
          )}

          {file.type === 'other' && (
            <div className="p-8 text-center text-gray-500">
              <p>این فایل برای پخش مستقیم نیست.</p>
            </div>
          )}
        </div>

        {/* Notice badge - Elegant Dark */}
        <div className="mt-4 flex items-center justify-between text-xs text-gray-400 bg-gray-900/60 p-3 rounded-xl border border-gray-800">
          <span className="flex items-center gap-1.5 text-gray-300">
            <span className="w-2 h-2 bg-amber-500 rounded-full"></span>
            پروتکل HTTP Range فعال است (امکان عقب و جلو بردن بدون بافرینگ).
          </span>
          <span className="font-mono text-amber-400 text-[11px]">Chunk Size: 1024 KB</span>
        </div>

      </div>
    </div>
  );
};
