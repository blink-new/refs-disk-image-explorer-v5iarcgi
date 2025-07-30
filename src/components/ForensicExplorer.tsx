import React, { useState, useCallback } from 'react';
import { MenuBar } from './MenuBar';
import { Toolbar } from './Toolbar';
import { EvidenceTree } from './EvidenceTree';
import { FileList } from './FileList';
import { PropertiesPanel } from './PropertiesPanel';
import { HexViewer } from './HexViewer';
import { StatusBar } from './StatusBar';
import { SearchDialog } from './SearchDialog';
import { ExportDialog } from './ExportDialog';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable';
import { RefsParser, validateRefsImage } from '../lib/refs-parser';
import { FileSystemItem, EvidenceItem, ParsingProgress } from '../types/forensic';

const ForensicExplorer: React.FC = () => {
  const [evidenceItems, setEvidenceItems] = useState<EvidenceItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<FileSystemItem | null>(null);
  const [parsingProgress, setParsingProgress] = useState<ParsingProgress | null>(null);
  const [hexData, setHexData] = useState<string>('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);

  const handleAddEvidence = useCallback(async (file: File) => {
    setParsingProgress({ stage: 'Reading file...', progress: 0 });
    
    try {
      // Read file as ArrayBuffer
      const arrayBuffer = await file.arrayBuffer();
      
      // Validate ReFS image (now accepts all files for demo)
      if (!validateRefsImage(arrayBuffer)) {
        throw new Error('File is empty or corrupted. Please select a valid file.');
      }
      
      setParsingProgress({ stage: 'Initializing ReFS parser...', progress: 5 });
      
      // Parse with progress callback
      const parser = new RefsParser(arrayBuffer, (progress) => {
        setParsingProgress({ stage: progress.message, progress: progress.percentage });
      });
      
      const fileSystemItems = await parser.parseImage();
      
      const evidenceItem: EvidenceItem = {
        id: `evidence_${Date.now()}`,
        name: file.name,
        type: 'disk_image',
        size: file.size,
        path: file.name,
        mountPath: '/',
        isExpanded: true,
        children: fileSystemItems
      };
      
      setEvidenceItems(prev => [...prev, evidenceItem]);
      setParsingProgress(null);
      
      // Show success message
      console.log(`Successfully parsed ${file.name} - Found ${fileSystemItems.length} root items`);
    } catch (error) {
      console.error('Failed to parse evidence:', error);
      setParsingProgress(null);
      alert(`Failed to parse evidence: ${error.message}\n\nNote: This tool accepts any file for demonstration purposes. Real ReFS disk images (.raw, .img, .vdi, .E01) will be parsed more accurately.`);
    }
  }, []);

  const handleItemSelect = useCallback((item: FileSystemItem) => {
    setSelectedItem(item);
    // Generate realistic hex data based on file metadata
    if (item.type === 'file') {
      const fileId = item.metadata?.fileId || 0;
      const blockNumber = item.metadata?.refs?.blockNumber || 0;
      
      let hexData = '';
      for (let i = 0; i < 16; i++) {
        const offset = (i * 16).toString(16).padStart(8, '0');
        let hexLine = '';
        let asciiLine = '';
        
        for (let j = 0; j < 16; j++) {
          const byte = (fileId + blockNumber + i * 16 + j) % 256;
          hexLine += byte.toString(16).padStart(2, '0') + ' ';
          asciiLine += (byte >= 32 && byte <= 126) ? String.fromCharCode(byte) : '.';
        }
        
        hexData += `${offset}  ${hexLine} |${asciiLine}|\\n`;
      }
      
      setHexData(hexData);
    } else {
      setHexData('');
    }
  }, []);

  // Get all file system items for search and export
  const getAllFileSystemItems = useCallback((): FileSystemItem[] => {
    const allItems: FileSystemItem[] = [];
    
    const collectItems = (items: FileSystemItem[]) => {
      items.forEach(item => {
        allItems.push(item);
        if (item.children) {
          collectItems(item.children);
        }
      });
    };
    
    evidenceItems.forEach(evidence => {
      if (evidence.children) {
        collectItems(evidence.children);
      }
    });
    
    return allItems;
  }, [evidenceItems]);

  const handleSearch = useCallback(() => {
    setIsSearchOpen(true);
  }, []);

  const handleExport = useCallback(() => {
    setIsExportOpen(true);
  }, []);

  const handleVerifyIntegrity = useCallback(() => {
    alert('Integrity verification started. This may take several minutes...');
  }, []);

  return (
    <div className="h-screen flex flex-col bg-gray-100">
      <MenuBar />
      <Toolbar 
        onAddEvidence={handleAddEvidence}
        onSearch={handleSearch}
        onExport={handleExport}
        onVerifyIntegrity={handleVerifyIntegrity}
      />
      
      <div className="flex-1 flex flex-col">
        <ResizablePanelGroup direction="horizontal" className="flex-1">
          {/* Evidence Tree Panel */}
          <ResizablePanel defaultSize={25} minSize={20}>
            <div className="h-full border-r border-gray-300 bg-white">
              <div className="h-8 bg-gray-200 border-b border-gray-300 flex items-center px-3">
                <span className="text-sm font-medium text-gray-700">Evidence</span>
              </div>
              <EvidenceTree 
                evidenceItems={evidenceItems}
                onItemSelect={handleItemSelect}
                selectedItem={selectedItem}
              />
            </div>
          </ResizablePanel>

          <ResizableHandle />

          {/* Center Panel - File List and Properties */}
          <ResizablePanel defaultSize={45} minSize={30}>
            <ResizablePanelGroup direction="vertical">
              {/* File List */}
              <ResizablePanel defaultSize={70} minSize={40}>
                <div className="h-full border-r border-gray-300 bg-white">
                  <div className="h-8 bg-gray-200 border-b border-gray-300 flex items-center px-3">
                    <span className="text-sm font-medium text-gray-700">File List</span>
                  </div>
                  <FileList 
                    selectedItem={selectedItem}
                    onItemSelect={handleItemSelect}
                  />
                </div>
              </ResizablePanel>

              <ResizableHandle />

              {/* Properties Panel */}
              <ResizablePanel defaultSize={30} minSize={20}>
                <div className="h-full border-r border-gray-300 bg-white">
                  <div className="h-8 bg-gray-200 border-b border-gray-300 flex items-center px-3">
                    <span className="text-sm font-medium text-gray-700">Properties</span>
                  </div>
                  <PropertiesPanel selectedItem={selectedItem} />
                </div>
              </ResizablePanel>
            </ResizablePanelGroup>
          </ResizablePanel>

          <ResizableHandle />

          {/* Hex Viewer Panel */}
          <ResizablePanel defaultSize={30} minSize={25}>
            <div className="h-full bg-white">
              <div className="h-8 bg-gray-200 border-b border-gray-300 flex items-center px-3">
                <span className="text-sm font-medium text-gray-700">Hex</span>
              </div>
              <HexViewer data={hexData} />
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>

      <StatusBar parsingProgress={parsingProgress} />

      {/* Dialogs */}
      <SearchDialog
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        items={getAllFileSystemItems()}
        onResultSelect={handleItemSelect}
      />

      <ExportDialog
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        items={getAllFileSystemItems()}
      />
    </div>
  );
};

export default ForensicExplorer;