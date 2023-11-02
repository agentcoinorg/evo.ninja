# evo.ninja

![](https://hackmd.io/_uploads/ByWjLKAhn.png)

[Discord](https://discord.gg/X7ystzGcf5) | [Website](https://evo.ninja)
Give this repo a star if you use it! :star: 

## Welcome to evo.ninja 

Dive in to explore the capabilities and features provided by this agent.

## Setup

#### Pre-Requisites
Please install the following:
- [git](https://git-scm.com/book/en/v2/Getting-Started-Installing-Git)
- [nodejs](https://nodejs.org/en/download/package-manager#alpine-linux)
- [yarn](https://classic.yarnpkg.com/lang/en/docs/install/#debian-stable)
- [nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

#### Installation
1. Clone the repository 
    > `git clone https://github.com/polywrap/evo.ninja`
2. Copy the `.env.template` file and rename it to `.env`.  
    > `cp .env.template .env`
3. Find the line that says OPENAI_API_KEY=, and add your unique OpenAI API Key
`OPENAI_API_KEY=sk-...`
4. Find the line that says SERP_API_KEY=, and add your unique SERP API Key.
`SERP_API_KEY=b071...`

    *Get it from https://serpapi.com

5. Use the correct version of Node.JS
    > `nvm install && nvm use`
6. Install all dependencies & build project
    > `yarn && yarn build`

Now you're ready to go! You can run Evo through CLI or using the UI

## Usage

There's two ways to interact with evo, it can be through the CLI or using the UI

#### CLI

You can just run evo by doing:
> `yarn start`

You can also pass a goal on startup:
> `yarn start '<your main goal here>'`

**Accepted arguments**:
- Session folder (-s | --session): To allow evo to access custom files at start, you can create a new folder in `./sessions/CUSTOM_NAME` and add all the files you need; then you can run `yarn start -s CUSTOM_NAME`; Evo will use this folder as its session folder.
- Timeout (-t | --timeout): Seconds to timeout
- Debug logs (-d | --debug): Creates a `debug.json` file where the LLM requests are added 


#### UI

Just run:
> `yarn build:browser && yarn start:browser`


### Examples
Now you can try any goal you'd like Evo to do like the followings:
- `Create one piece of SVG art and save it as art.svg`
- `Divide 590 by 204 and save it to a file named output.txt`
- `Create a CSV file named output.txt with the numbers from 1 to 10 and verify the content`
- `Write the word Washington to the file called output.txt`
- `Calculate the (590 * 204) + (1000 / 2) - 42`
- `Fetch the price of ethereum, bitcoin and dogecoin and save them in a file named crypto.csv`

### Workspace
Once evo.ninja is run, there will be a `./sessions` directory created.
This is the root directory for the agent. Any files will be read & written from this directory.


## How it works

Evo consist on multiple subagents which are specialized and are able to execute task in specific domains.

It first does an LLM interaction to predict what the next step should be, based on goal & previous messages.

Then, given the prediction of what should be done, it decides which specialized agent must be used; this decision is made based on the expertise + the function calls available of each specialized agent.

Once the agent has been selected, it does a second LLM call to know which function call it should execute, in order to achieve the goal asked; once the function call has been executed, the response is stored in the chat and the process is repeated until Evo knows that the goal has been accomplished

### Available Agents

| Agent                                                               | Description |
|---------------------------------------------------------------------|-------------|
|  🥷 [Evo](https://github.com/polywrap/evo.ninja/tree/dev/packages/agents/src/agents/Evo)                                                            | An assistant designed to achieve user goals. Predicts what the next step should be and find the best agent to execute the goal |
| #️⃣ [Csv Analyst](https://github.com/polywrap/evo.ninja/tree/dev/packages/agents/src/agents/CsvAnalyst)                                                    | An expert analyzing and modifying CSV datasets. |
| 💻 [Developer](https://github.com/polywrap/evo.ninja/tree/dev/packages/agents/src/agents/Developer)                                                      | A developer assistant that excels at coding related tasks with access to the file system. It plans and writes clean and effective code to files. |
| 🌐 [Researcher](https://github.com/polywrap/evo.ninja/tree/dev/packages/agents/src/agents/Researcher)                                                     | Advanced web information retriever that allows to do complex research in the internet. |
| 📝[Synthesizer](https://github.com/polywrap/evo.ninja/tree/dev/packages/agents/src/agents/Synthesizer)                                                    | An assistant that handle files in workspace |