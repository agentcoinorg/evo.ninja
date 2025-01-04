![](./docs/imgs/evo-ninja-logo.png)

---

[Discord](https://agentcoin.org/discord) | :star: the repo !  

---

## Welcome!

To get started using evo.ninja simply head to our [website](https://evo.ninja), or to build and run from source follow these [setup instructions](#setup).

![](./docs/imgs/evo-ninja-app.png)

## Need Help?

Join our [Discord community](https://agentcoin.org/discord) for support and discussions.

[![Join us on Discord](https://invidget.switchblade.xyz/6gk85fetcT)](https://discord.com/invite/6gk85fetcT)

If you have questions or encounter issues, please don't hesitate to [create a new issue](https://github.com/agentcoinorg/evo.ninja/issues/new/choose) to get support.

## How it works

What makes evo.ninja special is that it adapts itself in real-time, based on the tasks at hand. Evo utilizes pre-defined agent personas that are tailored to specific domains of tasks. Each iteration of evo's execution loop it will select and adopt the persona that fits the task at hand best.

### Agent Personas

| Agent | Expertise |
|-|-|
| 📝[Synthesizer](./packages/agents/src/agents/Synthesizer/index.ts) | "Reads text files, analyzing and gathering data and information from text files, generating summaries and reports, and analyzing text." |
| #️⃣ [Csv Analyst](./packages/agents/src/agents/CsvAnalyst/index.ts) | "Adept at reading CSV files, searching for data, extracting key data points, calculating amounts, and derive insights from CSV files." |
| 🌐 [Researcher](./packages/agents/src/agents/Researcher/index.ts) | "Searching the internet, comprehending details, and finding information." |
| 💻 [Developer](./packages/agents/src/agents/Developer/index.ts) | "Architect and build complex software. specialized in python." |

### Execution Loop

![](apps/browser/public/arch-diagram-w-logo.png)

1. **Predict Next Step:** For each iteration of the execution loop, Evo starts by making an informed prediction about what the best-next-step should be.
2. **Select Best Agent:** Based on this prediction, Evo selects a best-fit agent persona.
3. **Contextualize Chat History:** Based on the prediction from step 1, and the agent persona in step 2, the complete chat history is "contextualized" and only the most relevant messages are used for the final evaluation step.
4. **Evaluate and Execute:** A final evaluation step is run to determine what agent function is executed to try and further achieve the user's goal.

These 4 steps run in a loop continuously until it is determined the user's goal has been achieved.

## Setup

### Pre-Requisites
Please install the following:
- [git](https://git-scm.com/book/en/v2/Getting-Started-Installing-Git)
- [nodejs](https://nodejs.org/en/download/package-manager#alpine-linux)
- [yarn](https://classic.yarnpkg.com/lang/en/docs/install/#debian-stable)
- [nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

### Installation
1. Clone the repository 
    > `git clone https://github.com/agentcoinorg/evo.ninja`
2. Copy the `.env.template` file and rename it to `.env`.  
    > `cp .env.template .env`
3. Find the line that says OPENAI_API_KEY=, and add your unique OpenAI API Key
`OPENAI_API_KEY=sk-...`
4. Find the line that says SERP_API_KEY=, and add your unique SERP API Key.
`SERP_API_KEY=b071...` (see https://serpapi.com)
5. Use the correct version of Node.JS
    > `nvm install && nvm use`
   Install Yarn if the node environment is new
    > `npm install -g yarn`
6. Install all dependencies & build project
    > `yarn && yarn build`

Now you're ready to go! You can run Evo through CLI or using the UI

## CLI

Run evo in the terminal:
> `yarn start`

**Arguments:**
- `[goal]` - Goal to be achieved

**Options:**
- `-s, --session <name>` - Name of the session within the `./sessions/...` directory.
- `-t, --timeout <seconds>` - Specify a timeout, used to terminate the process after a specified number of seconds.
- `-d, --debug` - Emit debug logs within the `./sessions/${session}/.evo/...` directory.

### Session Workspace
Once the evo.ninja CLI is run, there will be a `./sessions` directory created, with named sessions within it. This is the root directory for the agent, and only files within this directory will be read and written by the agent. There exists a `.evo/` directory within each session workspace, where internal logs are kept, including a `chat.md` file that's provides a markdown version of the agent's output. Use `--debug` to get a raw debug log emitted here as well.

## UI

The UI depends on [Supabase Database](https://supabase.com/). In order to run it locally you must have [Docker Desktop](https://docs.docker.com/get-docker/) installed and running.

0. Make sure you've followed installation steps above
1. Go to `cd apps/browser`
2. Run `yarn db:start` - This can take up to ~3 minutes, since it will download all the images needed by supabase
3. Update `.env.local` with the values shown in the output of step 2:
    - `NEXT_PUBLIC_SUPABASE_URL` will have the value of `API URL`
    - `SUPABASE_SERVICE_ROLE_KEY` will have the value of `service_role key`
4. Run the UI with `yarn dev`.
