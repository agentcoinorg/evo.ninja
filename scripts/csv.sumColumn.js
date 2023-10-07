function parseCSV(data, delimiter) {
    const rows = data.trim().split('\n');
    return rows.map(row => row.split(delimiter));
}

const parsedData = parseCSV(csvData, delimiter);
let sum = 0;

// Start from 1 if there's a header row
for (let i = hasHeader ? 1 : 0; i < parsedData.length; i++) {
    const value = parseFloat(parsedData[i][columnIndex]);
    if (!isNaN(value)) {
        sum += value;
    }
}

return sum;
