import React from 'react';
import { ConsolePage } from './pages/ConsolePage';
import './App.scss';


function App() {
  return (
    <div className="App">
      <div className="content-wrapper">
        {/*<Visualizer />*/}  
        <ConsolePage />
      </div>
    </div>
  );
}

export default App;
