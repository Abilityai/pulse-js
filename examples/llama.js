import 'dotenv/config';
import { Chat, systemMessage, userMessage } from '../src/models/chat/index.js';

async function main() {
  const chat = new Chat({ model: 'llama3-8b-8192' });

  // Simple completion test
  console.log('\nTesting simple completion...');
  const response = await chat.get({
    messages: [
      systemMessage('You are a helpful assistant.'),
      userMessage('Give two answers. What is 2+2 and what is the capital of France?')
    ],
    kind: 'none'
  });

  const answer = response.answer.content;

  console.log('Give two answers. What is 2+2 and what is the capital of France?\n');
  console.log('\x1b[32m%s\x1b[0m', answer);

  // Verify response contains expected information
  const hasAnswer = answer.includes('4') && answer.includes('Paris');

  console.log('\nVerification:', hasAnswer ? '\x1b[32mdone\x1b[0m' : '\x1b[31mfail\x1b[0m');
}

main();
