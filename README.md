# evo.ninja

![](https://hackmd.io/_uploads/ByWjLKAhn.png)

[Discord](https://discord.polywrap.io/) | [Website](https://evo.ninja)
Give this repo a star if you use it! :star: 

## Welcome to evo.ninja

**The AI that evolves in real-time.** 

It executes scripts to achieve a goal. It is capable of using fuzzy search to find and execute any script in its library. Scripts are namespaced JavaScript functions with typed arguments and a description. If it can not find a script, it will write one itself.


Dive in to explore the capabilities and features provided by this agent.
Before you can run evo.ninja, ensure you have Node.js and yarn installed.

## Examples
- `Create one piece of SVG art and save it as art.svg`
- `Divide 590 by 204 and save it to a file named output.txt`
- `Create a CSV file named output.txt with the numbers from 1 to 10 and verify the content`
- `Write the word Washington to the file called output.txt`
- `Calculate the (590 * 204) + (1000 / 2) - 42`
- `Fetch the price of ethereum, bitcoin and dogecoin and save them in a file named crypto.csv`
## Getting Started
### Pre-Requisites
Please install the following:
- [git](https://git-scm.com/book/en/v2/Getting-Started-Installing-Git)
- [nodejs & npm](https://nodejs.org/en/download/package-manager#alpine-linux)
- [yarn](https://classic.yarnpkg.com/lang/en/docs/install/#debian-stable)
- [nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

NOTE: Step 5 is for Windows users using WSL2
`Executing yarn workspace @evo-ninja/core run build specifically builds the @evo-ninja/core package. The command triggers the build script defined in the package.json of the @evo-ninja/core workspace. In your case, this script cleans the build directory and then runs the TypeScript compiler (tsc) to transpile the TypeScript files into JavaScript, which is required for Node.js execution.`

### Setup
1. Clone the repository
`git clone https://github.com/polywrap/evo.ninja`
2. Copy the `.env.template` file and rename it to `.env`
`cp .env.template .env`
3. Find the line that says OPENAI_API_KEY=, and add your unique OpenAI API Key
`OPENAI_API_KEY=sk-...`
4. Use the correct version of Node.JS
`nvm install && nvm use`
5. Build the Core Package:
Given that the main field of your @evo-ninja/core package points to ./build/index.js, make sure you've built the TypeScript files in core to JavaScript:
`yarn workspace @evo-ninja/core run build`
6. Install all dependencies
`yarn install`
7. Run evo.ninja!
`yarn start`

Optional: You can also pass a goal on startup:
    `yarn start '<your main goal here>'`
    
NOTE: Please remember that this is a prototype. Its main purpose is to demonstrate how agent can self-learn.

## Workspace
Once evo.ninja is run, there will be a `./workspace` directory created. This is the root directory for the agent. Any files will be read & written from this directory.


## Debugging
evo.ninja keeps an up-to-date version of all messages being sent to the OpenAI API in the `./workspace/.msgs` file. All of these messages will be sent to OpenAI on each chat completion. This is useful because as the message log grows, summarizations are performed upon the message history to fit them within a maximum context window token limit.

## Collaborating
We are eager to work with the community to continue improving this agent, and building more wraps. If you're interested in contributing, we welcome pull-requests! Here are some ways you can contribute:

- **Bug Fixes:** If you spot a bug or an error, feel free to fix it and submit a PR. Please include a description of the bug and how your code fixes it.
- **Feature Additions:** We are open to new features! If you have an idea, please share it on our [discord](https://discord.com/invite/Z5m88a5qWu), or make an issue in this repo.
- **Documentation:** Good documentation makes for a good project. If you spot areas in our docs that can be improved, or if something is not documented and should be, feel free to make these changes.

Remember, the best way to submit these changes is via a pull-request. If you're new to Github, you can learn about PRs [here](https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/proposing-changes-to-your-work-with-pull-requests/about-pull-requests).

Also, please feel free to join our [discord](https://discord.com/invite/Z5m88a5qWu) and discuss your ideas or ask any questions. We are an open, welcoming community and we'd love to hear from you!



