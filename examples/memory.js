import crypto from 'crypto';
import { Memory, upload } from '../src/memory/index.js';

const sha1 = (input) => crypto.createHash('sha1').update(input, 'utf8').digest('hex');

const testResult = (name, result) => {
  if (result) {
    console.log(`✅ ${name}`);
  } else {
    console.log(`❌ ${name}`);
  }
};

(async () => {
  try {
    // Test file upload
    const attachResponse = await upload({
      content: Buffer.from('Test content'),
      name: 'test.txt',
      type: 'text/plain'
    });
    testResult('File upload', attachResponse && attachResponse.url);

    // Test project creation
    const bucket = await Memory({
      schema: {
        type: "object",
        properties: {
          sampleKey: {
            type: "string",
            description: "A sample text field"
          },
          otherKeys: {
            type: "array",
            items: {
              type: "object",
              properties: {
                key: { type: "string" },
                value: { type: "string" }
              }
            }
          },
          attached_files: {
            type: "array",
            items: {
              type: "object",
              properties: {
                url: { type: "string" },
                type: { type: "string" },
                metadata: {
                  type: "object",
                  properties: {
                    text_content: { type: "string" }
                  }
                }
              }
            }
          }
        }
      }
    });
    testResult('Project creation', !!bucket);

    // Test write operation
    const writeResult = await bucket.write('sampleKey', 'test value');
    testResult('Write operation', writeResult.status === 'success');

    // Test read operation
    const readValue = await bucket.read('sampleKey');
    testResult('Read operation', readValue === 'test value');

    // Test schema retrieval
    const schema = await bucket.schema();
    testResult('Schema retrieval', !!schema);

    // Test validation - valid data
    const validResult = await bucket.validate('sampleKey');
    testResult('Valid data validation', validResult.is_passed === true);

    // Test validation - invalid data
    await bucket.write('sampleKey', 123); // Number instead of string
    const invalidResult = await bucket.validate('sampleKey');
    testResult('Invalid data validation', invalidResult.is_passed === false);

    // Test data update
    const updateResult = await bucket.update('sampleKey', 'updated value');
    testResult('Update operation', updateResult.status === 'success');

    // Test data deletion
    const deleteResult = await bucket.delete('sampleKey');
    testResult('Delete operation', deleteResult.status === 'success');

  } catch (error) {
    console.error('❌ Test suite failed:', error.message);
  }
})();
