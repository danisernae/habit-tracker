import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import { NutritionProvider } from './nutrition';
import { StoreProvider } from './store';
import './styles.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <StoreProvider>
      <NutritionProvider>
        <App />
      </NutritionProvider>
    </StoreProvider>
  </StrictMode>,
);
