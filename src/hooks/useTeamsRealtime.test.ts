import { describe, it, expect, beforeEach } from 'vitest';
import { QueryClient } from '@tanstack/react-query';
import { applyTeamsEvent, type TeamsEvent } from './useTeamsRealtime';
import { queryKeys } from '../lib/queryKeys';
import type { ApiResponse } from '../types/api';
import type { TeamsChatMessage } from '../services/teams';

// The real cache (see useTeams.ts -> useTeamsChatMessages / useChannelMessages,
// and services/teams.ts) holds `ApiResponse<TeamsChatMessage[]>`, i.e.
// `{ success, message, result }`, NOT a bare array. Graph also returns
// messages newest-first (TeamsChatView.tsx reverses `result` for display), so
// a newly created message is prepended to `result`, not appended.
const wrap = (result: Partial<TeamsChatMessage>[]): ApiResponse<TeamsChatMessage[]> => ({
  success: true,
  message: '',
  result: result as TeamsChatMessage[],
});

const event = (over: Record<string, unknown> = {}): TeamsEvent => ({
  type: 'TEAMS_MESSAGE',
  changeType: 'created',
  message: {
    id: 'm1', chatId: '19:abc', channelId: null, teamId: null,
    body: 'hello', contentType: 'text',
    from: { id: 'oid-1', displayName: 'Priya' },
    createdDateTime: '2026-08-06T10:00:00Z',
    lastEditedDateTime: null, replyToId: null,
    ...over,
  },
});

let qc: QueryClient;
beforeEach(() => { qc = new QueryClient(); });

describe('applyTeamsEvent', () => {
  it('prepends a new message to the cached chat (API order is newest-first)', () => {
    const key = queryKeys.teams.chatMessages('19:abc');
    qc.setQueryData(key, wrap([{ id: 'm0', body: { content: 'earlier', contentType: 'text' } }]));

    applyTeamsEvent(qc, event());

    const cached = qc.getQueryData<ApiResponse<TeamsChatMessage[]>>(key);
    expect(cached?.result.map((m) => m.id)).toEqual(['m1', 'm0']);
  });

  it('does not duplicate a message already in the cache', () => {
    // The optimistic send may have put it there already, and Graph sends
    // created AND updated for the same id.
    const key = queryKeys.teams.chatMessages('19:abc');
    qc.setQueryData(key, wrap([{ id: 'm1', body: { content: 'hello', contentType: 'text' } }]));

    applyTeamsEvent(qc, event());

    const cached = qc.getQueryData<ApiResponse<TeamsChatMessage[]>>(key);
    expect(cached?.result).toHaveLength(1);
  });

  it('replaces the message body on an edit', () => {
    const key = queryKeys.teams.chatMessages('19:abc');
    qc.setQueryData(key, wrap([{ id: 'm1', body: { content: 'hello', contentType: 'text' } }]));

    applyTeamsEvent(qc, event({ body: 'edited' }));

    const cached = qc.getQueryData<ApiResponse<TeamsChatMessage[]>>(key);
    expect(cached?.result[0].body.content).toBe('edited');
  });

  it('removes a deleted message', () => {
    const key = queryKeys.teams.chatMessages('19:abc');
    qc.setQueryData(key, wrap([{ id: 'm1' }, { id: 'm2' }]));

    applyTeamsEvent(qc, { ...event(), changeType: 'deleted' });

    const cached = qc.getQueryData<ApiResponse<TeamsChatMessage[]>>(key);
    expect(cached?.result.map((m) => m.id)).toEqual(['m2']);
  });

  it('ignores an event for a chat that is not cached', () => {
    expect(() => applyTeamsEvent(qc, event())).not.toThrow();
    const key = queryKeys.teams.chatMessages('19:abc');
    expect(qc.getQueryData(key)).toBeUndefined();
  });

  it('ignores events that are not TEAMS_MESSAGE', () => {
    expect(() => applyTeamsEvent(qc, { type: 'SOMETHING_ELSE' } as never)).not.toThrow();
  });

  it('ignores a message with a missing id rather than corrupting the cache', () => {
    // Backend `toTeamsEvent` sets `id: raw.id` straight from an unvalidated
    // Graph payload, so schema drift or a malformed webhook can arrive here
    // with no id. Without a guard, `id: undefined` would either collide with
    // another `id: undefined` row already cached (silent overwrite) or
    // produce a duplicate React key when rendered.
    const key = queryKeys.teams.chatMessages('19:abc');
    qc.setQueryData(key, wrap([{ id: 'm0', body: { content: 'earlier', contentType: 'text' } }]));

    applyTeamsEvent(qc, event({ id: undefined as unknown as string }));

    const cached = qc.getQueryData<ApiResponse<TeamsChatMessage[]>>(key);
    expect(cached?.result.map((m) => m.id)).toEqual(['m0']);
  });

  it('ignores a message with an empty-string id', () => {
    const key = queryKeys.teams.chatMessages('19:abc');
    qc.setQueryData(key, wrap([{ id: 'm0', body: { content: 'earlier', contentType: 'text' } }]));

    applyTeamsEvent(qc, event({ id: '' }));

    const cached = qc.getQueryData<ApiResponse<TeamsChatMessage[]>>(key);
    expect(cached?.result).toHaveLength(1);
  });

  it('routes a channel message to the channelMessages cache, not chatMessages', () => {
    const chanKey = queryKeys.teams.channelMessages('team-1', 'chan-1');
    qc.setQueryData(chanKey, wrap([{ id: 'c0' }]));

    applyTeamsEvent(
      qc,
      event({ id: 'c1', chatId: null, teamId: 'team-1', channelId: 'chan-1' }),
    );

    const cached = qc.getQueryData<ApiResponse<TeamsChatMessage[]>>(chanKey);
    expect(cached?.result.map((m) => m.id)).toEqual(['c1', 'c0']);

    // Must not have touched the chatMessages cache for the same event id space.
    const chatKey = queryKeys.teams.chatMessages('19:abc');
    expect(qc.getQueryData(chatKey)).toBeUndefined();
  });
});
