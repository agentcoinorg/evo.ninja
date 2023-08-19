import { execSync } from 'child_process';

describe('AI Agent Test Suite', () => {
  const oneMinute = 60 * 1000;

  test('Simple Division: 590 / 204', () => {
    const goal = '590 / 204';
    const startTime = new Date().getTime();
    const result = execSync(`yarn start '${goal}'`, { timeout: oneMinute, encoding: 'utf-8' });
    const endTime = new Date().getTime();
    
    console.log(result); // Print the logs of the agent

    expect(endTime - startTime).toBeLessThanOrEqual(oneMinute);
    expect(parseFloat(result.trim())).toBeCloseTo(590 / 204);
  });

  // You can add more complex tests here...
  // For example:
  test('Complex Operation: (590 * 204) + (1000 / 2) - 42', () => {
    const goal = '(590 * 204) + (1000 / 2) - 42';
    const startTime = new Date().getTime();
    const result = execSync(`yarn start '${goal}'`, { timeout: oneMinute, encoding: 'utf-8' });
    const endTime = new Date().getTime();
    
    console.log(result); // Print the logs of the agent

    expect(endTime - startTime).toBeLessThanOrEqual(oneMinute);
    expect(parseFloat(result.trim())).toBeCloseTo((590 * 204) + (1000 / 2) - 42);
  });
});
