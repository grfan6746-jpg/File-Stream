import React, { useState } from 'react';
import { PROJECT_FILES } from '../data/projectFiles';
import JSZip from 'jszip';
import { 
  Terminal, Download, Copy, Check, FileCode, FolderArchive, 
  HelpCircle, ChevronRight, HardDrive, ShieldCheck, Play, Tv
} from 'lucide-react';

export const TermuxGuideView: React.FC = () => {
  const [selectedFileIndex, setSelectedFileIndex] = useState(0);
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedCmd, setCopiedCmd] = useState<string | null>(null);
  const [isZipping, setIsZipping] = useState(false);

  const selectedFile = PROJECT_FILES[selectedFileIndex] || PROJECT_FILES[0];

  const handleCopyCommand = (cmd: string, id: string) => {
    navigator.clipboard.writeText(cmd);
    setCopiedCmd(id);
    setTimeout(() => setCopiedCmd(null), 2000);
  };

  const handleCopySourceCode = () => {
    navigator.clipboard.writeText(selectedFile.content);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleDownloadZip = async () => {
    try {
      setIsZipping(true);
      const zip = new JSZip();

      // Bundle all files
      PROJECT_FILES.forEach((f) => {
        zip.file(f.path, f.content);
      });

      // Generate zip blob
      const content = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(content);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'media_server.zip';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      alert('خطا در ایجاد فایل فشرده: ' + (err as any).message);
    } finally {
      setIsZipping(false);
    }
  };

  const termuxSteps = [
    {
      id: 'step1',
      title: '۱. بروزرسانی مخازن و نصب Python در Termux',
      desc: 'ترمینال Termux را روی تلویزیون باز کرده و دستور زیر را تایپ یا Paste کنید:',
      cmd: 'pkg update -y && pkg upgrade -y\npkg install python python-pip git -y',
    },
    {
      id: 'step2',
      title: '۲. نصب فریم‌ورک Flask و ابزار Werkzeug',
      desc: 'برای حفظ سبکی تلویزیون، فقط دو پکیج رسمی و ضروری بدون وابستگی سنگین نصب می‌شوند:',
      cmd: 'pip install flask werkzeug',
    },
    {
      id: 'step3',
      title: '۳. اعطای دسترسی به حافظه تلویزیون (بسیار مهم)',
      desc: 'این دستور پیوندهای ~/storage را ایجاد کرده و پیام دسترسی در تلویزیون ظاهر می‌شود:',
      cmd: 'termux-setup-storage',
    },
    {
      id: 'step4',
      title: '۴. اجرای یک‌کلیکه اسکریپت راه‌اندازی سرور',
      desc: 'وارد پوشه پروژه شده و مجوز اجرا را به اسکریپت‌ها بدهید:',
      cmd: 'chmod +x scripts/*.sh\n./scripts/start.sh --bg',
    },
    {
      id: 'step5',
      title: '۵. شناسایی مسیر درایو USB در اندروید',
      desc: 'برای مشاهده مسیر دقیق فلش یا هارد USB متصل به پورت‌های تلویزیون:',
      cmd: 'ls -la /storage/\nls -la ~/storage/',
    },
  ];

  return (
    <div className="space-y-8 max-w-6xl mx-auto" dir="rtl">
      
      {/* Top Banner with 1-Click ZIP Download - Elegant Dark */}
      <div className="rounded-2xl border border-gray-800 bg-[#111111] p-6 sm:p-7 shadow-2xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full bg-amber-500/10 border border-amber-500/30 px-3 py-1 text-xs font-semibold text-amber-400">
              <FolderArchive className="h-3.5 w-3.5" /> بسته کامل پروژه آماده اجرا
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-gray-100">
              راهنمای اجرای Termux و دریافت کدهای پایتون
            </h2>
            <p className="text-xs sm:text-sm text-gray-400 max-w-2xl leading-relaxed">
              تمامی فایل‌های پایتون (Backend)، قالب‌های HTML و اسکریپت‌های شل با استانداردهای RFC 7233 ساخته شده‌اند. می‌توانید کل پکیج را دانلود کنید یا فایل‌ها را تک‌تک مشاهده و کپی فرمایید.
            </p>
          </div>

          <button
            onClick={handleDownloadZip}
            disabled={isZipping}
            className="flex shrink-0 items-center justify-center gap-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black px-6 py-3.5 text-sm font-black shadow-xl shadow-amber-500/20 transition-all disabled:opacity-50"
          >
            <Download className={`h-4 w-4 ${isZipping ? 'animate-bounce' : ''}`} />
            {isZipping ? 'در حال ایجاد فایل ZIP...' : 'دانلود فایل media_server.zip'}
          </button>
        </div>
      </div>

      {/* Step-by-Step Termux Commands - Elegant Dark */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold text-gray-100 flex items-center gap-2">
          <Terminal className="h-5 w-5 text-amber-500" />
          مراحل قدم به قدم اجرای سرور در Termux تلویزیون
        </h3>

        <div className="grid grid-cols-1 gap-3.5">
          {termuxSteps.map((step) => (
            <div key={step.id} className="rounded-2xl border border-gray-800 bg-[#111111] p-5 space-y-2.5 shadow-lg">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-xs sm:text-sm text-gray-200">{step.title}</h4>
                <button
                  onClick={() => handleCopyCommand(step.cmd, step.id)}
                  className="flex items-center gap-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 px-3 py-1 text-xs text-gray-300 transition-colors border border-gray-700"
                >
                  {copiedCmd === step.id ? (
                    <>
                      <Check className="h-3.5 w-3.5 text-green-400" /> کپی شد
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5 text-amber-400" /> کپی دستور
                    </>
                  )}
                </button>
              </div>

              <p className="text-xs text-gray-400">{step.desc}</p>

              <pre className="rounded-xl bg-black p-3.5 text-xs font-mono text-amber-200 overflow-x-auto border border-gray-800" dir="ltr">
                {step.cmd}
              </pre>
            </div>
          ))}
        </div>
      </div>

      {/* Source Code Explorer - Elegant Dark */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-gray-100 flex items-center gap-2">
              <FileCode className="h-5 w-5 text-amber-500" />
              مرور فایل‌های سورس کد پروژه پایتون ({PROJECT_FILES.length} فایل)
            </h3>
            <p className="text-xs text-gray-500">بدون هرگونه کد ناقص، TODO یا Placeholder</p>
          </div>

          <button
            onClick={handleCopySourceCode}
            className="flex items-center gap-1.5 rounded-xl bg-gray-800 hover:bg-gray-700 border border-gray-700 px-4 py-2 text-xs font-bold text-gray-200 transition-colors"
          >
            {copiedCode ? <Check className="h-3.5 w-3.5 text-green-400" /> : <Copy className="h-3.5 w-3.5 text-amber-400" />}
            {copiedCode ? 'کد کپی شد!' : 'کپی کل این فایل'}
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 rounded-2xl border border-gray-800 bg-[#111111] p-4 shadow-xl">
          
          {/* File Tree List */}
          <div className="lg:col-span-4 space-y-1.5 max-h-[500px] overflow-y-auto pr-1">
            {PROJECT_FILES.map((file, idx) => (
              <button
                key={file.path}
                onClick={() => setSelectedFileIndex(idx)}
                className={`w-full text-right flex items-center justify-between rounded-xl px-3.5 py-2.5 text-xs transition-all ${
                  selectedFileIndex === idx
                    ? 'bg-amber-500 text-black font-bold shadow-md'
                    : 'text-gray-300 hover:bg-gray-800/80'
                }`}
              >
                <div className="flex items-center gap-2 truncate">
                  <FileCode className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate font-mono" dir="ltr">{file.name}</span>
                </div>
                <span className="text-[10px] opacity-75 font-sans mr-2 shrink-0">
                  {file.category}
                </span>
              </button>
            ))}
          </div>

          {/* Code Viewer */}
          <div className="lg:col-span-8 flex flex-col rounded-xl border border-gray-800 bg-black overflow-hidden">
            <div className="flex items-center justify-between bg-gray-900/90 px-4 py-2.5 border-b border-gray-800 text-xs">
              <span className="font-mono font-bold text-amber-200" dir="ltr">{selectedFile.path}</span>
              <span className="text-gray-400 text-[11px]">{selectedFile.description}</span>
            </div>

            <pre className="p-4 text-xs font-mono text-gray-300 overflow-x-auto max-h-[460px] leading-relaxed select-all" dir="ltr">
              {selectedFile.content}
            </pre>
          </div>

        </div>
      </div>

    </div>
  );
};
