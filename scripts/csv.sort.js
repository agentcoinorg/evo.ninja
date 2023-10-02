const fs = require('fs');
const util = require('util');

const readFile = util.promisify(fs.readFile);
const writeFile = util.promisify(fs.writeFile);

// Read the input CSV file
const csvData = await readFile(inputPath, 'utf-8');

// Parse the CSV data into a 2D array
const rows = csvData.split('\n');
const data = rows.map(row => row.split(','));

// Remove headers before sorting
const columnList = data.shift();

// Identify the index of the specified column
const columnIndex = columnList.indexOf(column);

// Sort the 2D array based on the values in the specified column
data.sort((a, b) => {
  if (a[columnIndex] < b[columnIndex]) {
    return -1;
  }
  if (a[columnIndex] > b[columnIndex]) {
    return 1;
  }
  return 0;
});

// Add the headers back to the sorted 2D array
data.unshift(columnList);

// Convert the sorted 2D array back into CSV format
const sortedCsvData = data.map(row => row.join(',')).join('\n');

// Write the sorted CSV data to the output file
await writeFile(outputPath, sortedCsvData);