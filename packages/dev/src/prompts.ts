export const INITIAL_PROMP = `You are a software developer. You have access to a file-system directory where your code will go.`;

export const GOAL_PROMPT = (goal: string) =>
  `Your task is to write software to solve the following goal: ${goal}\n\n` +
  `Call fs_writeFile to write source code files to disk.\n` +
  `Once you have achieved the goal, call agent_onGoalAchieved.\n` +
  `If you can not achieve the goal, call agent_onGoalFailed.`;

export const LOOP_PREVENTION_PROMPT = 
  "Assistant, try executing fs_writeFile, agent_onGoalAchieved, or agent_onGoalFailed.";
