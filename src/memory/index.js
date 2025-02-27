/**
 * Memory API client for working with project data
 *
 * Example usage to create new memory bucket
 * ```js
 * const memory = await Memory({
 *   schema: {...},  // JSON schema for validation
 *   config: {...}   // Optional configuration
 * });
 *
 * // Create memory with a predefined schema
 * const memory = await Memory({
 *   schema: {
 *     type: "object",
 *     properties: {
 *       users: {
 *         type: "array",
 *         items: { type: "string" }
 *       }
 *     }
 *   }
 * });
 *
 * // Create memory with configuration options
 * const memory = await Memory({
 *   schema: {...},
 *   config: {
 *     validation: { enabled: true },
 *     versioning: { enabled: true }
 *   }
 * });
 *
 * // Create memory with custom API options using baseUrl
 * const memory = await Memory(
 *   { schema: {...} },
 *   { baseUrl: 'https://custom-api.example.com' }
 * );
 *
 * // Create memory with custom API options using individual components
 * // You can also set these with environment variables:
 * // MEMORY_API_DOMAIN, MEMORY_API_PORT, MEMORY_API_PROTOCOL
 * const memory = await Memory(
 *   { schema: {...} },
 *   {
 *     baseDomain: 'api.example.com',   // or use MEMORY_API_DOMAIN
 *     basePort: '8080',                // or use MEMORY_API_PORT
 *     baseProtocol: 'https'            // or use MEMORY_API_PROTOCOL
 *   }
 * );
 *
 * Example to create memory instance with existing bucket
 * ```js
 * const memory = await Memory('bucket-uid');
 *
 * // With custom API options using baseUrl
 * const memory = await Memory('bucket-uid', {
 *   baseUrl: 'https://custom-domain.com/api'
 * });
 *
 * // With custom API options using individual components
 * // These can be set via environment variables instead:
 * // MEMORY_API_DOMAIN, MEMORY_API_PORT, MEMORY_API_PROTOCOL
 * const memory = await Memory('bucket-uid', {
 *   baseDomain: 'memory.example.org',  // or use MEMORY_API_DOMAIN env var
 *   basePort: '443',                   // or use MEMORY_API_PORT env var
 *   baseProtocol: 'https'              // or use MEMORY_API_PROTOCOL env var
 * });
 * ```
 *
 * await memory.write('path.to.data[2]', data);    // Write data
 * const data = await memory.read('path.to.data[0]'); // Read data
 * await memory.delete('path.to.data[1]');         // Delete data
 * await memory.validate('path', data);         // Validate data
 * const config = await memory.config('path');  // Get config
 * const schema = await memory.schema();        // Get schema
 * ```
 */
import axios from 'axios';
import FormData from 'form-data';

const getConfig = function ({ baseUrl, baseDomain, basePort, baseProtocol, token } = {}) {
  if (baseUrl) {
    return baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
  }

  const domain = baseDomain || process.env.MEMORY_API_DOMAIN || 'localhost';
  const port = basePort || process.env.MEMORY_API_PORT || '6011';
  const protocol = baseProtocol || process.env.MEMORY_API_PROTOCOL || (port === '443' ? 'https' : 'http');
  const token1 = token || process.env.MEMORY_API_TOKEN;

  let baseUrl1;

  if (port === '80' || port === '443') {
    baseUrl1 = `${protocol}://${domain}/api`;
  } else {
    baseUrl1 = `${protocol}://${domain}:${port}/api`;
  }
  return { baseUrl: baseUrl1, token: token1 };
}

const getUrl = function (baseUrl, url) {
  return baseUrl + '/' + url.replace(/^\/+/, '');
}

export const upload = async function ({ content, name, type }, options) {
  const { token, baseUrl } = getConfig(options);
  const formData = new FormData();
  // The server expects the file under the 'file' key
  formData.append('file', content, {
    filename: name,
    contentType: type
  });

  try {
    console.log({
      url: getUrl(baseUrl, '/upload'),
      headers: {
        ...formData.getHeaders(),
        'Content-Type': 'multipart/form-data',
        'Authorization': token
      }
    });
    const response = await axios.post(getUrl(baseUrl, '/upload'), formData, {
      headers: {
        ...formData.getHeaders(),
        'Content-Type': 'multipart/form-data',
        'Authorization': token
      }
    });
    return response.data;
  } catch (error) {
    console.error('Upload error details:', error.response?.data || error.message);
    throw new Error(`Failed to upload file: ${error.message}`);
  }
}

// Memory API client
// Example usage:
// const memory1 = await Memory('bucket-uid');
// const memory2 = await Memory({ schema: {...}, config: {...} }, options);
// await memory1.write('path.to.data[2]', data);
// const data = await memory1.read('path.to.data[0]');
// await memory1.delete('path.to.data[1]');
export const Memory = async function (args, options = {}) {
  const { baseUrl, token } = getConfig(options);
  const url = (u) => getUrl(baseUrl, u)
  let uid;
  if (typeof args === 'string') {
    uid = args;
  } else {
    uid = await (async ({ schema, config }) => {
      try {
        const response = await axios.post(url('/bucket'), { schema, configuration: config }, {
          headers: {
            'Authorization': token
          }
        });
        return response.data.uid;
      } catch (error) {
        throw new Error(`Failed to initialize project: ${error.message}`);
      }
    })(args);
  }

  const request = async function (method, path, data) {
    try {
      const response = await axios.request({
        method,
        url: url(`/bucket/${uid}/${path}`),
        data,
        headers: {
          'Authorization': token
        },
      });
      return response.data;
    } catch (error) {
      throw new Error(`Failed to ${method} data: ${error.message}`);
    }
  }
  const post = async (path, data) => request('post', path, data);
  const put = async (path, data) => request('put', path, data);
  const get = async  (path) => request('get', path);
  const del = async (path) => request('delete', path);

  return {
    uid: uid.toString(), // prevent accidental mutation
    async write(path, value) {
      return await post('', { path, value });
    },
    async update(path, value) {
      return await put('', { path, value });
    },
    async read(path) {
      return await get(`blob/current/${path}`);
    },
    async delete(path) {
      return await del(`?path=${path}`);
    },
    async validate(path) {
      const queryParams = path ? `?path=${path}` : '';
      return await get(`validate/${queryParams}`);
    },
    async config(path) {
      return await get(`config?path=${path}`);
    },
    async schema() {
      return await get(`schema`);
    },
    async simpleSchema() {
      //...
    },
  }
}
