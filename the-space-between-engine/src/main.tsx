/**
 * Main Entry Point
 *
 * Renders the Observatory App into the DOM.
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './shell/App.js';

const root = document.getElementById('root');
if (!root) {
  throw new Error('Root element not found — add <div id="root"> to index.html');
}

ReactDOM.createRoot(root).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
