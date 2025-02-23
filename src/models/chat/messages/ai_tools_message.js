import { AiMessage } from './ai_message.js';
import { SystemMessage } from './system_message.js';
import { ToolMessage } from './tool_message.js';

class AiToolMessage {
  constructor({ id, function: fnc }) {
    this.uid = id;
    this.name = fnc.name;
    this.arguments = typeof fnc.arguments === 'string' ?
      JSON.parse(fnc.arguments) :
      fnc.arguments;
    this.isNotFound = false;
  }

  toJSON() {
    return {
      id: this.uid,
      type: 'function',
      function: {
        name: this.name,
        arguments: typeof this.arguments === 'string' ?
          this.arguments :
          JSON.stringify(this.arguments)
      }
    };
  }

  dump() {
    return {
      id: this.uid,
      type: 'function',
      function: {
        name: this.name,
        arguments: this.arguments
      }
    };
  }

  async findAndRunTool(tools) {
    const tool = this.findTool(tools);
    const content = await this.runTool(tool);

    return new ToolMessage({
      toolCallId: this.uid,
      name: this.name,
      content
    });
  }

  async runTool(tool) {
    try {
      const args = typeof this.arguments === 'string' ?
        JSON.parse(this.arguments) :
        this.arguments;
      return await tool(args);
    } catch (error) {
      console.error(error);
      return `ERROR: ${error.message}`;
    }
  }

  findTool(tools) {
    this.isNotFound = false;
    for (const tool of tools) {
      if (tool.name === this.name) {
        return tool;
      }
    }
    this.isNotFound = true;
    return () => `SYSTEM ERROR: Function \`${this.name}\` does not exist`;
  }
}

export class AiToolsMessage extends AiMessage {
  constructor({ toolCalls, tool_calls, content = null, tags = [] }) {
    super(content, tags);
    this.role = 'assistant';
    this.toolCalls = (toolCalls || tool_calls || []).map(tc => new AiToolMessage(tc));
  }

  async call(tools, callback) {
    const results = [];
    for (const toolCall of this.toolCalls) {
      const toolResult = await toolCall.findAndRunTool(tools);
      results.push(toolResult);

      if (toolCall.isNotFound) {
        results.push(new SystemMessage(`Do not call '${toolCall.name}' again.`));
      }
    }
    return callback(...results);
  }

  toJSON() {
    return {
      ...super.toJSON(),
      tool_calls: this.toolCalls.map(tc => tc.toJSON())
    };
  }

  dump() {
    return {
      ...super.dump(),
      tool_calls: this.toolCalls.map(tc => tc.dump())
    };
  }

  clone(overrides = {}) {
    return super.clone({
      toolCalls: this.toolCalls.map(tc => tc.toJSON()),
      ...overrides
    });
  }
}

export const aiToolsMessage = ({ toolCalls, tool_calls, content, tags }) =>
  new AiToolsMessage({ toolCalls, tool_calls, content, tags });
