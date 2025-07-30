import React from 'react';
import { Progress } from '@/components/ui/progress';
import { ParsingProgress } from '../types/forensic';

interface StatusBarProps {
  parsingProgress: ParsingProgress | null;
}

export const StatusBar: React.FC<StatusBarProps> = ({ parsingProgress }) => {
  return (
    <div className="h-6 bg-gray-200 border-t border-gray-300 flex items-center px-3 text-xs text-gray-700">
      <div className="flex items-center space-x-4 flex-1">
        {parsingProgress ? (
          <>
            <span>{parsingProgress.stage}</span>
            <div className="w-48">
              <Progress value={parsingProgress.progress} className="h-2" />
            </div>
            <span>{Math.round(parsingProgress.progress)}%</span>
            {parsingProgress.currentFile && (
              <span className="text-gray-500">
                Processing: {parsingProgress.currentFile}
              </span>
            )}
            {parsingProgress.processedFiles && parsingProgress.totalFiles && (
              <span className="text-gray-500">
                ({parsingProgress.processedFiles}/{parsingProgress.totalFiles} files)
              </span>
            )}
          </>
        ) : (
          <>
            <span>Ready</span>
            <span className="text-gray-500">|</span>
            <span>ReFS Disk Image Explorer v1.0</span>
            <span className="text-gray-500">|</span>
            <span>Read-only forensic analysis mode</span>
          </>
        )}
      </div>
      
      <div className="flex items-center space-x-4 text-gray-500">
        <span>Ln 1, Col 1</span>
        <span>UTF-8</span>
        <span>{new Date().toLocaleTimeString()}</span>
      </div>
    </div>
  );
};