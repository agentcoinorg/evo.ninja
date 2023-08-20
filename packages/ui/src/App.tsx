import React from 'react';

import { Evo, InMemoryWorkspace, Scripts, OpenAI, Chat } from "@evo-ninja/core";

import './App.css';

const workspace = new InMemoryWorkspace();
const scripts = new Scripts(workspace, "./scripts");
const llm = new OpenAI(
  "foo",
  "foo",
  510102
);
const chat = new Chat(
  workspace,
  llm
);
const evo = new Evo(workspace, scripts, llm, chat);

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
        <section className="Header-Links">
          <a href="https://discord.polywrap.io" target="_blank" rel="noopener noreferrer">
            <img src="discord.svg" alt="Discord" />
          </a>
          <a href="https://twitter.com/evo_ninja_ai" target="_blank" rel="noopener noreferrer">
            <img src="twitter.svg" alt="Twitter" />
          </a>
          <a href="https://github.com/polywrap/evo.ninja" target="_blank" rel="noopener noreferrer">
            <img src="github.svg" alt="Github" />
          </a>
        </section>
        <section className="Hero">
          <h1>evo.ninja</h1>
          <img src="avatar.png" alt="Evo" width={200} />
          <h2>The AI that evolves in real-time</h2>
          <button onClick={scrollToFeatures}>Learn More</button>
        </section>
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


