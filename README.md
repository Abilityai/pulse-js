# Pulse JS

JavaScript SDK for connecting to ability.ai/llm_core.

## Installation

```bash
npm install @ability/pulse
```

## Configuration

The SDK can be configured using environment variables or by passing options to the client:

```bash
# Environment variables
LLM_AGENCY_URL=http://127.0.0.1:5001
LLM_AGENCY_KEY=your_api_key
```

## Basic Usage

### Using GPT for text completion

```javascript
import { GPT } from '@ability/pulse';

const gpt = new GPT({ model: 'gpt-3.5-turbo-16k-0613' });
const gptResponse = await gpt.get({
  messages: [
    GPT.systemMessage("You are a helpful GPT assistant."),
    GPT.userMessage("What is the meaning of life?")
  ]
});
console.log("GPT Response:", gptResponse.answer);
console.log(gptResponse.threadUid);
console.log(gptResponse.usage);
```

### Using Claude for text completion

```javascript
import { Claude } from '@ability/pulse';

const claude = new Claude({ model: 'claude-3-haiku-20240307' });
const claudeResponse = await claude.get({
  messages: [
    Claude.systemMessage("You are a helpful Claude assistant."),
    Claude.userMessage("What is 2+2?")
  ]
});
console.log("Claude Response:", claudeResponse.answer);
console.log(claudeResponse.threadUid);
console.log(claudeResponse.usage);
```

### Using Llama for text completion

```javascript
import { Llama } from '@ability/pulse';

const llama = new Llama({ model: 'llama3-8b-8192' });
const llamaResponse = await llama.get({
  messages: [
    Llama.systemMessage("You are a helpful Llama assistant."),
    Llama.userMessage("Tell me a joke.")
  ]
});
console.log("Llama Response:", llamaResponse.answer);
console.log(llamaResponse.threadUid);
console.log(llamaResponse.usage);
```

### Using Dalle for image generation

```javascript
import { Dalle } from '@ability/pulse';

const dalle = new Dalle({ model: 'dall-e-3' });
const dalleResponse = await dalle.get({
  prompt: "A futuristic cityscape at sunset with flying cars."
});
console.log("Dalle Response:", dalleResponse.answer);
console.log(dalleResponse.threadUid);
console.log(dalleResponse.usage);
```

### Using Flux for image generation

```javascript
import { Flux } from '@ability/pulse';

const flux = new Flux({ model: 'flux-pro' });
const fluxResponse = await flux.get({
  prompt: "A neon-lit cyberpunk street scene at night."
});
console.log("Flux Response:", fluxResponse.answer);
console.log(fluxResponse.threadUid);
console.log(fluxResponse.usage);
```

### Using Gemini for text completion

```javascript
import { Gemini } from '@ability/pulse';

const gemini = new Gemini({ model: 'gemini-1.5-flash' });
const geminiResponse = await gemini.get({
  messages: [
    Gemini.systemMessage("You are a helpful Gemini assistant."),
    Gemini.userMessage("What is the capital of France?")
  ]
});
console.log("Gemini Response:", geminiResponse.answer);
console.log(geminiResponse.threadUid);
console.log(geminiResponse.usage);
```

### Response Format Examples:

```
// Text-based models:
/// {
///   answer: {
///     role: 'assistant',
///     content: 'Generated text response'
///   },
///   threadUid: 'UniqueThreadID',
///   usage: 'Optional usage stats'
/// }

// Image-based models:
/// {
///   answer: {
///     type: 'image',
///     url: 'Generated image URL'
///   },
///   threadUid: 'UniqueThreadID',
///   usage: 'Optional usage stats'
/// }

// Saving messages
// (Available in text-based models derived from LLMClient)
const threadUid = await gpt.save({
  messages: [
    GPT.systemMessage("Sample system message."),
    GPT.userMessage("Sample user message.")
  ],
  answer: gptResponse.answer
});

// Retrieving message history
const history = await gpt.messages(threadUid);
console.log("Message History:", history);
```
