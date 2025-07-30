export interface FileSystemItem {
  id: string;
  name: string;
  type: 'file' | 'directory' | 'partition' | 'image';
  size: number;
  created: Date;
  modified: Date;
  accessed: Date;
  path: string;
  children?: FileSystemItem[];
  metadata?: {
    inode?: number;
    permissions?: string;
    owner?: string;
    group?: string;
    hash?: string;
    deleted?: boolean;
    allocated?: boolean;
  };
}

export interface EvidenceItem {
  id: string;
  name: string;
  type: 'disk_image' | 'partition';
  path: string;
  size: number;
  fileSystem: 'ReFS' | 'NTFS' | 'FAT32' | 'EXT4' | 'Unknown';
  children: FileSystemItem[];
  metadata: {
    imageType: string;
    sectorSize: number;
    totalSectors: number;
    superblock?: RefsuperBlock;
  };
}

export interface RefsuperBlock {
  signature: string;
  version: number;
  blockSize: number;
  sectorsPerBlock: number;
  totalBlocks: number;
  rootDirectoryBlock: number;
  metadataTableBlock: number;
  checksum: string;
}

export interface ParsingProgress {
  stage: string;
  progress: number;
  currentFile?: string;
  totalFiles?: number;
  processedFiles?: number;
}

export interface HexViewerData {
  offset: number;
  hex: string;
  ascii: string;
}