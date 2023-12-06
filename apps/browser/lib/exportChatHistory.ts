import { ChatMessage } from "@/components/Chat"
import FileSaver from "file-saver"

export const exportChatHistory = (messages: ChatMessage[]) => {
  const exportedContent = messages.map((msg, i, msgs) => {
    if (msg.user === "user") {
      return `# User\n**Goal:** ${msg.title}\n`
    } else {
      const logMessage = `${msg.title} \n${msg.content ?? ""}`
      // We only append # Evo into the first message from Evo
      if (msgs.slice(0, i).some(m => m.user === "evo")) {
        return logMessage
      } else {
        return `# Evo\n` + logMessage
      }
    }
  }).join('\n')

  // Generate a date-time stamp
  const date = new Date();
  const dateTimeStamp = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}_${date.getHours().toString().padStart(2, '0')}-${date.getMinutes().toString().padStart(2, '0')}-${date.getSeconds().toString().padStart(2, '0')}`;

  const blob = new Blob([exportedContent], { type: 'text/plain;charset=utf-8' });
  FileSaver.saveAs(blob, `evo-ninja-${dateTimeStamp}.md`)
}