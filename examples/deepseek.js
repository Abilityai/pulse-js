import 'dotenv/config';
import { Chat, systemMessage, userMessage } from '../src/models/chat/index.js';

async function main() {
  const chat = new Chat({ model: 'deepseek-r1' });

  // Test code completion
  console.log('\nTesting code completion...');
  const { answer: { content: response1 } } = await chat.get({
    messages: [
      systemMessage('You are a helpful coding assistant.'),
      userMessage('Write a simple function to calculate fibonacci numbers.')
    ],
    kind: ['code', 'rust']
  });

  console.log('\nWrite a simple function to calculate fibonacci numbers:\n');
  console.log('\x1b[32m%s\x1b[0m', response1);

  // Test code explanation
  console.log('\nTesting code explanation...');
  const { answer: { content: response2 } } = await chat.get({
    messages
: [
      systemMessage('You are a helpful coding assistant.'),
      userMessage(`Explain what this code does:
        function quickSort(arr) {
          if (arr.length <= 1) return arr;
          const pivot = arr[0];
          const left = arr.slice(1).filter(x => x < pivot);
          const right = arr.slice(1).filter(x => x >= pivot);
          return [...quickSort(left), pivot, ...quickSort(right)];
        }`)
    ],
    kind: 'str'
  });

  console.log('\nExplain this code:\n');
  console.log('\x1b[33m%s\x1b[0m', `function quickSort(arr) {
  if (arr.length <= 1) return arr;
  const pivot = arr[0];
  const left = arr.slice(1).filter(x => x < pivot);
  const right = arr.slice(1).filter(x => x >= pivot);
  return [...quickSort(left), pivot, ...quickSort(right)];
}`);
  console.log('\nExplanation:\n');
  console.log('\x1b[32m%s\x1b[0m', response2);

  // Test error detection
  console.log('\nTesting error detection...');
  const { answer: { content: response3 } } = await chat.get({
    messages: [
      systemMessage('You are a helpful coding assistant.'),
      userMessage(`Find the bug in this code:
        function sumArray(arr) {
          let sum;
          for(let i = 1; i < arr.length; i++) {
            sum += arr[i];
          }
          return sum;
        }`),
      systemMessage('Return explanations only'),
    ],
    kind: ['array', 'str'],
    temperature: 0,
  });

  console.log('\nFind the bug in this code:\n');
  console.log('\x1b[33m%s\x1b[0m', `function sumArray(arr) {
    let sum;
    for(let i = 0; i < arr.length; i++) {
      sum += arr[i];
    }
    return sum;
  }`);
  response3.forEach((line, i) => {
    console.log(`${i}) \x1b[32m${line}\x1b[0m`);
  });
}

main();
