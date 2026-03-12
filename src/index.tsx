import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Pass a function to log results (e.g. reportWebVitals(console.log))
// or send to an analytics endpoint: https://bit.ly/CRA-vitals
reportWebVitals();
