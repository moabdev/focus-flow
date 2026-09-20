// Vercel Serverless Function: /api/send-invite
// Suporta Brevo (300 e-mails/dia = 9.000/mês grátis) e Resend (3.000/mês grátis)

export default async function handler(req: any, res: any) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido. Use POST.' });
  }

  try {
    const {
      provider = 'brevo',
      apiKey,
      senderEmail,
      senderName,
      to,
      subject,
      htmlContent,
    } = req.body || {};

    if (!to) {
      return res.status(400).json({ error: 'Destinatário (to) é obrigatório.' });
    }

    // 1. Brevo (300 e-mails/dia = 9.000/mês grátis)
    if (provider === 'brevo') {
      const brevoKey =
        apiKey || process.env.VITE_BREVO_API_KEY || process.env.BREVO_API_KEY;

      if (!brevoKey) {
        return res
          .status(400)
          .json({ error: 'Chave de API do Brevo não configurada no servidor ou na requisição.' });
      }

      const brevoRes = await fetch('https://api.brevo.com/v3/smtp/email', {
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

      const resText = await brevoRes.text();
      let resJson: any = {};
      try {
        resJson = JSON.parse(resText);
      } catch {}

      if (!brevoRes.ok) {
        return res
          .status(brevoRes.status)
          .json({ error: resJson.message || resText || 'Erro ao enviar via Brevo.' });
      }

      return res.status(200).json({ success: true, messageId: resJson.messageId });
    }

    // 2. Resend (3.000 e-mails/mês grátis)
    if (provider === 'resend') {
      const resendKey =
        apiKey || process.env.VITE_RESEND_API_KEY || process.env.RESEND_API_KEY;

      if (!resendKey) {
        return res
          .status(400)
          .json({ error: 'Chave de API do Resend não configurada.' });
      }

      const resendRes = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${resendKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: `${senderName || 'FocusFlow'} <${senderEmail || 'onboarding@resend.dev'}>`,
          to: [to],
          subject: subject || 'Convite para sala de estudos no FocusFlow',
          html: htmlContent,
        }),
      });

      const resText = await resendRes.text();
      let resJson: any = {};
      try {
        resJson = JSON.parse(resText);
      } catch {}

      if (!resendRes.ok) {
        return res
          .status(resendRes.status)
          .json({ error: resJson.message || resText || 'Erro ao enviar via Resend.' });
      }

      return res.status(200).json({ success: true, id: resJson.id });
    }

    return res.status(400).json({ error: 'Provedor não suportado. Use "brevo" ou "resend".' });
  } catch (err: any) {
    return res
      .status(500)
      .json({ error: err?.message || 'Erro interno ao processar envio de e-mail.' });
  }
}
