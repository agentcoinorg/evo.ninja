export class AuthProxy {
  public static async checkPrompt(
    message: string,
    setCapReached: () => void
  ): Promise<string | undefined> {
    const getPromptRequest = await fetch(`/api/prompt/create`, {
      method: "POST",
      body: JSON.stringify({
        message,
      }),
      headers: {
        "Content-Type": "application/json",
      },
    });
    if (getPromptRequest.status === 403) {
      setCapReached();
      return;
    }
    if (getPromptRequest.status === 200) {
      const { promptAdded } = await getPromptRequest.json();
      return promptAdded.id;
    }
  }
}
