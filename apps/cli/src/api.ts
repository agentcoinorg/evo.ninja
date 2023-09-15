import { createApp } from './app';

import Agent, {
  StepHandler,
  StepInput,
  StepResult,
  TaskInput,
} from 'agent-protocol';

async function taskHandler(taskInput: TaskInput | null): Promise<StepHandler> {
  const app = createApp();

  let iterator = app.evo.run(taskInput);

  async function stepHandler(stepInput: StepInput | null): Promise<StepResult> {
    const response = await iterator.next(stepInput);
    const outputMessage =
      response.value && 'message' in response.value ?
      response.value.message :
      'No message';

    if (response.done) {
      return {
        is_last: true,
        output: outputMessage
      };
    } else {
      return {
        is_last: false,
        output: outputMessage
      };
    }
  }

  return stepHandler;
}

Agent.handleTask(taskHandler).start();
