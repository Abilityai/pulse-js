import { LLMClient } from '../../base/llm_client.js';

const getUrlPath = (model) => {
  if (/^dalle/.test(model)) {
    return '/api/dalle';
  }
  if (/^flux/.test(model)) {
    return '/api/flux';
  }

  throw new Error(`Unknown model: ${model}, can't determine URL path`);
};

export class Flux extends LLMClient {
  constructor({ model, ...options }) {
    super({ ...options, urlPath: getUrlPath(model) });
    this.model = model;
  }

  async get({ prompt, ...options }) {
    const data = {
      model: this.model,
      prompt,
      ...options
    };

    const response = await this._request(data);
    return this._processResponse(response);
  }

  _processResponse(response) {
    const { answer, thread_uid: threadUid, usage } = response;

    // Return the image URL directly
    return {
      answer: {
        type: 'image',
        url: answer
      },
      threadUid,
      usage
    };
  }
}
