import dotenv from 'dotenv';
import path from 'path';

export function initEnv() {
  dotenv.config({ path: path.resolve(__dirname, '../../.env') });

  if (!process.env.PANDASCORE_API_KEY) {
    console.warn('[ERROR]: PANDASCORE_API_KEY missing in .env');
  }
  if (!process.env.DISCORD_TOKEN) {
    console.warn('[ERROR]: DISCORD_TOKEN missing in .env');
  }
}
