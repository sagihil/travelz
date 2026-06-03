// main.jsx
// --------
// Purpose: The entry point of the React application.
// - Imports the global CSS stylesheet (index.css).
// - Mounts the root <App /> component into the #root div defined in index.html.
// - Uses React 18's createRoot API for concurrent rendering.
// - Wraps the app in <React.StrictMode> to surface potential issues during development.

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';

// Find the single DOM node where React will render the entire application
const rootElement = document.getElementById('root');

// Create a React root and render the application
ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
