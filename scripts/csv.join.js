const fs = require('fs');

const csv1 = fs.readFileSync(csv1Path, 'utf8').trim().split('\n');
const csv2 = fs.readFileSync(csv2Path, 'utf8').trim().split('\n');

const headers1 = csv1[0].split(',');
const headers2 = csv2[0].split(',');

const idx1 = headers1.indexOf(commonColumn);
const idx2 = headers2.indexOf(commonColumn);

const map2 = new Map(csv2.slice(1).map(row => [row.split(',')[idx2], row]));

const mergedData = csv1.slice(1).map(row1 => {
  const key = row1.split(',')[idx1];
  const row2 = map2.get(key) || Array(headers2.length).fill('').join(',');
  return row1 + ',' + row2.split(',').slice(1).join(',');
});

const mergedCSV = [headers1.concat(headers2.slice(1)).join(','), ...mergedData].join('\n');

fs.writeFileSync(outputPath, mergedCSV);
return "Successfully merged CSV into new file."