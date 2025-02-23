import { BaseLLMMessage } from '../../../base/index.js';

export class AiMessage extends BaseLLMMessage {
  constructor(content, tags = []) {
    super(content, tags);
    this.role = 'assistant';
  }
}

export const aiMessage = (content, tags) => new AiMessage(content, tags);
