import React, { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { 
  FolderOpen, 
  Download, 
  Search, 
  RefreshCw, 
  FileText, 
  Shield,
  HardDrive
} from 'lucide-react';

interface ToolbarProps {
  onAddEvidence: (file: File) => void;
  onSearch: () => void;
  onExport: () => void;
  onVerifyIntegrity: () => void;
}

export const Toolbar: React.FC<ToolbarProps> = ({ onAddEvidence, onSearch, onExport, onVerifyIntegrity }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      onAddEvidence(file);
    }
  };

  const handleAddEvidenceClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="border-b border-gray-300 bg-gray-50 px-2 py-1">
      <TooltipProvider>
        <div className="flex items-center space-x-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleAddEvidenceClick}
                className="h-8 px-2"
              >
                <HardDrive className="h-4 w-4 mr-1" />
                Add Evidence
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Add Evidence Item (Ctrl+E)</p>
            </TooltipContent>
          </Tooltip>

          <Separator orientation="vertical" className="h-6" />

          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 px-2" onClick={onExport}>
                <Download className="h-4 w-4 mr-1" />
                Export
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Export Directory Listing</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 px-2">
                <FileText className="h-4 w-4 mr-1" />
                Report
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Generate Forensic Report</p>
            </TooltipContent>
          </Tooltip>

          <Separator orientation="vertical" className="h-6" />

          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 px-2" onClick={onSearch}>
                <Search className="h-4 w-4 mr-1" />
                Search
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Search Files (Ctrl+F)</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 px-2">
                <RefreshCw className="h-4 w-4 mr-1" />
                Refresh
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Refresh View (F5)</p>
            </TooltipContent>
          </Tooltip>

          <Separator orientation="vertical" className="h-6" />

          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 px-2" onClick={onVerifyIntegrity}>
                <Shield className="h-4 w-4 mr-1" />
                Verify
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Verify Evidence Integrity</p>
            </TooltipContent>
          </Tooltip>
        </div>
      </TooltipProvider>

      <input
        ref={fileInputRef}
        type="file"
        accept=".raw,.img,.vdi,.e01,.dd"
        onChange={handleFileSelect}
        className="hidden"
      />
    </div>
  );
};