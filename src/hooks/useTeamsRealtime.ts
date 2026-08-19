import type { QueryClient, QueryKey } from '@tanstack/react-query';
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
  /** Local-only: present while a send is in flight or has failed. Cleared once reconciled. */
  __status?: 'pending' | 'failed';
  /**
   * Correlates an optimistic message with its eventual server copy, and with
   * retries of the same send. Deliberately NOT cleared once reconciled (only
   * `__status` is): the UI keys rows on `__tempId ?? id` so a message that
   * started life as an optimistic row keeps the SAME React key through
   * pending -> failed -> retried -> reconciled, instead of remounting when
   * `id` swaps from the temp id to the real one.
   */
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

  // The backend's `toTeamsEvent` sets `id: raw.id` straight from
  // `JSON.parse`'d Graph payload with no schema validation, so a malformed
  // or schema-drifted webhook can reach here with a missing id. Without this
  // guard, `id: undefined` would collide with any other `id: undefined` row
  // already in the cache (silent overwrite) and produce a duplicate React
  // key in TeamsChatView/TeamsChannelView. Best-effort realtime channel: a
  // bad frame should be a silent no-op, not corrupt the cache.
  if (typeof event.message.id !== 'string' || !event.message.id) return;

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

/**
 * Insert a message optimistically, before the server has confirmed it.
 *
 * Seeds the envelope when the chat has no cache entry, rather than no-opping
 * as the other helpers do. The composer clears the editor synchronously on
 * send, so a no-op here loses the user's text outright: nothing renders, and
 * because no row was inserted, the later `markMessageFailed` has nothing to
 * mark either — no failed bubble, no retry affordance, no toast. Two ordinary
 * paths reach it: typing during the 1-3s initial fetch (the composer is live
 * while the message pane still shows its skeleton), and any chat whose fetch
 * 401s or whose user is not connected to Microsoft, where EVERY send would be
 * invisible.
 *
 * The seeded value is a well-formed `ApiResponse` envelope, the same shape
 * the query writes, so the in-flight or next fetch merges over it through
 * `preservePendingMessages` exactly as it would over a fetched page.
 */
export function addPendingMessage(
  queryClient: QueryClient,
  chatId: string,
  input: {
    tempId: string;
    body: string;
    /**
     * Required, not defaulted: the caller always knows what the composer
     * produced, and guessing here is exactly the bug this replaced — a
     * hardcoded 'text' rendered the raw `<div>` markup of any multi-line or
     * formatted message in the sender's own bubble.
     */
    contentType: 'html' | 'text';
    authorId: string;
  },
): void {
  const key = queryKeys.teams.chatMessages(chatId);
  const cached = queryClient.getQueryData<MessagesResponse>(key);
  const existing: MessagesResponse = cached?.result
    ? cached
    : { success: true, message: '', result: [] };

  const pending: CachedMessage = {
    id: input.tempId,
    __tempId: input.tempId,
    __status: 'pending',
    messageType: 'message',
    body: { content: input.body, contentType: input.contentType },
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
 * `__tempId` is deliberately NOT cleared (only `__status` is): it stays as a
 * stable React key across the pending -> reconciled transition (see
 * `CachedMessage.__tempId`'s doc comment), and `applyTeamsEvent`'s
 * already-present branch relies on the same convention.
 *
 * Also guards against a race with the WebSocket push or the 120s poll: either
 * can independently learn about this same message under its real id BEFORE
 * this reconcile runs (see `preservePendingMessages` / `applyTeamsEvent`),
 * leaving a second, redundant row already sitting in the cache under
 * `serverMessage.id`. Once this row is rewritten to that same id, any OTHER
 * row that already carries it is dropped, so the conversation ends up with
 * one entry (and one React key) for the message, not two.
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

  const reconciled: CachedMessage = {
    ...existing.result[at],
    ...serverMessage,
    __status: undefined,
  };

  const withReconciled = [...existing.result];
  withReconciled[at] = reconciled;
  const nextResult = withReconciled.filter((m, i) => i === at || m.id !== reconciled.id);

  queryClient.setQueryData<MessagesResponse>(key, { ...existing, result: nextResult });
}

/**
 * Mark a send as failed.
 *
 * The message is kept, not removed: dropping it would throw away text the
 * user typed. The UI offers a retry against the same entry.
 *
 * Unlike `addPendingMessage` this does NOT seed a missing envelope, and must
 * not: it is given a `tempId`, never the text, so the row it could invent
 * would be a blank failed bubble with nothing to retry — strictly worse than
 * no row. It does not need to, either: `addPendingMessage` now always inserts
 * the row this marks, so by the time a send can fail the entry exists.
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

/**
 * Retry a failed send: flip the same row back to `pending` IN PLACE.
 *
 * The retry re-runs the mutation with the failed row's existing `tempId`
 * rather than a freshly generated one, so this must find that row by
 * `__tempId` and flip its status, not insert a new one — otherwise a retry
 * would leave the stale failed row behind and add a second, duplicate entry
 * for the same piece of text.
 */
export function markMessagePending(
  queryClient: QueryClient,
  chatId: string,
  tempId: string,
): void {
  const key = queryKeys.teams.chatMessages(chatId);
  const existing = queryClient.getQueryData<MessagesResponse>(key);
  if (!existing?.result) return;

  queryClient.setQueryData<MessagesResponse>(key, {
    ...existing,
    result: existing.result.map((m) => (m.__tempId === tempId ? { ...m, __status: 'pending' } : m)),
  });
}

/**
 * Guard against the poll-vs-push race: `useTeamsChatMessages` / `useChannelMessages`
 * poll every 120s as a safety net behind the WebSocket (see useTeams.ts). That
 * poll's response is server data only — it has no concept of a pending/failed
 * row that exists only in the local cache — so writing it over the cache
 * verbatim would silently erase any in-flight or failed optimistic send.
 *
 * Call this with the freshly fetched response INSIDE the query's `queryFn`,
 * before it is returned (and therefore before React Query writes it to the
 * cache): any row still genuinely local-only (`__status` is `pending` or
 * `failed` — NOT merely `__tempId` present, since that field now survives
 * reconciliation as a stable key, see `CachedMessage.__tempId`) is carried
 * forward, newest-first ahead of the fetched page, matching the ordering
 * `addPendingMessage` uses.
 *
 * Deduped by `id`, fetched (server) rows winning over carried-forward local
 * rows: a still-pending row's `id` is always its `tempId`, which can never
 * collide with a real Graph id, so this cannot happen through this merge
 * alone today. It is kept anyway as a cheap, defensive guarantee that this
 * function never hands back two rows sharing an `id` — the actual fix for
 * the id-collision race (a pending row's `tempId` being rewritten to an id
 * that's already sitting in the cache from an independent poll/WebSocket
 * delivery) lives in `reconcilePendingMessage`, which is the point where
 * that collision can first occur.
 */
export function preservePendingMessages<T extends { id: string; __status?: 'pending' | 'failed' }>(
  queryClient: QueryClient,
  key: QueryKey,
  fetched: ApiResponse<T[]>,
): ApiResponse<T[]> {
  const existing = queryClient.getQueryData<ApiResponse<T[]>>(key);
  const pendingOrFailed =
    existing?.result?.filter((m) => m.__status === 'pending' || m.__status === 'failed') ?? [];
  if (pendingOrFailed.length === 0) return fetched;

  const fetchedIds = new Set(fetched.result.map((m) => m.id));
  const localOnly = pendingOrFailed.filter((m) => !fetchedIds.has(m.id));
  if (localOnly.length === 0) return fetched;

  return { ...fetched, result: [...localOnly, ...fetched.result] };
}
