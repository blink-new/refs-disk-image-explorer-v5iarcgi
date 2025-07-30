import { FileSystemItem } from '../types/forensic';

export interface SearchOptions {
  query: string;
  caseSensitive: boolean;
  useRegex: boolean;
  searchInPath: boolean;
  searchInContent: boolean;
  fileTypes: string[];
  sizeMin?: number;
  sizeMax?: number;
  dateFrom?: Date;
  dateTo?: Date;
  includeDeleted: boolean;
  hashSearch?: string;
}

export interface SearchResult {
  item: FileSystemItem;
  matches: SearchMatch[];
  score: number;
}

export interface SearchMatch {
  field: 'name' | 'path' | 'content' | 'hash';
  value: string;
  startIndex: number;
  endIndex: number;
}

export class ForensicSearchEngine {
  private items: FileSystemItem[] = [];
  private searchIndex: Map<string, FileSystemItem[]> = new Map();

  constructor(items: FileSystemItem[]) {
    this.items = items;
    this.buildSearchIndex();
  }

  private buildSearchIndex(): void {
    this.searchIndex.clear();
    
    const addToIndex = (item: FileSystemItem) => {
      // Index by name
      const nameTokens = this.tokenize(item.name.toLowerCase());
      nameTokens.forEach(token => {
        if (!this.searchIndex.has(token)) {
          this.searchIndex.set(token, []);
        }
        this.searchIndex.get(token)!.push(item);
      });

      // Index by path
      const pathTokens = this.tokenize(item.path.toLowerCase());
      pathTokens.forEach(token => {
        if (!this.searchIndex.has(token)) {
          this.searchIndex.set(token, []);
        }
        this.searchIndex.get(token)!.push(item);
      });

      // Index by hash if available
      if (item.metadata?.md5Hash) {
        this.searchIndex.set(item.metadata.md5Hash.toLowerCase(), [item]);
      }
      if (item.metadata?.sha1Hash) {
        this.searchIndex.set(item.metadata.sha1Hash.toLowerCase(), [item]);
      }

      // Recursively index children
      if (item.children) {
        item.children.forEach(child => addToIndex(child));
      }
    };

    this.items.forEach(item => addToIndex(item));
  }

  search(options: SearchOptions): SearchResult[] {
    const results: SearchResult[] = [];
    const processedItems = new Set<string>();

    const searchItems = (items: FileSystemItem[]) => {
      items.forEach(item => {
        if (processedItems.has(item.id)) return;
        processedItems.add(item.id);

        const matches = this.findMatches(item, options);
        if (matches.length > 0) {
          const score = this.calculateScore(item, matches, options);
          results.push({ item, matches, score });
        }

        if (item.children) {
          searchItems(item.children);
        }
      });
    };

    // Use search index for performance if possible
    if (options.query && !options.useRegex) {
      const queryTokens = this.tokenize(options.query.toLowerCase());
      const candidateItems = new Set<FileSystemItem>();

      queryTokens.forEach(token => {
        const indexedItems = this.searchIndex.get(token) || [];
        indexedItems.forEach(item => candidateItems.add(item));
      });

      searchItems(Array.from(candidateItems));
    } else {
      searchItems(this.items);
    }

    // Apply additional filters
    const filteredResults = results.filter(result => 
      this.applyFilters(result.item, options)
    );

    // Sort by score (descending)
    return filteredResults.sort((a, b) => b.score - a.score);
  }

  private findMatches(item: FileSystemItem, options: SearchOptions): SearchMatch[] {
    const matches: SearchMatch[] = [];

    if (!options.query) return matches;

    const searchText = options.caseSensitive ? options.query : options.query.toLowerCase();
    
    // Search in name
    const nameText = options.caseSensitive ? item.name : item.name.toLowerCase();
    const nameMatches = this.findTextMatches(nameText, searchText, options.useRegex);
    nameMatches.forEach(match => {
      matches.push({
        field: 'name',
        value: item.name,
        startIndex: match.start,
        endIndex: match.end
      });
    });

    // Search in path
    if (options.searchInPath) {
      const pathText = options.caseSensitive ? item.path : item.path.toLowerCase();
      const pathMatches = this.findTextMatches(pathText, searchText, options.useRegex);
      pathMatches.forEach(match => {
        matches.push({
          field: 'path',
          value: item.path,
          startIndex: match.start,
          endIndex: match.end
        });
      });
    }

    // Search in hashes
    if (options.hashSearch) {
      const hashQuery = options.hashSearch.toLowerCase();
      if (item.metadata?.md5Hash?.toLowerCase().includes(hashQuery)) {
        matches.push({
          field: 'hash',
          value: item.metadata.md5Hash,
          startIndex: 0,
          endIndex: item.metadata.md5Hash.length
        });
      }
      if (item.metadata?.sha1Hash?.toLowerCase().includes(hashQuery)) {
        matches.push({
          field: 'hash',
          value: item.metadata.sha1Hash,
          startIndex: 0,
          endIndex: item.metadata.sha1Hash.length
        });
      }
    }

    return matches;
  }

  private findTextMatches(text: string, query: string, useRegex: boolean): Array<{start: number, end: number}> {
    const matches: Array<{start: number, end: number}> = [];

    if (useRegex) {
      try {
        const regex = new RegExp(query, 'gi');
        let match;
        while ((match = regex.exec(text)) !== null) {
          matches.push({
            start: match.index,
            end: match.index + match[0].length
          });
        }
      } catch (error) {
        // Invalid regex, fall back to literal search
        return this.findTextMatches(text, query, false);
      }
    } else {
      let index = text.indexOf(query);
      while (index !== -1) {
        matches.push({
          start: index,
          end: index + query.length
        });
        index = text.indexOf(query, index + 1);
      }
    }

    return matches;
  }

  private applyFilters(item: FileSystemItem, options: SearchOptions): boolean {
    // File type filter
    if (options.fileTypes.length > 0) {
      const extension = item.name.split('.').pop()?.toLowerCase() || '';
      if (!options.fileTypes.includes(extension)) {
        return false;
      }
    }

    // Size filter
    if (options.sizeMin !== undefined && item.size < options.sizeMin) {
      return false;
    }
    if (options.sizeMax !== undefined && item.size > options.sizeMax) {
      return false;
    }

    // Date filter
    if (options.dateFrom && item.modified < options.dateFrom) {
      return false;
    }
    if (options.dateTo && item.modified > options.dateTo) {
      return false;
    }

    // Deleted files filter
    if (!options.includeDeleted && item.metadata?.isDeleted) {
      return false;
    }

    return true;
  }

  private calculateScore(item: FileSystemItem, matches: SearchMatch[], options: SearchOptions): number {
    let score = 0;

    matches.forEach(match => {
      switch (match.field) {
        case 'name':
          score += 10; // Name matches are most important
          break;
        case 'path':
          score += 5;
          break;
        case 'hash':
          score += 15; // Hash matches are very specific
          break;
        case 'content':
          score += 3;
          break;
      }
    });

    // Boost score for exact matches
    if (matches.some(m => m.value.toLowerCase() === options.query.toLowerCase())) {
      score += 20;
    }

    // Boost score for files vs directories (usually more relevant)
    if (item.type === 'file') {
      score += 2;
    }

    // Penalize deleted files slightly
    if (item.metadata?.isDeleted) {
      score -= 1;
    }

    return score;
  }

  private tokenize(text: string): string[] {
    return text.split(/[\s\-_./\\]+/).filter(token => token.length > 0);
  }

  // Advanced search methods
  findDuplicateFiles(): Array<{hash: string, files: FileSystemItem[]}> {
    const hashMap = new Map<string, FileSystemItem[]>();
    
    const collectHashes = (items: FileSystemItem[]) => {
      items.forEach(item => {
        if (item.type === 'file' && item.metadata?.md5Hash) {
          const hash = item.metadata.md5Hash;
          if (!hashMap.has(hash)) {
            hashMap.set(hash, []);
          }
          hashMap.get(hash)!.push(item);
        }
        
        if (item.children) {
          collectHashes(item.children);
        }
      });
    };

    collectHashes(this.items);

    return Array.from(hashMap.entries())
      .filter(([_, files]) => files.length > 1)
      .map(([hash, files]) => ({ hash, files }));
  }

  findLargeFiles(minSize: number = 100 * 1024 * 1024): FileSystemItem[] {
    const largeFiles: FileSystemItem[] = [];
    
    const collectLargeFiles = (items: FileSystemItem[]) => {
      items.forEach(item => {
        if (item.type === 'file' && item.size >= minSize) {
          largeFiles.push(item);
        }
        
        if (item.children) {
          collectLargeFiles(item.children);
        }
      });
    };

    collectLargeFiles(this.items);
    return largeFiles.sort((a, b) => b.size - a.size);
  }

  findRecentlyModified(days: number = 7): FileSystemItem[] {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    
    const recentFiles: FileSystemItem[] = [];
    
    const collectRecentFiles = (items: FileSystemItem[]) => {
      items.forEach(item => {
        if (item.modified > cutoffDate) {
          recentFiles.push(item);
        }
        
        if (item.children) {
          collectRecentFiles(item.children);
        }
      });
    };

    collectRecentFiles(this.items);
    return recentFiles.sort((a, b) => b.modified.getTime() - a.modified.getTime());
  }

  findDeletedFiles(): FileSystemItem[] {
    const deletedFiles: FileSystemItem[] = [];
    
    const collectDeletedFiles = (items: FileSystemItem[]) => {
      items.forEach(item => {
        if (item.metadata?.isDeleted) {
          deletedFiles.push(item);
        }
        
        if (item.children) {
          collectDeletedFiles(item.children);
        }
      });
    };

    collectDeletedFiles(this.items);
    return deletedFiles;
  }
}