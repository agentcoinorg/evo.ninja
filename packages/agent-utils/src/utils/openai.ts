export interface OpenAIError {
  status: number;
  message: string;
  data: unknown;
}

export const cleanOpenAIError = (
  error: unknown
): Partial<OpenAIError> | unknown => {
  const errorData: Partial<OpenAIError> = {};
  const errorObj = error as Record<string, unknown>;

  if (typeof error === "object" && errorObj.message) {
    if (errorObj.response) {
      const responseObj = errorObj.response as Record<string, unknown>;
      errorData.status = responseObj.status as number | undefined;
      errorData.data = responseObj.data;
    }
    errorData.message = errorObj.message as string | undefined;
  }

  if (errorData.message) {
    return errorData;
  } else {
    return error;
  }
};
