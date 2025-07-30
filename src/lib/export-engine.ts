import { FileSystemItem, RefsMetadata } from '../types/forensic';
import { formatFileSize, formatTimestamp } from './refs-parser';

export interface ExportOptions {
  format: 'json' | 'csv' | 'xml' | 'html';
  includeMetadata: boolean;
  includeDeleted: boolean;
  includeHashes: boolean;
  flattenStructure: boolean;
  customFields?: string[];
}

export interface ExportResult {
  data: string;
  filename: string;
  mimeType: string;
  size: number;
}

export class ForensicExportEngine {
  private items: FileSystemItem[];

  constructor(items: FileSystemItem[]) {
    this.items = items;
  }

  export(options: ExportOptions): ExportResult {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    let data: string;
    let filename: string;
    let mimeType: string;

    switch (options.format) {
      case 'json':
        data = this.exportToJson(options);
        filename = `refs-export-${timestamp}.json`;
        mimeType = 'application/json';
        break;
      case 'csv':
        data = this.exportToCsv(options);
        filename = `refs-export-${timestamp}.csv`;
        mimeType = 'text/csv';
        break;
      case 'xml':
        data = this.exportToXml(options);
        filename = `refs-export-${timestamp}.xml`;
        mimeType = 'application/xml';
        break;
      case 'html':
        data = this.exportToHtml(options);
        filename = `refs-export-${timestamp}.html`;
        mimeType = 'text/html';
        break;
      default:
        throw new Error(`Unsupported export format: ${options.format}`);
    }

    return {
      data,
      filename,
      mimeType,
      size: new Blob([data]).size
    };
  }

  private exportToJson(options: ExportOptions): string {
    const exportData = {
      exportInfo: {
        timestamp: new Date().toISOString(),
        format: 'json',
        options,
        totalItems: this.countItems(this.items)
      },
      fileSystem: options.flattenStructure 
        ? this.flattenItems(this.items, options)
        : this.processItems(this.items, options)
    };

    return JSON.stringify(exportData, null, 2);
  }

  private exportToCsv(options: ExportOptions): string {
    const flatItems = this.flattenItems(this.items, options);
    
    // Define CSV headers
    const headers = [
      'Path',
      'Name',
      'Type',
      'Size',
      'Size (Formatted)',
      'Created',
      'Modified',
      'Accessed'
    ];

    if (options.includeMetadata) {
      headers.push(
        'File ID',
        'Parent ID',
        'Attributes',
        'Is Deleted',
        'Block Number',
        'Entry Index',
        'B-Tree Level'
      );
    }

    if (options.includeHashes) {
      headers.push('MD5 Hash', 'SHA1 Hash');
    }

    // Build CSV content
    const csvRows = [headers.join(',')];
    
    flatItems.forEach(item => {
      const row = [
        this.escapeCsvValue(item.path),
        this.escapeCsvValue(item.name),
        item.type,
        item.size.toString(),
        this.escapeCsvValue(formatFileSize(item.size)),
        this.escapeCsvValue(formatTimestamp(item.created)),
        this.escapeCsvValue(formatTimestamp(item.modified)),
        this.escapeCsvValue(formatTimestamp(item.accessed))
      ];

      if (options.includeMetadata && item.metadata) {
        row.push(
          item.metadata.fileId?.toString() || '',
          item.metadata.parentId?.toString() || '',
          item.metadata.attributes?.toString() || '',
          item.metadata.isDeleted ? 'true' : 'false',
          item.metadata.refs?.blockNumber?.toString() || '',
          item.metadata.refs?.entryIndex?.toString() || '',
          item.metadata.refs?.btreeLevel?.toString() || ''
        );
      }

      if (options.includeHashes) {
        row.push(
          item.metadata?.md5Hash || '',
          item.metadata?.sha1Hash || ''
        );
      }

      csvRows.push(row.join(','));
    });

    return csvRows.join('\n');
  }

  private exportToXml(options: ExportOptions): string {
    const xmlHeader = '<?xml version="1.0" encoding="UTF-8"?>\n';
    const exportInfo = `<export timestamp="${new Date().toISOString()}" format="xml" totalItems="${this.countItems(this.items)}">\n`;
    
    let xmlContent = xmlHeader + exportInfo;
    xmlContent += '<fileSystem>\n';
    
    if (options.flattenStructure) {
      const flatItems = this.flattenItems(this.items, options);
      flatItems.forEach(item => {
        xmlContent += this.itemToXml(item, options, 1);
      });
    } else {
      this.items.forEach(item => {
        xmlContent += this.itemToXml(item, options, 1);
      });
    }
    
    xmlContent += '</fileSystem>\n</export>';
    return xmlContent;
  }

  private exportToHtml(options: ExportOptions): string {
    const timestamp = new Date().toISOString();
    const totalItems = this.countItems(this.items);
    
    let html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>ReFS Forensic Export - ${timestamp}</title>
    <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 20px; background: #f5f5f5; }
        .header { background: #2B5797; color: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
        .stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin-bottom: 20px; }
        .stat-card { background: white; padding: 15px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .file-tree { background: white; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); overflow: hidden; }
        .file-item { padding: 8px 15px; border-bottom: 1px solid #eee; display: flex; justify-content: space-between; align-items: center; }
        .file-item:hover { background: #f8f9fa; }
        .file-name { font-weight: 500; }
        .file-details { color: #666; font-size: 0.9em; }
        .directory { background: #f8f9fa; font-weight: 600; }
        .deleted { color: #dc3545; text-decoration: line-through; }
        .metadata { font-family: 'Consolas', monospace; font-size: 0.8em; color: #666; margin-top: 5px; }
        table { width: 100%; border-collapse: collapse; background: white; }
        th, td { padding: 8px 12px; text-align: left; border-bottom: 1px solid #ddd; }
        th { background: #2B5797; color: white; font-weight: 600; }
        .hash { font-family: 'Consolas', monospace; font-size: 0.8em; }
    </style>
</head>
<body>
    <div class="header">
        <h1>ReFS Forensic Analysis Export</h1>
        <p>Generated: ${timestamp}</p>
        <p>Total Items: ${totalItems}</p>
    </div>`;

    // Add statistics
    const stats = this.generateStatistics();
    html += '<div class="stats">';
    Object.entries(stats).forEach(([key, value]) => {
      html += `<div class="stat-card"><h3>${key}</h3><p>${value}</p></div>`;
    });
    html += '</div>';

    // Add file listing
    if (options.flattenStructure) {
      html += this.generateHtmlTable(options);
    } else {
      html += this.generateHtmlTree(options);
    }

    html += '</body></html>';
    return html;
  }

  private processItems(items: FileSystemItem[], options: ExportOptions): any[] {
    return items
      .filter(item => options.includeDeleted || !item.metadata?.isDeleted)
      .map(item => {
        const processedItem: any = {
          id: item.id,
          name: item.name,
          type: item.type,
          size: item.size,
          sizeFormatted: formatFileSize(item.size),
          path: item.path,
          created: item.created.toISOString(),
          modified: item.modified.toISOString(),
          accessed: item.accessed.toISOString()
        };

        if (options.includeMetadata && item.metadata) {
          processedItem.metadata = {
            fileId: item.metadata.fileId,
            parentId: item.metadata.parentId,
            attributes: item.metadata.attributes,
            isDeleted: item.metadata.isDeleted,
            refs: item.metadata.refs
          };
        }

        if (options.includeHashes && item.metadata) {
          processedItem.hashes = {
            md5: item.metadata.md5Hash,
            sha1: item.metadata.sha1Hash
          };
        }

        if (item.children && item.children.length > 0) {
          processedItem.children = this.processItems(item.children, options);
        }

        return processedItem;
      });
  }

  private flattenItems(items: FileSystemItem[], options: ExportOptions): FileSystemItem[] {
    const flattened: FileSystemItem[] = [];

    const flatten = (items: FileSystemItem[]) => {
      items.forEach(item => {
        if (options.includeDeleted || !item.metadata?.isDeleted) {
          flattened.push(item);
        }
        if (item.children) {
          flatten(item.children);
        }
      });
    };

    flatten(items);
    return flattened;
  }

  private countItems(items: FileSystemItem[]): number {
    let count = 0;
    const countRecursive = (items: FileSystemItem[]) => {
      items.forEach(item => {
        count++;
        if (item.children) {
          countRecursive(item.children);
        }
      });
    };
    countRecursive(items);
    return count;
  }

  private escapeCsvValue(value: string): string {
    if (value.includes(',') || value.includes('"') || value.includes('\n')) {
      return `"${value.replace(/"/g, '""')}"`;
    }
    return value;
  }

  private itemToXml(item: FileSystemItem, options: ExportOptions, depth: number): string {
    const indent = '  '.repeat(depth);
    const isDeleted = item.metadata?.isDeleted ? ' deleted="true"' : '';
    
    let xml = `${indent}<item type="${item.type}" size="${item.size}"${isDeleted}>\n`;
    xml += `${indent}  <name><![CDATA[${item.name}]]></name>\n`;
    xml += `${indent}  <path><![CDATA[${item.path}]]></path>\n`;
    xml += `${indent}  <created>${item.created.toISOString()}</created>\n`;
    xml += `${indent}  <modified>${item.modified.toISOString()}</modified>\n`;
    xml += `${indent}  <accessed>${item.accessed.toISOString()}</accessed>\n`;

    if (options.includeMetadata && item.metadata) {
      xml += `${indent}  <metadata>\n`;
      xml += `${indent}    <fileId>${item.metadata.fileId}</fileId>\n`;
      xml += `${indent}    <parentId>${item.metadata.parentId}</parentId>\n`;
      xml += `${indent}    <attributes>${item.metadata.attributes}</attributes>\n`;
      if (item.metadata.refs) {
        xml += `${indent}    <refs>\n`;
        xml += `${indent}      <blockNumber>${item.metadata.refs.blockNumber}</blockNumber>\n`;
        xml += `${indent}      <entryIndex>${item.metadata.refs.entryIndex}</entryIndex>\n`;
        xml += `${indent}      <btreeLevel>${item.metadata.refs.btreeLevel}</btreeLevel>\n`;
        xml += `${indent}    </refs>\n`;
      }
      xml += `${indent}  </metadata>\n`;
    }

    if (options.includeHashes && item.metadata) {
      xml += `${indent}  <hashes>\n`;
      if (item.metadata.md5Hash) {
        xml += `${indent}    <md5>${item.metadata.md5Hash}</md5>\n`;
      }
      if (item.metadata.sha1Hash) {
        xml += `${indent}    <sha1>${item.metadata.sha1Hash}</sha1>\n`;
      }
      xml += `${indent}  </hashes>\n`;
    }

    if (item.children && item.children.length > 0 && !options.flattenStructure) {
      xml += `${indent}  <children>\n`;
      item.children.forEach(child => {
        xml += this.itemToXml(child, options, depth + 2);
      });
      xml += `${indent}  </children>\n`;
    }

    xml += `${indent}</item>\n`;
    return xml;
  }

  private generateStatistics(): Record<string, string> {
    const flatItems = this.flattenItems(this.items, { includeDeleted: true } as ExportOptions);
    
    const stats = {
      'Total Files': flatItems.filter(item => item.type === 'file').length.toString(),
      'Total Directories': flatItems.filter(item => item.type === 'directory').length.toString(),
      'Deleted Items': flatItems.filter(item => item.metadata?.isDeleted).length.toString(),
      'Total Size': formatFileSize(flatItems.reduce((sum, item) => sum + item.size, 0)),
      'Largest File': formatFileSize(Math.max(...flatItems.map(item => item.size))),
      'Average File Size': formatFileSize(
        flatItems.filter(item => item.type === 'file').reduce((sum, item) => sum + item.size, 0) /
        flatItems.filter(item => item.type === 'file').length || 0
      )
    };

    return stats;
  }

  private generateHtmlTable(options: ExportOptions): string {
    const flatItems = this.flattenItems(this.items, options);
    
    let html = '<div class="file-tree"><table><thead><tr>';
    html += '<th>Path</th><th>Name</th><th>Type</th><th>Size</th><th>Modified</th>';
    
    if (options.includeHashes) {
      html += '<th>MD5 Hash</th>';
    }
    
    html += '</tr></thead><tbody>';
    
    flatItems.forEach(item => {
      const deletedClass = item.metadata?.isDeleted ? ' class="deleted"' : '';
      html += `<tr${deletedClass}>`;
      html += `<td>${this.escapeHtml(item.path)}</td>`;
      html += `<td>${this.escapeHtml(item.name)}</td>`;
      html += `<td>${item.type}</td>`;
      html += `<td>${formatFileSize(item.size)}</td>`;
      html += `<td>${formatTimestamp(item.modified)}</td>`;
      
      if (options.includeHashes) {
        html += `<td class="hash">${item.metadata?.md5Hash || ''}</td>`;
      }
      
      html += '</tr>';
    });
    
    html += '</tbody></table></div>';
    return html;
  }

  private generateHtmlTree(options: ExportOptions): string {
    let html = '<div class="file-tree">';
    
    const renderItem = (item: FileSystemItem, depth: number = 0): string => {
      const indent = '  '.repeat(depth);
      const deletedClass = item.metadata?.isDeleted ? ' deleted' : '';
      const typeClass = item.type === 'directory' ? ' directory' : '';
      
      let itemHtml = `${indent}<div class="file-item${typeClass}${deletedClass}">`;
      itemHtml += `<div class="file-name">${this.escapeHtml(item.name)}</div>`;
      itemHtml += `<div class="file-details">${formatFileSize(item.size)} - ${formatTimestamp(item.modified)}</div>`;
      itemHtml += '</div>';
      
      if (item.children && item.children.length > 0) {
        item.children.forEach(child => {
          itemHtml += renderItem(child, depth + 1);
        });
      }
      
      return itemHtml;
    };
    
    this.items.forEach(item => {
      html += renderItem(item);
    });
    
    html += '</div>';
    return html;
  }

  private escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  // Utility method to download the export
  static downloadExport(result: ExportResult): void {
    const blob = new Blob([result.data], { type: result.mimeType });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = result.filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    URL.revokeObjectURL(url);
  }
}