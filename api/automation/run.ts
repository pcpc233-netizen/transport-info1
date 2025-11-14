import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const ALLOWED_ORIGINS = [
  'https://admin.bustime.site',
  'http://localhost:5173',
  'http://localhost:3000'
];

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const adminEmail = 'pcpc233@gmail.com';

interface AdminSession {
  id: string;
  admin_id: string;
  session_token: string;
  expires_at: string;
}

async function verifyAdminSession(sessionToken: string): Promise<{ adminId: string; username: string } | null> {
  try {
    console.log('===== SESSION VERIFICATION DEBUG =====');
    console.log('[verifyAdminSession] Full token received:', sessionToken);
    console.log('[verifyAdminSession] Token length:', sessionToken.length);
    console.log('[verifyAdminSession] Token preview:', sessionToken.substring(0, 36));
    console.log('[verifyAdminSession] Using Supabase URL:', supabaseUrl);
    console.log('[verifyAdminSession] Service key available:', !!supabaseServiceKey);

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Query with exact token match
    console.log('[verifyAdminSession] Querying DB for token:', sessionToken);
    const { data: session, error } = await supabase
      .from('admin_sessions')
      .select('admin_id, expires_at, session_token')
      .eq('session_token', sessionToken)
      .gt('expires_at', new Date().toISOString())
      .maybeSingle();

    console.log('[verifyAdminSession] Query result:', {
      found: !!session,
      error: error?.message,
      sessionData: session ? {
        admin_id: session.admin_id,
        expires_at: session.expires_at,
        token_from_db: session.session_token,
        token_matches: session.session_token === sessionToken
      } : null
    });

    if (error) {
      console.error('[verifyAdminSession] Session query error:', error);
      return null;
    }

    if (!session) {
      console.log('[verifyAdminSession] Session not found or expired');
      console.log('[verifyAdminSession] Searched for token:', sessionToken);

      // Check if any similar tokens exist
      const { data: allSessions } = await supabase
        .from('admin_sessions')
        .select('session_token')
        .gt('expires_at', new Date().toISOString())
        .limit(10);

      console.log('[verifyAdminSession] Active sessions in DB:', allSessions?.map(s => s.session_token));
      return null;
    }
    console.log('====================================');

    const { data: admin, error: adminError } = await supabase
      .from('admin_users')
      .select('id, username, is_active')
      .eq('id', session.admin_id)
      .eq('is_active', true)
      .maybeSingle();

    if (adminError) {
      console.error('Admin user query error:', adminError);
      return null;
    }

    if (!admin) {
      console.log('Admin user not found or inactive');
      return null;
    }

    return {
      adminId: admin.id,
      username: admin.username,
    };
  } catch (error) {
    console.error('Session verification error:', error);
    return null;
  }
}

async function sendErrorEmail(error: any, context: any) {
  try {
    const subject = `🚨 [bustime.site] 자동화 실행 실패`;
    const body = `
자동화 실행 중 오류가 발생했습니다.

시간: ${new Date().toLocaleString('ko-KR')}
환경: Production
함수: auto-content-orchestrator

오류 내용:
${error.message || JSON.stringify(error)}

컨텍스트:
${JSON.stringify(context, null, 2)}

스택:
${error.stack || 'N/A'}
    `.trim();

    await fetch(`${supabaseUrl}/functions/v1/send-alert-email`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to: adminEmail,
        subject,
        body,
      }),
    });
  } catch (emailError) {
    console.error('Failed to send error email:', emailError);
  }
}

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
    // Vercel normalizes headers to lowercase
    const authHeader = req.headers.authorization as string | undefined;

    console.log('Debug - Headers:', {
      hasAuth: !!authHeader,
      allHeaders: Object.keys(req.headers),
    });

    if (!authHeader || typeof authHeader !== 'string') {
      console.log('No authorization header');
      return res.status(401).json({
        error: 'Unauthorized: No session token',
        debug: { hasAuthHeader: !!authHeader, headerType: typeof authHeader }
      });
    }

    if (!authHeader.startsWith('Bearer ')) {
      console.log('Invalid authorization format');
      return res.status(401).json({ error: 'Unauthorized: Invalid token format' });
    }

    const sessionToken = authHeader.replace('Bearer ', '').trim();

    console.log('===== TOKEN EXTRACTION DEBUG =====');
    console.log('Raw Authorization Header:', authHeader);
    console.log('After "Bearer " removal:', authHeader.replace('Bearer ', ''));
    console.log('After trim():', sessionToken);
    console.log('Token length:', sessionToken.length);
    console.log('Token hex dump (first 50 chars):', Array.from(sessionToken.substring(0, 50)).map(c => c.charCodeAt(0).toString(16)).join(' '));
    console.log('Full token:', sessionToken);
    console.log('==================================');

    if (!sessionToken) {
      console.log('Empty session token');
      return res.status(401).json({ error: 'Unauthorized: Empty session token' });
    }

    console.log('Verifying session token:', sessionToken.substring(0, 30) + '...');
    const session = await verifyAdminSession(sessionToken);

    if (!session) {
      console.log('Session verification failed');
      return res.status(401).json({ error: 'Unauthorized: Invalid or expired session' });
    }

    console.log(`Admin ${session.username} triggered automation`);

    const edgeFunctionResponse = await fetch(
      `${supabaseUrl}/functions/v1/auto-content-orchestrator`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${supabaseServiceKey}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!edgeFunctionResponse.ok) {
      const errorText = await edgeFunctionResponse.text();
      console.error('Edge Function error:', {
        status: edgeFunctionResponse.status,
        statusText: edgeFunctionResponse.statusText,
        body: errorText
      });

      await sendErrorEmail(
        new Error(`Edge Function returned ${edgeFunctionResponse.status}`),
        { admin: session.username, errorText }
      );

      return res.status(500).json({
        success: false,
        error: `Edge Function error: ${edgeFunctionResponse.status}`,
      });
    }

    const result = await edgeFunctionResponse.json();

    if (!result.success) {
      await sendErrorEmail(
        new Error(result.error || 'Automation failed'),
        { admin: session.username, result }
      );
    }

    if (result.summary?.content_published === 0) {
      await sendErrorEmail(
        new Error('No content published'),
        { admin: session.username, result }
      );
    }

    await createClient(supabaseUrl, supabaseServiceKey)
      .from('admin_activity_logs')
      .insert({
        admin_id: session.adminId,
        action: 'TRIGGER_AUTOMATION',
        resource_type: 'automation',
        details: {
          result: result.summary,
          success: result.success,
        },
        ip_address: (req.headers['x-forwarded-for'] || req.headers['x-real-ip'] || 'unknown') as string,
      });

    return res.status(200).json(result);

  } catch (error: any) {
    console.error('Automation API error:', error);

    await sendErrorEmail(error, {
      endpoint: '/api/automation/run',
      method: req.method,
      error: error.message,
      stack: error.stack,
    });

    return res.status(500).json({
      success: false,
      error: error.message || 'Internal server error',
    });
  }
}
