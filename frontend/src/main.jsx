import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
      <Toaster
        position="bottom-right"
        toastOptions={{
          duration: 3500,
          style: {
            background: 'var(--bg-overlay)',
            color: 'var(--text-primary)',
            border: '1px solid var(--border-strong)',
            borderRadius: '8px',
            fontSize: '13px',
            boxShadow: 'var(--shadow)',
          },
        }}
      />
    </BrowserRouter>
  </React.StrictMode>
);
