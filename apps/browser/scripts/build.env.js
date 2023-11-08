const fs = require("fs");

fs.copyFileSync("../../.env", ".env.local");
