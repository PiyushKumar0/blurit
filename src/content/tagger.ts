import { DATA_ATTRS, ROLE_VALUES } from '../shared/constants';

/**
 * Stamps data-blurit-role on nodes within a freshly-mounted subtree so the
 * exclusion-style CSS rules (e.g. ":not([data-blurit-role='system'])") can
 * tell apart message rows that should never be blurred.
 *
 * Note: positive blur rules in blur.css key on WhatsApp's own structural
 * selectors directly — we don't need to tag rows we DO want blurred. We only
 * tag the exclusions.
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

function tagComposer(root: ParentNode): void {
  // Composer footer is the most safety-critical no-blur target. Walk first.
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
  const rows = root.querySelectorAll('#main [role="row"]');
  for (const row of rows) {
    if (row.hasAttribute(DATA_ATTRS.role)) continue;
    const dataId = row.getAttribute('data-id') ?? '';
    if (dataId.startsWith('div-')) {
      row.setAttribute(DATA_ATTRS.role, ROLE_VALUES.date);
    }
  }
}
