import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // Cron Job 보안 검증
  if (req.headers['authorization'] !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const supabaseUrl = process.env.VITE_SUPABASE_URL!;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

    // Supabase Edge Function 호출
    const response = await fetch(
      `${supabaseUrl}/functions/v1/scheduled-daily-content`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Edge Function 실행 실패');
    }

    return res.status(200).json({
      success: true,
      message: '매일 새벽 3시 자동화 실행 완료',
      data: data,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Cron Job Error:', error);

    // 에러 발생 시 이메일 알림
    try {
      const supabaseUrl = process.env.VITE_SUPABASE_URL!;
      const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

      await fetch(`${supabaseUrl}/functions/v1/send-alert-email`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subject: '🚨 Cron Job 실행 실패',
          message: `Vercel Cron Job에서 오류가 발생했습니다.\n\n${error.message}\n\n${error.stack || ''}`,
          priority: 'critical',
        }),
      });
    } catch (emailError) {
      console.error('이메일 전송 실패:', emailError);
    }

    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
}
