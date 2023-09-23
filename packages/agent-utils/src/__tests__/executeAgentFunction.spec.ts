import {
  AgentFunctionResult,
  FUNCTION_NOT_FOUND,
  executeAgentFunction,
  UNPARSABLE_FUNCTION_ARGS,
  UNDEFINED_FUNCTION_ARGS,
  UNDEFINED_FUNCTION_NAME,
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
    ...mockedFunctionResult,
    messages: [
      {
        role: mockedFunctionResult.messages[0].role,
        content: globalState[executorState.name],
      },
    ],
  });
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

  test("Should fail if executes an non existent agent function", async () => {
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

  test("Should fail if executes a function with invalid arguments", async () => {
    const context = {};
    const name = "foo";
    const args = "{wrong-args}";
    const response = await executeAgentFunction(
      name,
      args,
      context,
      mockAgentFunctions
    );
    if (response.result.ok) throw Error("Response should be error");
    expect(response.result.ok).toBe(false);
    expect(
      UNPARSABLE_FUNCTION_ARGS(name, args, response.result.error)
    ).toContain(response.result.error);
  });

  test("Should fail if arguments is undefined", async () => {
    const context = {};
    const name = "foo";
    const response = await executeAgentFunction(
      name,
      undefined,
      context,
      mockAgentFunctions
    );
    if (response.result.ok) throw Error("Response should be error");
    expect(response.result.ok).toBe(false);
    expect(UNDEFINED_FUNCTION_ARGS(name)).toContain(response.result.error);
  });

  test("Should fail if name is undefined", async () => {
    const context = {};
    const name = undefined;
    const response = await executeAgentFunction(
      name,
      undefined,
      context,
      mockAgentFunctions
    );
    if (response.result.ok) throw Error("Response should be error");
    expect(response.result.ok).toBe(false);
    expect(UNDEFINED_FUNCTION_NAME).toContain(response.result.error);
  });
});
