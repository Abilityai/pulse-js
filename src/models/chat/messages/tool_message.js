import { BaseLLMMessage } from '../../../base/index.js';

export class ToolMessage extends BaseLLMMessage {
  constructor({ content, toolCallId, tool_call_id, name, tags = [] }) {
    super(content, tags);
    this.role = 'tool';
    this.toolCallId = toolCallId || tool_call_id;
    this.name = name;

    if (!this.toolCallId) {
      throw new Error('toolCallId (tool_call_id) is required for ToolMessage');
    }
    if (!this.name) {
      throw new Error('name is required for ToolMessage');
    }
  }

  toJSON() {
    return {
      ...super.toJSON(),
      tool_call_id: this.toolCallId,
      name: this.name
    };
  }

  dump() {
    return {
      ...super.dump(),
      tool_call_id: this.toolCallId,
      name: this.name
    };
  }
}

export const toolMessage = ({ content, toolCallId, tool_call_id, name, tags }) =>
  new ToolMessage({ content, toolCallId, tool_call_id, name, tags });
