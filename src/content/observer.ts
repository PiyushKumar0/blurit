import { tagSubtree } from './tagger';

/**
 * Single MutationObserver rooted at #app. Mutations coalesce into a
 * requestAnimationFrame flush to avoid layout thrash. The flush walks added
 * subtrees to stamp exclusion roles (composer, date separators). Selected-row
 * exclusion is done in CSS via :has([aria-selected="true"]) — no JS tracking
 * needed.
 *
 * Budget: target ≤ 4ms/frame on a 200-row list.
 */
export function startObserver(appRoot: Element): MutationObserver {
  const addedSubtrees = new Set<Node>();
  let frameScheduled = false;

  const flush = () => {
    frameScheduled = false;
    for (const node of addedSubtrees) {
      if (node.nodeType === Node.ELEMENT_NODE) {
        tagSubtree(node as Element);
      }
    }
    addedSubtrees.clear();
  };

  const schedule = () => {
    if (frameScheduled) return;
    frameScheduled = true;
    requestAnimationFrame(flush);
  };

  const observer = new MutationObserver((records) => {
    for (const rec of records) {
      if (rec.type !== 'childList') continue;
      for (const node of rec.addedNodes) addedSubtrees.add(node);
    }
    schedule();
  });

  observer.observe(appRoot, { childList: true, subtree: true });

  // Initial sweep so anything mounted before we started gets tagged.
  tagSubtree(appRoot);

  return observer;
}
