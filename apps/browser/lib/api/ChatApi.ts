export class ChatApi {
  public static async generateTitle(
    chatId: string,
    prompt: string
  ): Promise<string | undefined> {
    const generateTitle = await fetch(`/api/chat/generate-title`, {
      method: "POST",
      body: JSON.stringify({
        id: chatId,
        prompt,
      }),
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (generateTitle.status === 200) {
      const response = await generateTitle.json();
      if (response.message) {
        return response.message;
      }
    }
  }
}
