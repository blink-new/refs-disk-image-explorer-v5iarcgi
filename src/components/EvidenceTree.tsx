import React, { useState } from 'react';
import { ChevronRight, ChevronDown, HardDrive, Folder, FolderOpen, File } from 'lucide-react';
import { EvidenceItem, FileSystemItem } from '../types/forensic';
import { cn } from '@/lib/utils';

interface EvidenceTreeProps {
  evidenceItems: EvidenceItem[];
  onItemSelect: (item: FileSystemItem) => void;
  selectedItem: FileSystemItem | null;
}

interface TreeNodeProps {
  item: FileSystemItem | EvidenceItem;
  level: number;
  onSelect: (item: FileSystemItem) => void;
  selectedItem: FileSystemItem | null;
  expandedNodes: Set<string>;
  onToggleExpand: (id: string) => void;
}

const TreeNode: React.FC<TreeNodeProps> = ({
  item,
  level,
  onSelect,
  selectedItem,
  expandedNodes,
  onToggleExpand,
}) => {
  const isExpanded = expandedNodes.has(item.id);
  const hasChildren = 'children' in item && item.children && item.children.length > 0;
  const isSelected = selectedItem?.id === item.id;

  const getIcon = () => {
    if ('fileSystem' in item) {
      return <HardDrive className="h-4 w-4 text-blue-600" />;
    }
    
    switch (item.type) {
      case 'directory':
        return isExpanded ? 
          <FolderOpen className="h-4 w-4 text-yellow-600" /> : 
          <Folder className="h-4 w-4 text-yellow-600" />;
      case 'file':
        return <File className="h-4 w-4 text-gray-600" />;
      case 'partition':
        return <HardDrive className="h-4 w-4 text-green-600" />;
      default:
        return <File className="h-4 w-4 text-gray-600" />;
    }
  };

  const handleClick = () => {
    if ('fileSystem' in item) {
      // This is an EvidenceItem, convert to FileSystemItem for selection
      const fsItem: FileSystemItem = {
        id: item.id,
        name: item.name,
        type: 'image',
        size: item.size,
        created: new Date(),
        modified: new Date(),
        accessed: new Date(),
        path: item.path,
        children: item.children,
      };
      onSelect(fsItem);
    } else {
      onSelect(item);
    }
  };

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (hasChildren) {
      onToggleExpand(item.id);
    }
  };

  return (
    <div>
      <div
        className={cn(
          "flex items-center py-1 px-2 cursor-pointer hover:bg-blue-50 text-sm",
          isSelected && "bg-blue-100 text-blue-900"
        )}
        style={{ paddingLeft: `${level * 16 + 8}px` }}
        onClick={handleClick}
      >
        <div className="flex items-center space-x-1 flex-1">
          {hasChildren ? (
            <button
              onClick={handleToggle}
              className="p-0.5 hover:bg-gray-200 rounded"
            >
              {isExpanded ? (
                <ChevronDown className="h-3 w-3" />
              ) : (
                <ChevronRight className="h-3 w-3" />
              )}
            </button>
          ) : (
            <div className="w-4" />
          )}
          {getIcon()}
          <span className="truncate">{item.name}</span>
          {'fileSystem' in item && (
            <span className="text-xs text-gray-500 ml-1">({item.fileSystem})</span>
          )}
        </div>
      </div>

      {isExpanded && hasChildren && (
        <div>
          {'children' in item && item.children?.map((child) => (
            <TreeNode
              key={child.id}
              item={child}
              level={level + 1}
              onSelect={onSelect}
              selectedItem={selectedItem}
              expandedNodes={expandedNodes}
              onToggleExpand={onToggleExpand}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export const EvidenceTree: React.FC<EvidenceTreeProps> = ({
  evidenceItems,
  onItemSelect,
  selectedItem,
}) => {
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());

  const handleToggleExpand = (id: string) => {
    setExpandedNodes(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  if (evidenceItems.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-500 text-sm">
        <div className="text-center">
          <HardDrive className="h-8 w-8 mx-auto mb-2 text-gray-400" />
          <p>No evidence loaded</p>
          <p className="text-xs mt-1">Use File → Add Evidence Item</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-auto">
      {evidenceItems.map((item) => (
        <TreeNode
          key={item.id}
          item={item}
          level={0}
          onSelect={onItemSelect}
          selectedItem={selectedItem}
          expandedNodes={expandedNodes}
          onToggleExpand={handleToggleExpand}
        />
      ))}
    </div>
  );
};