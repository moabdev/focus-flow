import { CalendarEvent } from '@/features/core/types';

interface MicrosoftCalendarEventResource {
  id: string;
  subject?: string;
  bodyPreview?: string;
  start: { dateTime?: string; timeZone?: string };
  end: { dateTime?: string; timeZone?: string };
  webLink?: string;
}

interface MicrosoftCalendarListResponse {
  value: MicrosoftCalendarEventResource[];
}

export interface MicrosoftCalendarResource {
  id: string;
  name: string;
  color?: string;
  hexColor?: string;
  isDefaultCalendar?: boolean;
  canEdit?: boolean;
}

interface MicrosoftCalendarsResponse {
  value: MicrosoftCalendarResource[];
}

const MICROSOFT_GRAPH_API_BASE = 'https://graph.microsoft.com/v1.0';

/**
 * Busca o access token da Microsoft da sessão Supabase OAuth.
 * Funciona quando o usuário está autenticado via Supabase com provider "azure".
 */
export const getMicrosoftAccessToken = async (): Promise<string | null> => {
  try {
    const { supabaseService } = await import('@/features/core/api/supabase');
    const client = supabaseService.getClient();
    if (!client) return null;

    const { data } = await client.auth.getSession();
    if (data?.session?.user.app_metadata.provider !== 'azure') return null;
    const token = data?.session?.provider_token || null;
    return token;
  } catch {
    return null;
  }
};

/**
 * Verifica se o usuário está autenticado com Microsoft OAuth (tem provider_token e provider azure).
 */
export const isOutlookCalendarConnected = async (): Promise<boolean> => {
  const token = await getMicrosoftAccessToken();
  return token !== null;
};

/**
 * Busca a lista de todos os calendários do Outlook do usuário.
 * @param accessToken - Token OAuth da Microsoft
 */
export const fetchOutlookCalendars = async (accessToken: string): Promise<MicrosoftCalendarResource[]> => {
  const response = await fetch(`${MICROSOFT_GRAPH_API_BASE}/me/calendars`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(`Failed to fetch Outlook calendars: ${err?.error?.message || response.statusText}`);
  }

  const data: MicrosoftCalendarsResponse = await response.json();
  return data.value || [];
};

/**
 * Busca eventos do Outlook Calendar padrão do usuário ou de calendários específicos.
 * @param accessToken - Token OAuth da Microsoft
 * @param timeMin - Data de início (ISO string)
 * @param timeMax - Data de fim (ISO string)
 * @param calendarIds - Lista de IDs de calendários para buscar (opcional)
 */
export const fetchOutlookCalendarEvents = async (
  accessToken: string,
  timeMin: string,
  timeMax: string,
  calendarIds?: string[]
): Promise<CalendarEvent[]> => {
  const params = new URLSearchParams({
    startDateTime: timeMin,
    endDateTime: timeMax,
    $top: '250',
    $orderby: 'start/dateTime',
  });

  const fetchEventsForCalendar = async (calendarId?: string): Promise<MicrosoftCalendarEventResource[]> => {
    const url = calendarId 
      ? `${MICROSOFT_GRAPH_API_BASE}/me/calendars/${calendarId}/calendarview?${params.toString()}`
      : `${MICROSOFT_GRAPH_API_BASE}/me/calendarview?${params.toString()}`;

    try {
      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        console.warn(`Failed to fetch events for calendar ${calendarId || 'default'}: ${response.statusText}`);
        return [];
      }

      const data: MicrosoftCalendarListResponse = await response.json();
      return data.value || [];
    } catch (err) {
      console.warn(`Error fetching events for calendar ${calendarId || 'default'}:`, err);
      return [];
    }
  };

  let allEvents: MicrosoftCalendarEventResource[] = [];

  if (!calendarIds || calendarIds.length === 0) {
    allEvents = await fetchEventsForCalendar();
  } else {
    const results = await Promise.all(calendarIds.map(id => fetchEventsForCalendar(id)));
    allEvents = results.flat();
  }

  // Deduplicate by ID just in case
  const uniqueEventsMap = new Map<string, MicrosoftCalendarEventResource>();
  allEvents.forEach(e => uniqueEventsMap.set(e.id, e));
  const uniqueEvents = Array.from(uniqueEventsMap.values());

  return uniqueEvents.map((item): CalendarEvent => {
    // Microsoft Graph retorna dateTime em UTC sem o Z no final se for especificado timeZone, mas geralmente vem como UTC.
    // Vamos garantir o formato compatível com FocusFlow.
    const startStr = item.start.dateTime ? `${item.start.dateTime.split('.')[0]}Z` : new Date().toISOString();
    const endStr = item.end.dateTime ? `${item.end.dateTime.split('.')[0]}Z` : new Date().toISOString();

    return {
      id: `outlook-${item.id}`,
      outlook_event_id: item.id,
      source: 'outlook',
      title: item.subject || '(Sem título)',
      description: item.bodyPreview,
      start_time: startStr,
      end_time: endStr,
      color: '#0078D4', // azul Outlook
      is_completed: false,
    };
  });
};

/**
 * Cria um evento no Outlook Calendar padrão do usuário.
 * @param accessToken - Token OAuth da Microsoft
 * @param event - Evento do FocusFlow para exportar
 * @returns ID do evento criado no Outlook Calendar
 */
export const createOutlookCalendarEvent = async (
  accessToken: string,
  event: CalendarEvent
): Promise<string> => {
  const body = {
    subject: event.title,
    body: {
      contentType: 'HTML',
      content: event.description || 'Criado pelo FocusFlow',
    },
    start: {
      dateTime: event.start_time.includes('T') ? event.start_time : `${event.start_time}T09:00:00`,
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    },
    end: {
      dateTime: event.end_time.includes('T') ? event.end_time : `${event.end_time}T10:00:00`,
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    },
  };

  const response = await fetch(
    `${MICROSOFT_GRAPH_API_BASE}/me/events`,
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
    throw new Error(`Falha ao criar evento no Outlook Calendar: ${err?.error?.message || response.statusText}`);
  }

  const created: MicrosoftCalendarEventResource = await response.json();
  return created.id;
};

/**
 * Remove um evento do Outlook Calendar.
 */
export const deleteOutlookCalendarEvent = async (
  accessToken: string,
  outlookEventId: string
): Promise<void> => {
  const response = await fetch(
    `${MICROSOFT_GRAPH_API_BASE}/me/events/${outlookEventId}`,
    {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!response.ok && response.status !== 404 && response.status !== 410) {
    throw new Error(`Falha ao deletar evento do Outlook Calendar: ${response.statusText}`);
  }
};

/**
 * Atualiza um evento existente no Outlook Calendar.
 * @param accessToken - Token OAuth da Microsoft
 * @param outlookEventId - ID do evento no Outlook Calendar
 * @param event - Dados atualizados do evento
 */
export const updateOutlookCalendarEvent = async (
  accessToken: string,
  outlookEventId: string,
  event: CalendarEvent
): Promise<void> => {
  const body = {
    subject: event.title,
    body: {
      contentType: 'HTML',
      content: event.description || 'Atualizado pelo FocusFlow',
    },
    start: {
      dateTime: event.start_time.includes('T') ? event.start_time : `${event.start_time}T09:00:00`,
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    },
    end: {
      dateTime: event.end_time.includes('T') ? event.end_time : `${event.end_time}T10:00:00`,
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    },
  };

  const response = await fetch(
    `${MICROSOFT_GRAPH_API_BASE}/me/events/${outlookEventId}`,
    {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    }
  );

  if (!response.ok) {
    const err = await response.json();
    throw new Error(`Falha ao atualizar evento no Outlook Calendar: ${err?.error?.message || response.statusText}`);
  }
};
