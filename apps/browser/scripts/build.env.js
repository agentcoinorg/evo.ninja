const fs = require("fs");

if (fs.existsSync("../../.env")) {
  fs.copyFileSync("../../.env", ".env.local");
}
