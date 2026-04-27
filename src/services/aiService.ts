import Anthropic from '@anthropic-ai/sdk';
import OpenAI from 'openai';
import { getYTSettings } from './apiKeysService';

// ── Claude (roteiros) ──────────────────────────────────────────────────────

async function generateWithClaude(prompt: string, apiKey: string): Promise<string> {
  const client = new Anthropic({ apiKey, dangerouslyAllowBrowser: true });
  const message = await client.messages.create({
    model: 'claude-opus-4-7',
    max_tokens: 4096,
    messages: [{ role: 'user', content: prompt }],
  });
  const block = message.content[0];
  return block.type === 'text' ? block.text : '';
}

// ── ChatGPT ────────────────────────────────────────────────────────────────

async function generateWithChatGPT(prompt: string, apiKey: string): Promise<string> {
  const client = new OpenAI({ apiKey, dangerouslyAllowBrowser: true });
  const completion = await client.chat.completions.create({
    model: 'gpt-4o',
    messages: [{ role: 'user', content: prompt }],
    max_tokens: 4096,
  });
  return completion.choices[0]?.message?.content ?? '';
}

async function generateImageWithDallE(prompt: string, apiKey: string): Promise<string> {
  const client = new OpenAI({ apiKey, dangerouslyAllowBrowser: true });
  const response = await client.images.generate({
    model: 'dall-e-3',
    prompt,
    n: 1,
    size: '1024x1024',
    response_format: 'url',
  });
  return response.data[0]?.url ?? '';
}

// ── Nano Banana Pro ────────────────────────────────────────────────────────

async function generateImageWithNanoBanana(
  prompt: string,
  apiKey: string,
  endpoint: string,
  model: string,
): Promise<string> {
  const res = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ prompt, model, n: 1, size: '1024x1024' }),
  });
  if (!res.ok) throw new Error(`Erro na API do Nano Banana Pro: ${res.status} ${res.statusText}`);
  const data = await res.json();
  // Support both {url} and {data:[{url}]} response formats
  return data?.url ?? data?.data?.[0]?.url ?? data?.image_url ?? '';
}

// ── Unified interface ──────────────────────────────────────────────────────

export async function generateText(prompt: string): Promise<string> {
  const settings = getYTSettings();

  if (settings.preferredScriptAI === 'claude') {
    if (!settings.anthropicKey) throw new Error('Chave da API do Claude não configurada. Vá em ⚙️ Configurações de IA.');
    return generateWithClaude(prompt, settings.anthropicKey);
  }

  if (!settings.openaiKey) throw new Error('Chave da API do ChatGPT não configurada. Vá em ⚙️ Configurações de IA.');
  return generateWithChatGPT(prompt, settings.openaiKey);
}

export async function generateImage(prompt: string): Promise<string> {
  const settings = getYTSettings();

  if (settings.preferredImageAI === 'nanobanana') {
    if (!settings.nanoBananaKey || !settings.nanoBananaEndpoint)
      throw new Error('Nano Banana Pro não configurado. Vá em ⚙️ Configurações de IA.');
    return generateImageWithNanoBanana(
      prompt,
      settings.nanoBananaKey,
      settings.nanoBananaEndpoint,
      settings.nanoBananaModel,
    );
  }

  if (!settings.openaiKey) throw new Error('Chave da API do OpenAI (DALL-E) não configurada. Vá em ⚙️ Configurações de IA.');
  return generateImageWithDallE(prompt, settings.openaiKey);
}
