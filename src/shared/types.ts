export interface FeatureToggles {
  list: boolean;
  header: boolean;
  msgs: boolean;
}

export interface Settings {
  master: boolean;
  features: FeatureToggles;
  radiusPx: number;
  delayMs: number;
}

export type SemanticRole =
  | 'appRoot'
  | 'chatListPane'
  | 'chatListRow'
  | 'searchInput'
  | 'mainConversation'
  | 'chatHeader'
  | 'messageBubble'
  | 'dateSeparator'
  | 'composer';
