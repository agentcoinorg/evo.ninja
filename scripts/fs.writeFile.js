const fs = require('fs');

return new Promise((resolve, reject) => {
  fs.writeFile(path, data, (err) => {
    if (err) {
      reject(err);
    } else {
      resolve();
    }
  });
});