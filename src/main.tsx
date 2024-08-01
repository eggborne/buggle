// import React from 'react'
import ReactDOM from 'react-dom/client'
import 'normalize.css';
import './index.css'
import { FirebaseProvider } from './context/FirebaseContext';
import { UserProvider } from './context/UserContext';
import App from './App';

ReactDOM.createRoot(document.getElementById('root')!).render(
  // <React.StrictMode>
  <UserProvider>
    <FirebaseProvider>
      <App />
    </FirebaseProvider>
  </UserProvider>
  // </React.StrictMode>
)
