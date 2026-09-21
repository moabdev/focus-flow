import { CalendarEvent } from '@/features/core/types';

/** Estrutura retornada pela Google Calendar API para um evento */
interface GoogleCalendarEventResource {
  id: string;
  summary?: string;
  description?: string;
  start: { dateTime?: string; date?: string };
  end: { dateTime?: string; date?: string };
  colorId?: string;
  status?: string;
  htmlLink?: string;
}

interface GoogleCalendarListResponse {
  items: GoogleCalendarEventResource[];
  nextPageToken?: string;
}

const GOOGLE_CALENDAR_API_BASE = 'https://www.googleapis.com/calendar/v3';

/**
 * Busca o access token do Google da sessão Supabase OAuth.
 * Funciona quando o usuário está autenticado via Supabase com provider "google".
 */
export const getGoogleAccessToken = async (): Promise<string | null> => {
  try {
    const { supabaseService } = await import('@/features/core/api/supabase');
    const client = supabaseService.getClient();
    if (!client) return null;

    const { data } = await client.auth.getSession();
    const token = data?.session?.provider_token || null;
    return token;
  } catch {
    return null;
  }
};

/**
 * Verifica se o usuário está autenticado com Google OAuth (tem provider_token).
 */
export const isGoogleCalendarConnected = async (): Promise<boolean> => {
  const token = await getGoogleAccessToken();
  return token !== null;
};

/**
 * Busca eventos do Google Calendar primário do usuário.
 * @param accessToken - Token OAuth do Google
 * @param timeMin - Data de início (ISO string)
 * @param timeMax - Data de fim (ISO string)
 */
export const fetchGoogleCalendarEvents = async (
  accessToken: string,
  timeMin: string,
  timeMax: string
): Promise<CalendarEvent[]> => {
  const params = new URLSearchParams({
    calendarId: 'primary',
    timeMin,
    timeMax,
    singleEvents: 'true',
    orderBy: 'startTime',
    maxResults: '250',
  });

  const response = await fetch(
    `${GOOGLE_CALENDAR_API_BASE}/calendars/primary/events?${params.toString()}`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    }
  );

  if (!response.ok) {
    const err = await response.json();
    throw new Error(`Google Calendar API error: ${err?.error?.message || response.statusText}`);
  }

  const data: GoogleCalendarListResponse = await response.json();

  return (data.items || [])
    .filter((item) => item.status !== 'cancelled')
    .map((item): CalendarEvent => {
      const startStr = item.start.dateTime || `${item.start.date}T09:00:00`;
      const endStr = item.end.dateTime || `${item.end.date}T10:00:00`;

      return {
        id: `google-${item.id}`,
        google_event_id: item.id,
        source: 'google',
        title: item.summary || '(Sem título)',
        description: item.description,
        start_time: startStr,
        end_time: endStr,
        color: '#4285F4', // azul Google
        is_completed: false,
      };
    });
};

/**
 * Cria um evento no Google Calendar primário do usuário.
 * @param accessToken - Token OAuth do Google
 * @param event - Evento do FocusFlow para exportar
 * @returns ID do evento criado no Google Calendar
 */
export const createGoogleCalendarEvent = async (
  accessToken: string,
  event: CalendarEvent
): Promise<string> => {
  const body = {
    summary: event.title,
    description: event.description || 'Criado pelo FocusFlow',
    start: {
      dateTime: event.start_time.includes('T')
        ? event.start_time
        : `${event.start_time}T09:00:00`,
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    },
    end: {
      dateTime: event.end_time.includes('T')
        ? event.end_time
        : `${event.end_time}T10:00:00`,
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    },
    colorId: '11', // Vermelho-tomate, próximo ao ruby do FocusFlow
  };

  const response = await fetch(
    `${GOOGLE_CALENDAR_API_BASE}/calendars/primary/events`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    }
  );

  if (!response.ok) {
    const err = await response.json();
    throw new Error(`Falha ao criar evento no Google Calendar: ${err?.error?.message || response.statusText}`);
  }

  const created: GoogleCalendarEventResource = await response.json();
  return created.id;
};

/**
 * Remove um evento do Google Calendar.
 */
export const deleteGoogleCalendarEvent = async (
  accessToken: string,
  googleEventId: string
): Promise<void> => {
  const response = await fetch(
    `${GOOGLE_CALENDAR_API_BASE}/calendars/primary/events/${googleEventId}`,
    {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!response.ok && response.status !== 410) {
    // 410 = already deleted (Gone), we can ignore it
    throw new Error(`Falha ao deletar evento do Google Calendar: ${response.statusText}`);
  }
};
