function parseCSV(data, delimiter) {
    const rows = data.trim().split('\n');
    return rows.map(row => row.split(delimiter));
}

const rows = parseCSV(csvData, delimiter);
let sum = 0;

// Start from 1 if there's a header row
for (let i = hasHeader ? 1 : 0; i < rows.length; i++) {
    const value = parseFloat(rows[i][columnIndex]);
    if (!isNaN(value)) {
        sum += value;
    }
}

return sum;
