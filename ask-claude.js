import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

async function askClaude(prompt) {
  if (!prompt) {
    console.error('Error: No prompt provided');
    console.error('Usage: node ask-claude.js "your prompt here"');
    process.exit(1);
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    console.error('Error: ANTHROPIC_API_KEY environment variable is not set');
    console.error('Please add your API key to the Secrets tab');
    process.exit(1);
  }

  try {
    const message = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    const response = message.content[0];
    if (response.type === 'text') {
      console.log(response.text);
    }
  } catch (error) {
    console.error('Error calling Claude API:', error.message);
    process.exit(1);
  }
}

const prompt = process.argv.slice(2).join(' ');
askClaude(prompt);
