import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { ConsolePage } from './pages/ConsolePage';
import './App.scss';

function App() {
  return (
    <Router>
    <div className="App">
      <div className="content-wrapper">
      <Routes>
        {/*<Visualizer />*/}  
        <Route path="/console" element={<ConsolePage/>} />
        </Routes>
      </div>
      </div>
    </Router>
  );
}

export default App;
