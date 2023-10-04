import dotenv from "dotenv";
import path from "path";
import { Scripts } from "../scripts";

dotenv.config({
  path: path.join(__dirname, "../../../../.env")
});

describe('Script search', () => {
  test(`Script search`, async() => {

    expect(Scripts.searchScripts("http web page and", [
      {
        name: "web.scrapeText",
        arguments: "",
        code: "",
        description: "Open a web page and scrape all text found in the html (tags: http, fetch, request )"
      }
    ]).length).toBe(1);


    expect(Scripts.searchScripts("http in the html", [
      {
        name: "web.scrapeText",
        arguments: "",
        code: "",
        description: "Open a web page and scrape text all found in the html (tags: http, fetch, request )"
      }
    ]).length).toBe(1);

    expect(Scripts.searchScripts("http test", [
      {
        name: "web.scrapeText",
        arguments: "",
        code: "",
        description: "Open a web page and scrape text all found in the html (tags: http, fetch, request )"
      }
    ]).length).toBe(1);

    expect(Scripts.searchScripts("dsdsdsd", [
      {
        name: "web.scrapeText",
        arguments: "",
        code: "",
        description: "Open a web page and scrape text all found in the html (tags: http, fetch, request )"
      }
    ]).length).toBe(0);

    expect(Scripts.searchScripts("http request", [
      {
        name: "math.calculatePerimeterOfSquare",
        arguments: "",
        code: "",
        description: "Calculates the perimeter of a square given the length of one side."
      }
    ]).length).toBe(0);

    expect(Scripts.searchScripts("fs.readFile Reads a file", [
      {
        name: "fs.readFile",
        arguments: "",
        code: "",
        description: "Reads data from a file"
      }
    ]).length).toBe(1);
  });
});