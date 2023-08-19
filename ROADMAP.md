# Roadmap

## High-Pri
x rename operations -> scripts
- add metadata to header of script
- chat log, used for showing examples
    - example https://github.com/polywrap/polygpt#examples

## Test prompts
- "write 'Hello world!' into hello.txt" (works)
- "read in.txt and output the factorial to a file" (works)
- "get the price of ethereum and save it to a file" (works)
- "get the latest tesla news from google and save it to a file" (almost works, global vars preview cuts off the html)

## Improvements for hackathon
- Shims
    - axios (done?)
- When executeScript returns undefined it should be an error to the LLM (maybe) (void funcs to return bool?)
- Function to trim text("error..."). 
    - This should also fix the issue with always displaying '...' even when text is shorter than max length
- Better global variable implementation
    - Issue is that agent tries to access props of the variable (which is not supported) or use it in script code, etc 
