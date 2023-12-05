import { Row } from "./types";

import {
  ChatMessage
} from "@evo-ninja/agents";

export const mapChatMessageToMessageDTO = (chatId: number, temporary: boolean, message: ChatMessage): Omit<Row<'messages'>, "id" | "created_at"> => {
  switch (message.role) {
    case "user":
    case "system": {
      return {
        role: message.role,
        content: message.content,
        chat_id: chatId,
        function_call: null,
        name: null,
        tool_calls: null,
        tool_call_id: null,
        temporary
      }
    }
    case "function": {
      return {
        role: message.role,
        content: message.content,
        chat_id: chatId,
        function_call: null,
        name: message.name,
        tool_calls: null,
        tool_call_id: null,
        temporary
      }
    }
    case "assistant": {
      return {
        role: message.role,
        content: message.content,
        chat_id: chatId,
        // TODO: Json casting
        function_call: message.function_call as any ?? null,
        name: null,
        tool_calls: message.tool_calls as any ?? null,
        tool_call_id: null,
        temporary
      }
    }
    case "tool": {
      return {
        role: message.role,
        content: message.content,
        chat_id: chatId,
        function_call: null,
        name: null,
        tool_calls: null,
        tool_call_id: message.tool_call_id,
        temporary
      }
    }
  }
}