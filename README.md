# evo-ninja
Welcome to evo.ninja.

Evo.ninja is an AI agent that builds itself!
It executes scripts to achieve a goal.
It is capable of using fuzzy search to find and execute any script in its library.
Scripts are namespaced JavaScript functions with typed arguments and a description. 
If it can not find a script, it will write one itself.

[Roadmap](./ROADMAP.md)

Dive in to explore the capabilities and features provided by this agent.
Before you can run evo.ninja, ensure you have Node.js and yarn installed.

## Installation
Clone the repository:
```bash
git clone https://github.com/polywrap/evo.ninja
cd evo.ninja
```

Install dependencies:
```bash
yarn
```

## Running
To run the agent, simply run:
```bash
yarn start
```

If you want to provide the goal as an argument, you can run:
```bash
yarn start "Write 'Hello world!' to a hello.txt file"
```
