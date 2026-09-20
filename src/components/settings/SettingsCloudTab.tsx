import React, { useState } from 'react';
import { LogOut, Mail, ChevronDown, ChevronUp, Save, Check } from 'lucide-react';
import { SupabaseProfile } from '../../types';
import { emailService, EmailServiceConfig } from '../../services/emailService';

interface SettingsCloudTabProps {
  userProfile: SupabaseProfile | null;
  onGoogleLogin: () => void;
  onSignOut: () => void;
  onSyncToCloud: () => void;
  syncStatus: string | null;
}

export const SettingsCloudTab: React.FC<SettingsCloudTabProps> = ({
  userProfile,
  onGoogleLogin,
  onSignOut,
  onSyncToCloud,
  syncStatus,
}) => {
  const [emailConfig, setEmailConfig] = useState<EmailServiceConfig>(() => emailService.getConfig());
  const [showEmailSettings, setShowEmailSettings] = useState(false);
  const [savedEmailMsg, setSavedEmailMsg] = useState(false);

  const handleSaveEmailConfig = (e: React.FormEvent) => {
    e.preventDefault();
    emailService.saveConfig(emailConfig);
    setSavedEmailMsg(true);
    setTimeout(() => setSavedEmailMsg(false), 3000);
  };

  return (
    <>
      <div className="cloud-info-card">
        <div className="cloud-info-header">
          <div className="cloud-status-indicator">
            <span className="status-dot online" />
            <strong>Supabase Cloud Ativo</strong>
          </div>
          <span className="cloud-db-badge">PostgreSQL</span>
        </div>
        <p
          style={{
            fontSize: '0.85rem',
            color: 'var(--text-secondary)',
            margin: '0.5rem 0 0 0',
            lineHeight: 1.5,
          }}
        >
          Suas tarefas, disciplinas e histórico de foco são sincronizados de forma segura no banco
          de dados na nuvem com criptografia e isolamento de dados por usuário (Row Level Security).
        </p>
      </div>

      {userProfile ? (
        <div className="cloud-user-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            {userProfile.avatar_url ? (
              <img
                src={userProfile.avatar_url}
                alt="Avatar"
                style={{ width: '42px', height: '42px', borderRadius: '50%' }}
              />
            ) : (
              <div
                className="brand-logo-icon"
                style={{ width: '42px', height: '42px', fontSize: '1.1rem' }}
              >
                {userProfile.full_name?.charAt(0) || 'U'}
              </div>
            )}
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{userProfile.full_name}</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{userProfile.email}</div>
            </div>
          </div>
          <button
            className="icon-btn"
            onClick={onSignOut}
            title="Desconectar Conta"
            aria-label="Desconectar Conta"
          >
            <LogOut size={16} />
          </button>
        </div>
      ) : (
        <div style={{ textAlign: 'center', padding: '1rem 0' }}>
          <button className="google-login-btn-lg" onClick={onGoogleLogin}>
            <svg className="google-icon-svg" viewBox="0 0 24 24" width="20" height="20">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>Entrar com o Google</span>
          </button>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.75rem' }}>
            Faça login com sua conta Google para salvar seu progresso e acessar de qualquer lugar.
          </div>
        </div>
      )}

      {userProfile && (
        <button
          className="filter-chip"
          style={{ width: '100%', padding: '0.75rem', fontWeight: 700, justifyContent: 'center' }}
          onClick={onSyncToCloud}
        >
          ☁️ Enviar Tarefas & Histórico Locais para a Nuvem
        </button>
      )}

      {syncStatus && (
        <div style={{ fontSize: '0.85rem', color: '#10b981', textAlign: 'center', fontWeight: 600 }}>
          {syncStatus}
        </div>
      )}

      {/* Seção de Configuração do Serviço de E-mail (Brevo / Resend / EmailJS / API) */}
      <div className="glass-card" style={{ marginTop: '1.25rem', padding: '1rem' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            cursor: 'pointer',
          }}
          onClick={() => setShowEmailSettings((prev) => !prev)}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Mail size={16} color="var(--accent-primary)" />
            <div>
              <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>
                Serviço de E-mail ({emailConfig.provider === 'brevo' ? 'Brevo 300/dia' : emailConfig.provider === 'resend' ? 'Resend 3.000/mês' : emailConfig.provider === 'emailjs' ? 'EmailJS' : 'Provedor'})
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                {emailService.isConfigured() ? 'Provedor conectado' : 'Modo envio direto pronto'} • {emailService.getDailyUsage().count}/{emailService.getDailyUsage().limit} hoje
              </div>
            </div>
          </div>
          {showEmailSettings ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </div>

        {showEmailSettings && (
          <form onSubmit={handleSaveEmailConfig} style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {/* Seletor de Provedor */}
            <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap', marginBottom: '0.25rem' }}>
              {[
                { id: 'brevo', label: '🏆 Brevo (300/dia)', desc: '9.000/mês grátis' },
                { id: 'resend', label: '⚡ Resend', desc: '3.000/mês grátis' },
                { id: 'custom_api', label: '☁️ API / Supabase', desc: 'Endpoint próprio' },
                { id: 'emailjs', label: '📧 EmailJS', desc: '200/mês' },
              ].map((p) => {
                const active = (emailConfig.provider || 'brevo') === p.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setEmailConfig({ ...emailConfig, provider: p.id as any })}
                    style={{
                      flex: '1 1 45%',
                      padding: '0.45rem 0.5rem',
                      borderRadius: '6px',
                      border: `1px solid ${active ? 'var(--accent-primary)' : 'rgba(255, 255, 255, 0.1)'}`,
                      backgroundColor: active ? 'rgba(252, 0, 56, 0.1)' : 'transparent',
                      color: active ? 'var(--accent-primary)' : 'var(--text-secondary)',
                      fontSize: '0.78rem',
                      fontWeight: active ? 700 : 500,
                      cursor: 'pointer',
                      textAlign: 'center',
                    }}
                  >
                    <div>{p.label}</div>
                    <div style={{ fontSize: '0.65rem', opacity: 0.8 }}>{p.desc}</div>
                  </button>
                );
              })}
            </div>

            {/* Banner de Cota */}
            {(() => {
              const usage = emailService.getDailyUsage();
              return (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.5rem 0.75rem',
                    backgroundColor: 'rgba(252, 0, 56, 0.05)',
                    borderRadius: '6px',
                    border: '1px solid rgba(252, 0, 56, 0.15)',
                    fontSize: '0.8rem',
                  }}
                >
                  <span>⚡ Cota: <strong>{usage.count}/{usage.limit}</strong> envios hoje</span>
                  <span style={{ color: usage.remaining > 20 ? '#10b981' : '#f59e0b', fontWeight: 600 }}>
                    {usage.remaining} restantes hoje
                  </span>
                </div>
              );
            })()}

            {/* Campos Brevo */}
            {(emailConfig.provider === 'brevo' || !emailConfig.provider) && (
              <>
                <p style={{ fontSize: '0.76rem', color: 'var(--text-muted)', margin: 0, lineHeight: 1.4 }}>
                  <strong>Brevo (antigo Sendinblue)</strong> oferece <strong>300 e-mails grátis por dia</strong> (~9.000/mês). Crie sua conta em brevo.com e gere sua chave em <em>SMTP & API</em>.
                </p>
                <div className="form-group">
                  <label className="form-label" style={{ fontSize: '0.78rem' }}>Chave de API do Brevo (API Key)</label>
                  <input
                    type="password"
                    className="modal-input"
                    placeholder="xkeysib-..."
                    value={emailConfig.brevoApiKey || ''}
                    onChange={(e) => setEmailConfig({ ...emailConfig, brevoApiKey: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label" style={{ fontSize: '0.78rem' }}>E-mail do Remetente (Cadastrado no Brevo)</label>
                  <input
                    type="email"
                    className="modal-input"
                    placeholder="seu-email-verificado@gmail.com"
                    value={emailConfig.brevoSenderEmail || ''}
                    onChange={(e) => setEmailConfig({ ...emailConfig, brevoSenderEmail: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label" style={{ fontSize: '0.78rem' }}>Nome de Exibição do Remetente</label>
                  <input
                    type="text"
                    className="modal-input"
                    placeholder="FocusFlow Estudos"
                    value={emailConfig.brevoSenderName || ''}
                    onChange={(e) => setEmailConfig({ ...emailConfig, brevoSenderName: e.target.value })}
                  />
                </div>
              </>
            )}

            {/* Campos Resend */}
            {emailConfig.provider === 'resend' && (
              <>
                <p style={{ fontSize: '0.76rem', color: 'var(--text-muted)', margin: 0, lineHeight: 1.4 }}>
                  <strong>Resend</strong> oferece <strong>3.000 e-mails por mês</strong> (100 por dia). Obtenha sua chave em resend.com/api-keys.
                </p>
                <div className="form-group">
                  <label className="form-label" style={{ fontSize: '0.78rem' }}>Chave de API do Resend</label>
                  <input
                    type="password"
                    className="modal-input"
                    placeholder="re_..."
                    value={emailConfig.resendApiKey || ''}
                    onChange={(e) => setEmailConfig({ ...emailConfig, resendApiKey: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label" style={{ fontSize: '0.78rem' }}>E-mail Remetente (Resend)</label>
                  <input
                    type="text"
                    className="modal-input"
                    placeholder="onboarding@resend.dev ou seu dominio"
                    value={emailConfig.resendSenderEmail || ''}
                    onChange={(e) => setEmailConfig({ ...emailConfig, resendSenderEmail: e.target.value })}
                  />
                </div>
              </>
            )}

            {/* Campos API Customizada ou Supabase Function */}
            {emailConfig.provider === 'custom_api' && (
              <>
                <p style={{ fontSize: '0.76rem', color: 'var(--text-muted)', margin: 0, lineHeight: 1.4 }}>
                  Dispare para uma Edge Function do Supabase (<code>/functions/v1/send-invite</code>), Make, n8n ou servidor próprio.
                </p>
                <div className="form-group">
                  <label className="form-label" style={{ fontSize: '0.78rem' }}>URL do Endpoint / Webhook</label>
                  <input
                    type="url"
                    className="modal-input"
                    placeholder="https://sua-api.com/send-invite"
                    value={emailConfig.customApiUrl || ''}
                    onChange={(e) => setEmailConfig({ ...emailConfig, customApiUrl: e.target.value })}
                  />
                </div>
              </>
            )}

            {/* Campos EmailJS */}
            {emailConfig.provider === 'emailjs' && (
              <>
                <p style={{ fontSize: '0.76rem', color: 'var(--text-muted)', margin: 0, lineHeight: 1.4 }}>
                  EmailJS tem cota de <strong>200 e-mails/mês</strong> no plano gratuito:
                </p>
                <div className="form-group">
                  <label className="form-label" style={{ fontSize: '0.78rem' }}>EmailJS Service ID</label>
                  <input
                    type="text"
                    className="modal-input"
                    placeholder="service_xxxxx"
                    value={emailConfig.serviceId || ''}
                    onChange={(e) => setEmailConfig({ ...emailConfig, serviceId: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label" style={{ fontSize: '0.78rem' }}>EmailJS Template ID</label>
                  <input
                    type="text"
                    className="modal-input"
                    placeholder="template_xxxxx"
                    value={emailConfig.templateId || ''}
                    onChange={(e) => setEmailConfig({ ...emailConfig, templateId: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label" style={{ fontSize: '0.78rem' }}>EmailJS Public Key</label>
                  <input
                    type="text"
                    className="modal-input"
                    placeholder="public_key_xxxxx"
                    value={emailConfig.publicKey || ''}
                    onChange={(e) => setEmailConfig({ ...emailConfig, publicKey: e.target.value })}
                  />
                </div>
              </>
            )}

            <button
              type="submit"
              className="btn btn-primary"
              style={{
                width: '100%',
                padding: '0.65rem',
                fontWeight: 600,
                marginTop: '0.25rem',
                justifyContent: 'center',
              }}
            >
              Salvar Configurações de E-mail
            </button>

            {savedEmailMsg && (
              <div style={{ fontSize: '0.8rem', color: '#10b981', textAlign: 'center', fontWeight: 600 }}>
                ✓ Configurações de e-mail salvas com sucesso!
              </div>
            )}
          </form>
        )}
      </div>
    </>
  );
};
