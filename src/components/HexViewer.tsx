import React from 'react';

interface HexViewerProps {
  data: string;
}

export const HexViewer: React.FC<HexViewerProps> = ({ data }) => {
  if (!data) {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-500 text-sm">
        <div className="text-center">
          <div className="font-mono text-xs mb-2">00 01 02 03 04 05 06 07</div>
          <p>Select a file to view hex data</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-auto p-2 bg-white">
      <div className="font-mono text-xs leading-relaxed">
        {data.split('\n').map((line, index) => (
          <div key={index} className="hover:bg-gray-100 px-1">
            {line}
          </div>
        ))}
      </div>
    </div>
  );
};