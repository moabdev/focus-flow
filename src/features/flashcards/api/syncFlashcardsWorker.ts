import { SupabaseClient } from '@supabase/supabase-js';
import { storageService } from '@/features/core/api/storage';
import { mergeById } from '@/features/core/api/syncUtils';

export async function pushFlashcards(client: SupabaseClient, userId: string) {
  const localDecks = storageService.flashcardsService.getLocalDecks();
  for (const d of localDecks) {
    await client.from('flashcard_decks').upsert({
      id: d.id,
      user_id: userId,
      title: d.title,
      description: d.description || '',
      color: d.color,
      icon: d.icon,
      project_id: d.project_id || null,
      tags: d.tags || [],
      card_count: d.card_count || 0,
      due_count: d.due_count || 0,
      created_at: d.created_at,
      updated_at: d.updated_at,
    });
  }

  const localCards = storageService.flashcardsService.getLocalCards();
  for (const c of localCards) {
    await client.from('flashcards').upsert({
      id: c.id,
      deck_id: c.deck_id,
      user_id: userId,
      front: c.front,
      back: c.back,
      hint: c.hint || '',
      tags: c.tags || [],
      repetition: c.repetition || 0,
      interval_days: c.interval_days || 0,
      ease_factor: c.ease_factor || 2.5,
      due_date: c.due_date,
      last_reviewed_at: c.last_reviewed_at || null,
      lapses: c.lapses || 0,
      created_at: c.created_at,
    });
  }
}

export async function pullFlashcards(client: SupabaseClient, userId: string) {
  const { data: remoteDecks, error: errDecks } = await client
    .from('flashcard_decks')
    .select('*')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false });

  if (!errDecks && remoteDecks) {
    const localDecks = storageService.flashcardsService.getLocalDecks();
    const mergedDecks = mergeById(localDecks, remoteDecks as any[]);
    storageService.flashcardsService.saveLocalDecks(mergedDecks);
  }

  const { data: remoteCards, error: errCards } = await client
    .from('flashcards')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (!errCards && remoteCards) {
    const localCards = storageService.flashcardsService.getLocalCards();
    const mergedCards = mergeById(localCards, remoteCards as any[]);
    storageService.flashcardsService.saveLocalCards(mergedCards);
  }
}
