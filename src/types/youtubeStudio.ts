export interface YTStudioSettings {
  anthropicKey: string;
  openaiKey: string;
  nanoBananaKey: string;
  nanoBananaEndpoint: string;
  nanoBananaModel: string;
  preferredScriptAI: 'claude' | 'chatgpt';
  preferredImageAI: 'dalle' | 'nanobanana';
}

export const DEFAULT_YT_SETTINGS: YTStudioSettings = {
  anthropicKey: '',
  openaiKey: '',
  nanoBananaKey: '',
  nanoBananaEndpoint: '',
  nanoBananaModel: 'nano-banana-v1',
  preferredScriptAI: 'claude',
  preferredImageAI: 'dalle',
};

export interface GeneratedImage {
  url: string;
  prompt: string;
}
