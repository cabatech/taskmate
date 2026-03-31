/**
 * TaskMate i18n Module
 * Lightweight translation loader for TaskMate custom cards.
 *
 * Usage in a card:
 *   import { localize } from '/local/community/taskmate/taskmate-localize.js';
 *   // or, since cards are served from /taskmate/:
 *   // loaded via window.__taskmate_localize
 *
 *   localize(this.hass, 'common.today')           → "Today"
 *   localize(this.hass, 'common.points_received',
 *     { count: 5, name: 'Stars' })                → "5 Stars received"
 */

const _cache = {};          // lang → { key: value }
const _pending = {};        // lang → Promise
const _BASE = '/taskmate/locales';

/**
 * Load a locale file by language code. Returns cached result if available.
 */
async function _loadLocale(lang) {
  if (_cache[lang]) return _cache[lang];
  if (_pending[lang]) return _pending[lang];

  _pending[lang] = (async () => {
    try {
      const resp = await fetch(`${_BASE}/${lang}.json?v=${Date.now()}`);
      if (!resp.ok) throw new Error(resp.status);
      const data = await resp.json();
      _cache[lang] = data;
      return data;
    } catch {
      // If non-English locale fails, don't cache — try again next time
      if (lang !== 'en') {
        delete _pending[lang];
        return null;
      }
      _cache['en'] = {};
      return {};
    } finally {
      delete _pending[lang];
    }
  })();

  return _pending[lang];
}

/**
 * Synchronous lookup — returns the translated string or the fallback.
 * Triggers async load in the background if the locale isn't cached yet.
 *
 * @param {object} hass - Home Assistant hass object (for hass.language)
 * @param {string} key  - Dot-notation key, e.g. 'common.today'
 * @param {object} [params] - Replacement params, e.g. { count: 5 }
 * @returns {string}
 */
function localize(hass, key, params) {
  const lang = (hass && hass.language) || 'en';

  // Try current language first, fall back to English
  let str = (_cache[lang] && _cache[lang][key]) ||
            (_cache['en'] && _cache['en'][key]) ||
            key;

  // Trigger background load if not cached
  if (!_cache[lang]) _loadLocale(lang);
  if (!_cache['en']) _loadLocale('en');

  // Replace {placeholder} tokens
  if (params && typeof str === 'string') {
    for (const [k, v] of Object.entries(params)) {
      str = str.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v));
    }
  }

  return str;
}

/**
 * Pre-load a locale so translations are ready before first render.
 * Call this in connectedCallback() of your card.
 *
 * @param {object} hass - Home Assistant hass object
 * @returns {Promise<void>}
 */
async function loadTranslations(hass) {
  const lang = (hass && hass.language) || 'en';
  await Promise.all([
    _loadLocale('en'),
    lang !== 'en' ? _loadLocale(lang) : Promise.resolve(),
  ]);
}

// Expose globally so cards can access without ES module imports
// (HA custom cards are loaded as classic scripts, not ES modules)
window.__taskmate_localize = localize;
window.__taskmate_loadTranslations = loadTranslations;
