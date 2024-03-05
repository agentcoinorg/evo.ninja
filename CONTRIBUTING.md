# Contributing

Here are some ways you can contribute:

- **Bug Fixes:** If you spot a bug or an error, feel free to fix it and submit a PR. Please include a description of the bug and how your code fixes it.
- **Feature Additions:** We are open to new features! If you have an idea, please share it on our [discord](https://discord.gg/k7UCsH3ps9), or make an issue in this repo.
- **Documentation:** Good documentation makes for a good project. If you spot areas in our docs that can be improved, or if something is not documented and should be, feel free to make these changes.

Remember, the best way to submit these changes is via a pull-request. If you're new to Github, you can learn about PRs [here](https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/proposing-changes-to-your-work-with-pull-requests/about-pull-requests).

Also, please feel free to join our [discord](https://discord.gg/k7UCsH3ps9) and discuss your ideas or ask any questions. We are an open, welcoming community and we'd love to hear from you!

## Benchmarks
In order to run Agent Protocol Benchmarks you must have all pre-requisites mentioned above, as well as:
- [python](https://www.python.org/downloads/)
- [poetry](https://python-poetry.org/docs/#installation)

If you haven't fetched the submodules you can do it by doing the command:
> `git submodule update --init`

If you have already fetched the submodules and need to update it, you can run:
> `git submodule update --recursive`

Then, in one terminal you must start the Agent Protocol HTTP Server: `yarn start:api`; in another terminal you must go to `benchmarks` folder and run:

```
poetry shell
poetry install
agbenchmark --cutoff=300
``````

**Note: If you have an existing environment and you have updated the git submodule its recommended that you delete the environment and create a new one by doing:**

```shell
$ poetry env list
myenv-dL2uBROB-py3.10 (Activated)

$ poetry env remove myenv-dL2uBROB-py3.10
```

This will run the `agbenchmark` framework against the API of the [Agent Protocol](https://github.com/AI-Engineers-Foundation/agent-protocol-sdk-js). And will set a timeout of 5 minutes per task; if you'd like to run just one test in particular you can just add the flag `--test=TestCaseName`
