import React from 'react';
import { File, Folder, FolderOpen } from 'lucide-react';
import { FileSystemItem } from '../types/forensic';
import { cn } from '@/lib/utils';

interface FileListProps {
  selectedItem: FileSystemItem | null;
  onItemSelect: (item: FileSystemItem) => void;
}

export const FileList: React.FC<FileListProps> = ({ selectedItem, onItemSelect }) => {
  const formatSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (date: Date): string => {
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  const getIcon = (item: FileSystemItem) => {
    switch (item.type) {
      case 'directory':
        return <Folder className="h-4 w-4 text-yellow-600" />;
      case 'file':
        return <File className="h-4 w-4 text-gray-600" />;
      default:
        return <File className="h-4 w-4 text-gray-600" />;
    }
  };

  const items = selectedItem?.children || [];

  if (!selectedItem) {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-500 text-sm">
        <div className="text-center">
          <Folder className="h-8 w-8 mx-auto mb-2 text-gray-400" />
          <p>Select an item from the evidence tree</p>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-500 text-sm">
        <div className="text-center">
          <FolderOpen className="h-8 w-8 mx-auto mb-2 text-gray-400" />
          <p>No items in this directory</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-auto">
      {/* Header */}
      <div className="sticky top-0 bg-gray-100 border-b border-gray-300 text-xs font-medium text-gray-700">
        <div className="grid grid-cols-12 gap-2 px-3 py-2">
          <div className="col-span-4">Name</div>
          <div className="col-span-1">Size</div>
          <div className="col-span-2">Modified</div>
          <div className="col-span-2">Created</div>
          <div className="col-span-2">Accessed</div>
          <div className="col-span-1">Type</div>
        </div>
      </div>

      {/* File List */}
      <div>
        {items.map((item) => (
          <div
            key={item.id}
            className={cn(
              "grid grid-cols-12 gap-2 px-3 py-1 text-sm cursor-pointer hover:bg-blue-50 border-b border-gray-100",
              selectedItem?.id === item.id && "bg-blue-100"
            )}
            onClick={() => onItemSelect(item)}
          >
            <div className="col-span-4 flex items-center space-x-2 truncate">
              {getIcon(item)}
              <span className="truncate">{item.name}</span>
              {item.metadata?.deleted && (
                <span className="text-red-500 text-xs">[DELETED]</span>
              )}
            </div>
            <div className="col-span-1 text-right">
              {item.type === 'file' ? formatSize(item.size) : ''}
            </div>
            <div className="col-span-2 text-xs text-gray-600">
              {formatDate(item.modified)}
            </div>
            <div className="col-span-2 text-xs text-gray-600">
              {formatDate(item.created)}
            </div>
            <div className="col-span-2 text-xs text-gray-600">
              {formatDate(item.accessed)}
            </div>
            <div className="col-span-1 text-xs text-gray-600 capitalize">
              {item.type}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};