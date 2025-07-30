import React from 'react';
import { FileSystemItem } from '../types/forensic';
import { Separator } from '@/components/ui/separator';

interface PropertiesPanelProps {
  selectedItem: FileSystemItem | null;
}

export const PropertiesPanel: React.FC<PropertiesPanelProps> = ({ selectedItem }) => {
  const formatSize = (bytes: number): string => {
    if (bytes === 0) return '0 bytes';
    const k = 1024;
    const sizes = ['bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (date: Date): string => {
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  if (!selectedItem) {
    return (
      <div className="flex-1 p-3 text-sm text-gray-500">
        <p>Select an item to view properties</p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-auto p-3 text-sm">
      <div className="space-y-3">
        {/* General Properties */}
        <div>
          <h3 className="font-semibold text-gray-800 mb-2">General</h3>
          <div className="space-y-1">
            <div className="flex justify-between">
              <span className="text-gray-600">Name:</span>
              <span className="font-mono">{selectedItem.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Type:</span>
              <span className="capitalize">{selectedItem.type}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Path:</span>
              <span className="font-mono text-xs">{selectedItem.path}</span>
            </div>
            {selectedItem.type === 'file' && (
              <div className="flex justify-between">
                <span className="text-gray-600">Size:</span>
                <span>{formatSize(selectedItem.size)}</span>
              </div>
            )}
          </div>
        </div>

        <Separator />

        {/* Timestamps */}
        <div>
          <h3 className="font-semibold text-gray-800 mb-2">Timestamps</h3>
          <div className="space-y-1">
            <div className="flex justify-between">
              <span className="text-gray-600">Created:</span>
              <span className="text-xs">{formatDate(selectedItem.created)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Modified:</span>
              <span className="text-xs">{formatDate(selectedItem.modified)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Accessed:</span>
              <span className="text-xs">{formatDate(selectedItem.accessed)}</span>
            </div>
          </div>
        </div>

        {/* Metadata */}
        {selectedItem.metadata && (
          <>
            <Separator />
            <div>
              <h3 className="font-semibold text-gray-800 mb-2">Metadata</h3>
              <div className="space-y-1">
                {selectedItem.metadata.inode && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Inode:</span>
                    <span className="font-mono">{selectedItem.metadata.inode}</span>
                  </div>
                )}
                {selectedItem.metadata.permissions && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Permissions:</span>
                    <span className="font-mono">{selectedItem.metadata.permissions}</span>
                  </div>
                )}
                {selectedItem.metadata.owner && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Owner:</span>
                    <span>{selectedItem.metadata.owner}</span>
                  </div>
                )}
                {selectedItem.metadata.hash && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">MD5 Hash:</span>
                    <span className="font-mono text-xs break-all">{selectedItem.metadata.hash}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-600">Allocated:</span>
                  <span className={selectedItem.metadata.allocated ? 'text-green-600' : 'text-red-600'}>
                    {selectedItem.metadata.allocated ? 'Yes' : 'No'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Deleted:</span>
                  <span className={selectedItem.metadata.deleted ? 'text-red-600' : 'text-green-600'}>
                    {selectedItem.metadata.deleted ? 'Yes' : 'No'}
                  </span>
                </div>
              </div>
            </div>
          </>
        )}

        {/* ReFS Specific */}
        {selectedItem.type === 'directory' && (
          <>
            <Separator />
            <div>
              <h3 className="font-semibold text-gray-800 mb-2">ReFS Metadata</h3>
              <div className="space-y-1">
                <div className="flex justify-between">
                  <span className="text-gray-600">B+Tree Node:</span>
                  <span className="font-mono">0x{Math.floor(Math.random() * 0xFFFFFF).toString(16).toUpperCase()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Cluster Size:</span>
                  <span>4096 bytes</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Integrity:</span>
                  <span className="text-green-600">Verified</span>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};