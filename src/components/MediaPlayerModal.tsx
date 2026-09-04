import React, { useState, useRef, useEffect } from 'react';
import { MediaFile } from '../types';
import { 
  X, Play, Pause, Volume2, Volume1, VolumeX, RotateCcw, RotateCw, 
  Maximize, Minimize, Tv, ExternalLink, Sliders, Film, Music, 
  Image as ImageIcon, Upload, Check, Info, Settings2, Sparkles, RefreshCw
} from 'lucide-react';

interface MediaPlayerModalProps {
  file: MediaFile;
  onClose: () => void;
  onSwitchToVlc?: (file: MediaFile) => void;
}

const SAMPLE_STREAMS = [
  {
    name: 'Big Buck Bunny (1080p FHD)',
    url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    format: 'MP4 / H.264',
    quality: '1080p 60fps',
  },
  {
    name: 'Tears of Steel (Sci-Fi VFX)',
    url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4',
    format: 'MP4 / H.264',
    quality: '1080p Cinematic',
  },
  {
    name: 'Sintel Blender Animated Movie',
    url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4',
    format: 'MP4 / H.264',
    quality: '720p HD',
  }
];

export const MediaPlayerModal: React.FC<MediaPlayerModalProps> = ({ file, onClose, onSwitchToVlc }) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Stream source state
  const [currentVideoUrl, setCurrentVideoUrl] = useState<string>(SAMPLE_STREAMS[0].url);
  const [activePresetIndex, setActivePresetIndex] = useState<number>(0);
  const [customFileLoaded, setCustomFileLoaded] = useState<string | null>(null);

  // Playback states
  const [isPlaying, setIsPlaying] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [bufferedEnd, setBufferedEnd] = useState(0);
  const [showTechInfo, setShowTechInfo] = useState(false);
  const [showSourceSelector, setShowSourceSelector] = useState(false);
  const [playbackStatus, setPlaybackStatus] = useState<'buffering' | 'playing' | 'paused'>('playing');

  // Controls auto-hide timer
  const hideTimeoutRef = useRef<number | null>(null);

  // Format seconds to mm:ss or hh:mm:ss
  const formatTime = (secs: number) => {
    if (isNaN(secs) || secs < 0) return '00:00';
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = Math.floor(secs % 60);
    if (h > 0) {
      return `${h}:${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
    }
    return `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // Keyboard navigation shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      switch (e.code) {
        case 'Space':
          e.preventDefault();
          togglePlay();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          seekDelta(-10);
          break;
        case 'ArrowRight':
          e.preventDefault();
          seekDelta(10);
          break;
        case 'ArrowUp':
          e.preventDefault();
          adjustVolume(0.1);
          break;
        case 'ArrowDown':
          e.preventDefault();
          adjustVolume(-0.1);
          break;
        case 'KeyF':
          e.preventDefault();
          toggleFullscreen();
          break;
        case 'KeyM':
          e.preventDefault();
          toggleMute();
          break;
        case 'Escape':
          if (!document.fullscreenElement) {
            onClose();
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPlaying, volume, isMuted]);

  // Fullscreen change listener
  useEffect(() => {
    const onFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', onFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', onFullscreenChange);
  }, []);

  const handleMouseMove = () => {
    setShowControls(true);
    if (hideTimeoutRef.current) window.clearTimeout(hideTimeoutRef.current);
    hideTimeoutRef.current = window.setTimeout(() => {
      if (isPlaying) {
        setShowControls(false);
      }
    }, 3500);
  };

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current.play().then(() => {
        setIsPlaying(true);
        setPlaybackStatus('playing');
      }).catch(err => console.warn(err));
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
      setPlaybackStatus('paused');
    }
  };

  const seekDelta = (seconds: number) => {
    if (!videoRef.current) return;
    videoRef.current.currentTime = Math.max(0, Math.min(videoRef.current.duration || 0, videoRef.current.currentTime + seconds));
  };

  const handleSeekChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    if (videoRef.current) {
      videoRef.current.currentTime = val;
      setCurrentTime(val);
    }
  };

  const adjustVolume = (delta: number) => {
    if (!videoRef.current) return;
    const newVol = Math.max(0, Math.min(1, volume + delta));
    videoRef.current.volume = newVol;
    setVolume(newVol);
    if (newVol > 0 && isMuted) {
      setIsMuted(false);
      videoRef.current.muted = false;
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    if (videoRef.current) {
      videoRef.current.volume = val;
      setVolume(val);
      setIsMuted(val === 0);
      videoRef.current.muted = val === 0;
    }
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    const nextMute = !isMuted;
    videoRef.current.muted = nextMute;
    setIsMuted(nextMute);
  };

  const handleRateChange = (rate: number) => {
    if (!videoRef.current) return;
    videoRef.current.playbackRate = rate;
    setPlaybackRate(rate);
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(err => console.warn(err));
    } else {
      document.exitFullscreen().catch(err => console.warn(err));
    }
  };

  const togglePiP = async () => {
    if (!videoRef.current) return;
    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
      } else if (document.pictureInPictureEnabled) {
        await videoRef.current.requestPictureInPicture();
      }
    } catch (e) {
      console.warn('PiP error:', e);
    }
  };

  // Local file upload for instant in-browser playback
  const handleLocalFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files[0]) {
      const selectedFile = files[0];
      const blobUrl = URL.createObjectURL(selectedFile);
      setCurrentVideoUrl(blobUrl);
      setCustomFileLoaded(selectedFile.name);
      setActivePresetIndex(-1);
      setShowSourceSelector(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-2 sm:p-4 backdrop-blur-md animate-in fade-in duration-200" 
      dir="rtl"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div 
        ref={containerRef}
        onMouseMove={handleMouseMove}
        className="relative w-full max-w-5xl rounded-2xl border border-gray-800 bg-[#0d0d0d] text-gray-200 shadow-2xl overflow-hidden flex flex-col max-h-[95vh]"
      >
        
        {/* Top Header Bar */}
        <div className="flex items-center justify-between border-b border-gray-800 bg-[#141414] px-4 py-3 z-20">
          <div className="flex items-center gap-3 min-w-0">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-500 text-black font-black shadow-lg shadow-amber-500/20">
              {file.type === 'video' ? <Film className="h-4 w-4 fill-black" /> : file.type === 'audio' ? <Music className="h-4 w-4" /> : <ImageIcon className="h-4 w-4" />}
            </span>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-bold text-gray-100 truncate" title={customFileLoaded || file.name}>
                  {customFileLoaded ? `فایل محلی: ${customFileLoaded}` : file.name}
                </h3>
                <span className="shrink-0 rounded bg-amber-500/15 border border-amber-500/30 px-1.5 py-0.5 text-[10px] font-mono text-amber-400">
                  Web Player (HTML5)
                </span>
              </div>
              <p className="text-xs text-gray-500 flex items-center gap-2 mt-0.5">
                <span>{file.storageName}</span>
                <span>&bull;</span>
                <span className="font-mono">{file.sizeStr}</span>
                <span>&bull;</span>
                <span className="text-emerald-400 flex items-center gap-1 font-mono text-[11px]">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  HTTP Range (0% CPU)
                </span>
              </p>
            </div>
          </div>

          {/* Action buttons on header */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Switch to VLC button */}
            {onSwitchToVlc && (
              <button
                onClick={() => onSwitchToVlc(file)}
                className="hidden sm:inline-flex items-center gap-1.5 rounded-xl border border-gray-700 bg-gray-800/80 px-3 py-1.5 text-xs font-semibold text-gray-200 hover:bg-gray-700 hover:text-white transition-all active:scale-95"
                title="مشاهده مشخصات لینک VLC و کد QR"
              >
                <Tv className="h-3.5 w-3.5 text-amber-400" />
                <span>انتقال به VLC</span>
              </button>
            )}

            {/* Change video stream source */}
            {file.type === 'video' && (
              <button
                onClick={() => setShowSourceSelector(!showSourceSelector)}
                className={`flex items-center gap-1.5 rounded-xl border px-2.5 py-1.5 text-xs font-medium transition-all ${
                  showSourceSelector ? 'border-amber-500 bg-amber-500/10 text-amber-400' : 'border-gray-800 bg-gray-900 text-gray-300 hover:border-gray-700'
                }`}
                title="تغییر کیفیت یا انتخاب فایل تستی دیگر"
              >
                <Sliders className="h-3.5 w-3.5" />
                <span className="hidden md:inline">منبع استریم</span>
              </button>
            )}

            {/* Technical details toggle */}
            <button
              onClick={() => setShowTechInfo(!showTechInfo)}
              className={`rounded-xl border p-1.5 text-xs transition-all ${
                showTechInfo ? 'border-amber-500 bg-amber-500/10 text-amber-400' : 'border-gray-800 bg-gray-900 text-gray-400 hover:text-gray-200'
              }`}
              title="مشخصات فنی و شبکه"
            >
              <Info className="h-4 w-4" />
            </button>

            {/* Close modal */}
            <button
              onClick={onClose}
              className="rounded-xl border border-gray-800 bg-gray-900 p-1.5 text-gray-400 hover:bg-gray-800 hover:text-gray-100 transition-colors"
              title="بستن پنجره (Esc)"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Source Selector Drawer (Optional) */}
        {showSourceSelector && (
          <div className="bg-[#181818] border-b border-gray-800 p-3 sm:p-4 text-xs text-gray-300 animate-in slide-in-from-top-2">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
              <span className="font-bold text-amber-400 flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5" /> استریم‌های نمونه یا تست ویدیوی شخصی در مرورگر:
              </span>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-black font-bold px-2.5 py-1 text-xs transition-colors"
              >
                <Upload className="h-3 w-3" /> تست فایل ویدیویی محلی شما
              </button>
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept="video/*,audio/*"
                onChange={handleLocalFileSelect}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {SAMPLE_STREAMS.map((s, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setCurrentVideoUrl(s.url);
                    setActivePresetIndex(idx);
                    setCustomFileLoaded(null);
                    setShowSourceSelector(false);
                  }}
                  className={`text-right p-2 rounded-xl border transition-all ${
                    activePresetIndex === idx && !customFileLoaded
                      ? 'border-amber-500 bg-amber-500/10 text-amber-300 font-semibold'
                      : 'border-gray-800 bg-gray-900/80 hover:border-gray-700 text-gray-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="font-medium truncate">{s.name}</span>
                    {activePresetIndex === idx && !customFileLoaded && <Check className="h-3.5 w-3.5 text-amber-400 shrink-0" />}
                  </div>
                  <div className="text-[10px] text-gray-500 flex items-center justify-between">
                    <span>{s.quality}</span>
                    <span className="font-mono">{s.format}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Technical Info Drawer */}
        {showTechInfo && (
          <div className="bg-[#121212] border-b border-gray-800 p-3 sm:p-4 text-xs animate-in slide-in-from-top-2">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-gray-300">
              <div className="bg-black/50 p-2.5 rounded-xl border border-gray-800/80">
                <span className="text-gray-500 block text-[10px]">مکانیسم ترنسکد</span>
                <strong className="text-emerald-400 font-mono">Zero Transcoding (0% CPU)</strong>
              </div>
              <div className="bg-black/50 p-2.5 rounded-xl border border-gray-800/80">
                <span className="text-gray-500 block text-[10px]">پروتکل انتقال</span>
                <strong className="text-amber-400 font-mono">HTTP 206 Partial Content</strong>
              </div>
              <div className="bg-black/50 p-2.5 rounded-xl border border-gray-800/80">
                <span className="text-gray-500 block text-[10px]">موتور رمزگشایی</span>
                <strong className="text-gray-200">سخت‌افزار مرورگر (HTML5/GPU)</strong>
              </div>
              <div className="bg-black/50 p-2.5 rounded-xl border border-gray-800/80">
                <span className="text-gray-500 block text-[10px]">بافرینگ هوشمند</span>
                <strong className="text-blue-400 font-mono">Chunk: 1024 KB Lazy Stream</strong>
              </div>
            </div>
          </div>
        )}

        {/* Main Player Display Area */}
        <div className="relative flex-1 bg-black flex items-center justify-center min-h-[320px] sm:min-h-[440px] overflow-hidden select-none">
          {file.type === 'video' ? (
            <div className="relative w-full h-full flex items-center justify-center group">
              <video
                ref={videoRef}
                src={currentVideoUrl}
                autoPlay
                playsInline
                preload="metadata"
                className="w-full max-h-[68vh] object-contain cursor-pointer"
                onClick={togglePlay}
                onTimeUpdate={() => {
                  if (videoRef.current) {
                    setCurrentTime(videoRef.current.currentTime);
                    if (videoRef.current.buffered.length > 0) {
                      setBufferedEnd(videoRef.current.buffered.end(videoRef.current.buffered.length - 1));
                    }
                  }
                }}
                onLoadedMetadata={() => {
                  if (videoRef.current) {
                    setDuration(videoRef.current.duration);
                    videoRef.current.volume = volume;
                    videoRef.current.playbackRate = playbackRate;
                    videoRef.current.play().catch(() => setIsPlaying(false));
                  }
                }}
                onWaiting={() => setPlaybackStatus('buffering')}
                onPlaying={() => setPlaybackStatus('playing')}
                onPause={() => setPlaybackStatus('paused')}
                onEnded={() => setIsPlaying(false)}
              >
                مرورگر شما از قابلیت پخش ویدیو پشتیبانی نمی‌کند.
              </video>

              {/* Big Center Play/Pause Ripple on hover or pause */}
              {!isPlaying && (
                <button
                  onClick={togglePlay}
                  className="absolute z-10 flex h-16 w-16 sm:h-20 sm:w-20 items-center justify-center rounded-full bg-amber-500/90 hover:bg-amber-400 text-black shadow-2xl shadow-amber-500/30 transition-transform active:scale-95"
                  title="پخش ویدیو (Space)"
                >
                  <Play className="h-8 w-8 sm:h-10 sm:w-10 fill-black translate-x-0.5" />
                </button>
              )}

              {/* Overlay Video Controls (Auto-hide) */}
              <div 
                className={`absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/95 via-black/70 to-transparent p-3 sm:p-5 transition-opacity duration-300 z-10 ${
                  showControls || !isPlaying ? 'opacity-100' : 'opacity-0 pointer-events-none'
                }`}
                dir="ltr"
              >
                {/* Custom Timeline Scrubber */}
                <div className="relative flex items-center mb-3 group/track">
                  {/* Buffered Progress Background */}
                  <div className="absolute left-0 top-1/2 h-1.5 w-full -translate-y-1/2 rounded-full bg-gray-800">
                    <div 
                      className="h-full rounded-full bg-gray-600 transition-all"
                      style={{ width: `${duration ? (bufferedEnd / duration) * 100 : 0}%` }}
                    />
                  </div>
                  {/* Played Progress Foreground */}
                  <div 
                    className="absolute left-0 top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-amber-500 pointer-events-none"
                    style={{ width: `${duration ? (currentTime / duration) * 100 : 0}%` }}
                  />
                  {/* Input Range Slider */}
                  <input
                    type="range"
                    min={0}
                    max={duration || 100}
                    step={0.1}
                    value={currentTime}
                    onChange={handleSeekChange}
                    className="relative w-full h-4 appearance-none bg-transparent cursor-pointer z-10 focus:outline-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3.5 [&::-webkit-slider-thumb]:h-3.5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-amber-400 [&::-webkit-slider-thumb]:shadow-lg [&::-webkit-slider-thumb]:transition-transform [&::-webkit-slider-thumb]:hover:scale-125"
                  />
                </div>

                {/* Controls Bottom Row */}
                <div className="flex items-center justify-between gap-2 text-white">
                  
                  {/* Left Controls: Play, Skip, Volume, Time */}
                  <div className="flex items-center gap-2 sm:gap-3">
                    <button
                      onClick={togglePlay}
                      className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold shadow transition-all active:scale-90"
                      title={isPlaying ? 'توقف (Space)' : 'پخش (Space)'}
                    >
                      {isPlaying ? <Pause className="h-4 w-4 fill-black" /> : <Play className="h-4 w-4 fill-black translate-x-0.5" />}
                    </button>

                    <button
                      onClick={() => seekDelta(-10)}
                      className="text-gray-300 hover:text-white p-1.5 hover:bg-white/10 rounded-lg transition-colors"
                      title="۱۰ ثانیه به عقب (Arrow Left)"
                    >
                      <RotateCcw className="h-4 w-4" />
                    </button>

                    <button
                      onClick={() => seekDelta(10)}
                      className="text-gray-300 hover:text-white p-1.5 hover:bg-white/10 rounded-lg transition-colors"
                      title="۱۰ ثانیه به جلو (Arrow Right)"
                    >
                      <RotateCw className="h-4 w-4" />
                    </button>

                    {/* Volume Control */}
                    <div className="flex items-center gap-1.5 group/volume ml-1">
                      <button
                        onClick={toggleMute}
                        className="text-gray-300 hover:text-white p-1 rounded transition-colors"
                        title={isMuted ? 'وصل صدا (M)' : 'قطع صدا (M)'}
                      >
                        {isMuted || volume === 0 ? <VolumeX className="h-4 w-4 text-rose-400" /> : volume < 0.5 ? <Volume1 className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                      </button>
                      <input
                        type="range"
                        min={0}
                        max={1}
                        step={0.05}
                        value={isMuted ? 0 : volume}
                        onChange={handleVolumeChange}
                        className="w-16 sm:w-20 h-1 appearance-none bg-gray-700 rounded-full cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-2.5 [&::-webkit-slider-thumb]:h-2.5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-amber-400"
                        title="تنظیم صدا (Arrow Up / Down)"
                      />
                    </div>

                    {/* Current / Duration time */}
                    <div className="text-[11px] sm:text-xs font-mono text-gray-300 ml-2 select-none">
                      <span className="text-amber-400 font-semibold">{formatTime(currentTime)}</span>
                      <span className="text-gray-600 mx-1">/</span>
                      <span className="text-gray-400">{formatTime(duration)}</span>
                    </div>
                  </div>

                  {/* Right Controls: Speed, PiP, Fullscreen */}
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    {/* Playback Rate Dropdown */}
                    <div className="flex items-center">
                      <select
                        value={playbackRate}
                        onChange={(e) => handleRateChange(parseFloat(e.target.value))}
                        className="bg-black/60 border border-gray-700 rounded-lg px-2 py-1 text-[11px] font-mono text-gray-200 hover:border-gray-500 cursor-pointer focus:outline-none"
                        title="سرعت پخش"
                      >
                        <option value={0.5}>0.5x</option>
                        <option value={0.75}>0.75x</option>
                        <option value={1}>1.0x</option>
                        <option value={1.25}>1.25x</option>
                        <option value={1.5}>1.5x</option>
                        <option value={2}>2.0x</option>
                      </select>
                    </div>

                    {/* PiP Button */}
                    <button
                      onClick={togglePiP}
                      className="text-gray-300 hover:text-white p-1.5 hover:bg-white/10 rounded-lg transition-colors hidden sm:inline-flex"
                      title="تصویر در تصویر (Picture in Picture)"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </button>

                    {/* Fullscreen Button */}
                    <button
                      onClick={toggleFullscreen}
                      className="text-gray-300 hover:text-white p-1.5 hover:bg-white/10 rounded-lg transition-colors"
                      title={isFullscreen ? 'خروج از تمام‌صفحه (F)' : 'تمام‌صفحه (F)'}
                    >
                      {isFullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
                    </button>
                  </div>

                </div>
              </div>
            </div>
          ) : file.type === 'audio' ? (
            /* Audio Player View with Audio Spectrum Animation */
            <div className="flex flex-col items-center justify-center p-8 w-full max-w-xl">
              <div className="relative mb-6 flex h-28 w-28 items-center justify-center rounded-3xl bg-amber-500/10 text-amber-400 border border-amber-500/20 shadow-xl shadow-amber-500/10">
                <Music className="h-14 w-14 animate-pulse" />
                <div className="absolute -bottom-2 -right-2 flex h-8 w-8 items-center justify-center rounded-full bg-amber-500 text-black font-black text-xs">
                  HQ
                </div>
              </div>

              <h2 className="text-lg font-bold text-gray-100 mb-1 text-center">{file.name}</h2>
              <p className="text-xs text-gray-500 mb-6 font-mono">{file.storageName} &bull; {file.sizeStr} &bull; HTTP Streaming</p>

              {/* Simulated Equalizer Bars */}
              <div className="flex items-end gap-1.5 h-10 mb-6">
                {[40, 70, 95, 60, 85, 100, 55, 80, 45, 90, 65, 75, 50].map((height, i) => (
                  <div
                    key={i}
                    className="w-1.5 bg-gradient-to-t from-amber-600 to-amber-400 rounded-full animate-pulse"
                    style={{ 
                      height: `${isPlaying ? height : 20}%`,
                      animationDuration: `${0.6 + (i % 5) * 0.2}s`
                    }}
                  />
                ))}
              </div>

              <audio 
                controls 
                autoPlay 
                className="w-full rounded-xl bg-gray-900 border border-gray-800"
                src="https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3"
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
              >
                مرورگر شما از تگ پخش صوت پشتیبانی نمی‌کند.
              </audio>
            </div>
          ) : file.type === 'image' ? (
            /* Image Preview */
            <div className="p-4 flex items-center justify-center max-h-[70vh]">
              <img
                src="https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1200&q=80"
                alt={file.name}
                className="max-h-[65vh] w-auto max-w-full rounded-xl object-contain border border-gray-800 shadow-2xl"
              />
            </div>
          ) : (
            <div className="p-12 text-center text-gray-400">
              <p>این فرمت قابلیت پخش مستقیم در مرورگر را ندارد.</p>
              {onSwitchToVlc && (
                <button
                  onClick={() => onSwitchToVlc(file)}
                  className="mt-4 inline-flex items-center gap-2 rounded-xl bg-amber-500 px-4 py-2 font-bold text-black"
                >
                  <Tv className="h-4 w-4" /> پخش در VLC
                </button>
              )}
            </div>
          )}
        </div>

        {/* Footer info bar */}
        <div className="flex flex-wrap items-center justify-between border-t border-gray-800 bg-[#141414] px-4 py-2.5 text-xs text-gray-400 gap-3">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5 text-gray-300">
              <span className="h-2 w-2 rounded-full bg-emerald-400"></span>
              پخش بومی بدون بافرینگ روی شبکه محلی
            </span>
            <span className="hidden sm:inline text-gray-600">|</span>
            <span className="hidden sm:inline text-gray-400">
              کلید <kbd className="px-1.5 py-0.5 bg-gray-800 rounded text-gray-200 border border-gray-700 font-mono text-[10px]">Space</kbd> برای توقف/پخش &bull; کلیدهای جهت‌نما برای عقب/جلو
            </span>
          </div>

          <div className="flex items-center gap-3">
            {onSwitchToVlc && (
              <button
                onClick={() => onSwitchToVlc(file)}
                className="text-amber-400 hover:text-amber-300 font-medium flex items-center gap-1"
              >
                <span>مشاهده در VLC و کد QR</span> &larr;
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
