import { spawn } from 'child_process';
import { readFileSync } from 'fs';

type TestResult = {
  goal: string;
  success: boolean;
  result: string;
  expected: string;
  timeTaken: number;
};

describe('AI Agent Test Suite', () => {
  const oneMinute = 300 * 1000;
  let testResults: TestResult[] = [];

  const goals = [

    // Mathematics
    { goal: 'Calculate the area of a circle with a radius of 5 meters and save it in a file named output.txt', expected: '78.54' },
    /*{ goal: 'Calculate the perimeter of a square with side length 6 cm and save it in a file named output.txt', expected: '24' },
    { goal: 'Calculate the sum of the first 100 natural numbers and save it in a file named output.txt', expected: '5050' },
    { goal: 'Calculate the value of sin(45°) and save it in a file named output.txt', expected: '0.7071' },

    // Geography
    { goal: 'Write the capital of France and save it in a file named output.txt', expected: 'Paris' },

    // Algorithms
    { goal: 'Sort the array [3, 1, 4, 1, 5, 9, 2, 6, 5, 3, 5] in ascending order and save it in a file named output.txt', expected: '1,1,2,3,3,4,5,5,5,6,9' },
    { goal: 'Sort the array [5, 2, 9, 1, 5, 6] in descending order and save it in a file named output.txt', expected: '9,6,5,5,2,1' },
    { goal: 'Find the 5th largest element in the array [42, 63, 15, 73, 24, 48, 31, 55] and save it in a file named output.txt', expected: '42' },
    { goal: 'Sort the strings ["apple", "orange", "banana", "grape"] alphabetically and save it in a file named output.txt', expected: 'apple,banana,grape,orange' },
    { goal: 'Sort the array of objects [{"name": "Alice", "age": 30}, {"name": "Bob", "age": 25}, {"name": "Charlie", "age": 35}] by age in ascending order and save the names in a file named output.txt', expected: 'Bob,Alice,Charlie' },
    { goal: 'Sort the array [1, 10, 5, 8, 7, 6, 4, 3, 2, 9] using bubble sort and save it in a file named output.txt', expected: '1,2,3,4,5,6,7,8,9,10' },
    { goal: 'Sort the array [50, 40, 30, 20, 10] using quick sort and save it in a file named output.txt', expected: '10,20,30,40,50' },
    { goal: 'Find the median of the array [7, 9, 3, 2, 4] and save it in a file named output.txt', expected: '4' },
    { goal: 'Sort the array [5, 2, 8, 12, 1] using merge sort and save it in a file named output.txt', expected: '1,2,5,8,12' },
    { goal: 'Sort the array [6, 3, 9, 0, 5] using insertion sort and save it in a file named output.txt', expected: '0,3,5,6,9' },

    // Physics
    { goal: 'Calculate the speed of light in vacuum (in meters per second) and save it in a file named output.txt', expected: '299792458' },
    { goal: 'Calculate the work done when a force of 10 N is applied to move an object 5 meters in the direction of force (in Joules) and save it in a file named output.txt', expected: '50' },
    { goal: 'Calculate the kinetic energy of a 2 kg object moving at 3 m/s (in Joules) and save it in a file named output.txt', expected: '9' },
    { goal: 'Calculate the acceleration due to gravity on the surface of Earth (in meters per second squared) and save it in a file named output.txt', expected: '9.81' },
    { goal: 'Calculate the wavelength of a wave with a frequency of 50 Hz and a speed of 300 m/s (in meters) and save it in a file named output.txt', expected: '6' },
    { goal: 'Calculate the frequency of a wave with a wavelength of 2 meters and a speed of 400 m/s (in Hertz) and save it in a file named output.txt', expected: '200' },

    // // Chemistry functionality
    { goal: 'Calculate the atomic mass of hydrogen (in atomic mass units) and save it in a file named output.txt', expected: '1.008' },
    { goal: 'Calculate the number of protons in a carbon atom and save it in a file named output.txt', expected: '6' },
    { goal: 'Calculate the number of electrons in a neutral oxygen atom and save it in a file named output.txt', expected: '8' },
    { goal: 'Calculate the molecular weight of water (H2O) in atomic mass units and save it in a file named output.txt', expected: '18.015' },
    { goal: 'Calculate the number of neutrons in an isotope of carbon-14 and save it in a file named output.txt', expected: '8' },
    { goal: 'Calculate the number of valence electrons in a chlorine atom and save it in a file named output.txt', expected: '7' },
    { goal: 'Calculate the boiling point of ethanol at standard atmospheric pressure (in degrees Celsius) and save it in a file named output.txt', expected: '78.37' },

    // General Challenges
    { goal: 'Create a CSV file named output.txt with the numbers from 1 to 10 and verify the content', expected: '1,2,3,4,5,6,7,8,9,10' },
    { goal: 'Write the word Washington to the file called output.txt', expected: 'Washington' },
    { goal: 'Divide 590 by 204 and save it to a file named output.txt', expected: (590 / 204).toString() },
    { goal: 'Calculate the factorial of 5 using JavaScript and save the result to output.txt', expected: '120' },
    { goal: 'Convert a JSON object {"foo": "bar"} to string and save it to output.txt', expected: '{"foo": "bar"}' },
    { goal: 'Use JavaScript to calculate the sum of the numbers from 1 to 100 and save the result to output.txt', expected: '5050' },
    { goal: 'Create a JavaScript function that reverses the string "OpenAI" and save the result to output.txt', expected: 'IAnepO' },
    { goal: 'Use JavaScript to calculate the 5th term of the Fibonacci sequence and save the result to output.txt', expected: '3' },*/
  ];

  afterAll(() => {
    console.log('All test results:');
    testResults.forEach(result => {
      console.log(`Operation: ${result.goal}, Success: ${result.success}, Time Taken: ${result.timeTaken}ms. Result: ${result.result}, Expected: ${result.expected}`);
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

        child.on("close", () => {
          console.log("CLOSE");
        });

        child.on("disconnect", () => {
          console.log("DISCONNECT");
        });

        child.on('exit', () => {
          console.log("ON EXIT")
          clearTimeout(timeout);
          const endTime = new Date().getTime();
          const result = readFileSync('workspace/output.txt', 'utf-8').trim();
          let success = result === expected;

          // Asserting the success condition using the expect function
          expect(success).toBe(true);

          testResults.push({ goal, success, result, expected, timeTaken: endTime - startTime });
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