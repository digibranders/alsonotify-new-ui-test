import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { App } from 'antd';
import { TeamsChatView } from './TeamsChatView';
import { useTeamsChatMessages, useSendTeamsChatMessage, useTeamsChats } from '@/hooks/useTeams';
import type { TeamsChatMessage as TChatMessage } from '@/services/teams';
import type { ApiResponse } from '@/types/api';

vi.mock('@/hooks/useTeams');
vi.mock('@/hooks/useCurrentUser', async () => {
  const actual = await vi.importActual<typeof import('@/hooks/useCurrentUser')>(
    '@/hooks/useCurrentUser',
  );
  return { ...actual, useCurrentUser: () => ({ user: { id: 7 }, isLoading: false, error: null }) };
});

const CHAT_ID = '19:abc';

const mutate = vi.fn();

const message = (over: Partial<TChatMessage> = {}): TChatMessage =>
  ({
    id: 'm1',
    messageType: 'message',
    createdDateTime: '2026-08-19T10:00:00Z',
    from: { user: { id: 'oid-them', displayName: 'Priya Sharma' } },
    body: { contentType: 'text', content: 'hello' },
    ...over,
  }) as TChatMessage;

const seed = (messages: TChatMessage[]) => {
  vi.mocked(useTeamsChatMessages).mockReturnValue({
    data: { success: true, message: '', result: messages } as ApiResponse<TChatMessage[]>,
    isLoading: false,
  } as unknown as ReturnType<typeof useTeamsChatMessages>);
};

const draw = (chatId: string | null = CHAT_ID) =>
  render(
    <App>
      <TeamsChatView chatId={chatId} />
    </App>,
  );

/**
 * jsdom lays nothing out, so the scroll heuristic has no geometry to read
 * unless the test supplies it. These are the three numbers it uses.
 */
const pane = () => screen.getByRole('log');
const layOut = (
  el: HTMLElement,
  geometry: { scrollHeight: number; clientHeight: number; scrollTop: number },
) => {
  Object.defineProperty(el, 'scrollHeight', { value: geometry.scrollHeight, configurable: true });
  Object.defineProperty(el, 'clientHeight', { value: geometry.clientHeight, configurable: true });
  el.scrollTop = geometry.scrollTop;
  fireEvent.scroll(el);
};

const AT_BOTTOM = { scrollHeight: 1000, clientHeight: 400, scrollTop: 600 };
const SCROLLED_UP = { scrollHeight: 1000, clientHeight: 400, scrollTop: 0 };

/** Type into the contenteditable composer and press Enter. */
const compose = (html: string, text = html) => {
  const editor = document.querySelector('.teams-input-editor') as HTMLElement;
  editor.innerHTML = html;
  // textContent is derived from innerHTML by jsdom, but a plain-text case
  // needs the two to differ from each other exactly as a real editor's would.
  fireEvent.input(editor);
  expect(editor.textContent).toBe(text);
  fireEvent.keyDown(editor, { key: 'Enter' });
};

beforeEach(() => {
  vi.clearAllMocks();
  seed([]);
  vi.mocked(useTeamsChats).mockReturnValue({ data: undefined } as unknown as ReturnType<
    typeof useTeamsChats
  >);
  vi.mocked(useSendTeamsChatMessage).mockReturnValue({
    mutate,
    isPending: false,
  } as unknown as ReturnType<typeof useSendTeamsChatMessage>);
});

describe('TeamsChatView — contentType reaches the mutation', () => {
  it('sends plain text as text', () => {
    // The composer already works out whether it produced markup;
    // handleSend discarded the answer and let the service default to "html",
    // so every plain-text message was posted to Graph as HTML.
    draw();

    compose('hello there');

    expect(mutate).toHaveBeenCalledWith(
      expect.objectContaining({ chatId: CHAT_ID, content: 'hello there', contentType: 'text' }),
      expect.anything(),
    );
  });

  it('sends markup as html', () => {
    draw();

    compose('line one<div>line two</div>', 'line oneline two');

    expect(mutate).toHaveBeenCalledWith(
      expect.objectContaining({ contentType: 'html' }),
      expect.anything(),
    );
  });

});

describe('TeamsChatView — auto-scroll', () => {
  // Under the old 15s poll a length change was rare. Under realtime it happens
  // on every inbound message, so an unconditional scrollIntoView slides the
  // view away from whatever the user was reading, mid-sentence.
  it('follows a new message when the user is already at the bottom', () => {
    seed([message({ id: 'm1' })]);
    const { rerender } = draw();
    layOut(pane(), AT_BOTTOM);

    seed([message({ id: 'm1' }), message({ id: 'm2', body: { contentType: 'text', content: 'new' } })]);
    rerender(
      <App>
        <TeamsChatView chatId={CHAT_ID} />
      </App>,
    );

    expect(pane().scrollTop).toBe(1000);
  });

  it('leaves the view alone when the user has scrolled up to read history', () => {
    seed([message({ id: 'm1' })]);
    const { rerender } = draw();
    layOut(pane(), SCROLLED_UP);

    seed([message({ id: 'm1' }), message({ id: 'm2', body: { contentType: 'text', content: 'new' } })]);
    rerender(
      <App>
        <TeamsChatView chatId={CHAT_ID} />
      </App>,
    );

    expect(pane().scrollTop).toBe(0);
  });

  it('always follows the user\'s own send, even from up in the history', () => {
    // Sending is an explicit request to be at the bottom. Not following it
    // would put the user's own message somewhere they cannot see.
    seed([message({ id: 'm1' })]);
    const { rerender } = draw();
    layOut(pane(), SCROLLED_UP);

    compose('mine');
    seed([message({ id: 'm1' }), message({ id: 'm2', body: { contentType: 'text', content: 'mine' } })]);
    rerender(
      <App>
        <TeamsChatView chatId={CHAT_ID} />
      </App>,
    );

    expect(pane().scrollTop).toBe(1000);
  });
});
