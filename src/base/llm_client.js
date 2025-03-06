/**
 * Environment Variables Guide:
 *
 * URL Configuration:
 * - LLM_AGENCY_URL: Complete base URL (highest priority)
 *   Example: "http://localhost:5001" or "https://api.example.com"
 *
 * - LLM_AGENCY_HOST: Combined domain and optional port
 *   Example: "localhost:5001" or "api.example.com"
 *
 * - LLM_AGENCY_PROTOCOL: Protocol to use ("http" or "https")
 *   Default: "http" (or "https" if port is 443)
 *
 * - LLM_AGENCY_DOMAIN: Server domain name
 *   Default: "localhost"
 *
 * - LLM_AGENCY_PORT: Server port number
 *   Default: "5001"
 *
 * Authentication:
 * - LLM_AGENCY_KEY: API key for authentication (required)
 *   Example: "sk-yourapikeyhere"
 *
 * Priority order:
 * 1. Explicitly provided config object parameters
 * 2. Environment variables
 * 3. Default values
 */
export class LLMClient {
  constructor(config) {
    // URL configuration can be provided in multiple ways:
    // 1. As a complete 'baseUrl' in the config object (highest priority)
    // 2. Through LLM_AGENCY_URL environment variable
    // 3. By combining parts:
    //    a. From LLM_AGENCY_HOST environment variable (which can include domain:port or just domain if port is 80/443).
    //       In this case, protocol is determined from LLM_AGENCY_PROTOCOL environment variable.
    //    b. From separate config properties: baseProtocol, baseDomain, basePort
    //    c. From separate environment variables: LLM_AGENCY_PROTOCOL, LLM_AGENCY_DOMAIN, LLM_AGENCY_PORT
    //
    // The urlPath can be provided in the config object to specify a base path.
    //
    // Protocol defaults to 'http' unless port is 443, in which case it defaults to 'https'.
    // Domain defaults to 'localhost' if not specified.
    // Port defaults to 5001 if not specified.
    this.getUrl = function (url) {
      const b = (function ({ baseUrl, baseDomain, basePort, baseProtocol }) {
        if (baseUrl === undefined) {
          // First check for complete URL in env var
          baseUrl = process.env.LLM_AGENCY_URL;

          // If no complete URL is provided, build it from parts
          if (baseUrl === undefined) {
            // Check if LLM_AGENCY_HOST is available (combines domain+port)
            const hostString = process.env.LLM_AGENCY_HOST;
            let domain, port;

            if (hostString) {
              // Parse host string if available
              const hostParts = hostString.split(':');
              domain = hostParts[0];
              // When no port is provided in the host string, also check LLM_AGENCY_PROTOCOL
              if (hostParts.length > 1) {
                port = hostParts[1];
              } else {
                port = '5001';
                // If no port is specified, protocol needs to be determined from environment variable
                const envProtocol = process.env.LLM_AGENCY_PROTOCOL;
                if (envProtocol) {
                  // Use the protocol from environment variable to decide port if needed
                  port = envProtocol === 'https' ? '443' : '5001';
                }
              }
            } else {
              // Fall back to separate domain and port variables
              domain = baseDomain !== undefined ? baseDomain : (process.env.LLM_AGENCY_DOMAIN || 'localhost');
              port = basePort !== undefined ? basePort : (process.env.LLM_AGENCY_PORT || '5001');
            }

            let protocol = baseProtocol !== undefined ? baseProtocol : (process.env.LLM_AGENCY_PROTOCOL || (port === '443' ? 'https' : 'http'));
            if (port === '80' || port === '443') {
              baseUrl = `${protocol}://${domain}`;
            } else {
              baseUrl = `${protocol}://${domain}:${port}`;
            }
          }
        }
        if (baseUrl.endsWith('/')) {
          return baseUrl.slice(0, -1);
        }
        return baseUrl;
      })(config);

      const u = (function ({ urlPath }) {
        if (urlPath === undefined) {
          return '';
        }
        if (urlPath.startsWith('/')) {
          return urlPath;
        }
        return `/${urlPath}`;
      })(config);

      return `${b}${u}/${url.slice(url.startsWith('/') ? 1 : 0)}`;
    }

    this.apiKey = (function ({ apiKey }) {
      const result = apiKey || process.env.LLM_AGENCY_KEY;
      if (result === '' || result === undefined) throw new Error("apiKey is required");
      return result;
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
