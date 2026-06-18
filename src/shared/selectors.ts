import type { SemanticRole } from './types';

/**
 * The ONE place WhatsApp UI churn is fixed. Each role has a fallback chain;
 * the first chain entry returning matches wins.
 *
 * Selector hygiene: every chain is anchored to a stable ID/landmark
 * (#app, #side, #pane-side, #main, header, footer) to avoid stray matches from
 * popovers, dialogs, or extensions.
 */
type SelectorChain = readonly string[];

export const RESOLVERS: Record<SemanticRole, SelectorChain> = {
  appRoot: ['div#app', '[role="application"]'],
  // Chat rows live in TWO separate places:
  //   1. The main list + search results: inside #side (the left column).
  //     These rows are [role="row"] (legacy builds added data-testid^="list-item-").
  //   2. The Archived view: a left DRAWER mounted OUTSIDE #side, under
  //     [data-testid="drawer-left"]; its list container is
  //     [data-testid="archived-chatlist"] and its rows are [role="listitem"].
  // Selection is signalled by aria-selected="true" on a nested div.
  chatListPane: ['div#side', 'div[data-testid="archived-chatlist"]', 'div#pane-side'],
  chatListRow: [
    '#side [role="listitem"]',
    '#side [role="row"]',
    '[data-testid="archived-chatlist"] [role="listitem"]',
    '[data-testid="archived-chatlist"] [role="row"]',
    '#pane-side [role="row"][data-testid^="list-item-"]',
  ],
  searchInput: [
    'div[contenteditable="true"][role="textbox"][data-tab="3"]',
    '[aria-label*="search" i][role="textbox"]',
  ],
  mainConversation: ['div#main', '[role="main"]'],
  chatHeader: [
    '#main header',
    '#main [data-testid="conversation-header"]',
    '#main > div:first-child[role="banner"]',
  ],
  messageBubble: [
    '#main [role="row"]',
    '#main div[data-id^="false_"]',
    '#main div[data-id^="true_"]',
  ],
  dateSeparator: ['#main [role="row"][data-id^="div-"]'],
  composer: ['#main footer', '#main [data-tab="10"]'],
};

export const CHAT_LIST_ROW_SELECTOR =
  ':is(#side, [data-testid="archived-chatlist"]) :is([role="listitem"], [role="row"])';

export function resolveAll(role: SemanticRole, scope: ParentNode = document): Element[] {
  const chain = RESOLVERS[role];
  for (const selector of chain) {
    try {
      const matches = scope.querySelectorAll(selector);
      if (matches.length > 0) return Array.from(matches);
    } catch {
      // Selectors using :has() or similar may throw on older Chrome, try next.
    }
  }
  return [];
}

export function resolveOne(role: SemanticRole, scope: ParentNode = document): Element | null {
  const all = resolveAll(role, scope);
  return all[0] ?? null;
}
