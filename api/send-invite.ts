// Vercel Serverless Function: /api/send-invite
// Provedor Exclusivo: Brevo (300 e-mails/dia = 9.000/mês 100% grátis)

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

    const brevoKey =
      apiKey || process.env.VITE_BREVO_API_KEY || process.env.BREVO_API_KEY;

    if (!brevoKey) {
      return res.status(400).json({
        error: 'Chave de API do Brevo não configurada no .env (VITE_BREVO_API_KEY).',
      });
    }

    const finalSenderEmail =
      senderEmail ||
      process.env.VITE_BREVO_SENDER_EMAIL ||
      process.env.BREVO_SENDER_EMAIL ||
      'support@focusflow.app';

    const finalSenderName =
      senderName ||
      process.env.VITE_BREVO_SENDER_NAME ||
      process.env.BREVO_SENDER_NAME ||
      'FocusFlow';

    const brevoRes = await fetch('https://api.brevo.com/v3/smtp/email', {
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

    const resText = await brevoRes.text();
    let resJson: any = {};
    try {
      resJson = JSON.parse(resText);
    } catch {}

    if (!brevoRes.ok) {
      return res
        .status(brevoRes.status)
        .json({ error: resJson.message || resText || 'Erro ao enviar e-mail via Brevo.' });
    }

    return res.status(200).json({ success: true, messageId: resJson.messageId });
  } catch (err: any) {
    return res
      .status(500)
      .json({ error: err?.message || 'Erro interno ao processar envio de e-mail.' });
  }
}
