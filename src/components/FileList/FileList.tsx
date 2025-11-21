
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import './FileList.css';
import { FileItem } from '../../types';
import FileIcon from '../FileIcon/FileIcon';

interface FileListProps {
  files: FileItem[];
  onDeleteFile: (fileId: string) => void;
  onDeleteSelected: (fileIds: string[]) => void;
  fadeOut?: boolean;
}

const FileList: React.FC<FileListProps> = ({ files, onDeleteFile, onDeleteSelected, fadeOut }) => {
  const { t } = useTranslation();
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
  const [timers, setTimers] = useState<Record<string, string>>({});
  const [deletingFiles, setDeletingFiles] = useState<Set<string>>(new Set());

  useEffect(() => {
    const updateTimers = () => {
      const newTimers: Record<string, string> = {};
      files.forEach(file => {
        const now = Date.now();
        const remaining = file.expiresAt - now;
        
        if (remaining <= 0) {
          newTimers[file.id] = t('fileList.expired');
        } else {
          const minutes = Math.floor(remaining / 60000);
          const seconds = Math.floor((remaining % 60000) / 1000);
          newTimers[file.id] = `${minutes}:${seconds.toString().padStart(2, '0')}`;
        }
      });
      setTimers(newTimers);
    };

    updateTimers();
    const interval = setInterval(updateTimers, 1000);
    return () => clearInterval(interval);
  }, [files, t]);

  const toggleSelectAll = () => {
    if (selectedFiles.size === files.length) {
      setSelectedFiles(new Set());
    } else {
      setSelectedFiles(new Set(files.map(f => f.id)));
    }
  };

  const toggleSelect = (fileId: string) => {
    const newSelected = new Set(selectedFiles);
    if (newSelected.has(fileId)) {
      newSelected.delete(fileId);
    } else {
      newSelected.add(fileId);
    }
    setSelectedFiles(newSelected);
  };

  const handleCopyLink = async (url: string, fileId: string) => {
    try {
      await navigator.clipboard.writeText(url);
      const button = document.getElementById(`copy-${fileId}`);
      if (button) {
        const originalText = button.textContent;
        button.textContent = t('fileList.copied');
        setTimeout(() => {
          button.textContent = originalText;
        }, 1500);
      }
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const handleCopyAllLinks = async () => {
    const links = files.map(f => f.url).join('\n');
    try {
      await navigator.clipboard.writeText(links);
      const button = document.getElementById('copy-all');
      if (button) {
        const originalText = button.textContent;
        button.textContent = t('fileList.copiedAll');
        setTimeout(() => {
          button.textContent = originalText;
        }, 1500);
      }
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const handleDeleteSelected = () => {
    if (selectedFiles.size > 0 && confirm(t('fileList.deleteConfirm', { count: selectedFiles.size }))) {
      const toDelete = Array.from(selectedFiles);
      setDeletingFiles(new Set(toDelete));
      setTimeout(() => {
        onDeleteSelected(toDelete);
        setSelectedFiles(new Set());
        setDeletingFiles(new Set());
      }, 500);
    }
  };

  const handleDeleteFile = (fileId: string) => {
    setDeletingFiles(new Set([fileId]));
    setTimeout(() => {
      onDeleteFile(fileId);
      setDeletingFiles(new Set());
    }, 500);
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 10) / 10 + ' ' + sizes[i];
  };

  return (
    <div className={`file-list ${fadeOut ? 'fade-out' : ''}`} role="region" aria-label="Uploaded files list">
      <div className="file-list-header">
        <h2 className="file-list-title">{t('fileList.title')} ({files.length})</h2>
        <div className="bulk-actions">
          {selectedFiles.size > 0 && (
            <>
              <button className="bulk-action-btn delete" onClick={handleDeleteSelected} type="button" aria-label={t('fileList.deleteSelected', { count: selectedFiles.size })}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                {t('fileList.deleteSelected', { count: selectedFiles.size })}
              </button>
            </>
          )}
          {files.length > 0 && (
            <button id="copy-all" className="bulk-action-btn" onClick={handleCopyAllLinks} type="button" aria-label={t('fileList.copyAllLinks')}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
              </svg>
              {t('fileList.copyAllLinks')}
            </button>
          )}
        </div>
      </div>
      
      <div className="file-list-table">
        <div className="file-list-table-header">
          <div className="file-cell file-cell-checkbox">
            <input 
              type="checkbox" 
              checked={selectedFiles.size === files.length && files.length > 0}
              onChange={toggleSelectAll}
              aria-label={t('fileList.selectAllAria')}
            />
          </div>
          <div className="file-cell file-cell-name">{t('fileList.name')}</div>
          <div className="file-cell file-cell-size">{t('fileList.size')}</div>
          <div className="file-cell file-cell-timer">{t('fileList.expires')}</div>
          <div className="file-cell file-cell-actions">{t('fileList.actions')}</div>
        </div>

        {files.map((file) => (
          <div key={file.id} className={`file-list-row ${selectedFiles.has(file.id) ? 'selected' : ''} ${deletingFiles.has(file.id) ? 'deleting' : ''}`}>
            <div className="file-cell file-cell-checkbox">
              <input 
                type="checkbox" 
                checked={selectedFiles.has(file.id)}
                onChange={() => toggleSelect(file.id)}
                aria-label={t('fileList.selectFileAria', { name: file.name })}
              />
            </div>
            <div className="file-cell file-cell-name">
              <div className="file-name-wrapper">
                <div className="file-icon">
                  <FileIcon fileName={file.name} />
                </div>
                <span className="file-name" title={file.name}>{file.name}</span>
              </div>
            </div>
            <div className="file-cell file-cell-size">{formatFileSize(file.size)}</div>
            <div className="file-cell file-cell-timer">
              <span className="timer-text">{timers[file.id] || '...'}</span>
            </div>
            <div className="file-cell file-cell-actions">
              <button 
                id={`copy-${file.id}`}
                className="action-btn copy"
                onClick={() => handleCopyLink(file.url, file.id)}
                title={t('fileList.copyLinkTitle')}
                aria-label={t('fileList.copyLinkAria', { name: file.name })}
                type="button"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                </svg>
              </button>
              <a 
                href={file.url}
                className="action-btn open"
                target="_blank"
                rel="noopener noreferrer"
                title={t('fileList.openFileTitle')}
                aria-label={t('fileList.openFileAria', { name: file.name })}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
              <button 
                className="action-btn delete"
                onClick={() => handleDeleteFile(file.id)}
                title={t('fileList.deleteFileTitle')}
                aria-label={t('fileList.deleteFileAria', { name: file.name })}
                type="button"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FileList;
