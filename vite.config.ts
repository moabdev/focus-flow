import { defineConfig, Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';

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
              apiKey,
              senderEmail,
              senderName,
              to,
              subject,
              htmlContent,
            } = data;

            const brevoKey =
              apiKey || process.env.VITE_BREVO_API_KEY || process.env.BREVO_API_KEY;

            if (!brevoKey) {
              res.statusCode = 400;
              res.setHeader('Content-Type', 'application/json');
              res.end(
                JSON.stringify({
                  error: 'Chave de API do Brevo não configurada no .env (VITE_BREVO_API_KEY).',
                })
              );
              return;
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
              res.statusCode = brevoRes.status;
              res.setHeader('Content-Type', 'application/json');
              res.end(
                JSON.stringify({
                  error: resJson.message || resText || 'Erro na API do Brevo',
                })
              );
              return;
            }

            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ success: true, messageId: resJson.messageId }));
          } catch (err: any) {
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(
              JSON.stringify({
                error: err?.message || 'Erro interno no servidor de e-mail',
              })
            );
          }
        });
      });
    },
  };
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), emailApiPlugin()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    port: 5173,
    host: true,
  },
  build: {
    target: 'esnext',
    cssCodeSplit: true,
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom'],
          'vendor-supabase': ['@supabase/supabase-js'],
          'vendor-icons': ['lucide-react'],
        },
      },
    },
  },
});
