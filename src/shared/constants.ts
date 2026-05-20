export const STORAGE_KEY = 'blurit';

export const DATA_ATTRS = {
  master: 'data-blurit-master',
  featureList: 'data-blurit-feature-list',
  featureHeader: 'data-blurit-feature-header',
  featureMsgs: 'data-blurit-feature-msgs',
  role: 'data-blurit-role',
} as const;

export const CSS_VARS = {
  radius: '--blurit-radius',
  delayIn: '--blurit-delay-in',
  delayOut: '--blurit-delay-out',
  transition: '--blurit-transition',
} as const;

export const ROLE_VALUES = {
  chatRow: 'chat-row',
  chatHeader: 'chat-header',
  composer: 'composer',
  system: 'system',
  date: 'date',
  messageBubble: 'message-bubble',
} as const;

export const COMMAND_TOGGLE_MASTER = 'toggle-master';
