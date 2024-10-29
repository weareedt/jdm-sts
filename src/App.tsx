import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import {ConsolePage } from './pages/ConsolePage';
import './App.scss';

function App() {
  return (
    <BrowserRouter basename="/jdm-sts">
      <div className="App">
        <div className="content-wrapper">
          <Routes>
            <Route path="/" element={<ConsolePage />} />
            {/*<Visualizer />*/}  
            <Route path="/console" element={<ConsolePage/>} />
          </Routes>
        </div>
      </div>
    </BrowserRouter>
  );
}

export default App;
