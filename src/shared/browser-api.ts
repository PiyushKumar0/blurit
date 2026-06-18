// Single-source extension API alias. Firefox exposes the promisified API as
// `browser`; Chrome exposes the same shape (post-MV3) as `chrome`. Firefox
// also aliases `chrome` to `browser` for portability, but reading the source
// as `api.*` keeps it honest in places like commands.update/reset, which
// simply don't exist on Chrome's runtime even though @types/chrome includes
// them.
//
// We deliberately do NOT use webextension-polyfill. Every API surface we
// touch (storage.sync, storage.onChanged, commands, tabs.create) already
// returns Promises on both engines.

// @types/chrome (currently 0.0.260) predates `commands.update`/`reset`,
// which Firefox supports but Chrome's runtime does not. Augment locally so
// the popup's rebind controller typechecks without a dep bump. Calls are
// gated by `supportsCommandsRebind` at runtime, so this never invokes on
// Chrome. Namespace merging is the canonical extension mechanism for
// @types/chrome; the ESLint rule against namespaces doesn't fit here.
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace chrome.commands {
    function update(details: {
      name: string;
      description?: string;
      shortcut?: string;
    }): Promise<void>;
    function reset(name: string): Promise<void>;
  }
}

const api: typeof chrome =
  (globalThis as { browser?: typeof chrome }).browser ?? globalThis.chrome;

// Firefox-only capability flag: both `update` and `reset` ship together in
// Firefox. Gating the rebind UI on a single derived boolean avoids drift
// where one is detected and the other isn't.
//
// Use `typeof === 'function'` rather than `in` so a future Proxy-wrapped
// namespace exposing the property as a non-callable still gets treated as
// unsupported (no silent runtime crash when we try to call).
type CommandsRebindable = typeof chrome.commands & {
  update: (details: { name: string; shortcut?: string }) => Promise<void>;
  reset: (name: string) => Promise<void>;
};
const commandsNs = api?.commands as Partial<CommandsRebindable> | undefined;
export const supportsCommandsRebind: boolean =
  typeof commandsNs?.update === 'function' && typeof commandsNs?.reset === 'function';

export default api;
