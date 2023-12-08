import { AgentVariables } from "../agent-core/agent";

describe("Agent Variables", () => {
  it("Should properly trigger onVariableSet", async () => {
    const setVars: string[] = [];
    
    const variables = new AgentVariables({
      async onVariableSet(key, value) {
        setVars.push(key);
      },
    });
  
    await variables.set("test", "value");
    await variables.set("foo", "bar");

    expect(setVars[0]).toEqual("test");
    expect(setVars[1]).toEqual("foo");
  })
})