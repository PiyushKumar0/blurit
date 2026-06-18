import {
  tagSubtree,
  updateLatestMessage,
  tagWhitelistedRows,
  updateCurrentWhitelistedFlag,
} from './tagger';

/**
 * Single MutationObserver rooted at #app. Mutations coalesce into a
 * requestAnimationFrame flush to avoid layout thrash, and are attributed to a
 * region so each scanner only runs when its region actually changed:
 *   - latest-message scan         → only when #main changed
 *   - whitelist row tagging (loop) → only when the chat-list region changed
 *   - current-chat whitelist flag  → either region (cheap single query)
 */
export function startObserver(appRoot: Element): MutationObserver {
  const addedSubtrees = new Set<Node>();
  let mainTouched = false;
  let listTouched = false;
  let frameScheduled = false;

  const markPanes = (node: Node) => {
    if (node.nodeType !== Node.ELEMENT_NODE) return;
    const el = node as Element;
    if (el.closest('#main')) {
      mainTouched = true;
      return;
    }
    if (listTouched) return;
    if (
      el.closest('#side, [data-testid="drawer-left"]') ||
      el.querySelector('[data-testid="archived-chatlist"]')
    ) {
      listTouched = true;
    }
  };

  const flush = () => {
    frameScheduled = false;
    for (const node of addedSubtrees) {
      if (node.nodeType === Node.ELEMENT_NODE) {
        tagSubtree(node as Element);
      }
    }
    addedSubtrees.clear();

    if (mainTouched) updateLatestMessage();
    if (listTouched) tagWhitelistedRows();
    if (mainTouched || listTouched) updateCurrentWhitelistedFlag();

    mainTouched = false;
    listTouched = false;
  };

  const schedule = () => {
    if (frameScheduled) return;
    frameScheduled = true;
    requestAnimationFrame(flush);
  };

  const observer = new MutationObserver((records) => {
    for (const rec of records) {
      if (rec.type !== 'childList') continue;
      markPanes(rec.target);
      for (const node of rec.addedNodes) {
        addedSubtrees.add(node);
        markPanes(node);
      }
    }
    if (mainTouched || listTouched || addedSubtrees.size > 0) schedule();
  });

  observer.observe(appRoot, { childList: true, subtree: true });

  // Initial sweep so anything mounted before we started gets tagged.
  tagSubtree(appRoot);
  updateLatestMessage();
  tagWhitelistedRows();
  updateCurrentWhitelistedFlag();

  return observer;
}
