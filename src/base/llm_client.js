export class LLMClient {
  constructor({ baseUrl = process.env.LLM_AGENCY_URL || 'http://127.0.0.1:5001', apiKey = process.env.LLM_AGENCY_KEY, urlPath = '' }) {
    this.baseUrl = baseUrl;
    this.apiKey = apiKey;
    this.urlPath = urlPath;
  }

  async _request(data = {}, url = '', method_name = 'POST') {
    const m = String(method_name).toUpperCase();
    const response = await fetch(`${this.baseUrl}${this.urlPath}${url}`, {
      method: m,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': this.apiKey
      },
      body: m !== 'GET' ? JSON.stringify(data) : undefined
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`HTTP error! status: ${response.status}, body: ${text}`);
    }

    return await response.json();
  }

  _processResponse(response) {
    const { answer, thread_uid: threadUid, usage } = response;
    return {
      answer,
      threadUid,
      usage
    };
  }

  async save({ messages, answer }) {
    const response = await this._request({
      messages: messages.map(m => m.json()),
      response: answer.json()
    }, '/messages', 'PUT');
    return response.thread_uid;
  }

  async messages(threadUid) {
    if (!threadUid) {
      return [];
    }
    const response = await this._http_request(undefined, `/messages/${threadUid}`, 'GET');
    return response.messages;
  }
}
