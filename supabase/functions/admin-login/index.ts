import { createClient } from 'npm:@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password + 'bustime-salt-2025');
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const { username, password, ipAddress, userAgent } = await req.json();

    if (!username || !password) {
      return new Response(
        JSON.stringify({ success: false, error: '아이디와 비밀번호를 입력하세요' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: admin, error } = await supabase
      .from('admin_users')
      .select('*')
      .eq('username', username)
      .eq('is_active', true)
      .maybeSingle();

    if (error || !admin) {
      await supabase.from('admin_activity_logs').insert({
        admin_id: null,
        action: 'LOGIN_FAILED',
        resource_type: 'auth',
        details: { username, reason: 'user_not_found' },
        ip_address: ipAddress,
      });

      return new Response(
        JSON.stringify({ success: false, error: '아이디 또는 비밀번호가 틀렸습니다' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const passwordHash = await hashPassword(password);
    const passwordMatch = passwordHash === admin.password_hash;

    if (!passwordMatch) {
      await supabase.from('admin_activity_logs').insert({
        admin_id: admin.id,
        action: 'LOGIN_FAILED',
        resource_type: 'auth',
        details: { reason: 'wrong_password' },
        ip_address: ipAddress,
      });

      return new Response(
        JSON.stringify({ success: false, error: '아이디 또는 비밀번호가 틀렸습니다' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const sessionToken = crypto.randomUUID();
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    await supabase.from('admin_sessions').insert({
      admin_id: admin.id,
      session_token: sessionToken,
      ip_address: ipAddress,
      user_agent: userAgent,
      expires_at: expiresAt.toISOString(),
    });

    await supabase.from('admin_users').update({
      last_login_at: new Date().toISOString(),
    }).eq('id', admin.id);

    await supabase.from('admin_activity_logs').insert({
      admin_id: admin.id,
      action: 'LOGIN_SUCCESS',
      resource_type: 'auth',
      details: { username },
      ip_address: ipAddress,
    });

    return new Response(
      JSON.stringify({
        success: true,
        sessionToken,
        admin: {
          id: admin.id,
          username: admin.username,
          email: admin.email,
        },
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});