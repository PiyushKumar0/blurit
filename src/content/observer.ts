import {
  tagSubtree,
  updateLatestMessage,
  tagWhitelistedRows,
  updateCurrentWhitelistedFlag,
} from './tagger';

/**
 * Single MutationObserver rooted at #app. Mutations coalesce into a
 * requestAnimationFrame flush to avoid layout thrash, and are attributed to a
 * pane (#main vs #pane-side) so each scanner only runs when its pane actually
 * changed:
 *   - latest-message scan         → only when #main changed
 *   - whitelist row tagging (loop) → only when #pane-side changed
 *   - current-chat whitelist flag  → either pane (cheap single query)
 */
export function startObserver(appRoot: Element): MutationObserver {
  const addedSubtrees = new Set<Node>();
  let mainTouched = false;
  let paneSideTouched = false;
  let frameScheduled = false;

  const markPanes = (node: Node) => {
    if (node.nodeType !== Node.ELEMENT_NODE) return;
    const el = node as Element;
    if (!mainTouched && el.closest('#main')) mainTouched = true;
    if (!paneSideTouched && el.closest('#pane-side')) paneSideTouched = true;
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
    if (paneSideTouched) tagWhitelistedRows();
    if (mainTouched || paneSideTouched) updateCurrentWhitelistedFlag();

    mainTouched = false;
    paneSideTouched = false;
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
    if (mainTouched || paneSideTouched || addedSubtrees.size > 0) schedule();
  });

  observer.observe(appRoot, { childList: true, subtree: true });

  // Initial sweep so anything mounted before we started gets tagged.
  tagSubtree(appRoot);
  updateLatestMessage();
  tagWhitelistedRows();
  updateCurrentWhitelistedFlag();

  return observer;
}
