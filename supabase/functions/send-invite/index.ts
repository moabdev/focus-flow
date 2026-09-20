// Supabase Edge Function: send-invite
// Deploy via: supabase functions deploy send-invite
// Suporta Brevo (300 e-mails/dia = 9.000/mês) e Resend (3.000/mês)

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
      provider = 'brevo',
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

    // 1. Brevo (300 e-mails/dia = 9.000/mês)
    if (provider === 'brevo') {
      const brevoKey = apiKey || Deno.env.get('BREVO_API_KEY');
      if (!brevoKey) {
        return new Response(JSON.stringify({ error: 'BREVO_API_KEY não configurada.' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const res = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
          accept: 'application/json',
          'api-key': brevoKey,
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          sender: {
            name: senderName || 'FocusFlow',
            email: senderEmail || 'support@focusflow.app',
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
    }

    // 2. Resend (3.000 e-mails/mês)
    if (provider === 'resend') {
      const resendKey = apiKey || Deno.env.get('RESEND_API_KEY');
      if (!resendKey) {
        return new Response(JSON.stringify({ error: 'RESEND_API_KEY não configurada.' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${resendKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: `${senderName || 'FocusFlow'} <${senderEmail || 'onboarding@resend.dev'}>`,
          to: [to],
          subject: subject,
          html: htmlContent,
        }),
      });

      const resData = await res.json();
      if (!res.ok) {
        return new Response(JSON.stringify({ error: resData.message || 'Erro no Resend' }), {
          status: res.status,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      return new Response(JSON.stringify({ success: true, id: resData.id }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'Provedor não suportado' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err?.message || 'Erro interno' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
