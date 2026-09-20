// Supabase Edge Function: send-invite
// Provedor Exclusivo: Brevo (300 e-mails/dia = 9.000/mês 100% grátis)
// Deploy via: supabase functions deploy send-invite

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const data = await req.json();
    const {
      apiKey,
      senderEmail,
      senderName,
      to,
      subject,
      htmlContent,
    } = data;

    if (!to) {
      return new Response(JSON.stringify({ error: 'Destinatário (to) obrigatório.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const brevoKey =
      apiKey || Deno.env.get('VITE_BREVO_API_KEY') || Deno.env.get('BREVO_API_KEY');

    if (!brevoKey) {
      return new Response(
        JSON.stringify({ error: 'BREVO_API_KEY não configurada no ambiente.' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const finalSenderEmail =
      senderEmail ||
      Deno.env.get('VITE_BREVO_SENDER_EMAIL') ||
      Deno.env.get('BREVO_SENDER_EMAIL') ||
      'support@focusflow.app';

    const finalSenderName =
      senderName ||
      Deno.env.get('VITE_BREVO_SENDER_NAME') ||
      Deno.env.get('BREVO_SENDER_NAME') ||
      'FocusFlow';

    const res = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        accept: 'application/json',
        'api-key': brevoKey,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        sender: {
          name: finalSenderName,
          email: finalSenderEmail,
        },
        to: [{ email: to }],
        subject: subject || 'Convite para sala de estudos no FocusFlow',
        htmlContent: htmlContent,
      }),
    });

    const resData = await res.json();
    if (!res.ok) {
      return new Response(JSON.stringify({ error: resData.message || 'Erro no Brevo' }), {
        status: res.status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ success: true, messageId: resData.messageId }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err?.message || 'Erro interno' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
