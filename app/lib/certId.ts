import Certificate from '@/app/models/Certificate';

const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

function randomChunk(len: number): string {
  let out = '';
  for (let i = 0; i < len; i++) {
    out += ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
  }
  return out;
}

export async function generateUniqueCertId(): Promise<string> {
  const year = new Date().getFullYear();
  for (let attempt = 0; attempt < 8; attempt++) {
    const candidate = `TKS-${year}-${randomChunk(4)}-${randomChunk(4)}`;
    const exists = await Certificate.exists({ certId: candidate });
    if (!exists) return candidate;
  }
  return `TKS-${year}-${Date.now().toString(36).toUpperCase()}-${randomChunk(3)}`;
}
