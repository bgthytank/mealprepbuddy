import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { DiceOptions } from './views/DiceOptions';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    {window.location.pathname === '/dice-options' ? <DiceOptions /> : <App />}
  </React.StrictMode>,
);
