import { createApp } from './app';

import Agent, {
  StepHandler,
  StepInput,
  StepResult,
  TaskInput,
} from 'forked-agent-protocol';

async function taskHandler(taskId: string, taskInput: TaskInput | null): Promise<StepHandler> {
  const app = createApp(undefined, taskId);

  let iterator = app.evo.run(taskInput);

  async function stepHandler(stepInput: StepInput | null): Promise<StepResult> {
    const response = await iterator.next(stepInput);
    const outputMessage =
      response.value && 'message' in response.value ?
      response.value.message :
      'No message';

    return {
      is_last: response.done,
      output: JSON.stringify(outputMessage)
    }
  }

  return stepHandler;
}

Agent.handleTask(taskHandler).start();
