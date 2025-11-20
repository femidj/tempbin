
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import './Settings.css';
import { R2Config } from '../../types';
import { getR2Config, saveR2Config } from '../../services/r2Service';

interface SettingsProps {
  onClose: () => void;
  theme: 'light' | 'dark';
  onThemeChange: (theme: 'light' | 'dark') => void;
  highContrast: boolean;
  onHighContrastChange: (enabled: boolean) => void;
}

const Settings: React.FC<SettingsProps> = ({ onClose, theme, onThemeChange, highContrast, onHighContrastChange }) => {
  const { t, i18n } = useTranslation();
  const [config, setConfig] = useState<R2Config>({
    accountId: '',
    accessKeyId: '',
    secretAccessKey: '',
    bucketName: '',
    publicUrl: '',
  });
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [isClosing, setIsClosing] = useState(false);
  const [currentLanguage, setCurrentLanguage] = useState(i18n.language);

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    const savedConfig = await getR2Config();
    if (savedConfig) {
      setConfig({
        ...savedConfig,
        publicUrl: savedConfig.publicUrl || '',
      });
    }
  };

  const handleSave = async () => {
    if (!config.accountId || !config.accessKeyId || !config.secretAccessKey || !config.bucketName) {
      setMessage({ text: t('settings.requiredFields'), type: 'error' });
      return;
    }

    setIsSaving(true);
    try {
      await saveR2Config(config);
      setMessage({ text: t('settings.saveSuccess'), type: 'success' });
      setTimeout(() => {
        handleClose();
      }, 1500);
    } catch (error) {
      setMessage({ text: t('settings.saveError'), type: 'error' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      onClose();
    }, 300);
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };

  const handleLanguageChange = (lang: string) => {
    setCurrentLanguage(lang);
    i18n.changeLanguage(lang);
    localStorage.setItem('language', lang);
  };

  const languages = [
    { code: 'en-US', name: 'English (US)' },
    { code: 'en-GB', name: 'English (UK)' },
    { code: 'es', name: 'Español' },
    { code: 'fr', name: 'Français' },
    { code: 'de', name: 'Deutsch' },
    { code: 'zh-CN', name: '简体中文' },
    { code: 'zh-HK', name: '繁體中文' },
    { code: 'ja', name: '日本語' },
    { code: 'ko', name: '한국어' },
  ];

  return (
    <div className={`settings-overlay ${isClosing ? 'closing' : ''}`} onClick={handleOverlayClick} role="presentation">
      <div 
        className={`settings-modal ${isClosing ? 'closing' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="settings-dialog-title"
      >
        <div className="settings-header">
          <h2 className="settings-title" id="settings-dialog-title">{t('settings.title')}</h2>
          <button 
            className="close-button" 
            onClick={handleClose} 
            aria-label={t('settings.closeAria')}
            type="button"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="settings-content">
          <div className="r2-section">
            <h3 className="section-title">{t('settings.r2Title')}</h3>
            
            <div className="settings-info">
              <svg className="info-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <strong>{t('settings.infoTitle')}</strong>
                <p>{t('settings.infoDescription')}</p>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="accountId">{t('settings.accountId')} *</label>
              <input
                id="accountId"
                type="text"
                value={config.accountId}
                onChange={(e) => setConfig({ ...config, accountId: e.target.value })}
                placeholder={t('settings.accountIdPlaceholder')}
                autoComplete="off"
                aria-required="true"
              />
            </div>

            <div className="form-group">
              <label htmlFor="bucketName">{t('settings.bucketName')} *</label>
              <input
                id="bucketName"
                type="text"
                value={config.bucketName}
                onChange={(e) => setConfig({ ...config, bucketName: e.target.value })}
                placeholder={t('settings.bucketNamePlaceholder')}
                autoComplete="off"
                aria-required="true"
              />
            </div>

            <div className="form-group">
              <label htmlFor="accessKeyId">{t('settings.accessKeyId')} *</label>
              <input
                id="accessKeyId"
                type="text"
                value={config.accessKeyId}
                onChange={(e) => setConfig({ ...config, accessKeyId: e.target.value })}
                placeholder={t('settings.accessKeyIdPlaceholder')}
                autoComplete="off"
                aria-required="true"
              />
            </div>

            <div className="form-group">
              <label htmlFor="secretAccessKey">{t('settings.secretAccessKey')} *</label>
              <input
                id="secretAccessKey"
                type="password"
                value={config.secretAccessKey}
                onChange={(e) => setConfig({ ...config, secretAccessKey: e.target.value })}
                placeholder={t('settings.secretAccessKeyPlaceholder')}
                autoComplete="new-password"
                aria-required="true"
              />
            </div>

            <div className="form-group">
              <label htmlFor="publicUrl">{t('settings.publicUrl')}</label>
              <input
                id="publicUrl"
                type="url"
                value={config.publicUrl}
                onChange={(e) => setConfig({ ...config, publicUrl: e.target.value })}
                placeholder={t('settings.publicUrlPlaceholder')}
                autoComplete="url"
                aria-describedby="publicUrl-hint"
              />
              <small id="publicUrl-hint">{t('settings.publicUrlHint')}</small>
            </div>
          </div>

          <div className="appearance-section">
            <h3 className="section-title">{t('settings.appearance')}</h3>
            
            <div className="toggle-group">
              <div className="toggle-item">
                <div className="toggle-info">
                  <label htmlFor="themeToggle">{t('settings.themeMode')}</label>
                  <small>{t('settings.themeModeHint')}</small>
                </div>
                <div className="theme-toggle">
                  <button
                    className={`theme-option ${theme === 'light' ? 'active' : ''}`}
                    onClick={() => onThemeChange('light')}
                    aria-label={t('settings.lightMode')}
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z\" />
                    </svg>
                    <span>{t('settings.light')}</span>
                  </button>
                  <button
                    className={`theme-option ${theme === 'dark' ? 'active' : ''}`}
                    onClick={() => onThemeChange('dark')}
                    aria-label={t('settings.darkMode')}
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                    </svg>
                    <span>{t('settings.dark')}</span>
                  </button>
                </div>
              </div>

              <div className="toggle-item">
                <div className="toggle-info">
                  <label htmlFor="contrastToggle">{t('settings.highContrast')}</label>
                  <small>{t('settings.highContrastHint')}</small>
                </div>
                <label className="switch">
                  <input
                    id="contrastToggle"
                    type="checkbox"
                    checked={highContrast}
                    onChange={(e) => onHighContrastChange(e.target.checked)}
                    aria-label={t('settings.highContrast')}
                  />
                  <span className="switch-slider"></span>
                </label>
              </div>

              <div className="toggle-item">
                <div className="toggle-info">
                  <label htmlFor="languageSelect">{t('settings.language')}</label>
                  <small>{t('settings.languageHint')}</small>
                </div>
                <select
                  id="languageSelect"
                  className="language-select"
                  value={currentLanguage}
                  onChange={(e) => handleLanguageChange(e.target.value)}
                  aria-label={t('settings.language')}
                >
                  {languages.map((lang) => (
                    <option key={lang.code} value={lang.code}>
                      {lang.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {message && (
            <div className={`settings-message ${message.type}`}>
              {message.text}
            </div>
          )}

          <div className="settings-actions">
            <button className="button secondary" onClick={handleClose} type="button">
              {t('settings.cancel')}
            </button>
            <button 
              className="button primary" 
              onClick={handleSave}
              disabled={isSaving}
              type="button"
            >
              {isSaving ? t('settings.saving') : t('settings.save')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
