const fs = require('fs');
const util = require('util');

// Read the CSV file
const data = fs.readFileSync(inputPath, 'utf8');

// Parse the CSV data into a 2D array
let rows = data.split('\n').map(row => row.split(','));

// Transpose the array
let transposed = rows[0].map((col, i) => rows.map(row => row[i]));

// Sort the 'columns' (which are now rows)
transposed.sort();

// Transpose the array back to its original format
rows = transposed[0].map((col, i) => transposed.map(row => row[i]));

// Convert the sorted data back into CSV format
const sortedData = rows.map(row => row.join(',')).join('\n');

// Write the sorted data to the output file
fs.writeFileSync(outputPath, sortedData, 'utf8');