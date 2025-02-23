import 'dotenv/config';
import Flux from '../src/models/flux/index.js';

// Initialize the Flux client
const flux = new Flux({ model: 'flux-pro' });

// Generate an image
console.log('Generating image...');
const response = await flux.get({
  prompt: 'A beautiful sunset over a mountain lake, digital art style'
});

console.log('\nResponse:');
console.log(response);

// Generate another image with different parameters
console.log('\nGenerating another image...');
const response2 = await flux.get({
  prompt: 'A futuristic cityscape at night with flying cars and neon lights'
});

console.log('\nResponse:');
console.log(response2);
