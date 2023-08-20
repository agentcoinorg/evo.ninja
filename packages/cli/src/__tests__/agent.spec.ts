import { spawn } from 'child_process';
import { readFileSync } from 'fs';

type TestResult = {
  goal: string;
  success: boolean;
  timeTaken: number;
};

describe('AI Agent Test Suite', () => {
  const oneMinute = 120 * 1000;
  let testResults: TestResult[] = [];

  const goals = [
    { goal: 'Create a CSV file named output.txt with the numbers from 1 to 10 and verify the content', expected: '1,2,3,4,5,6,7,8,9,10' },
    { goal: 'Write the word Washington to the file called output.txt', expected: 'Washington' },
    { goal: 'Divide 590 by 204 and save it to a file named output.txt', expected: (590 / 204).toString() },
    { goal: 'Calculate the factorial of 5 using JavaScript and save the result to output.txt', expected: '120' },
    { goal: 'Convert a JSON object {"foo": "bar"} to string and save it to output.txt', expected: '{"foo": "bar"}' },
    { goal: 'Use JavaScript to calculate the sum of the numbers from 1 to 100 and save the result to output.txt', expected: '5050' },
    { goal: 'Create a JavaScript function that reverses the string "OpenAI" and save the result to output.txt', expected: 'IAnepO' },
    { goal: 'Use JavaScript to calculate the 5th term of the Fibonacci sequence and save the result to output.txt', expected: '3' },
  ];

  afterAll(() => {
    console.log('All test results:');
    testResults.forEach(result => {
      console.log(`Operation: ${result.goal}, Success: ${result.success}, Time Taken: ${result.timeTaken}ms`);
    });
  });

  goals.forEach(({ goal, expected }) => {
    test(`Execute operation: ${goal}`, async () => {
      const startTime = new Date().getTime();
  
      await new Promise<void>((resolve, reject) => {
        const child = spawn('yarn', ['start', `'${goal}'`], { shell: true });
        const timeout = setTimeout(() => {
          child.kill();
          reject(new Error(`Operation ${goal} timed out`));
        }, oneMinute);
  
        child.stdout.on('data', (data) => {
          console.log(data.toString());
        });
  
        child.on('exit', () => {
          clearTimeout(timeout);
          const endTime = new Date().getTime();
          const result = readFileSync('workspace/output.txt', 'utf-8').trim();
          let success = result === expected;

          testResults.push({ goal, success, timeTaken: endTime - startTime });
          resolve();
        });

        child.on('error', (error) => {
          clearTimeout(timeout);
          reject(error);
        });
      });
    }, oneMinute);
  });
});
