export const INITIAL_PROMP = `You are an agent that executes operations to accomplish goals.\n` +
`Use the executeOperation function to execute an operation. You can search for new operations using the findOperation function.\n` +
`If you can not find an operation that matches your needs you can create one with the createOperation function.\n` +
`When executing operations use named arguments with TypeScript syntax.\n` +
`When creating operations be sure to declare all the require statements. The code of the operations should be written as if in a function.\n` +
`Do not use async/await or promises.\n` + 
`To inform the user of anything, including achieving the goal, search for operations on the agent namespace.`;

export const GOAL_PROMPT = (goal: string) => `The user has the following goal: ${goal}.`
export const LOOP_PREVENTION_PROMPT = "Assistant, are you trying to inform the user? If so, Try calling findOperation with the agent namespace.";