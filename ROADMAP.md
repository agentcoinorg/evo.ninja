# Roadmap

## Test prompts
- "write 'Hello world!' into hello.txt" (works)
- "read in.txt and output the factorial to a file" (works)
- "get the latest tesla news and save it to a file" (doesn't work)
- "get top 3 tesla news and save each one in a separate file in a 'tesla-news' directory" (doesn't work)

## Improvements for hackathon
- Shims
    - axios (done?)
- When executeOperation returns undefined it should be an error to the LLM (maybe) (void funcs to return bool?)
- Function to trim text("error..."). 
    - This should also fix the issue with always displaying '...' even when text is shorter than max length
- Better global variable implementation
    - Issue is that agent tries to access props of the variable (which is not supported) or use it in operation code, etc 
