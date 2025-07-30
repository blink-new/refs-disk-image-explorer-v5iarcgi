import React, { useState } from 'react';
import { Download, FileText, Database, Code, Globe, Check } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { Checkbox } from './ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Progress } from './ui/progress';
import { Badge } from './ui/badge';
import { ForensicExportEngine, ExportOptions, ExportResult } from '../lib/export-engine';
import { FileSystemItem } from '../types/forensic';

interface ExportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  items: FileSystemItem[];
}

export function ExportDialog({ isOpen, onClose, items }: ExportDialogProps) {
  const [exportOptions, setExportOptions] = useState<ExportOptions>({
    format: 'json',
    includeMetadata: true,
    includeDeleted: false,
    includeHashes: true,
    flattenStructure: false
  });
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [exportResult, setExportResult] = useState<ExportResult | null>(null);

  const exportEngine = new ForensicExportEngine(items);

  const formatOptions = [
    { value: 'json', label: 'JSON', icon: Code, description: 'Structured data format, preserves hierarchy' },
    { value: 'csv', label: 'CSV', icon: Database, description: 'Spreadsheet format, flattened structure' },
    { value: 'xml', label: 'XML', icon: FileText, description: 'Markup format, preserves hierarchy' },
    { value: 'html', label: 'HTML Report', icon: Globe, description: 'Web page with interactive features' }
  ];

  const updateExportOption = <K extends keyof ExportOptions>(
    key: K,
    value: ExportOptions[K]
  ) => {
    setExportOptions(prev => ({ ...prev, [key]: value }));
  };

  const performExport = async () => {
    setIsExporting(true);
    setExportProgress(0);

    try {
      // Simulate progress for better UX
      const progressSteps = [
        { message: 'Preparing data...', progress: 20 },
        { message: 'Processing file structure...', progress: 40 },
        { message: 'Generating metadata...', progress: 60 },
        { message: 'Formatting output...', progress: 80 },
        { message: 'Finalizing export...', progress: 100 }
      ];

      for (const step of progressSteps) {
        setExportProgress(step.progress);
        await new Promise(resolve => setTimeout(resolve, 200));
      }

      const result = exportEngine.export(exportOptions);
      setExportResult(result);
    } catch (error) {
      console.error('Export failed:', error);
      alert('Export failed: ' + error.message);
    } finally {
      setIsExporting(false);
    }
  };

  const downloadExport = () => {
    if (exportResult) {
      ForensicExportEngine.downloadExport(exportResult);
    }
  };

  const resetDialog = () => {
    setExportResult(null);
    setExportProgress(0);
    setIsExporting(false);
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  };

  const getEstimatedSize = (): string => {
    const baseSize = items.length * 200; // Rough estimate per item
    const multiplier = exportOptions.includeMetadata ? 1.5 : 1;
    const hashMultiplier = exportOptions.includeHashes ? 1.3 : 1;
    return formatFileSize(baseSize * multiplier * hashMultiplier);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="w-5 h-5" />
            Export Forensic Data
          </DialogTitle>
        </DialogHeader>

        {exportResult ? (
          // Export complete view
          <div className="space-y-6">
            <div className="flex items-center justify-center py-8">
              <div className="text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Check className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Export Complete!</h3>
                <p className="text-gray-600">Your forensic data has been successfully exported.</p>
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-4 space-y-3">
              <div className="flex justify-between items-center">
                <span className="font-medium">Filename:</span>
                <span className="font-mono text-sm">{exportResult.filename}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-medium">Format:</span>
                <Badge variant="outline">{exportOptions.format.toUpperCase()}</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-medium">File Size:</span>
                <span>{formatFileSize(exportResult.size)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-medium">Items Exported:</span>
                <span>{items.length}</span>
              </div>
            </div>

            <div className="flex gap-3">
              <Button onClick={downloadExport} className="flex-1">
                <Download className="w-4 h-4 mr-2" />
                Download File
              </Button>
              <Button variant="outline" onClick={resetDialog}>
                Export Another
              </Button>
            </div>
          </div>
        ) : (
          // Export configuration view
          <div className="space-y-6">
            {isExporting && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Exporting...</span>
                  <span className="text-sm text-gray-500">{exportProgress}%</span>
                </div>
                <Progress value={exportProgress} className="w-full" />
              </div>
            )}

            <div className="space-y-4">
              <div className="space-y-3">
                <Label className="text-base font-semibold">Export Format</Label>
                <div className="grid grid-cols-2 gap-3">
                  {formatOptions.map((format) => {
                    const Icon = format.icon;
                    return (
                      <div
                        key={format.value}
                        className={`border rounded-lg p-3 cursor-pointer transition-colors ${
                          exportOptions.format === format.value
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                        onClick={() => updateExportOption('format', format.value as any)}
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <Icon className="w-4 h-4" />
                          <span className="font-medium">{format.label}</span>
                        </div>
                        <p className="text-xs text-gray-600">{format.description}</p>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-3">
                <Label className="text-base font-semibold">Export Options</Label>
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="includeMetadata"
                      checked={exportOptions.includeMetadata}
                      onCheckedChange={(checked) => updateExportOption('includeMetadata', !!checked)}
                    />
                    <Label htmlFor="includeMetadata" className="text-sm">
                      Include forensic metadata (file IDs, attributes, B+Tree info)
                    </Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="includeHashes"
                      checked={exportOptions.includeHashes}
                      onCheckedChange={(checked) => updateExportOption('includeHashes', !!checked)}
                    />
                    <Label htmlFor="includeHashes" className="text-sm">
                      Include file hashes (MD5, SHA1)
                    </Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="includeDeleted"
                      checked={exportOptions.includeDeleted}
                      onCheckedChange={(checked) => updateExportOption('includeDeleted', !!checked)}
                    />
                    <Label htmlFor="includeDeleted" className="text-sm">
                      Include deleted files and directories
                    </Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="flattenStructure"
                      checked={exportOptions.flattenStructure}
                      onCheckedChange={(checked) => updateExportOption('flattenStructure', !!checked)}
                    />
                    <Label htmlFor="flattenStructure" className="text-sm">
                      Flatten directory structure (all files in single list)
                    </Label>
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 rounded-lg p-4">
                <h4 className="font-medium text-blue-900 mb-2">Export Summary</h4>
                <div className="text-sm text-blue-800 space-y-1">
                  <div>• {items.length} total items to export</div>
                  <div>• Estimated file size: {getEstimatedSize()}</div>
                  <div>• Format: {exportOptions.format.toUpperCase()}</div>
                  {exportOptions.includeMetadata && <div>• Including forensic metadata</div>}
                  {exportOptions.includeHashes && <div>• Including file hashes</div>}
                  {exportOptions.includeDeleted && <div>• Including deleted files</div>}
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <Button 
                onClick={performExport} 
                disabled={isExporting}
                className="flex-1"
              >
                {isExporting ? (
                  <>Exporting...</>
                ) : (
                  <>
                    <Download className="w-4 h-4 mr-2" />
                    Start Export
                  </>
                )}
              </Button>
              <Button variant="outline" onClick={onClose} disabled={isExporting}>
                Cancel
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}