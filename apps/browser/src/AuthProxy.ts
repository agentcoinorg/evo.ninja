export const PROMPTS_CAP = 30;

export class AuthProxy {
  public static async checkPrompt(message: string, setCapReached: () => void): Promise<string | undefined> {
    const getPromptRequest = await fetch(`/api/supabase/prompts`);
    const { prompts } = await getPromptRequest.json();
    if (prompts?.length && prompts.length >= PROMPTS_CAP) {
      setCapReached();
      return
    } else {
      const addPromptRequest = await fetch(`/api/supabase/prompts`, {
        method: "POST",
        body: JSON.stringify({
          message,
        }),
        headers: {
          "Content-Type": "application/json",
        },
      });
      if (!addPromptRequest.ok) {
        console.log("Error trying to add prompt request");
        return
      }
      const {promptAdded} = await addPromptRequest.json()
      const promptId = promptAdded[0].id
      return promptId
    }
  }
}
