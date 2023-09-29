import { TestCase, runTestCases } from "./TestCase";

import path from "path";

jest.setTimeout(600000);

describe('AI Agent Test Suite', () => {
  const scriptsDir = path.join(__dirname, "../../../../scripts");

  const cases: TestCase[] = [
    // Mathematics
    new TestCase(
      "math_circle_radius",
      "Calculate the area of a circle with a radius of 5 meters and save it in a file named output.txt",
      "78.53981633974483",
      scriptsDir
    ),
    /*new TestCase("math_perimeter_square", "Calculate the perimeter of a square with side length 6 cm and save it in a file named output.txt", "24"),
    new TestCase("math_sum_natural", "Calculate the sum of the first 100 natural numbers and save it in a file named output.txt", "5050"),
    new TestCase("math_sin", "Calculate the value of sin(45°) and save it in a file named output.txt", "0.7071067811865475"),

    // Geography
    new TestCase("geography_capital_france", "Write the capital of France and save it in a file named output.txt", "Paris"),

    // Algorithms
    new TestCase("algo_sort_asc", "Sort the array [3, 1, 4, 1, 5, 9, 2, 6, 5, 3, 5] in ascending order and save it in a file named output.txt", "1,1,2,3,3,4,5,5,5,6,9"),
    new TestCase("algo_sort_dec", "Sort the array [5, 2, 9, 1, 5, 6] in descending order and save it in a file named output.txt", "9,6,5,5,2,1"),
    new TestCase("algo_find_5th_large", "Find the 5th largest element in the array [42, 63, 15, 73, 24, 48, 31, 55] and save it in a file named output.txt", "42"),
    new TestCase("algo_sort_strings", 'Sort the strings ["apple", "orange", "banana", "grape"] alphabetically and save it in a file named output.txt', "apple,banana,grape,orange"),
    new TestCase("algo_sort_objects", 'Sort the array of objects [{"name": "Alice", "age": 30}, {"name": "Bob", "age": 25}, {"name": "Charlie", "age": 35}] by age in ascending order and save the names in a file named output.txt', "Bob,Alice,Charlie"),
    new TestCase("algo_sort_bubble", "Sort the array [1, 10, 5, 8, 7, 6, 4, 3, 2, 9] using bubble sort and save it in a file named output.txt", "1,2,3,4,5,6,7,8,9,10"),
    new TestCase("algo_sort_qsort", "Sort the array [50, 40, 30, 20, 10] using quick sort and save it in a file named output.txt", "10,20,30,40,50"),
    new TestCase("algo_median", "Find the median of the array [7, 9, 3, 2, 4] and save it in a file named output.txt", "4"),
    new TestCase("algo_sort_merge", "Sort the array [5, 2, 8, 12, 1] using merge sort and save it in a file named output.txt", "1,2,5,8,12"),
    new TestCase("algo_sort_insert", "Sort the array [6, 3, 9, 0, 5] using insertion sort and save it in a file named output.txt", "0,3,5,6,9"),

    // Physics
    new TestCase("phys_speed_of_light", "Calculate the speed of light in vacuum (in meters per second) and save it in a file named output.txt", "299792458"),
    new TestCase("phys_work_done", "Calculate the work done when a force of 10 N is applied to move an object 5 meters in the direction of force (in Joules) and save it in a file named output.txt", "50"),
    new TestCase("phys_kin_energy", "Calculate the kinetic energy of a 2 kg object moving at 3 m/s (in Joules) and save it in a file named output.txt", "9"),
    new TestCase("phys_grav_earth", "Calculate the acceleration due to gravity on the surface of Earth (in meters per second squared) and save it in a file named output.txt", "9.81"),
    new TestCase("phys_wave_len", "Calculate the wavelength of a wave with a frequency of 50 Hz and a speed of 300 m/s (in meters) and save it in a file named output.txt", "6"),
    new TestCase("phys_wave_freq", "Calculate the frequency of a wave with a wavelength of 2 meters and a speed of 400 m/s (in Hertz) and save it in a file named output.txt", "200"),

    // Chemistry
    new TestCase("chem_atomic_mass", "Calculate the atomic mass of hydrogen (in atomic mass units) and save it in a file named output.txt", "1.008"),
    new TestCase("chem_proton_count", "Calculate the number of protons in a carbon atom and save it in a file named output.txt", "6"),
    new TestCase("chem_electron_count", "Calculate the number of electrons in a neutral oxygen atom and save it in a file named output.txt", "8"),
    new TestCase("chem_molecular_weight", "Calculate the molecular weight of water (H2O) in atomic mass units and save it in a file named output.txt", "18.015"),
    new TestCase("chem_neutron_count", "Calculate the number of neutrons in an isotope of carbon-14 and save it in a file named output.txt", "8"),
    new TestCase("chem_valence_count", "Calculate the number of valence electrons in a chlorine atom and save it in a file named output.txt", "7"),
    new TestCase("chem_boiling_point", "Calculate the boiling point of ethanol at standard atmospheric pressure (in degrees Celsius) and save it in a file named output.txt", "78.37"),

    // General Challenges
    new TestCase("basic_csv_create", "Create a CSV file named output.txt with the numbers from 1 to 10 and verify the content", "1,2,3,4,5,6,7,8,9,10"),
    new TestCase("basic_write_file", "Write the word Washington to the file called output.txt", "Washington"),
    new TestCase("basic_math_divide", "Divide 590 by 204 and save it to a file named output.txt", (590 / 204).toString()),
    new TestCase("basic_factorial", "Calculate the factorial of 5 using JavaScript and save the result to output.txt", "120"),
    new TestCase("basic_json", 'Convert a JSON object {"foo": "bar"} to string and save it to output.txt', '{"foo": "bar"}'),
    new TestCase("basic_sum_nums", "Use JavaScript to calculate the sum of the numbers from 1 to 100 and save the result to output.txt", "5050"),
    new TestCase("basic_string_rev", 'Create a JavaScript function that reverses the string "OpenAI" and save the result to output.txt', "IAnepO"),
    new TestCase("basic_fibonacci", "Use JavaScript to calculate the 5th term of the Fibonacci sequence and save the result to output.txt", "3"),*/
  ];

  runTestCases(cases);
});
