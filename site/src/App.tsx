import React from 'react';

import './App.css';

function App() {
  const scrollToFeatures = () => {
    const element = document.querySelector('.FeaturesSection');
    element && element.scrollIntoView({ behavior: 'smooth' });
  };

  const scrollToHowItWorks = () => {
    const element = document.querySelector('.HowItWorksSection');
    element && element.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>evo.ninja</h1>
        <img src="avatar-shadow.png" alt="Evo" width={200} />
        <h2>An AI that never stops learning.</h2>
        <button onClick={scrollToFeatures}>Learn More</button>
      </header>
      <section className="FeaturesSection">
        <h1>Under The Hood</h1>
        <div className="Features">
          <div className="Feature">
            <h3>On-the-Fly Learning</h3>
            <p style={{ fontSize: '2em', textAlign: 'center' }}>🚀</p>
            <p>Evo updates its skills in real time, adapting to new tasks seamlessly.</p>
          </div>
          <div className="Feature">
            <h3>Internet Integrated</h3>
            <p style={{ fontSize: '2em', textAlign: 'center' }}>🌐</p>
            <p>Evo connects and learns from the vastness of the web, harnessing global knowledge.</p>
          </div>
          <div className="Feature">
            <h3>Self-Improving System</h3>
            <p style={{ fontSize: '2em', textAlign: 'center' }}>🔄</p>
            <p>In-built algorithms enable Evo to refine and enhance its abilities continuously.</p>
          </div>
        </div>
        <button onClick={scrollToHowItWorks}>Get Started</button>
      </section>
      <section className="HowItWorksSection">
        <h1>How It Works</h1>
        <div className="HowItWorks">
          <div className="HowItWorksStep">
            <h3>1. Connect</h3>
            <p style={{ fontSize: '2em', textAlign: 'center' }}>🔌</p>
            <p>Integrate Evo into your systems.</p>
          </div>
          <div className="HowItWorksStep">
            <h3>2. Command</h3>
            <p style={{ fontSize: '2em', textAlign: 'center' }}>🎯</p>
            <p>Assign a task or challenge.</p>
          </div>
          <div className="HowItWorksStep">
            <h3>3. See Evo Evolve</h3>
            <p style={{ fontSize: '2em', textAlign: 'center' }}>👀</p>
            <p>Witness real-time learning and dynamic function adaptation.</p>
          </div>
        </div>
      </section>
    </div>
  );
}

export default App;


