import React from 'react';
import ReactDOM from 'react-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import reportWebVitals from './reportWebVitals';
import { BrowserRouter as Router, Route, Routes, Link } from 'react-router-dom';
import TransferPage from './TransferPage';
import Punto from './Punto';

const App = () => {
  return (
    <div style={{ margin: 'auto 0' }}>
    <Router>
      <div style={{ backgroundColor: '#E8E8E8', margin: '5rem', padding: '2rem', borderRadius: '2rem' }}>
        {/* Set the background color and minimum height for the entire application */}
        <Routes>
          <Route path="/settings" element={<TransferPage />} />
          <Route path="/" element={<Punto />} />
        </Routes>
      </div>
    </Router>
    </div>
  );
};

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);

reportWebVitals();



