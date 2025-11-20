
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import './FileList.css';
import { FileItem } from '../../types';

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

  const getFileIcon = (fileName: string) => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    
    // Images
    if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp', 'ico'].includes(ext || '')) {
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      );
    }
    
    // Videos
    if (['mp4', 'avi', 'mov', 'wmv', 'flv', 'mkv', 'webm', 'm4v', 'mpeg', 'mpg'].includes(ext || '')) {
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
      );
    }
    
    // Audio
    if (['mp3', 'wav', 'ogg', 'flac', 'aac', 'm4a', 'wma', 'aiff'].includes(ext || '')) {
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
        </svg>
      );
    }
    
    // PDF
    if (['pdf'].includes(ext || '')) {
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
        </svg>
      );
    }

    // Archives
    if (['zip', 'rar', '7z', 'tar', 'gz', 'bz2', 'xz', 'iso'].includes(ext || '')) {
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
        </svg>
      );
    }

    // Code files
    if (['js', 'jsx', 'ts', 'tsx', 'py', 'java', 'cpp', 'c', 'h', 'cs', 'php', 'rb', 'go', 'rs', 'swift', 'kt'].includes(ext || '')) {
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
        </svg>
      );
    }

    // Documents
    if (['doc', 'docx', 'txt', 'rtf', 'odt'].includes(ext || '')) {
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      );
    }

    // Spreadsheets
    if (['xls', 'xlsx', 'csv', 'ods'].includes(ext || '')) {
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
      );
    }

    // Presentations
    if (['ppt', 'pptx', 'odp'].includes(ext || '')) {
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />
        </svg>
      );
    }

    // Default file icon
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    );
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
                  {getFileIcon(file.name)}
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
