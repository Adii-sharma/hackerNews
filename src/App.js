import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './components/LoginPage';
import SignupPage from './components/SignupPage';
import HackerNewsSearch from './components/HackerNewsSearch';

const App = () => {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route 
            path="/" 
            element={<ProtectedRoute />}  
          />
          <Route path="*" element={<Navigate to="/login" />} />
        </Routes>
      </div>
    </Router>
  );
};

const ProtectedRoute = () => {
  const isLoggedIn = !!localStorage.getItem('username');
  return isLoggedIn ? <HackerNewsSearch /> : <Navigate to="/login" replace />;
};

export default App;