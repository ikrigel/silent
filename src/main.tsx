import React from 'react';
import ReactDOM from 'react-dom/client';
import './i18n';
import App from './App';

/**
 * Application entry point.
 * Mounts the React app into the #root DOM element.
 */
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
