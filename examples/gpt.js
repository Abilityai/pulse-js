import 'dotenv/config';
import { Chat, systemMessage, userMessage, tool } from '../src/models/chat/index.js';

async function main() {
  const chat = new Chat({ model: 'gpt-4o-mini' });

  // Simple completion test
  console.log('\nTesting simple completion...');
  const response = await chat.get({
    messages: [
      systemMessage('You are a helpful assistant.'),
      userMessage('What is 2+2 and what is the capital of France?')
    ],
    kind: 'str'
  });

  console.log('\nResponse:');
  console.log(response)

  // Function calling test
  console.log('\nTesting function calling...');
  const response2 = await chat.get({
    messages: [
      systemMessage('You are a helpful assistant that can use tools.'),
      userMessage('Calculate 10 + 20 and then multiply the result by 2')
    ],
    kind: 'str',
    tools: [
      tool({
        name: 'calculator',
        description: 'Calculator for basic arithmetic operations',
        parameters: {
          type: 'object',
          properties: {
            a: {
              type: 'number',
              description: 'First number'
            },
            b: {
              type: 'number',
              description: 'Second number'
            },
            operation: {
              type: 'string',
              enum: ['add', 'subtract', 'multiply', 'divide'],
              description: 'Operation to perform'
            }
          },
          required: ['a', 'b', 'operation']
        }
      }, async ({ a, b, operation }) => {
        console.log(`Executing calculator with: ${operation}(${a}, ${b})`);
        switch (operation) {
          case 'add': return a + b;
          case 'subtract': return a - b;
          case 'multiply': return a * b;
          case 'divide': return a / b;
          default: throw new Error(`Unknown operation: ${operation}`);
        }
      })
    ]
  });

  console.log('\nResponse with function:');
  console.log(response2)

  // Test error handling in function calling
  console.log('\nTesting function error handling...');
  const response3 = await chat.get({
    messages: [
      systemMessage('You are a helpful assistant that can use tools.'),
      userMessage('Divide 10 by 0')
    ],
    kind: 'str',
    tools: [
      tool({
        name: 'calculator',
        description: 'Calculator for basic arithmetic operations',
        parameters: {
          type: 'object',
          properties: {
            a: {
              type: 'number',
              description: 'First number'
            },
            b: {
              type: 'number',
              description: 'Second number'
            },
            operation: {
              type: 'string',
              enum: ['add', 'subtract', 'multiply', 'divide'],
              description: 'Operation to perform'
            }
          },
          required: ['a', 'b', 'operation']
        }
      }, async ({ a, b, operation }) => {
        console.log(`Executing calculator with: ${operation}(${a}, ${b})`);
        if (operation === 'divide' && b === 0) {
          throw new Error('Division by zero is not allowed');
        }
        switch (operation) {
          case 'add': return a + b;
          case 'subtract': return a - b;
          case 'multiply': return a * b;
          case 'divide': return a / b;
          default: throw new Error(`Unknown operation: ${operation}`);
        }
      })
    ]
  });

  console.log('\nResponse with error:');
  console.log(response3)
}

main();
