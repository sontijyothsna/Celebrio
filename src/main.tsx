import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { SelectedEventProvider } from './context/SelectedEventContext';
import { SettingsProvider } from './context/SettingsContext';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <SettingsProvider>
      <BrowserRouter>
        <SelectedEventProvider>
          <App />
        </SelectedEventProvider>
      </BrowserRouter>
    </SettingsProvider>
  </StrictMode>,
);
