import React from "react";
import { useRouter } from "next/router";

function Landing() {
  const router = useRouter();

  return (
    <div className="animate-landing-bg bg-landing-bg bg-repeat text-center text-neutral-400 ">
      <div className="bg-neutral-900/70 text-center text-white">
        <header className="flex min-h-screen items-center justify-center text-3xl font-semibold text-white">
          <section className="absolute right-0 top-0 mr-12 flex h-16 items-center gap-6">
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
          <section className="flex flex-col items-center gap-4">
            <h1>evo.ninja</h1>
            <img src="avatar.png" alt="Evo" width={200} />
            <h2>The AI that evolves in real-time</h2>
            <button
              className="cursor-pointer rounded border-none bg-slate-900 px-5 py-2.5 text-white transition-colors hover:bg-slate-700"
              onClick={() => router.push("/dojo")}
            >Enter Dojo</button>
          </section>
        </header>
      </div>
    </div>
  );
}

export default Landing;
