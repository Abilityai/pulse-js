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
 * Example to create memory instance with existing bucket
 * ```js
 * const memory = await Memory('bucket-uid');
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

const getConfig = function ({ baseUrl, baseDomain, basePort, baseProtocol }) {
  if (baseUrl) {
    return baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
  }

  const domain = baseDomain || process.env.MEMORY_API_DOMAIN || 'localhost';
  const port = basePort || process.env.MEMORY_API_PORT || '6011';
  const protocol = baseProtocol || process.env.MEMORY_API_PROTOCOL || (port === '443' ? 'https' : 'http');

  if (port === '80' || port === '443') {
    return `${protocol}://${domain}/api`;
  }
  return `${protocol}://${domain}:${port}/api`;
}

const getUrl = function (url) {
  let baseUrl = getConfig(this.config);
  if (!baseUrl.endsWith('/')) {
    baseUrl += '/';
  }
  return baseUrl + url.replace(/^\/+/, '');
}

export const upload = async function ({ content, name, type }) {
  const formData = new FormData();
  // The server expects the file under the 'file' key
  formData.append('file', content, {
    filename: name,
    contentType: type
  });

  try {
    const response = await axios.post(getUrl('/upload'), formData, {
      headers: {
        ...formData.getHeaders(),
        'Content-Type': 'multipart/form-data'
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
// const memory2 = await Memory({ schema: {...}, config: {...} });
// await memory1.write('path.to.data[2]', data);
// const data = await memory1.read('path.to.data[0]');
// await memory1.delete('path.to.data[1]');
export const Memory = async function (args) {
  let uid;
  if (typeof args === 'string') {
    uid: args
  } else {
    uid = await (async ({ schema, config }) => {
      try {
        const response = await axios.post(`${BASE_URL}/bucket`, { schema, configuration: config });
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
        url: `${BASE_URL}/bucket/${uid}/${path}`,
        data
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
