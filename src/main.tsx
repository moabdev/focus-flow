import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { App } from './App';
import { ToastProvider } from '@/features/core/contexts/ToastContext';
import { ToastContainer } from '@/features/core/components/common/ToastContainer';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <ToastProvider>
        <App />
        <ToastContainer />
      </ToastProvider>
    </BrowserRouter>
  </React.StrictMode>
);

