import React from 'react';
import ReactDOM from 'react-dom/client';
import { HelmetProvider } from 'react-helmet-async';
import App from './App';
import './index.css';
import { FirebaseAuthProvider } from './components/FirebaseAuthProvider';
import { NotificationSoundProvider } from './components/NotificationSoundProvider';

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <HelmetProvider>
      <FirebaseAuthProvider>
        <NotificationSoundProvider>
          <App />
        </NotificationSoundProvider>
      </FirebaseAuthProvider>
    </HelmetProvider>
  </React.StrictMode>
);
