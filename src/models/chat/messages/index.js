import { v4 as uuidv4 } from 'uuid';
import { SystemMessage, systemMessage } from './system_message.js';
import { UserMessage, userMessage } from './user_message.js';
import { AiMessage, aiMessage } from './ai_message.js';
import { ToolMessage, toolMessage } from './tool_message.js';
import { AiToolsMessage, aiToolsMessage } from './ai_tools_message.js';

function messageFromRaw(message) {
  if (!message || !message.role) {
    throw new Error(`Invalid message format: ${JSON.stringify(message)}`);
  }

  if (message.role === 'system') {
    return new SystemMessage(message.content, message.tags);
  }
  if (message.role === 'user') {
    return new UserMessage(message.content, message.tags);
  }
  if (message.role === 'assistant' && message.tool_calls) {
    return new AiToolsMessage({
      toolCalls: message.tool_calls,
      content: message.content,
      tags: message.tags
    });
  }
  if (message.role === 'assistant') {
    return new AiMessage(message.content, message.tags);
  }
  if (message.role === 'tool') {
    if (!message.tool_call_id || !message.name) {
      throw new Error(`Tool message missing required fields: ${JSON.stringify(message)}`);
    }
    return new ToolMessage({
      content: message.content,
      toolCallId: message.tool_call_id,
      name: message.name,
      tags: message.tags
    });
  }
  throw new Error(`Unknown message role: ${message.role}`);
}

function messagesFromRaw(messages) {
  if (!messages) return [];
  return messages.map(messageFromRaw);
}

function toolCalls({ content = "", calls = [] }) {
  const ids = calls.map(() => uuidv4());

  return [aiToolsMessage({
    content,
    toolCalls: calls.map((t, i) => ({
      id: ids[i],
      function: { name: t.name, arguments: t.arguments || {} },
    })),
  }), ...calls.map((t, i) => toolMessage({
    toolCallId: ids[i],
    name: t.name,
    content: t.content,
  }))]
}

export {
  AiMessage,
  aiMessage,
  AiToolsMessage,
  aiToolsMessage,
  SystemMessage,
  systemMessage,
  ToolMessage,
  toolMessage,
  UserMessage,
  userMessage,
  toolCalls,
  // // Message constructors and conversion utilities
  messageFromRaw,
  messagesFromRaw,
}
