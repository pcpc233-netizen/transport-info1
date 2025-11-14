import type { VercelRequest, VercelResponse } from '@vercel/node';

const ALLOWED_ORIGINS = [
  'https://admin.bustime.site',
  'http://localhost:5173',
  'http://localhost:3000'
];

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY!;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const origin = req.headers.origin || '';

  if (ALLOWED_ORIGINS.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }

  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        error: '아이디와 비밀번호를 입력하세요',
      });
    }

    const ipAddress = (req.headers['x-forwarded-for'] || req.headers['x-real-ip'] || 'unknown') as string;
    const userAgent = req.headers['user-agent'] || 'unknown';

    const response = await fetch(
      `${supabaseUrl}/functions/v1/admin-login`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${supabaseAnonKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username,
          password,
          ipAddress,
          userAgent,
        }),
      }
    );

    const result = await response.json();

    if (!response.ok) {
      return res.status(response.status).json(result);
    }

    return res.status(200).json(result);

  } catch (error: any) {
    console.error('Login API error:', error);

    return res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
}
