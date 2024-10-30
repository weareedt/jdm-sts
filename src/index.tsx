import React from 'react';
import ReactDOM from 'react-dom/client';
import { ConsolePage } from './pages/ConsolePage';

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement);
root.render(
  <React.StrictMode>
    <ConsolePage />
  </React.StrictMode>
);
