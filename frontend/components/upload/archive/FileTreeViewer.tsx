'use client';

import { useState } from 'react';
import { clsx } from 'clsx';
import { ChevronRight, ChevronDown, FileText, Folder, FolderOpen } from 'lucide-react';

export interface FileNode {
  name: string;
  path: string;
  isDir: boolean;
  content?: string;
  size?: number;
  children?: FileNode[];
}

interface Props {
  files: { path: string; content: string; size: number }[];
  entryFilePath?: string;
  onFileSelect?: (path: string, content: string) => void;
  selectedPath?: string;
}

export function buildFileTree(files: { path: string; content: string; size: number }[]): FileNode[] {
  const root: FileNode[] = [];
  const dirMap = new Map<string, FileNode>();

  for (const file of files) {
    const parts = file.path.split('/');
    let current = root;

    for (let i = 0; i < parts.length - 1; i++) {
      const dirPath = parts.slice(0, i + 1).join('/');
      if (!dirMap.has(dirPath)) {
        const node: FileNode = {
          name: parts[i],
          path: dirPath,
          isDir: true,
          children: [],
        };
        dirMap.set(dirPath, node);
        current.push(node);
      }
      current = dirMap.get(dirPath)!.children!;
    }

    current.push({
      name: parts[parts.length - 1],
      path: file.path,
      isDir: false,
      content: file.content,
      size: file.size,
    });
  }

  return root;
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes}B`;
  return `${(bytes / 1024).toFixed(1)}KB`;
}

function TreeNode({
  node,
  entryFilePath,
  onFileSelect,
  selectedPath,
  depth = 0,
}: {
  node: FileNode;
  entryFilePath?: string;
  onFileSelect?: (path: string, content: string) => void;
  selectedPath?: string;
  depth?: number;
}) {
  const [open, setOpen] = useState(depth < 2);

  if (node.isDir) {
    return (
      <div>
        <button
          onClick={() => setOpen((v) => !v)}
          className="flex items-center gap-1 w-full text-left py-0.5 text-sm text-gray-700 hover:text-gray-900"
          style={{ paddingLeft: `${depth * 16}px` }}
        >
          {open ? <ChevronDown size={13} className="shrink-0 text-gray-400" /> : <ChevronRight size={13} className="shrink-0 text-gray-400" />}
          {open ? <FolderOpen size={14} className="shrink-0 text-yellow-500" /> : <Folder size={14} className="shrink-0 text-yellow-500" />}
          <span className="font-medium">{node.name}/</span>
        </button>
        {open && node.children?.map((child) => (
          <TreeNode
            key={child.path}
            node={child}
            entryFilePath={entryFilePath}
            onFileSelect={onFileSelect}
            selectedPath={selectedPath}
            depth={depth + 1}
          />
        ))}
      </div>
    );
  }

  const isEntry = entryFilePath && node.path === entryFilePath;
  const isSelected = selectedPath === node.path;

  return (
    <button
      onClick={() => onFileSelect?.(node.path, node.content ?? '')}
      className={clsx(
        'flex items-center gap-1.5 w-full text-left py-0.5 text-sm rounded transition-colors',
        isSelected ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
      )}
      style={{ paddingLeft: `${depth * 16 + 18}px` }}
    >
      <FileText size={13} className={clsx('shrink-0', isEntry ? 'text-blue-500' : 'text-gray-400')} />
      <span className={clsx(isEntry && 'font-semibold text-blue-600')}>{node.name}</span>
      {isEntry && (
        <span className="ml-1 text-xs px-1.5 py-0.5 bg-blue-100 text-blue-600 rounded font-medium">主要</span>
      )}
      {node.size !== undefined && (
        <span className="ml-auto text-xs text-gray-400 shrink-0">{formatSize(node.size)}</span>
      )}
    </button>
  );
}

export default function FileTreeViewer({ files, entryFilePath, onFileSelect, selectedPath }: Props) {
  const tree = buildFileTree(files);

  return (
    <div className="font-mono text-xs bg-gray-50 rounded-lg border border-gray-200 px-3 py-2 overflow-auto max-h-64">
      {tree.map((node) => (
        <TreeNode
          key={node.path}
          node={node}
          entryFilePath={entryFilePath}
          onFileSelect={onFileSelect}
          selectedPath={selectedPath}
        />
      ))}
    </div>
  );
}
