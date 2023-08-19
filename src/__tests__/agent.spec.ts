import { execSync } from 'child_process';
import { readFileSync } from 'fs';

describe('AI Agent Test Suite', () => {
  const oneMinute = 60 * 1000;

  const goals = [
    { goal: 'Write the word Washington to the file called output.txt', expected: 'Washington' }, // Correct this line as needed
    { goal: 'Divide 590 by 204 and save it to a file named output.txt', expected: 590 / 204 },
    // { goal: '(590 * 204) + (1000 / 2) - 42', expected: (590 * 204) + (1000 / 2) - 42 },
    // Add more goals here...
  ];

  goals.forEach(({ goal, expected }) => {
    test(`Operation: ${goal}`, () => {
      const startTime = new Date().getTime();
      execSync(`yarn start '${goal}'`, { timeout: oneMinute });
      const endTime = new Date().getTime();

      // Read the result from output.txt
      const result = readFileSync('workspace/output.txt', 'utf-8').trim();
      console.log(result); // Print the logs of the agent

      expect(endTime - startTime).toBeLessThanOrEqual(oneMinute);
      if (typeof expected === 'string') {
        expect(result).toBe(expected);
      } else {
        expect(parseFloat(result)).toBeCloseTo(expected);
      }
    });
  });
});
