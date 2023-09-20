const fs = require('fs');
fs.writeFile(path, data, (err) => {
    if (err) throw err;
    console.log('The file has been saved!');
});