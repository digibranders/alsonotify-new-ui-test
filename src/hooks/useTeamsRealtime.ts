import type { QueryClient } from '@tanstack/react-query';
import { queryKeys } from '../lib/queryKeys';
import type { ApiResponse } from '../types/api';

/**
 * Cache writes for realtime Teams events.
 *
 * These are plain functions taking a QueryClient rather than hooks, so they
 * can be tested without rendering and called from the WebSocket handler
 * (useWebSocket.ts), which is not inside a component.
 *
 * IMPORTANT — cache shape: `useTeamsChatMessages` / `useChannelMessages`
 * (see useTeams.ts) cache the raw API envelope `ApiResponse<Message[]>`
 * (`{ success, message, result }`, see services/teams.ts and types/api.ts),
 * not a bare array. Graph also returns messages newest-first — TeamsChatView
 * reverses `result` before rendering — so a newly created message is
 * PREPENDED to `result`, matching that ordering.
 */

export interface TeamsEventMessage {
  id: string;
  chatId: string | null;
  channelId: string | null;
  teamId: string | null;
  body: string;
  contentType: string;
  from: { id: string | null; displayName: string | null };
  createdDateTime: string;
  lastEditedDateTime: string | null;
  replyToId: string | null;
}

export interface TeamsEvent {
  type: 'TEAMS_MESSAGE';
  changeType: string;
  message: TeamsEventMessage;
}

/** Shape the Teams UI already renders (see TeamsChatMessage / ChannelMessage in services/teams.ts). */
interface CachedMessage {
  id: string;
  messageType?: string;
  body?: { content?: string; contentType?: string };
  from?: { user?: { id?: string | null; displayName?: string | null } | null } | null;
  createdDateTime?: string;
  lastEditedDateTime?: string | null;
  replyToId?: string | null;
  /** Local-only: present while a send is in flight or has failed. */
  __status?: 'pending' | 'failed';
  /** Local-only: correlates an optimistic message with its server copy. */
  __tempId?: string;
}

type MessagesResponse = ApiResponse<CachedMessage[]>;

function keyFor(message: TeamsEventMessage) {
  if (message.chatId) return queryKeys.teams.chatMessages(message.chatId);
  if (message.teamId && message.channelId) {
    return queryKeys.teams.channelMessages(message.teamId, message.channelId);
  }
  return null;
}

function toCached(message: TeamsEventMessage): CachedMessage {
  return {
    id: message.id,
    messageType: 'message',
    body: { content: message.body, contentType: message.contentType },
    from: { user: { id: message.from.id, displayName: message.from.displayName } },
    createdDateTime: message.createdDateTime,
    lastEditedDateTime: message.lastEditedDateTime,
    replyToId: message.replyToId,
  };
}

/**
 * Apply one realtime event to the cache.
 *
 * Silently ignores conversations that are not cached: the user has not opened
 * that chat/channel, so there is nothing to update and it will be fetched
 * fresh when they do.
 */
export function applyTeamsEvent(queryClient: QueryClient, event: TeamsEvent): void {
  if (event?.type !== 'TEAMS_MESSAGE' || !event.message) return;

  const key = keyFor(event.message);
  if (!key) return;

  const existing = queryClient.getQueryData<MessagesResponse>(key);
  if (!existing?.result) return;

  if (event.changeType === 'deleted') {
    queryClient.setQueryData<MessagesResponse>(key, {
      ...existing,
      result: existing.result.filter((m) => m.id !== event.message.id),
    });
    return;
  }

  const incoming = toCached(event.message);
  const at = existing.result.findIndex((m) => m.id === incoming.id);

  if (at >= 0) {
    // Already present. Graph sends `created` and `updated` for the same id, and
    // our own optimistic copy may have been reconciled first, so replacing in
    // place is correct for both edits and duplicate deliveries.
    const nextResult = [...existing.result];
    nextResult[at] = { ...existing.result[at], ...incoming, __status: undefined };
    queryClient.setQueryData<MessagesResponse>(key, { ...existing, result: nextResult });
    return;
  }

  // API returns messages newest-first; prepend to match that ordering.
  queryClient.setQueryData<MessagesResponse>(key, {
    ...existing,
    result: [incoming, ...existing.result],
  });
}

/** Insert a message optimistically, before the server has confirmed it. */
export function addPendingMessage(
  queryClient: QueryClient,
  chatId: string,
  input: { tempId: string; body: string; authorId: string },
): void {
  const key = queryKeys.teams.chatMessages(chatId);
  const existing = queryClient.getQueryData<MessagesResponse>(key);
  if (!existing?.result) return;

  const pending: CachedMessage = {
    id: input.tempId,
    __tempId: input.tempId,
    __status: 'pending',
    messageType: 'message',
    body: { content: input.body, contentType: 'text' },
    from: { user: { id: input.authorId, displayName: null } },
    createdDateTime: new Date().toISOString(),
    lastEditedDateTime: null,
    replyToId: null,
  };

  // Newest-first ordering, same as the server would return once it lands.
  queryClient.setQueryData<MessagesResponse>(key, {
    ...existing,
    result: [pending, ...existing.result],
  });
}

/**
 * Swap the optimistic copy for the server's, IN PLACE.
 *
 * Position is preserved rather than moved to the front, so a slow first send
 * cannot jump behind a fast second one and reorder the conversation.
 */
export function reconcilePendingMessage(
  queryClient: QueryClient,
  chatId: string,
  tempId: string,
  serverMessage: { id: string; body?: { content?: string } },
): void {
  const key = queryKeys.teams.chatMessages(chatId);
  const existing = queryClient.getQueryData<MessagesResponse>(key);
  if (!existing?.result) return;

  const at = existing.result.findIndex((m) => m.__tempId === tempId);
  if (at < 0) return;

  const nextResult = [...existing.result];
  nextResult[at] = {
    ...nextResult[at],
    ...serverMessage,
    __status: undefined,
    __tempId: undefined,
  };
  queryClient.setQueryData<MessagesResponse>(key, { ...existing, result: nextResult });
}

/**
 * Mark a send as failed.
 *
 * The message is kept, not removed: dropping it would throw away text the
 * user typed. The UI offers a retry against the same entry.
 */
export function markMessageFailed(
  queryClient: QueryClient,
  chatId: string,
  tempId: string,
): void {
  const key = queryKeys.teams.chatMessages(chatId);
  const existing = queryClient.getQueryData<MessagesResponse>(key);
  if (!existing?.result) return;

  queryClient.setQueryData<MessagesResponse>(key, {
    ...existing,
    result: existing.result.map((m) => (m.__tempId === tempId ? { ...m, __status: 'failed' } : m)),
  });
}
