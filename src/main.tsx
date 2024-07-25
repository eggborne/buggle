// import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import 'normalize.css';
import './index.css'
import { UserProvider } from './context/UserContext.tsx';
import { FirebaseProvider } from 'context/FirebaseContext.tsx';

ReactDOM.createRoot(document.getElementById('root')!).render(
  // <React.StrictMode>
  <FirebaseProvider>
    <UserProvider>
      <App />
    </UserProvider>
  </FirebaseProvider>
  // </React.StrictMode>
)
