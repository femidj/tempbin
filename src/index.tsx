import React, { Suspense } from 'react';
import { createRoot } from 'react-dom/client';
import './i18n/config';
import App from './App';
import SkeletonLoader from './components/SkeletonLoader/SkeletonLoader';

// Prevent theme flash by setting body background immediately
const savedTheme = localStorage.getItem('theme');
if (savedTheme === 'light') {
  document.documentElement.style.backgroundColor = '#f5f5f5';
  document.body.style.backgroundColor = '#f5f5f5';
  
  // Also update theme-color meta tag
  const metaThemeColor = document.querySelector('meta[name="theme-color"]');
  if (metaThemeColor) {
    metaThemeColor.setAttribute('content', '#f5f5f5');
  }
}

const container = document.getElementById('app');
if (container) {
  const root = createRoot(container);
  const theme = savedTheme || 'dark';

  root.render(
    <React.StrictMode>
      <Suspense fallback={
        <div className={`app theme-${theme}`}>
          <SkeletonLoader />
        </div>
      }>
        <App />
      </Suspense>
    </React.StrictMode>
  );
}