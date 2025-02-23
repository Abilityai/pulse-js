import { BaseLLMMessage } from '../../../base/index.js';

export class UserMessage extends BaseLLMMessage {
  constructor(content, tags = []) {
    super(content, tags);
    this.role = 'user';
  }
}

export const userMessage = (content, tags) => new UserMessage(content, tags);
