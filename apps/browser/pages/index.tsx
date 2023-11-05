import React from "react";
import { useRouter } from "next/router";

function Landing() {
  const router = useRouter();
  return (
    <div className="Landing-background">
      <div className="Landing">
        <header className="Landing-header">
          <section className="Header-Links">
            <a
              href="https://discord.gg/X7ystzGcf5"
              target="_blank"
              rel="noopener noreferrer"
            >
              <img src="discord.svg" alt="Discord" />
            </a>
            <a
              href="https://twitter.com/evo_ninja_ai"
              target="_blank"
              rel="noopener noreferrer"
            >
              <img src="twitter.svg" alt="Twitter" />
            </a>
            <a
              href="https://github.com/polywrap/evo.ninja"
              target="_blank"
              rel="noopener noreferrer"
            >
              <img src="github.svg" alt="Github" />
            </a>
          </section>
          <section className="Hero">
            <h1>evo.ninja</h1>
            <img src="avatar.png" alt="Evo" width={200} />
            <h2>The AI that evolves in real-time</h2>
            <button onClick={() => router.push("/dojo")}>Enter Dojo</button>
          </section>
        </header>
      </div>
    </div>
  );
}

export default Landing;
