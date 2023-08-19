# Roadmap

## High-Pri
- chat log, used for showing examples
    - example https://github.com/polywrap/polygpt#examples

## Improvements for hackathon
- Shims
    - axios (done?)
- When executeOperation returns undefined it should be an error to the LLM (maybe) (void funcs to return bool?)
- Function to trim text("error..."). 
    - This should also fix the issue with always displaying '...' even when text is shorter than max length
- Better global variable implementation
    - Issue is that agent tries to access props of the variable (which is not supported) or use it in operation code, etc 

