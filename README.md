# Pulse JS

A lightweight JavaScript SDK for seamless integration with ability.ai/llm_core services. Access multiple LLM providers through a unified API.

## Installation

```bash
npm install @ability/pulse
```

## Configuration

Configure the SDK using environment variables or by passing options directly to the client:

```bash
# Environment variables
# URL Configuration
LLM_AGENCY_URL=http://localhost:5001   # Complete base URL (highest priority)
LLM_AGENCY_HOST=localhost:5001         # Combined domain and optional port, could be LLM_AGENCY_HOST=core.ability.ai with LLM_AGENCY_PROTOCOL=https
LLM_AGENCY_DOMAIN=localhost            # API domain (default: localhost)
LLM_AGENCY_PORT=5001                   # API port (default: 5001)
LLM_AGENCY_PROTOCOL=http               # API protocol (default: http, or https if port is 443)

# Authentication
LLM_AGENCY_KEY=your_api_key            # Required API key
```

## Basic Usage

### Chat Models

Access different LLM providers through a unified interface using the `Chat` class:

```javascript
import { Chat } from 'pulse';

// Initialize with your preferred model
const chat = new Chat({
  model: 'gpt-4o',               // Model name
  apiKey: 'your_api_key'         // Optional if set via env var
});

// Send a message and get a response
const response = await chat.get({
  messages: [
    Chat.systemMessage("You are a helpful assistant."),
    Chat.userMessage("What's the distance between Earth and Mars?")
  ],
  kind: 'str'  // Request a string response
});

console.log(response.answer.content);
console.log(`Thread ID: ${response.thread}`);
console.log(`Token usage: ${JSON.stringify(response.usage)}`);
```

### Function Calling (Tools)

Enhance your AI with tools for external data access or computation:

```javascript
import { Chat, tool } from 'pulse';

const chat = new Chat({ model: 'gpt-4o-mini' });

const response = await chat.get({
  messages: [
    Chat.systemMessage("You're an assistant with tool access."),
    Chat.userMessage("What's 42 × 18?")
  ],
  tools: [
    tool({
      name: 'calculator',
      description: 'Performs arithmetic calculations',
      parameters: {
        type: 'object',
        properties: {
          operation: {
            type: 'string',
            enum: ['add', 'subtract', 'multiply', 'divide']
          },
          a: { type: 'number' },
          b: { type: 'number' }
        },
        required: ['operation', 'a', 'b']
      }
    }, async ({ operation, a, b }) => {
      switch (operation) {
        case 'add': return a + b;
        case 'subtract': return a - b;
        case 'multiply': return a * b;
        case 'divide': return a / b;
      }
    })
  ]
});

console.log(response.answer.content);
```

### Image Generation

Generate images using DALL-E or Flux models:

```javascript
import { Image } from 'pulse';

const imageGen = new Image({ model: 'flux-pro' });
const result = await imageGen.get({
  prompt: "A serene mountain lake at sunset with reflections"
});

console.log(`Generated image URL: ${result.answer.url}`);
```

### Memory Storage

Store and retrieve structured data with schema validation:

```javascript
import { Memory } from 'pulse';

// Create a new memory bucket with schema
const memory = await Memory({
  schema: {
    type: "object",
    properties: {
      users: {
        type: "array",
        items: {
          type: "object",
          properties: {
            name: { type: "string" },
            score: { type: "number" }
          }
        }
      }
    }
  }
});

// Write data
await memory.write('users', [
  { name: "Alice", score: 95 },
  { name: "Bob", score: 87 }
]);

// Read data
const users = await memory.read('users');
console.log(users);

// Validate against schema
const validation = await memory.validate();
console.log(`Data valid: ${validation.is_passed}`);
```

## Response Formats

```javascript
// Text responses
{
  answer: {
    role: 'assistant',
    content: 'Generated text response'
  },
  thread: 'thread_123abc',
  usage: { prompt_tokens: 42, completion_tokens: 128 }
}

// Image responses
{
  answer: {
    type: 'image',
    url: 'https://storage.example.com/generated-image.png'
  },
  thread: 'thread_456def'
}

// Function call responses
{
  answer: {
    role: 'assistant',
    content: 'I calculated the result for you.',
    tool_calls: [
      {
        id: 'call_789ghi',
        function: {
          name: 'calculator',
          arguments: '{"operation":"multiply","a":42,"b":18}'
        }
      }
    ]
  }
}
```
