export class GoalApi {
  public static async create(
    chatId: string | undefined,
    message: string,
    subsidize: boolean,
    setCapReached: () => void
  ): Promise<string | undefined> {
    const getGoalRequest = await fetch(`/api/goal/create`, {
      method: "POST",
      body: JSON.stringify({
        chatId: chatId === "<anon>" ? undefined : chatId,
        message,
        subsidize
      }),
      headers: {
        "Content-Type": "application/json",
      },
    });
    if (getGoalRequest.status === 403) {
      setCapReached();
      return;
    }
    if (getGoalRequest.status === 200) {
      const { goalAdded } = await getGoalRequest.json();
      return goalAdded.id;
    }
  }
}
