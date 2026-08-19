import { describe, it, expect, beforeEach } from 'vitest';
import { QueryClient } from '@tanstack/react-query';
import {
  addPendingMessage,
  markMessageFailed,
  markMessagePending,
  reconcilePendingMessage,
  preservePendingMessages,
} from './useTeamsRealtime';
import { queryKeys } from '../lib/queryKeys';
import type { ApiResponse } from '../types/api';
import type { TeamsChatMessage } from '../services/teams';

// The real cache (see useTeams.ts -> useTeamsChatMessages / useChannelMessages,
// and useTeamsRealtime.ts / useTeamsRealtime.test.ts, established in Task 8)
// holds the API envelope `ApiResponse<TeamsChatMessage[]>`
// (`{ success, message, result }`), NOT a bare array. The three helpers under
// test operate on `existing.result`, so the cache must be seeded in that
// shape or they no-op (see the early `if (!existing?.result) return;` guards
// in useTeamsRealtime.ts).
const wrap = (result: Partial<TeamsChatMessage>[]): ApiResponse<TeamsChatMessage[]> => ({
  success: true,
  message: '',
  result: result as TeamsChatMessage[],
});

type LocalRow = TeamsChatMessage & { __status?: 'pending' | 'failed'; __tempId?: string };

let qc: QueryClient;
const KEY = () => queryKeys.teams.chatMessages('19:abc');

beforeEach(() => {
  qc = new QueryClient();
  qc.setQueryData(KEY(), wrap([]));
});

describe('optimistic send', () => {
  it('shows the message immediately, marked pending', () => {
    addPendingMessage(qc, '19:abc', { tempId: 't1', body: 'hello', authorId: 'me' });

    const cached = qc.getQueryData<ApiResponse<LocalRow[]>>(KEY());
    const [msg] = cached!.result;
    expect(msg.body.content).toBe('hello');
    expect(msg.__status).toBe('pending');
  });

  it('replaces the pending copy when the real message arrives, without duplicating', () => {
    addPendingMessage(qc, '19:abc', { tempId: 't1', body: 'hello', authorId: 'me' });

    reconcilePendingMessage(qc, '19:abc', 't1', { id: 'real-1', body: { content: 'hello' } });

    const cached = qc.getQueryData<ApiResponse<LocalRow[]>>(KEY());
    expect(cached!.result).toHaveLength(1);
    expect(cached!.result[0].id).toBe('real-1');
    expect(cached!.result[0].__status).toBeUndefined();
  });

  it('marks the message failed rather than removing it, so the text is not lost', () => {
    addPendingMessage(qc, '19:abc', { tempId: 't1', body: 'hello', authorId: 'me' });

    markMessageFailed(qc, '19:abc', 't1');

    const cached = qc.getQueryData<ApiResponse<LocalRow[]>>(KEY());
    const [msg] = cached!.result;
    expect(msg.__status).toBe('failed');
    expect(msg.body.content).toBe('hello');
  });

  it('keeps ordering stable when several sends are in flight', () => {
    // Cache order is newest-first (see useTeamsRealtime.ts / useTeamsRealtime.test.ts:
    // Graph returns messages newest-first, and TeamsChatView reverses `result`
    // before rendering). So `t2` ("second"), added after `t1`, is prepended
    // ahead of it: raw cache order is [second, first], which TeamsChatView
    // displays as "first" then "second". Reconciling `t1` replaces it IN
    // PLACE rather than moving it to the front, so a slow first send cannot
    // jump behind a fast second one and reorder the conversation.
    addPendingMessage(qc, '19:abc', { tempId: 't1', body: 'first', authorId: 'me' });
    addPendingMessage(qc, '19:abc', { tempId: 't2', body: 'second', authorId: 'me' });

    reconcilePendingMessage(qc, '19:abc', 't1', { id: 'r1', body: { content: 'first' } });

    const cached = qc.getQueryData<ApiResponse<LocalRow[]>>(KEY());
    expect(cached!.result.map((m) => m.body.content)).toEqual(['second', 'first']);
  });
});

describe('retry after a failed send', () => {
  it('flips the same row back to pending in place, rather than inserting a new one', () => {
    addPendingMessage(qc, '19:abc', { tempId: 't1', body: 'hello', authorId: 'me' });
    markMessageFailed(qc, '19:abc', 't1');

    markMessagePending(qc, '19:abc', 't1');

    const cached = qc.getQueryData<ApiResponse<LocalRow[]>>(KEY());
    expect(cached!.result).toHaveLength(1);
    expect(cached!.result[0].__tempId).toBe('t1');
    expect(cached!.result[0].__status).toBe('pending');
    expect(cached!.result[0].body.content).toBe('hello');
  });

  it('can then be reconciled by the same tempId once the retry succeeds', () => {
    addPendingMessage(qc, '19:abc', { tempId: 't1', body: 'hello', authorId: 'me' });
    markMessageFailed(qc, '19:abc', 't1');
    markMessagePending(qc, '19:abc', 't1');

    reconcilePendingMessage(qc, '19:abc', 't1', { id: 'real-1', body: { content: 'hello' } });

    const cached = qc.getQueryData<ApiResponse<LocalRow[]>>(KEY());
    expect(cached!.result).toHaveLength(1);
    expect(cached!.result[0].id).toBe('real-1');
    expect(cached!.result[0].__status).toBeUndefined();
  });

  it('flips back to failed correctly if the retry itself fails again', () => {
    addPendingMessage(qc, '19:abc', { tempId: 't1', body: 'hello', authorId: 'me' });
    markMessageFailed(qc, '19:abc', 't1');
    markMessagePending(qc, '19:abc', 't1'); // user clicks Retry
    markMessageFailed(qc, '19:abc', 't1'); // the retry also fails

    const cached = qc.getQueryData<ApiResponse<LocalRow[]>>(KEY());
    expect(cached!.result).toHaveLength(1);
    expect(cached!.result[0].__tempId).toBe('t1');
    expect(cached!.result[0].__status).toBe('failed');
    expect(cached!.result[0].body.content).toBe('hello');
  });

  it('keeps the row keyed on the same __tempId after reconciliation, so the UI does not remount it', () => {
    // __tempId is deliberately NOT cleared by reconcilePendingMessage (only
    // __status is): TeamsChatView keys rows on `__tempId ?? id` so the row's
    // React key stays stable across the pending -> reconciled transition,
    // even though `id` itself changes from the temp id to the real one.
    addPendingMessage(qc, '19:abc', { tempId: 't1', body: 'hello', authorId: 'me' });

    reconcilePendingMessage(qc, '19:abc', 't1', { id: 'real-1', body: { content: 'hello' } });

    const cached = qc.getQueryData<ApiResponse<LocalRow[]>>(KEY());
    expect(cached!.result[0].__tempId).toBe('t1');
    expect(cached!.result[0].id).toBe('real-1');
  });
});

describe('reconcile racing an independent delivery of the same message', () => {
  it('drops the redundant row rather than leaving two entries with the same real id', () => {
    // Simulates the race: the WebSocket push (applyTeamsEvent) or a poll
    // (preservePendingMessages) learned about this message under its real id
    // and already inserted a row for it, BEFORE this send's own onSuccess
    // fired to reconcile the still-pending row.
    qc.setQueryData(
      KEY(),
      wrap([
        { id: 'real-1', body: { content: 'hello', contentType: 'text' } },
      ]),
    );
    addPendingMessage(qc, '19:abc', { tempId: 't1', body: 'hello', authorId: 'me' });

    reconcilePendingMessage(qc, '19:abc', 't1', { id: 'real-1', body: { content: 'hello' } });

    const cached = qc.getQueryData<ApiResponse<LocalRow[]>>(KEY());
    expect(cached!.result).toHaveLength(1);
    expect(cached!.result.filter((m) => m.id === 'real-1')).toHaveLength(1);
    // The reconciled row (which keeps a stable __tempId key) is the survivor,
    // not the earlier server-only duplicate.
    expect(cached!.result[0].__tempId).toBe('t1');
  });
});

describe('no-op guards for an unknown tempId or an unseeded chat', () => {
  it('reconcilePendingMessage is a no-op when the tempId is not in the cache', () => {
    addPendingMessage(qc, '19:abc', { tempId: 't1', body: 'hello', authorId: 'me' });
    const before = qc.getQueryData(KEY());

    reconcilePendingMessage(qc, '19:abc', 'does-not-exist', { id: 'real-1', body: { content: 'x' } });

    expect(qc.getQueryData(KEY())).toEqual(before);
  });

  it('markMessageFailed is a no-op when the tempId is not in the cache', () => {
    addPendingMessage(qc, '19:abc', { tempId: 't1', body: 'hello', authorId: 'me' });
    const before = qc.getQueryData(KEY());

    markMessageFailed(qc, '19:abc', 'does-not-exist');

    expect(qc.getQueryData(KEY())).toEqual(before);
  });

  it('markMessagePending is a no-op when the tempId is not in the cache', () => {
    addPendingMessage(qc, '19:abc', { tempId: 't1', body: 'hello', authorId: 'me' });
    const before = qc.getQueryData(KEY());

    markMessagePending(qc, '19:abc', 'does-not-exist');

    expect(qc.getQueryData(KEY())).toEqual(before);
  });

  it('all three helpers no-op cleanly when the chat was never fetched (no cache entry at all)', () => {
    const freshQc = new QueryClient();
    const unseeded = queryKeys.teams.chatMessages('19:never-opened');

    expect(() => {
      reconcilePendingMessage(freshQc, '19:never-opened', 't1', { id: 'real-1', body: { content: 'x' } });
      markMessageFailed(freshQc, '19:never-opened', 't1');
      markMessagePending(freshQc, '19:never-opened', 't1');
    }).not.toThrow();

    expect(freshQc.getQueryData(unseeded)).toBeUndefined();
  });
});

// Deferred from Task 8's review: the 120s background poll (see
// useTeamsChatMessages / useChannelMessages in useTeams.ts) does a normal
// fetch-and-cache-write. Its response is server data only -- it has no
// concept of a local-only pending/failed row -- so a poll landing while one
// of those rows exists must not silently drop it from the cache.
describe('poll-vs-push race (preservePendingMessages)', () => {
  it('keeps a pending message when a background poll response lands without it', () => {
    addPendingMessage(qc, '19:abc', { tempId: 't1', body: 'still sending', authorId: 'me' });

    // Simulates what the poll's queryFn receives from the server: it knows
    // nothing about the optimistic row that only exists in the cache.
    const serverResponse = wrap([{ id: 'm0', body: { content: 'earlier', contentType: 'text' } }]);
    const merged = preservePendingMessages(qc, KEY(), serverResponse) as ApiResponse<LocalRow[]>;

    expect(merged.result.some((m) => m.__tempId === 't1')).toBe(true);
    expect(merged.result.map((m) => m.id)).toEqual(['t1', 'm0']);
  });

  it('keeps a failed message across a poll too', () => {
    addPendingMessage(qc, '19:abc', { tempId: 't1', body: 'oops', authorId: 'me' });
    markMessageFailed(qc, '19:abc', 't1');

    const merged = preservePendingMessages(qc, KEY(), wrap([])) as ApiResponse<LocalRow[]>;

    expect(merged.result).toHaveLength(1);
    expect(merged.result[0].__status).toBe('failed');
  });

  it('returns the fetched response unchanged when nothing is pending', () => {
    const serverResponse = wrap([{ id: 'm1', body: { content: 'hi', contentType: 'text' } }]);

    const merged = preservePendingMessages(qc, KEY(), serverResponse);

    expect(merged).toEqual(serverResponse);
  });

  it('a reconciled row (status cleared) is no longer carried forward as pending', () => {
    // Regression guard for the __status-based predicate: previously this
    // checked `__tempId` presence, and __tempId is now intentionally kept
    // after reconciliation as a stable UI key (see reconcilePendingMessage),
    // so the predicate must be __status, not __tempId, or every
    // ever-optimistic row would be treated as still-pending forever.
    addPendingMessage(qc, '19:abc', { tempId: 't1', body: 'hello', authorId: 'me' });
    reconcilePendingMessage(qc, '19:abc', 't1', { id: 'real-1', body: { content: 'hello' } });

    const serverResponse = wrap([{ id: 'real-1', body: { content: 'hello', contentType: 'text' } }]);
    const merged = preservePendingMessages(qc, KEY(), serverResponse);

    expect(merged.result).toHaveLength(1);
    expect(merged).toEqual(serverResponse);
  });

  it('prefers the fetched (server) copy over a local row sharing the same id', () => {
    // Defensive dedup requested in review: even though a still-pending row's
    // id is always its tempId and can never naturally collide with a real
    // Graph id (so this exact path is not reachable through normal use
    // today), preservePendingMessages must never hand back two rows sharing
    // an id.
    qc.setQueryData(
      KEY(),
      wrap([{ id: 'dup-1', __status: 'pending', body: { content: 'stale local copy', contentType: 'text' } }]),
    );

    const serverResponse = wrap([{ id: 'dup-1', body: { content: 'authoritative server copy', contentType: 'text' } }]);
    const merged = preservePendingMessages(qc, KEY(), serverResponse);

    expect(merged.result).toHaveLength(1);
    expect(merged.result[0].body.content).toBe('authoritative server copy');
  });
});
