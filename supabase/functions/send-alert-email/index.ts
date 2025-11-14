import { createClient } from 'npm:@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

const ADMIN_EMAIL = 'pcpc233@gmail.com';

interface EmailRequest {
  to?: string;
  subject: string;
  message?: string;
  body?: string;
  priority?: 'high' | 'normal' | 'critical';
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!authHeader || !authHeader.includes(serviceKey!)) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized: Service key required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const emailData: EmailRequest = await req.json();
    const recipient = emailData.to || ADMIN_EMAIL;
    const emailBody = emailData.body || emailData.message || '';

    console.log(`Sending alert email to ${recipient}: ${emailData.subject}`);

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabase = createClient(supabaseUrl, serviceKey!);

    await supabase.from('alert_email_queue').insert({
      recipient,
      subject: emailData.subject,
      body: emailBody,
      priority: emailData.priority || 'high',
      sent: false,
      created_at: new Date().toISOString(),
    });

    try {
      const resendApiKey = Deno.env.get('RESEND_API_KEY');
      
      if (resendApiKey) {
        const resendResponse = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${resendApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: 'BusTime <onboarding@resend.dev>',
            to: [recipient],
            subject: emailData.subject,
            text: emailBody,
          }),
        });

        const responseData = await resendResponse.json();
        console.log('Resend API response:', JSON.stringify(responseData));

        if (resendResponse.ok) {
          await supabase
            .from('alert_email_queue')
            .update({ sent: true, sent_at: new Date().toISOString() })
            .eq('recipient', recipient)
            .eq('subject', emailData.subject)
            .order('created_at', { ascending: false })
            .limit(1);

          console.log('Email sent successfully via Resend');
        } else {
          console.error('Resend API error:', JSON.stringify(responseData));
          await supabase
            .from('alert_email_queue')
            .update({ error_message: JSON.stringify(responseData) })
            .eq('recipient', recipient)
            .eq('subject', emailData.subject)
            .order('created_at', { ascending: false })
            .limit(1);
        }
      } else {
        console.warn('RESEND_API_KEY not configured, email queued but not sent');
      }
    } catch (sendError) {
      console.error('Email send error (queued for retry):', sendError);
    }

    return new Response(
      JSON.stringify({ success: true, message: 'Alert queued and sent' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Alert email error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
