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
    const { recoveryCode, newPassword } = await req.json();

    if (!recoveryCode || !newPassword) {
      return new Response(
        JSON.stringify({ success: false, error: '복구 코드와 새 비밀번호를 입력하세요' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    if (newPassword.length < 8) {
      return new Response(
        JSON.stringify({ success: false, error: '비밀번호는 8자 이상이어야 합니다' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: recovery, error } = await supabase
      .from('admin_recovery_codes')
      .select('*')
      .eq('recovery_code', recoveryCode)
      .eq('is_used', false)
      .gt('expires_at', new Date().toISOString())
      .maybeSingle();

    if (error || !recovery) {
      return new Response(
        JSON.stringify({ success: false, error: '유효하지 않거나 만료된 복구 코드입니다' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const passwordHash = await hashPassword(newPassword);

    const { error: updateError } = await supabase
      .from('admin_users')
      .update({
        password_hash: passwordHash,
        updated_at: new Date().toISOString(),
      })
      .eq('id', recovery.admin_id);

    if (updateError) {
      console.error('Failed to update password:', updateError);
      return new Response(
        JSON.stringify({ success: false, error: '비밀번호 업데이트 실패' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    await supabase
      .from('admin_recovery_codes')
      .update({ is_used: true })
      .eq('id', recovery.id);

    await supabase.from('admin_activity_logs').insert({
      admin_id: recovery.admin_id,
      action: 'PASSWORD_RESET_SUCCESS',
      resource_type: 'auth',
      details: { recovery_code_used: recoveryCode },
    });

    const { data: admin } = await supabase
      .from('admin_users')
      .select('email')
      .eq('id', recovery.admin_id)
      .maybeSingle();

    if (admin?.email) {
      await fetch(`${supabaseUrl}/functions/v1/send-alert-email`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: admin.email,
          subject: '[bustime.site] 비밀번호 변경 완료',
          body: '보안상 중요한 알림입니다.\n\n귀하의 bustime.site 관리자 계정 비밀번호가 방금 변경되었습니다.\n\n이 변경을 요청하지 않으셨다면 즉시 pcpc233@gmail.com으로 연락주세요.',
        }),
      });
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: '비밀번호가 성공적으로 변경되었습니다',
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error: any) {
    console.error('Password reset error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});