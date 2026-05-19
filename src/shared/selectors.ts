import type { SemanticRole } from './types';

/**
 * The ONE place WhatsApp UI churn is fixed. Each role has a fallback chain;
 * the first chain entry returning matches wins.
 *
 * Selector hygiene: every chain is anchored to a stable ID/landmark
 * (#app, #pane-side, #main, header, footer) to avoid stray matches from
 * popovers, dialogs, or extensions.
 */
type SelectorChain = readonly string[];

export const RESOLVERS: Record<SemanticRole, SelectorChain> = {
  appRoot: ['div#app', '[role="application"]'],
  // #pane-side wraps the Archived button + chat list. Chat rows are
  // [role="row"][data-testid^="list-item-N"] inside the inner "Chat list"
  // grid; selection is signalled by aria-selected="true" on a nested div.
  chatListPane: ['div#pane-side'],
  chatListRow: [
    '#pane-side [role="row"][data-testid^="list-item-"]',
    '#pane-side div[aria-label="Chat list"][role="grid"] [role="row"]',
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

export function resolveAll(role: SemanticRole, scope: ParentNode = document): Element[] {
  const chain = RESOLVERS[role];
  for (const selector of chain) {
    try {
      const matches = scope.querySelectorAll(selector);
      if (matches.length > 0) return Array.from(matches);
    } catch {
      // Selectors using :has() or similar may throw on older Chrome — try next.
    }
  }
  return [];
}

export function resolveOne(role: SemanticRole, scope: ParentNode = document): Element | null {
  const all = resolveAll(role, scope);
  return all[0] ?? null;
}
