import type { Settings } from '../shared/types';
import { CSS_VARS, DATA_ATTRS } from '../shared/constants';

function flag(on: boolean): 'on' | 'off' {
  return on ? 'on' : 'off';
}

/**
 * Constant-time application: writes a handful of <html> data-attrs and CSS
 * custom properties. The actual blur is done by rules in blur.css that key off
 * these attrs, so no DOM scan is ever needed when settings change.
 */
export function applySettings(settings: Settings): void {
  const root = document.documentElement;
  root.setAttribute(DATA_ATTRS.master, flag(settings.master));
  root.setAttribute(DATA_ATTRS.featureList, flag(settings.features.list));
  root.setAttribute(DATA_ATTRS.featureHeader, flag(settings.features.header));
  root.setAttribute(DATA_ATTRS.featureMsgs, flag(settings.features.msgs));
  root.style.setProperty(CSS_VARS.radius, `${settings.radiusPx}px`);
  root.style.setProperty(CSS_VARS.delayIn, `${settings.delayMs}ms`);
}
