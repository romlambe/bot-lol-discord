import dotenv from 'dotenv';
import path from 'path';

export function initEnv() {
  dotenv.config({ 
    path: path.resolve(__dirname, '../../.env'),
    override: false
  });

  if (!process.env.PANDASCORE_API_KEY) {
    console.error('[ERROR]: PANDASCORE_API_KEY missing in .env');
    process.exit(1);
  }
  if (!process.env.DISCORD_TOKEN) {
    console.error('[ERROR]: DISCORD_TOKEN missing in .env');
    process.exit(1);
  }
}