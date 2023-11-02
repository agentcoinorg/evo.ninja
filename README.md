# evo.ninja

![](https://hackmd.io/_uploads/ByWjLKAhn.png)

[Discord](https://discord.gg/X7ystzGcf5) | [Website](https://evo.ninja) | Give the repo a :star: !  

## Welcome!

To get started using evo.ninja simply head to our [website](https://evo.ninja), or to build and run from source follow these [setup instructions](#setup).

## How it works

What makes evo.ninja special is that it evolves itself in real-time, based on the tasks at hand. Evo utilizes pre-defined agent personas that are tailored to specific domains of tasks. Each iteration of evo's execution loop it will select and adopt the persona that fits the task at hand best.

### Agent Personas

| Agent | Expertise |
|-|-|
| 📝[Synthesizer](./packages/agents/src/agents/Synthesizer/index.ts) | "Reads text files, analyzing and gathering data and information from text files, generating summaries and reports, and analyzing text." |
| #️⃣ [Csv Analyst](./packages/agents/src/agents/CsvAnalyst/index.ts) | "Adept at reading CSV files, searching for data, extracting key data points, calculating amounts, and derive insights from CSV files." |
| 🌐 [Researcher](./packages/agents/src/agents/Researcher/index.ts) | "Searching the internet, comprehending details, and finding information." |
| 💻 [Developer](./packages/agents/src/agents/Developer/index.ts) | "Architect and build complex software. specialized in python." |

### Execution Loop

1. **Predict Next Step:** For each iteration of the execution loop, Evo starts by making an informed prediction about what the best-next-step should be.
2. **Select Best Agent:** Based on this prediction, Evo selects a best-fit agent persona.
3. **Contextualize Chat History:** Based on the prediction from step 1, and the agent persona in step 2, the complete chat history is "contextualized" and only the most relevant messages are used for the final evaluation step.
4. **Evaluate and Execute:** Using a smart LLM (GPT-4), a final evaluation step is run to determine what function call should be executed in order to achieve the user's goal. Once the function call has been executed, the response is stored, and the loop repeats itself until the user's goal has been accomplished.

## Setup

### Pre-Requisites
Please install the following:
- [git](https://git-scm.com/book/en/v2/Getting-Started-Installing-Git)
- [nodejs](https://nodejs.org/en/download/package-manager#alpine-linux)
- [yarn](https://classic.yarnpkg.com/lang/en/docs/install/#debian-stable)
- [nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

### Installation
1. Clone the repository 
    > `git clone https://github.com/polywrap/evo.ninja`
2. Copy the `.env.template` file and rename it to `.env`.  
    > `cp .env.template .env`
3. Find the line that says OPENAI_API_KEY=, and add your unique OpenAI API Key
`OPENAI_API_KEY=sk-...`
4. Find the line that says SERP_API_KEY=, and add your unique SERP API Key.
`SERP_API_KEY=b071...` (see https://serpapi.com)
5. Use the correct version of Node.JS
    > `nvm install && nvm use`
6. Install all dependencies & build project
    > `yarn && yarn build`

Now you're ready to go! You can run Evo through CLI or using the UI

## CLI

You can just run evo by doing:
> `yarn start`

You can also pass a goal on startup:
> `yarn start '<your main goal here>'`

**Accepted arguments**:
- Session folder (-s | --session): To allow evo to access custom files at start, you can create a new folder in `./sessions/CUSTOM_NAME` and add all the files you need; then you can run `yarn start -s CUSTOM_NAME`; Evo will use this folder as its session folder.
- Timeout (-t | --timeout): Seconds to timeout
- Debug logs (-d | --debug): Creates a `debug.json` file where the LLM requests are added 

### Workspace
Once evo.ninja is run, there will be a `./sessions` directory created.
This is the root directory for the agent. Any files will be read & written from this directory.

## UI

Just run:
> `yarn start:browser`
