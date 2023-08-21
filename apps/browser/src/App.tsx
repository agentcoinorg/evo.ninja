import React from 'react';
import { HashRouter as Router, Route, Routes } from "react-router-dom";

import './App.css';

import Landing from "./pages/Landing";
import Dojo from "./pages/Dojo";

function App() {
  return (
    <Router>
      <Routes>
          <Route path="/" Component={Landing} />
          <Route path="/dojo" Component={Dojo} />
      </Routes>
    </Router>
  );
}

export default App;
