import { BaseLLMMessage } from '../../../base/index.js';

export class SystemMessage extends BaseLLMMessage {
  constructor(content, tags = []) {
    super(content, tags);
    this.role = 'system';
  }
}

export const systemMessage = (content, tags) => new SystemMessage(content, tags);
