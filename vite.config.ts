import { defineConfig, Plugin } from 'vite';
import react from '@vitejs/plugin-react';

function emailApiPlugin(): Plugin {
  return {
    name: 'email-api-plugin',
    configureServer(server) {
      server.middlewares.use('/api/send-invite', async (req, res) => {
        if (req.method !== 'POST') {
          res.statusCode = 405;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: 'Método não permitido' }));
          return;
        }

        let body = '';
        req.on('data', (chunk) => {
          body += chunk;
        });

        req.on('end', async () => {
          try {
            const data = JSON.parse(body || '{}');
            const {
              provider = 'brevo',
              apiKey,
              senderEmail,
              senderName,
              to,
              subject,
              htmlContent,
            } = data;

            if (provider === 'brevo') {
              const brevoKey =
                apiKey || process.env.VITE_BREVO_API_KEY || process.env.BREVO_API_KEY;
              if (!brevoKey) {
                res.statusCode = 400;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ error: 'Chave de API do Brevo não configurada.' }));
                return;
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
                  subject: subject,
                  htmlContent: htmlContent,
                }),
              });

              const resText = await brevoRes.text();
              let resJson: any = {};
              try {
                resJson = JSON.parse(resText);
              } catch {}

              if (!brevoRes.ok) {
                res.statusCode = brevoRes.status;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ error: resJson.message || resText || 'Erro na API do Brevo' }));
                return;
              }

              res.statusCode = 200;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ success: true, messageId: resJson.messageId }));
              return;
            }

            if (provider === 'resend') {
              const resendKey =
                apiKey || process.env.VITE_RESEND_API_KEY || process.env.RESEND_API_KEY;
              if (!resendKey) {
                res.statusCode = 400;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ error: 'Chave de API do Resend não configurada.' }));
                return;
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
                  subject: subject,
                  html: htmlContent,
                }),
              });

              const resText = await resendRes.text();
              let resJson: any = {};
              try {
                resJson = JSON.parse(resText);
              } catch {}

              if (!resendRes.ok) {
                res.statusCode = resendRes.status;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ error: resJson.message || resText || 'Erro na API do Resend' }));
                return;
              }

              res.statusCode = 200;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ success: true, id: resJson.id }));
              return;
            }

            res.statusCode = 400;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: 'Provedor de e-mail não suportado' }));
          } catch (err: any) {
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: err?.message || 'Erro interno no servidor de e-mail' }));
          }
        });
      });
    },
  };
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), emailApiPlugin()],
  server: {
    port: 5173,
    host: true,
  },
});
