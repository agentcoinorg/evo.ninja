import {
  AgentFunctionResult,
  FUNCTION_NOT_FOUND,
  executeAgentFunction,
} from "../agent";

import { ResultOk } from "@polywrap/result";

const mockedFunctionResult: AgentFunctionResult = {
  outputs: [
    {
      type: "success",
      title: "Mock title",
    },
  ],
  messages: [
    {
      role: "user",
      content: "Mock content!",
    },
  ],
};

const readMockState = (globalState: any) => async (executorState: any) => {
  if (!globalState[executorState.name]) {
    return ResultOk(mockedFunctionResult);
  }

  return ResultOk({
    outputs: [
      {
        type: "success",
        title: "Mock title",
      },
    ],
    messages: [
      {
        role: "user",
        content: globalState[executorState.name],
      },
    ],
  } as AgentFunctionResult);
};

const mockAgentFunctions = [
  {
    definition: {
      name: "foo",
    },
    buildExecutor: readMockState,
  },
  {
    definition: {
      name: "readState",
    },
    buildExecutor: readMockState,
  },
];

describe("Execute agent function", () => {
  test("Should work if executes be able to interact with global variable", async () => {
    const context = { bar: "baz" };
    const response = await executeAgentFunction(
      "readState",
      JSON.stringify({ name: "bar" }),
      context,
      mockAgentFunctions
    );

    if (!response.result.ok) fail(response.result.error);
    expect(response.result.ok).toBeTruthy();
    expect(response.result.value.messages[0].content).toBe("baz");
  });

  test("Should work if executes an existing agent function", async () => {
    const context = { bar: "baz" };
    const response = await executeAgentFunction(
      "foo",
      JSON.stringify({}),
      context,
      mockAgentFunctions
    );

    if (!response.result.ok) fail(response.result.error);
    expect(response.result.ok).toBeTruthy();
    expect(response.result.value).toBe(mockedFunctionResult);
  });

  test("Should fail if executes an non existant agent function", async () => {
    const context = { bar: "baz" };
    const wrongFunctionName = "non-existant";
    const response = await executeAgentFunction(
      wrongFunctionName,
      JSON.stringify({}),
      context,
      mockAgentFunctions
    );

    expect(response.result.ok).toBeFalsy();
    //@ts-ignore
    expect(response.result.error).toBe(FUNCTION_NOT_FOUND(wrongFunctionName));
  });
});
