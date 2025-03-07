import { LLMClient } from '../../base/index.js';
import { tool } from './tool.js';
import { messageFromRaw } from './messages/index.js';
import { SystemMessage } from './messages/system_message.js';
import { UserMessage } from './messages/user_message.js';
import { AiMessage } from './messages/ai_message.js';
import { ToolMessage } from './messages/tool_message.js';
import { AiToolsMessage } from './messages/ai_tools_message.js';

const getUrlPath = (model) => {
  if (/^(gpt|o1|o3)/.test(model)) {
    return '/api/gpt';
  }
  if (/^claude/.test(model)) {
    return '/api/claude';
  }
  if (/^llama3/.test(model)) {
    return '/api/llama';
  }
  if (/^deepseek/.test(model)) {
    return '/api/deepseek';
  }

  if (/^gemini/.test(model)) {
    return '/api/gemini';
  }

  throw new Error(`Unknown model: ${model}, can't determine URL path`);
};

const getUrlPathAndModel = (options = {}) => {
  const { model } = options;
  let model_name, url_path;
  if (Array.isArray(model) && model.length === 2) {
    model_name = model[0]
    url_path = model[1]
  } else if (typeof model === 'object' && model !== null) {
    model_name = model.name
    url_path = model.path
  } else if (typeof model === 'string') {
    model_name = model
  }

  if (url_path === undefined) {
    url_path = getUrlPath(model_name)
  }

  if (model_name === undefined) {
    throw new Error(`Unknown model, can't determine model name from options: ${Object.keys(options)}`)
  }

  if (url_path === undefined) {
    throw new Error(`Unknown model: ${model}, can't determine URL path`)
  }

  return { model: model_name, path: url_path }
}

export class Chat extends LLMClient {
  constructor(options = {}) {
    super(options);
    const { model, path } = getUrlPathAndModel(options);

    this.model = model;
    this.urlPath = path;
  }

  // Static message creators
  static systemMessage(...args) {
    return new SystemMessage(...args);
  }

  static userMessage(...args) {
    return new UserMessage(...args);
  }

  static aiMessage(...args) {
    return new AiMessage(...args);
  }

  static toolMessage(...args) {
    return new ToolMessage(...args);
  }

  static toolsMessage(...args) {
    return new AiToolsMessage(...args);
  }

  // Tool creation helper
  static tool(...args) {
    return tool(...args);
  }

  async get({ messages = [], tools = [], ...rest } = {}) {
    // array of objects `{ name, toJSON, async call }` but without duplicates of `name`
    const originalTools = await Promise.all(tools);
    const deduplicatedTools = (function(tools1) {
      const nameCounts = {};
      let toolsArray = tools1.map((t) => t.toJSON());
      toolsArray.forEach(t => {
        nameCounts[t.name] = (nameCounts[t.name] || 0) + 1;
      });

      Object.keys(nameCounts).forEach(name => {
        if (nameCounts[name] > 1) {
          let index = 1;
          toolsArray = toolsArray.map(t => {
            if (t.name === name) {
              const uniqueName = `${name}_${index}`;
              index++;
              return { ...t, name: uniqueName };
            }
            return t;
          });
        }
      });

      return toolsArray;
    })(originalTools);

    const compactMessages = messages.filter(m => m !== null);

    const data = await this._processData({ messages: compactMessages, tools: deduplicatedTools, ...rest });
    const response = await this._request(data, this.urlPath);
    const result = await this._processResponse(response);

    // Handle function calling
    const answer = this._processAnswer(result.answer);
    if (answer instanceof AiToolsMessage && deduplicatedTools.length > 0) {
      const toolResults = [];
      for (const toolCall of answer.toolCalls) {
        const toolIndex = deduplicatedTools.findIndex(t => t.name === toolCall.name);

        if (toolIndex !== -1) {
          try {
            const args = typeof toolCall.arguments === 'string' ? JSON.parse(toolCall.arguments) : toolCall.arguments;
            const result = await originalTools[toolIndex].call(args);
            toolResults.push(
              new ToolMessage({
                content: result,
                toolCallId: toolCall.uid,
                name: deduplicatedTools[toolIndex].name
              })
            );
          } catch (error) {
            toolResults.push(
              new ToolMessage({
                content: `ERROR: ${error.message}`,
                toolCallId: toolCall.uid,
                name: deduplicatedTools[toolIndex].name
              })
            );
          }
        } else {
          toolResults.push(
            new ToolMessage({
              content: `SYSTEM ERROR: Function \`${toolCall.name}\` does not exist`,
              toolCallId: toolCall.uid,
              name: toolCall.name
            })
          );
          messages.push(new SystemMessage(`Do not call '${toolCall.name}' again.`));
        }
      }

      // Make another request with tool results
      return await this.get({
        messages: [...messages, answer, ...toolResults],
        tools: tools,
        ...rest
      });
    }

    return {
      answer,
      thread: result.threadUid,
      usage: result.usage
    };
  }

  async _processMessages(messages) {
    for (const message of messages) {
      if (!message) continue;
      if (!(message instanceof AiToolsMessage) && !message.content) {
        throw new Error(`Message content can't be null if it is not a tool message: ${message}`);
      }
    }
    return messages.map(m => m.toJSON());
  }

  async _processData({ messages, kind, mode, tools = [], ...rest }) {
    return {
      messages: await this._processMessages(messages),
      tools: tools,
      model: this.model,
      kind: await this._processKind(kind),
      mode: await this._processMode(mode),
      ...rest
    };
  }

  async _processKind(kind) {
    if (typeof kind === 'string' || kind === null) {
      return kind;
    }
    if (Array.isArray(kind)) {
      return kind.map(k => this._processKindItem(k));
    }
    return this._processKindItem(kind);
  }

  _processKindItem(kind) {
    if (typeof kind === 'object' && kind !== null) {
      return Object.fromEntries(
        Object.entries(kind).map(([k, v]) => [
          this._typeToString(k),
          this._typeToString(v)
        ])
      );
    }
    return this._typeToString(kind);
  }

  _typeToString(type) {
    if (typeof type === 'function') {
      return type.name;
    }
    return type;
  }

  async _processMode(mode) {
    if (typeof mode === 'string' || mode === null) {
      return mode;
    }
    if (Array.isArray(mode)) {
      return mode;
    }
    return mode;
  }

  _processAnswer(answer) {
    return messageFromRaw(answer);
  }

  async _processResponse(response) {
    const result = super._processResponse(response);
    return {
      ...result,
      messages: result.messages?.map(messageFromRaw)
    };
  }
}
