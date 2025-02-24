export class LLMClient {
  constructor(config) {
    this.getUrl = function (url) {
      const b = (function ({ baseUrl, baseDomain, basePort, baseProtocol }) {
        if (baseUrl === undefined) {
          const domain = baseDomain !== undefined ? baseDomain : process.env.LLM_AGENCY_DOMAIN;
          let port = basePort !== undefined ? basePort : (process.env.LLM_AGENCY_PORT || '5001');
          let protocol = baseProtocol !== undefined ? baseProtocol : (process.env.LLM_AGENCY_PROTOCOL || (port === '443' ? 'https' : 'http'));
          if (port === '80' || port === '443') {
            baseUrl = `${protocol}://${domain}`;
          } else {
            baseUrl = `${protocol}://${domain}:${port}`;
          }
        }
        if (baseUrl.endsWith('/')) {
          return baseUrl.slice(0, -1);
        }
        return baseUrl;
      })(config);
      const u = (function ({ urlPath }) {
        if (urlPath.startsWith('/')) {
          return urlPath;
        }
        return `/${urlPath}`;
      })(config);

      if (url.startsWith('/')) {
        return `${b}${u}${url}`;
      } else {
        return `${b}${u}/${url}`;
      }
    }

    this.apiKey = (function ({apiKey}) {
      const result = apiKey || process.env.LLM_AGENCY_KEY;
      if (!result) {
        throw new Error("apiKey is required");
      }
    })(config)
  }

  async _request(data = {}, url = '', method_name = 'POST') {
    const m = String(method_name).toUpperCase();
    const response = await fetch(this.getUrl(url), {
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
    const response = await this._request(undefined, `/messages/${threadUid}`, 'GET');
    return response.messages;
  }
}
