import { DATA_ATTRS, ROLE_VALUES } from '../shared/constants';
import { CHAT_LIST_ROW_SELECTOR } from '../shared/selectors';

/**
 * Stamps data-blurit-role on nodes within a freshly-mounted subtree so the
 * exclusion-style CSS rules (e.g. ":not([data-blurit-role='system'])") can
 * tell apart message rows that should never be blurred.
 */
export function tagSubtree(root: ParentNode): void {
  tagComposer(root);
  tagSystemAndDate(root);
}

/**
 * Marks the latest (bottom-most) message row in the open conversation with
 * data-blurit-latest="true".
 */
export function updateLatestMessage(): void {
  const candidates = document.querySelectorAll(
    `#main [role="row"]:not([${DATA_ATTRS.role}="date"]):not([${DATA_ATTRS.role}="system"])`,
  );
  const newLatest = candidates[candidates.length - 1] ?? null;
  const oldLatest = document.querySelector(`#main [${DATA_ATTRS.latest}="true"]`);

  if (oldLatest && oldLatest !== newLatest) {
    oldLatest.removeAttribute(DATA_ATTRS.latest);
  }
  if (newLatest && oldLatest !== newLatest) {
    newLatest.setAttribute(DATA_ATTRS.latest, 'true');
  }
}

/**
 * Whitelist state - updated by blur-engine when settings change.
 * Names are lowercased for case-insensitive matching against [title] attrs.
 */
let activeWhitelist = new Set<string>();

export function setWhitelist(names: string[]): void {
  activeWhitelist = new Set(names.map((n) => n.trim().toLowerCase()));
}

export function tagWhitelistedRows(): void {
  if (activeWhitelist.size === 0) {
    for (const el of document.querySelectorAll(`[${DATA_ATTRS.whitelisted}="true"]`)) {
      el.removeAttribute(DATA_ATTRS.whitelisted);
    }
    return;
  }

  const rows = document.querySelectorAll(CHAT_LIST_ROW_SELECTOR);
  for (const row of rows) {
    const title = readChatName(row);
    const isWhitelisted = title !== null && activeWhitelist.has(title.toLowerCase());
    if (isWhitelisted) {
      if (!row.hasAttribute(DATA_ATTRS.whitelisted)) {
        row.setAttribute(DATA_ATTRS.whitelisted, 'true');
      }
    } else if (row.hasAttribute(DATA_ATTRS.whitelisted)) {
      row.removeAttribute(DATA_ATTRS.whitelisted);
    }
  }
}

export function updateCurrentWhitelistedFlag(): void {
  const root = document.documentElement;
  let isWhitelisted = false;

  if (activeWhitelist.size > 0) {
    const selected = document.querySelector(
      ':is(#side, [data-testid="archived-chatlist"]) ' +
        ':is([role="listitem"], [role="row"]):has([aria-selected="true"])',
    );
    const title = selected ? readChatName(selected) : null;
    isWhitelisted = title !== null && activeWhitelist.has(title.toLowerCase());
  }

  if (isWhitelisted) {
    if (root.getAttribute(DATA_ATTRS.currentWhitelisted) !== 'on') {
      root.setAttribute(DATA_ATTRS.currentWhitelisted, 'on');
    }
  } else if (root.hasAttribute(DATA_ATTRS.currentWhitelisted)) {
    root.removeAttribute(DATA_ATTRS.currentWhitelisted);
  }
}

function readChatName(row: Element): string | null {
  // WhatsApp puts the contact name in a [title] span inside the row.
  const titled = row.querySelector('[title]');
  const t = titled?.getAttribute('title');
  return t && t.trim() ? t.trim() : null;
}

function tagComposer(root: ParentNode): void {
  // Composer footer is the most safety-critical no-blur target. Walk first.
  // querySelectorAll only sees descendants, so also check root itself: an
  // observer can hand us a freshly-inserted <footer> as the subtree root.
  if (root instanceof Element && root.matches('#main footer')) {
    root.setAttribute(DATA_ATTRS.role, ROLE_VALUES.composer);
  }
  const footers = root.querySelectorAll('#main footer');
  for (const el of footers) {
    el.setAttribute(DATA_ATTRS.role, ROLE_VALUES.composer);
  }
}

function tagSystemAndDate(root: ParentNode): void {
  // POSITIVE-ONLY tagging. Earlier code tagged rows as `system` when their
  // children hadn't reconciled yet, which made them permanently unblurred
  // once the message bubble landed. Default-blur is the safe direction.
  // Add a positive `system` tagger here only when we have a verified signal.
  const tagRow = (row: Element): void => {
    if (row.hasAttribute(DATA_ATTRS.role)) return;
    const dataId = row.getAttribute('data-id') ?? '';
    if (dataId.startsWith('div-')) {
      row.setAttribute(DATA_ATTRS.role, ROLE_VALUES.date);
    }
  };
  // querySelectorAll only sees descendants, so also check root itself: the
  // observer can hand us a freshly-inserted [role="row"] as the subtree root.
  if (root instanceof Element && root.matches('#main [role="row"]')) {
    tagRow(root);
  }
  for (const row of root.querySelectorAll('#main [role="row"]')) {
    tagRow(row);
  }
}
