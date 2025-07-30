import React, { useState, useEffect, useCallback } from 'react';
import { Search, Filter, X, FileText, Hash, Calendar, HardDrive } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Checkbox } from './ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Badge } from './ui/badge';
import { ForensicSearchEngine, SearchOptions, SearchResult } from '../lib/search-engine';
import { FileSystemItem } from '../types/forensic';
import { formatFileSize, formatTimestamp } from '../lib/refs-parser';

interface SearchDialogProps {
  isOpen: boolean;
  onClose: () => void;
  items: FileSystemItem[];
  onResultSelect: (item: FileSystemItem) => void;
}

export function SearchDialog({ isOpen, onClose, items, onResultSelect }: SearchDialogProps) {
  const [searchEngine] = useState(() => new ForensicSearchEngine(items));
  const [searchOptions, setSearchOptions] = useState<SearchOptions>({
    query: '',
    caseSensitive: false,
    useRegex: false,
    searchInPath: true,
    searchInContent: false,
    fileTypes: [],
    includeDeleted: false,
    hashSearch: ''
  });
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [activeTab, setActiveTab] = useState('basic');

  // Common file types for filtering
  const commonFileTypes = [
    'txt', 'doc', 'docx', 'pdf', 'xls', 'xlsx', 'ppt', 'pptx',
    'jpg', 'jpeg', 'png', 'gif', 'bmp', 'tiff',
    'mp3', 'wav', 'mp4', 'avi', 'mov', 'wmv',
    'zip', 'rar', '7z', 'tar', 'gz',
    'exe', 'dll', 'sys', 'bat', 'cmd'
  ];

  const performSearch = useCallback(async () => {
    setIsSearching(true);
    try {
      // Add small delay to show loading state
      await new Promise(resolve => setTimeout(resolve, 100));
      const searchResults = searchEngine.search(searchOptions);
      setResults(searchResults);
    } catch (error) {
      console.error('Search failed:', error);
      setResults([]);
    } finally {
      setIsSearching(false);
    }
  }, [searchEngine, searchOptions]);

  useEffect(() => {
    if (searchOptions.query || searchOptions.hashSearch) {
      performSearch();
    } else {
      setResults([]);
    }
  }, [searchOptions, performSearch]);

  const updateSearchOption = <K extends keyof SearchOptions>(
    key: K,
    value: SearchOptions[K]
  ) => {
    setSearchOptions(prev => ({ ...prev, [key]: value }));
  };

  const toggleFileType = (fileType: string) => {
    setSearchOptions(prev => ({
      ...prev,
      fileTypes: prev.fileTypes.includes(fileType)
        ? prev.fileTypes.filter(t => t !== fileType)
        : [...prev.fileTypes, fileType]
    }));
  };

  const clearSearch = () => {
    setSearchOptions({
      query: '',
      caseSensitive: false,
      useRegex: false,
      searchInPath: true,
      searchInContent: false,
      fileTypes: [],
      includeDeleted: false,
      hashSearch: ''
    });
    setResults([]);
  };

  const getAdvancedSearchResults = () => {
    const duplicates = searchEngine.findDuplicateFiles();
    const largeFiles = searchEngine.findLargeFiles();
    const recentFiles = searchEngine.findRecentlyModified();
    const deletedFiles = searchEngine.findDeletedFiles();

    return { duplicates, largeFiles, recentFiles, deletedFiles };
  };

  const highlightMatch = (text: string, query: string, caseSensitive: boolean) => {
    if (!query) return text;
    
    const searchText = caseSensitive ? query : query.toLowerCase();
    const targetText = caseSensitive ? text : text.toLowerCase();
    const index = targetText.indexOf(searchText);
    
    if (index === -1) return text;
    
    return (
      <>
        {text.substring(0, index)}
        <mark className="bg-yellow-200 px-1 rounded">
          {text.substring(index, index + query.length)}
        </mark>
        {text.substring(index + query.length)}
      </>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Search className="w-5 h-5" />
            Forensic Search & Analysis
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="basic">Basic Search</TabsTrigger>
            <TabsTrigger value="advanced">Advanced Filters</TabsTrigger>
            <TabsTrigger value="analysis">Analysis Tools</TabsTrigger>
          </TabsList>

          <TabsContent value="basic" className="flex-1 flex flex-col space-y-4">
            <div className="space-y-4">
              <div className="flex gap-2">
                <div className="flex-1">
                  <Input
                    placeholder="Search files and folders..."
                    value={searchOptions.query}
                    onChange={(e) => updateSearchOption('query', e.target.value)}
                    className="w-full"
                  />
                </div>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={clearSearch}
                  title="Clear search"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>

              <div className="flex flex-wrap gap-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="caseSensitive"
                    checked={searchOptions.caseSensitive}
                    onCheckedChange={(checked) => updateSearchOption('caseSensitive', !!checked)}
                  />
                  <Label htmlFor="caseSensitive">Case sensitive</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="useRegex"
                    checked={searchOptions.useRegex}
                    onCheckedChange={(checked) => updateSearchOption('useRegex', !!checked)}
                  />
                  <Label htmlFor="useRegex">Regular expression</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="searchInPath"
                    checked={searchOptions.searchInPath}
                    onCheckedChange={(checked) => updateSearchOption('searchInPath', !!checked)}
                  />
                  <Label htmlFor="searchInPath">Search in path</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="includeDeleted"
                    checked={searchOptions.includeDeleted}
                    onCheckedChange={(checked) => updateSearchOption('includeDeleted', !!checked)}
                  />
                  <Label htmlFor="includeDeleted">Include deleted files</Label>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Hash Search</Label>
                <Input
                  placeholder="Enter MD5 or SHA1 hash..."
                  value={searchOptions.hashSearch}
                  onChange={(e) => updateSearchOption('hashSearch', e.target.value)}
                  className="font-mono text-sm"
                />
              </div>
            </div>

            <div className="flex-1 overflow-auto border rounded-lg">
              {isSearching ? (
                <div className="flex items-center justify-center h-32">
                  <div className="text-sm text-gray-500">Searching...</div>
                </div>
              ) : results.length > 0 ? (
                <div className="divide-y">
                  {results.map((result, index) => (
                    <div
                      key={`${result.item.id}-${index}`}
                      className="p-3 hover:bg-gray-50 cursor-pointer"
                      onClick={() => {
                        onResultSelect(result.item);
                        onClose();
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <FileText className="w-4 h-4 text-gray-400 flex-shrink-0" />
                            <span className="font-medium truncate">
                              {highlightMatch(result.item.name, searchOptions.query, searchOptions.caseSensitive)}
                            </span>
                            {result.item.metadata?.isDeleted && (
                              <Badge variant="destructive" className="text-xs">Deleted</Badge>
                            )}
                          </div>
                          <div className="text-sm text-gray-500 truncate mt-1">
                            {highlightMatch(result.item.path, searchOptions.query, searchOptions.caseSensitive)}
                          </div>
                          <div className="flex items-center gap-4 text-xs text-gray-400 mt-1">
                            <span>{formatFileSize(result.item.size)}</span>
                            <span>{formatTimestamp(result.item.modified)}</span>
                            {result.item.metadata?.md5Hash && (
                              <span className="font-mono">{result.item.metadata.md5Hash.substring(0, 8)}...</span>
                            )}
                          </div>
                        </div>
                        <div className="text-xs text-gray-400 ml-2">
                          Score: {result.score}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : searchOptions.query || searchOptions.hashSearch ? (
                <div className="flex items-center justify-center h-32">
                  <div className="text-sm text-gray-500">No results found</div>
                </div>
              ) : (
                <div className="flex items-center justify-center h-32">
                  <div className="text-sm text-gray-500">Enter search terms to begin</div>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="advanced" className="flex-1 flex flex-col space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>File Size Range</Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="Min size (bytes)"
                    type="number"
                    value={searchOptions.sizeMin || ''}
                    onChange={(e) => updateSearchOption('sizeMin', e.target.value ? parseInt(e.target.value) : undefined)}
                  />
                  <Input
                    placeholder="Max size (bytes)"
                    type="number"
                    value={searchOptions.sizeMax || ''}
                    onChange={(e) => updateSearchOption('sizeMax', e.target.value ? parseInt(e.target.value) : undefined)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Date Range</Label>
                <div className="flex gap-2">
                  <Input
                    type="date"
                    value={searchOptions.dateFrom?.toISOString().split('T')[0] || ''}
                    onChange={(e) => updateSearchOption('dateFrom', e.target.value ? new Date(e.target.value) : undefined)}
                  />
                  <Input
                    type="date"
                    value={searchOptions.dateTo?.toISOString().split('T')[0] || ''}
                    onChange={(e) => updateSearchOption('dateTo', e.target.value ? new Date(e.target.value) : undefined)}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label>File Types</Label>
              <div className="flex flex-wrap gap-2 max-h-32 overflow-auto p-2 border rounded">
                {commonFileTypes.map(type => (
                  <Badge
                    key={type}
                    variant={searchOptions.fileTypes.includes(type) ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() => toggleFileType(type)}
                  >
                    {type}
                  </Badge>
                ))}
              </div>
            </div>

            <div className="flex-1 overflow-auto border rounded-lg">
              {results.length > 0 && (
                <div className="divide-y">
                  {results.map((result, index) => (
                    <div
                      key={`${result.item.id}-${index}`}
                      className="p-3 hover:bg-gray-50 cursor-pointer"
                      onClick={() => {
                        onResultSelect(result.item);
                        onClose();
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <FileText className="w-4 h-4 text-gray-400 flex-shrink-0" />
                            <span className="font-medium truncate">{result.item.name}</span>
                            {result.item.metadata?.isDeleted && (
                              <Badge variant="destructive" className="text-xs">Deleted</Badge>
                            )}
                          </div>
                          <div className="text-sm text-gray-500 truncate mt-1">{result.item.path}</div>
                          <div className="flex items-center gap-4 text-xs text-gray-400 mt-1">
                            <span>{formatFileSize(result.item.size)}</span>
                            <span>{formatTimestamp(result.item.modified)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="analysis" className="flex-1 flex flex-col space-y-4">
            {(() => {
              const { duplicates, largeFiles, recentFiles, deletedFiles } = getAdvancedSearchResults();
              
              return (
                <div className="grid grid-cols-2 gap-4 flex-1">
                  <div className="space-y-4">
                    <div className="border rounded-lg p-4">
                      <h3 className="font-semibold flex items-center gap-2 mb-3">
                        <Hash className="w-4 h-4" />
                        Duplicate Files ({duplicates.length})
                      </h3>
                      <div className="space-y-2 max-h-32 overflow-auto">
                        {duplicates.slice(0, 5).map((dup, index) => (
                          <div key={index} className="text-sm">
                            <div className="font-mono text-xs text-gray-500">{dup.hash.substring(0, 16)}...</div>
                            <div className="text-gray-600">{dup.files.length} files</div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="border rounded-lg p-4">
                      <h3 className="font-semibold flex items-center gap-2 mb-3">
                        <HardDrive className="w-4 h-4" />
                        Large Files ({largeFiles.length})
                      </h3>
                      <div className="space-y-2 max-h-32 overflow-auto">
                        {largeFiles.slice(0, 5).map((file, index) => (
                          <div
                            key={index}
                            className="text-sm cursor-pointer hover:bg-gray-50 p-1 rounded"
                            onClick={() => {
                              onResultSelect(file);
                              onClose();
                            }}
                          >
                            <div className="truncate">{file.name}</div>
                            <div className="text-gray-500">{formatFileSize(file.size)}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="border rounded-lg p-4">
                      <h3 className="font-semibold flex items-center gap-2 mb-3">
                        <Calendar className="w-4 h-4" />
                        Recently Modified ({recentFiles.length})
                      </h3>
                      <div className="space-y-2 max-h-32 overflow-auto">
                        {recentFiles.slice(0, 5).map((file, index) => (
                          <div
                            key={index}
                            className="text-sm cursor-pointer hover:bg-gray-50 p-1 rounded"
                            onClick={() => {
                              onResultSelect(file);
                              onClose();
                            }}
                          >
                            <div className="truncate">{file.name}</div>
                            <div className="text-gray-500">{formatTimestamp(file.modified)}</div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="border rounded-lg p-4">
                      <h3 className="font-semibold flex items-center gap-2 mb-3 text-red-600">
                        <X className="w-4 h-4" />
                        Deleted Files ({deletedFiles.length})
                      </h3>
                      <div className="space-y-2 max-h-32 overflow-auto">
                        {deletedFiles.slice(0, 5).map((file, index) => (
                          <div
                            key={index}
                            className="text-sm cursor-pointer hover:bg-gray-50 p-1 rounded"
                            onClick={() => {
                              onResultSelect(file);
                              onClose();
                            }}
                          >
                            <div className="truncate line-through text-red-600">{file.name}</div>
                            <div className="text-gray-500">{formatFileSize(file.size)}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}
          </TabsContent>
        </Tabs>

        <div className="flex justify-between items-center pt-4 border-t">
          <div className="text-sm text-gray-500">
            {results.length > 0 && `${results.length} results found`}
          </div>
          <Button onClick={onClose}>Close</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}