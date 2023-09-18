const fs = require('fs');

let emailContent = `Subject: ${subject}

${body}`;

fs.writeFileSync(`${recipient}.txt`, emailContent);

return `Email to ${recipient} has been sent.`;