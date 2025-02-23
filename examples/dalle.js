import 'dotenv/config';
import { Dalle } from '../src/models/dalle/index.js';

async function main() {
  const dalle = new Dalle({ model: 'dall-e-3' });

  // Generate an image
  console.log('\nGenerating image...');
  const response = await dalle.get({
    prompt: 'A cute cat playing with a ball of yarn in a cozy living room, digital art style',
    size: '1024x1024',
    quality: 'standard',
    style: 'vivid'
  });

  console.log('\nResponse:');
  console.log(response);

  // Generate another image with different style
  console.log('\nGenerating another image...');
  const response2 = await dalle.get({
    prompt: 'A serene mountain landscape at sunset with a lake reflection, watercolor style',
    size: '1024x1024',
    quality: 'hd',
    style: 'natural'
  });

  console.log('\nResponse:');
  console.log(response2);
}

main(); 