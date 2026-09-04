export type MediaType = 'video' | 'audio' | 'image' | 'other';

export interface StorageItem {
  id: string;
  name: string;
  path: string;
  type: 'internal' | 'usb' | 'sdcard' | 'folder';
  accessible: boolean;
  totalBytes: number;
  usedBytes: number;
  freeBytes: number;
  totalStr: string;
  usedStr: string;
  freeStr: string;
  percentUsed: number;
  error?: string;
}

export interface MediaFile {
  id: string;
  name: string;
  path: string;
  storageId: string;
  storageName: string;
  isDir: boolean;
  size: number;
  sizeStr: string;
  extension: string;
  type: MediaType;
  modified: string;
  streamUrl: string;
  videoQuality?: string;
  duration?: string;
}

export interface ServerConfig {
  server_name: string;
  port: number;
  host: string;
  authentication: boolean;
  username: string;
  password: string;
  show_hidden_files: boolean;
  chunk_size_kb: number;
  theme: 'dark' | 'light';
  storages: Array<{ name: string; path: string }>;
}

export interface CodeFile {
  path: string;
  name: string;
  category: 'python' | 'template' | 'static' | 'script' | 'config' | 'doc';
  description: string;
  content: string;
}
