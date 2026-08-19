import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { QueryClient } from '@tanstack/react-query';
import { applyTeamsEvent, parseTeamsEvent, type TeamsEvent } from './useTeamsRealtime';
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
/**
 * The contract-break diagnostics are dev-only console warnings (NODE_ENV is
 * 'test' here, so they are live). Several tests below deliberately feed
 * malformed frames in, so silence the channel by default and assert against
 * this spy where the warning itself is the thing under test.
 */
let warnSpy: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
  qc = new QueryClient();
  warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
});

afterEach(() => {
  warnSpy.mockRestore();
});

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

  it('ignores a well-formed message carrying the wrong frame type', () => {
    // The previous test passes `{ type: 'SOMETHING_ELSE' }` with no message at
    // all, so it is rejected by the `!event.message` half of the guard and says
    // nothing about the discriminator. Once the socket carries a second event
    // type (a reaction, a read receipt), those frames WILL have a populated
    // `message`, and treating them as chat messages would write junk rows into
    // the conversation.
    const key = queryKeys.teams.chatMessages('19:abc');
    qc.setQueryData(key, wrap([{ id: 'm0', body: { content: 'earlier', contentType: 'text' } }]));

    applyTeamsEvent(qc, { ...event(), type: 'TEAMS_REACTION' } as unknown as TeamsEvent);

    const cached = qc.getQueryData<ApiResponse<TeamsChatMessage[]>>(key);
    expect(cached?.result.map((m) => m.id)).toEqual(['m0']);
  });

  it('maps the sender through to the shape the UI reads', () => {
    // `from.user.id` is what TeamsChatMessage compares against the current
    // user's azure_oid to decide own-message styling, and displayName is the
    // only name a realtime row ever has. Dropping or mis-nesting either one
    // renders every inbound message as an unknown sender.
    const key = queryKeys.teams.chatMessages('19:abc');
    qc.setQueryData(key, wrap([]));

    applyTeamsEvent(qc, event());

    const cached = qc.getQueryData<ApiResponse<TeamsChatMessage[]>>(key);
    expect(cached?.result[0].from?.user).toEqual({ id: 'oid-1', displayName: 'Priya' });
    expect(cached?.result[0].body).toEqual({ content: 'hello', contentType: 'text' });
    expect(cached?.result[0].createdDateTime).toBe('2026-08-06T10:00:00Z');
  });

  it('clears the pending status when the server copy of an in-flight send arrives', () => {
    // The user's own send is echoed back over the socket while the POST is
    // still in flight, so the row it lands on is very often the optimistic
    // one. Leaving (or setting) a `__status` here freezes that row in a
    // sending/failed state forever: nothing else ever clears it, because the
    // send's own reconcile matches on __tempId and has already run or will
    // find an id that no longer needs changing.
    const key = queryKeys.teams.chatMessages('19:abc');
    qc.setQueryData(
      key,
      wrap([
        {
          id: 'm1',
          __tempId: 't1',
          __status: 'pending',
          body: { content: 'hello', contentType: 'text' },
        } as Partial<TeamsChatMessage>,
      ]),
    );

    applyTeamsEvent(qc, event());

    const cached = qc.getQueryData<ApiResponse<TeamsChatMessage[]>>(key);
    expect(cached?.result).toHaveLength(1);
    expect(cached?.result[0].__status).toBeUndefined();
    // The stable React key must survive the swap (see reconcilePendingMessage).
    expect(cached?.result[0].__tempId).toBe('t1');
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

  it('routes to the chat cache when an event carries a chatId AND channel identity', () => {
    // Graph populates `channelIdentity` on channel messages and `chatId` on
    // chat messages, but a meeting chat can carry both. chatId must win:
    // routing that message to the channel cache would drop it out of the
    // conversation the user actually has open, and there is no second write.
    const chatKey = queryKeys.teams.chatMessages('19:abc');
    const chanKey = queryKeys.teams.channelMessages('team-1', 'chan-1');
    qc.setQueryData(chatKey, wrap([{ id: 'm0' }]));
    qc.setQueryData(chanKey, wrap([{ id: 'c0' }]));

    applyTeamsEvent(qc, event({ id: 'm1', teamId: 'team-1', channelId: 'chan-1' }));

    expect(
      qc.getQueryData<ApiResponse<TeamsChatMessage[]>>(chatKey)?.result.map((m) => m.id),
    ).toEqual(['m1', 'm0']);
    expect(
      qc.getQueryData<ApiResponse<TeamsChatMessage[]>>(chanKey)?.result.map((m) => m.id),
    ).toEqual(['c0']);
  });
});

describe('parseTeamsEvent', () => {
  // The socket frame arrives as `JSON.parse(event.data)` — genuinely unknown
  // data. It used to be asserted straight to the frame type and narrowed on
  // `type` alone, so `{"type":"TEAMS_MESSAGE"}` with no message at all was
  // handed downstream typed as a complete event. It only survived because
  // applyTeamsEvent re-checks at runtime: the type was decorative and the
  // inner guards were load-bearing. Validating here inverts that.
  const frame = (over: Record<string, unknown> = {}) => ({
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

  it('accepts a well-formed frame', () => {
    expect(parseTeamsEvent(frame())).toEqual(frame());
  });

  it('accepts a channel frame, where chatId is null and the channel ids are set', () => {
    const channelFrame = frame({ chatId: null, teamId: 'team-1', channelId: 'chan-1' });
    expect(parseTeamsEvent(channelFrame)).toEqual(channelFrame);
  });

  it('returns only the known fields, so nothing unreviewed can ride along', () => {
    const parsed = parseTeamsEvent({
      ...frame({ mentions: [{ id: 0 }] }),
      clientState: 'the per-subscription secret',
    });

    expect(parsed).toEqual(frame());
    expect(parsed).not.toHaveProperty('clientState');
    expect(parsed?.message).not.toHaveProperty('mentions');
  });

  it.each([
    ['a non-object', 'TEAMS_MESSAGE'],
    ['null', null],
    ['a frame with no type', { changeType: 'created', message: frame().message }],
    ['a frame of another type', { ...frame(), type: 'TEAMS_REACTION' }],
    ['a frame with a non-string changeType', { ...frame(), changeType: 3 }],
    ['a TEAMS_MESSAGE with no message', { type: 'TEAMS_MESSAGE', changeType: 'created' }],
    ['a message with a missing id', frame({ id: undefined })],
    ['a message with an empty id', frame({ id: '' })],
    ['a message with a non-string id', frame({ id: 42 })],
    ['a message with a non-string body', frame({ body: null })],
    ['a message with no from', frame({ from: undefined })],
    ['a message with a non-string createdDateTime', frame({ createdDateTime: 0 })],
    ['a message with a non-string, non-null replyToId', frame({ replyToId: 7 })],
  ])('rejects %s', (_label, input) => {
    expect(parseTeamsEvent(input)).toBeNull();
  });

  it('warns when a TEAMS_MESSAGE frame fails validation, instead of dropping it in silence', () => {
    // A contract break here means realtime is dead and nothing anywhere says
    // so: pushToUser's return value is discarded on the backend, and the
    // frontend would just stop applying events. The 120s poll hides it well
    // enough that it could ship unnoticed.
    expect(parseTeamsEvent({ type: 'TEAMS_MESSAGE', changeType: 'created' })).toBeNull();

    expect(warnSpy).toHaveBeenCalledTimes(1);
  });

  it('stays silent for frames that were never Teams events', () => {
    // Every notification on the shared socket would otherwise log a warning.
    expect(parseTeamsEvent({ type: 'TASK_ASSIGNED', message: 'You have a task' })).toBeNull();

    expect(warnSpy).not.toHaveBeenCalled();
  });

  it('never puts the message body in a warning', () => {
    // Chat content is the one thing on this socket that must not end up in a
    // console log or a Sentry breadcrumb.
    parseTeamsEvent(frame({ id: 42, body: 'SECRET-CHAT-CONTENT' }));

    expect(warnSpy).toHaveBeenCalled();
    expect(JSON.stringify(warnSpy.mock.calls)).not.toContain('SECRET-CHAT-CONTENT');
  });
});

describe('applyTeamsEvent diagnostics', () => {
  it('warns when an event routes to no conversation at all', () => {
    // If Graph ever stops populating chatId, keyFor returns null and EVERY
    // realtime message is dropped forever, silently -- nothing in the
    // console, nothing in Sentry, and no backend log either.
    applyTeamsEvent(qc, event({ chatId: null, teamId: null, channelId: null }));

    expect(warnSpy).toHaveBeenCalledTimes(1);
  });

  it('warns when the event carries no usable id', () => {
    applyTeamsEvent(qc, event({ id: '' }));

    expect(warnSpy).toHaveBeenCalledTimes(1);
  });

  it('stays silent for a conversation the user simply has not opened', () => {
    // Routine and expected: there is nothing cached to update, and it will be
    // fetched fresh when they open it. Warning here would fire constantly.
    applyTeamsEvent(qc, event());

    expect(warnSpy).not.toHaveBeenCalled();
  });
});
