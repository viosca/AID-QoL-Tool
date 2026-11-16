// ==UserScript==
// @name         AID-QoL-Tool
// @version      3.7.0
// @description  Modular Quality-of-Life enhancements for AI Dungeon (Auto-quoting, Hotkeys, Action Toggle, Story Card & Context Modals, Game Menu Resizing, Theme & Typography Manager, Antigravity Dev Bridge).
// @author       viosca
// @match        https://*.aidungeon.com/*
// @icon         https://play-lh.googleusercontent.com/ALmVcUVvR8X3q-hOUbcR7S__iicLgIWDwM9K_9PJy87JnK1XfHSi_tp1sUlJJBVsiSc
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_registerMenuCommand
// @grant        GM_addStyle
// @grant        GM_setClipboard
// @grant        GM_xmlhttpRequest
// @connect      127.0.0.1
// @connect      localhost
// @license      MIT
// @namespace    https://github.com/viosca/AID-QoL-Tool/tree/main
// @downloadURL  https://github.com/viosca/AID-QoL-Tool/raw/main/AID-QoL-Tool.user.js
// @updateURL    https://github.com/viosca/AID-QoL-Tool/raw/main/AID-QoL-Tool.user.js
// @run-at       document-idle
// ==/UserScript==

(function () {
  'use strict';

  // =========================================================================
  // Configuration & State
  // =========================================================================
  const DEFAULT_CONFIG = {
    // Theme & Typography Manager
    themePreset: 'default', // 'default', 'compact', 'large', 'oled', 'custom'
    themeFontSize: '18px',
    themeFontWeight: '400',
    themeLineHeight: '1.7',
    themeParagraphSpacing: '1.25em',
    themeStoryWidth: '900px',
    themeTextColor: '', // empty = native AID text color
    themeBgColor: '',   // empty = native AID background color
    themeActionStyle: 'default', // 'default', 'dimmed', 'italic', 'accent', 'italic-accent', 'underlined'
    themeActionColor: '#fb923c',
    themeUiDensity: 'default', // 'default', 'compact', 'ultra', 'custom'
    themeCardHeight: '64px',
    themeMenuSpacing: '12px',
    themeMenuFontSize: '14px',
    themeTextareaHeight: '96px',

    // Input Preferences
    autoQuoteDo: true,
    autoFocusInput: true,

    // Action Row Visibility
    actionsVisible: true,

    // Story Card Modals
    storyCardModalsEnabled: true,
    scModalWidth: '680px',
    scModalHeight: '82vh',
    rememberSCSize: true,

    // Context Viewer Modal
    contextModalEnabled: true,
    contextModalWidth: '480px',
    contextModalHeight: 'auto',
    rememberContextSize: true,

    // Modal Backdrops & Overlays
    disableModalDimming: true,

    // Game Menu (Right Sidebar) Resizing
    gameMenuResizeEnabled: true,
    gameMenuWidth: '424px',

    // Textarea Vertical Resizing
    textareaResizeEnabled: true,

    // Hotkeys & Modifiers
    hotkeysEnabled: true,
    hotkeyModifierAlt: true,
    hotkeyModifierCtrl: true,
    hotkeyModifierShift: false,

    // Hotkey Action Characters (Single uppercase characters)
    keyTakeTurn: 'C',
    keyContinue: 'A',
    keyRetry: 'S',
    keyRetryHistory: 'X',
    keyErase: 'D',
    keyModeDo: 'Q',
    keyModeSay: 'W',
    keyModeStory: 'E',
    keyModeSee: 'R',
    keyToggleActions: 'U',
    keyGameMenu: 'F',
    keyScrollTop: 'H',
    keyToggleSite: 'T',
    keyUserProfile: 'G',
    keyContinueAdventure: 'V',
    keyCharacterName: 'Z',
    keyOpenSettings: ',',

    // Diagnostics
    debugLogging: false
  };

  const CONFIG = {
    get(key, defaultValue) {
      const fallback = defaultValue !== undefined ? defaultValue : DEFAULT_CONFIG[key];
      return GM_getValue(key, fallback);
    },
    set(key, value) {
      GM_setValue(key, value);
    },
    resetToDefaults() {
      for (const [key, val] of Object.entries(DEFAULT_CONFIG)) {
        GM_setValue(key, val);
      }
    }
  };

  // Register Tampermonkey menu commands
  GM_registerMenuCommand(
    '⚙️ Configure Settings (Hotkeys, Sizes, Toggles)',
    () => {
      ConfigUIModule.open();
    }
  );

  GM_registerMenuCommand(
    `Hotkeys: ${CONFIG.get('hotkeysEnabled') ? 'ENABLED' : 'DISABLED'} (Click to toggle)`,
    () => {
      CONFIG.set('hotkeysEnabled', !CONFIG.get('hotkeysEnabled'));
      location.reload();
    }
  );

  GM_registerMenuCommand(
    `Action Visibility: ${CONFIG.get('actionsVisible') ? 'VISIBLE (A+)' : 'HIDDEN (A-)'} (Click to toggle)`,
    () => {
      ActionToggleModule.toggle();
    }
  );

  GM_registerMenuCommand(
    `Story Card Modals: ${CONFIG.get('storyCardModalsEnabled') ? 'ENABLED' : 'DISABLED'} (Click to toggle)`,
    () => {
      CONFIG.set('storyCardModalsEnabled', !CONFIG.get('storyCardModalsEnabled'));
      location.reload();
    }
  );

  GM_registerMenuCommand(
    `Context Viewer Modal: ${CONFIG.get('contextModalEnabled') ? 'ENABLED' : 'DISABLED'} (Click to toggle)`,
    () => {
      CONFIG.set('contextModalEnabled', !CONFIG.get('contextModalEnabled'));
      location.reload();
    }
  );

  GM_registerMenuCommand(
    `Modal Background Dimming: ${CONFIG.get('disableModalDimming', true) ? 'REMOVED' : 'DEFAULT'} (Click to toggle)`,
    () => {
      const next = !CONFIG.get('disableModalDimming', true);
      CONFIG.set('disableModalDimming', next);
      StoryCardModalModule.updateModalDimmingState();
      ConfigUIModule.showToast(`Modal Dimming: ${next ? 'REMOVED' : 'DEFAULT'}`);
    }
  );

  GM_registerMenuCommand(
    `Textarea Resizing: ${CONFIG.get('textareaResizeEnabled') ? 'ENABLED' : 'DISABLED'} (Click to toggle)`,
    () => {
      const next = !CONFIG.get('textareaResizeEnabled');
      CONFIG.set('textareaResizeEnabled', next);
      TextareaResizeModule.updateStyles();
      ConfigUIModule.showToast(`Textarea Resizing: ${next ? 'ENABLED' : 'DISABLED'}`);
    }
  );

  GM_registerMenuCommand(
    `Debug Logs: ${CONFIG.get('debugLogging') ? 'ENABLED' : 'DISABLED'} (Click to toggle)`,
    () => {
      CONFIG.set('debugLogging', !CONFIG.get('debugLogging'));
      location.reload();
    }
  );

  // =========================================================================
  // Logger
  // =========================================================================
  const Logger = {
    prefix: '[AID-QoL]',
    log(...args) {
      if (CONFIG.get('debugLogging')) {
        console.log(this.prefix, ...args);
      }
    },
    info(...args) {
      console.info(this.prefix, ...args);
    },
    warn(...args) {
      console.warn(this.prefix, ...args);
    },
    error(...args) {
      console.error(this.prefix, ...args);
    }
  };

  // =========================================================================
  // DOM & Event Utilities
  // =========================================================================

  /**
   * Dispatches complete pointer + mouse + click events for Tamagui & React.
   * Ensures handlers like `onPress` fire even when elements aren't standard buttons.
   *
   * @param {HTMLElement} element
   * @returns {boolean} True if element was found and clicked
   */
  function triggerClick(element) {
    if (!element) return false;
    try {
      element.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, cancelable: true }));
      element.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true }));
      element.dispatchEvent(new PointerEvent('pointerup', { bubbles: true, cancelable: true }));
      element.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, cancelable: true }));
      element.click();
      return true;
    } catch (err) {
      Logger.warn('triggerClick error:', err);
      element.click();
      return true;
    }
  }

  /**
   * Sets value on React controlled inputs (React 16-19 compatible).
   * Overrides native prototype setter and dispatches synthetic events.
   *
   * @param {HTMLInputElement|HTMLTextAreaElement} element
   * @param {string} value
   */
  function setNativeValue(element, value) {
    if (!element) return;

    const proto = Object.getPrototypeOf(element);
    const descriptor = Object.getOwnPropertyDescriptor(proto, 'value');
    const setter = descriptor?.set;

    if (setter) {
      setter.call(element, value);
    } else {
      element.value = value;
    }

    // React value-tracker hook (ensures React recognizes the change)
    if (element._valueTracker) {
      element._valueTracker.setValue(value === '' ? ' ' : '');
    }

    // Dispatch input and change events for synthetic React listeners
    element.dispatchEvent(new InputEvent('input', { bubbles: true, composed: true }));
    element.dispatchEvent(new Event('change', { bubbles: true, composed: true }));
  }

  /**
   * Watches for elements matching a selector to appear in the DOM.
   * Handles SPA client-side routing and dynamic rendering without external libraries.
   *
   * @param {string} selector
   * @param {function(HTMLElement): void} callback
   */
  function observeSelector(selector, callback) {
    const processedElements = new WeakSet();

    function checkNode(node) {
      if (!node || node.nodeType !== Node.ELEMENT_NODE) return;
      if (node.matches(selector) && !processedElements.has(node)) {
        processedElements.add(node);
        callback(node);
      }
      const matches = node.querySelectorAll(selector);
      matches.forEach(el => {
        if (!processedElements.has(el)) {
          processedElements.add(el);
          callback(el);
        }
      });
    }

    // Check existing DOM elements
    document.querySelectorAll(selector).forEach(el => {
      processedElements.add(el);
      callback(el);
    });

    // Observe future DOM mutations
    const observer = new MutationObserver(mutations => {
      for (const mutation of mutations) {
        mutation.addedNodes.forEach(checkNode);
      }
    });

    observer.observe(document.body, { childList: true, subtree: true });
    return observer;
  }

  /**
   * Utility for executing an async sequence of functions with delay between steps.
   *
   * @param {Array<function(): void>} steps
   * @param {number} delayMs
   */
  async function executeSequence(steps, delayMs = 60) {
    for (const step of steps) {
      try {
        step();
      } catch (err) {
        Logger.warn('Step failed in sequence:', err);
      }
      if (delayMs > 0) {
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
    }
  }

  // =========================================================================
  // Feature Module 1: Story Input Tweaks
  // =========================================================================
  const StoryInputModule = {
    name: 'Story Input Tweaks',
    optedOutQuotes: false,
    lastSeenMode: null,

    init() {
      Logger.info('Initializing StoryInputModule...');

      // 1. Target main gameplay textarea (#game-text-input)
      observeSelector('#game-text-input', (textarea) => {
        Logger.log('Found #game-text-input element:', textarea);
        this.attachToGameplayInput(textarea);
      });

      // 2. Target scenario start / full screen input (#full-screen-text-input)
      observeSelector('#full-screen-text-input', (input) => {
        if (!CONFIG.get('autoFocusInput')) return;
        Logger.log('Found #full-screen-text-input, focusing...');
        setTimeout(() => {
          input.focus();
        }, 100);
      });
    },

    /**
     * Determines whether the game is currently in "Do" mode.
     * Checks both the textarea placeholder and the mode switcher button.
     * @param {HTMLTextAreaElement} textarea
     * @returns {boolean}
     */
    isDoMode(textarea) {
      const placeholder = (textarea?.getAttribute('placeholder') || '').toLowerCase();
      if (placeholder.includes('what do you do') || placeholder.startsWith('do')) {
        return true;
      }
      const modeBtn = document.querySelector('[aria-label="Change input mode" i]');
      if (modeBtn) {
        // AI Dungeon's mode button contains chevron icons and the mode name.
        // We look for a non-icon text element or test with word boundaries.
        const labelEl = modeBtn.querySelector('[class*="Text"]:not([class*="font_icons"]), span:not([class*="font_icons"])');
        const modeText = labelEl ? labelEl.textContent.trim().toLowerCase() : (modeBtn.innerText || modeBtn.textContent).trim().toLowerCase();
        if (modeText === 'do' || /\bdo\b/i.test(modeText)) {
          return true;
        }
      }
      return false;
    },

    /**
     * Places the cursor strictly between the quotes (index 1) in the Do textarea.
     * Staggers calls across requestAnimationFrame and timeouts to override native
     * mouseup/click caret positioning and React synthetic event updates.
     *
     * @param {HTMLTextAreaElement} textarea
     * @param {boolean} forceFocus - whether to ensure the textarea is focused
     */
    setCaretBetweenQuotes(textarea, forceFocus = true) {
      if (!textarea) return;

      const doSet = () => {
        try {
          // Only operate if the value is empty quotes (ignoring whitespace)
          if (textarea.value.replace(/\s+/g, '') === '""') {
            if (forceFocus && document.activeElement !== textarea) {
              // Don't steal focus if user is actively in another text input or modal dialog
              const active = document.activeElement;
              const isOtherInput = active && active !== textarea && (
                active.tagName === 'INPUT' ||
                active.tagName === 'TEXTAREA' ||
                active.isContentEditable ||
                active.closest?.('[role="dialog"], [role="alertdialog"]')
              );
              if (!isOtherInput) {
                textarea.focus();
              }
            }
            textarea.setSelectionRange(1, 1);
          }
        } catch (_) {}
      };

      doSet();
      requestAnimationFrame(doSet);
      setTimeout(doSet, 10);
      setTimeout(doSet, 40);
      setTimeout(doSet, 100);
      setTimeout(doSet, 250);
    },

    /**
     * Toggles quotation marks on or off for the given textarea.
     * If quotes are present (empty "" or wrapped around text), strips them.
     * If quotes are absent, wraps text in quotes (or inserts "" if empty).
     *
     * @param {HTMLTextAreaElement} textarea
     */
    toggleQuotes(textarea) {
      if (!textarea) return;

      const val = textarea.value;
      const cleanVal = val.replace(/\s+/g, '');

      // 1. Empty quotes ("") -> strip completely to empty string
      if (cleanVal === '""') {
        setNativeValue(textarea, '');
        this.optedOutQuotes = true;
        textarea.focus();
        Logger.log('Ctrl+U: Cleared empty quotes (opted out of quotes for turn)');
        return;
      }

      // 2. Already wrapped in outer quotes -> strip outer quotes
      const trimmed = val.trim();
      if (trimmed.startsWith('"') && trimmed.endsWith('"') && trimmed.length >= 2) {
        // Strip the outermost matching quote pair
        const firstQuote = val.indexOf('"');
        const lastQuote = val.lastIndexOf('"');
        const unquoted = val.substring(0, firstQuote) + val.substring(firstQuote + 1, lastQuote) + val.substring(lastQuote + 1);
        const start = Math.max(0, textarea.selectionStart - 1);
        const end = Math.max(0, textarea.selectionEnd - 1);
        setNativeValue(textarea, unquoted);
        this.optedOutQuotes = true;
        setTimeout(() => {
          try {
            textarea.focus();
            textarea.setSelectionRange(start, end);
          } catch (_) {}
        }, 20);
        Logger.log('Ctrl+U: Stripped outer quotes (opted out of quotes for turn)');
        return;
      }

      // 3. Completely empty input -> add empty quotes and place caret between them
      if (cleanVal === '') {
        setNativeValue(textarea, '""');
        this.optedOutQuotes = false;
        this.setCaretBetweenQuotes(textarea, true);
        Logger.log('Ctrl+U: Added empty quotes (opted in for turn)');
        return;
      }

      // 4. Has unquoted text -> wrap in quotes
      const start = textarea.selectionStart + 1;
      const end = textarea.selectionEnd + 1;
      setNativeValue(textarea, `"${val}"`);
      this.optedOutQuotes = false;
      setTimeout(() => {
        try {
          textarea.focus();
          textarea.setSelectionRange(start, end);
        } catch (_) {}
      }, 20);
      Logger.log('Ctrl+U: Wrapped text in quotes (opted in for turn)');
    },

    /**
     * Binds quote management, event listeners, and observers to the story input textarea.
     * @param {HTMLTextAreaElement} textarea
     */
    attachToGameplayInput(textarea) {
      const applyQuotesLogic = () => {
        if (!CONFIG.get('autoQuoteDo')) return;

        const inDoMode = this.isDoMode(textarea);
        const currentMode = inDoMode ? 'do' : 'other';

        // Reset opt-out state when changing modes
        if (this.lastSeenMode !== null && this.lastSeenMode !== currentMode) {
          this.optedOutQuotes = false;
        }
        this.lastSeenMode = currentMode;

        const val = textarea.value;
        const cleanVal = val.replace(/\s+/g, '');

        if (inDoMode) {
          // If user has opted out of quotes on this turn, do not re-insert or wrap
          if (this.optedOutQuotes) return;

          if (cleanVal === '') {
            // Completely empty input in Do mode -> insert quotes and place cursor inside
            setNativeValue(textarea, '""');
            this.setCaretBetweenQuotes(textarea, true);
            Logger.log('Auto-quoted empty Do action');
          } else if (cleanVal === '""') {
            // Already contains empty quotes -> ensure normalized value and keep cursor inside
            if (val !== '""') {
              setNativeValue(textarea, '""');
            }
            this.setCaretBetweenQuotes(textarea, false);
          }
          // Note: If user has entered text, we never forcibly auto-wrap.
          // Pure WYSIWYG: what is in the box is what gets sent.
        } else {
          // Switched away from "Do" mode -> remove empty quotes if left behind
          if (cleanVal === '""') {
            setNativeValue(textarea, '');
            setTimeout(() => {
              try {
                textarea.focus();
              } catch (_) {}
            }, 30);
            Logger.log('Cleaned leftover quotes on mode switch');
          }
        }
      };

      // Periodic check after submitting turns to ensure the new empty turn is quoted and cursor positioned
      const checkPostSubmit = () => {
        this.optedOutQuotes = false;
        const checkDelays = [100, 250, 500, 800, 1200, 1800, 2600, 3600, 5000];
        checkDelays.forEach(delay => {
          setTimeout(() => {
            if (this.isDoMode(textarea)) {
              const clean = textarea.value.replace(/\s+/g, '');
              if (clean === '' || clean === '""') {
                applyQuotesLogic();
              }
            }
          }, delay);
        });
      };

      // 1. Initial check (staggered to catch slow React hydration)
      [50, 150, 350, 700].forEach(delay => setTimeout(applyQuotesLogic, delay));

      // 2. Watch for mode, placeholder, class, disabled, style, or readonly attribute changes
      const attrObserver = new MutationObserver((mutations) => {
        for (const mutation of mutations) {
          const name = (mutation.attributeName || '').toLowerCase();
          if (['placeholder', 'disabled', 'class', 'style', 'readonly'].includes(name)) {
            applyQuotesLogic();
          }
        }
      });
      attrObserver.observe(textarea, {
        attributes: true,
        attributeFilter: ['placeholder', 'disabled', 'class', 'style', 'readonly']
      });

      // 3. User interaction events: Focus, Click, MouseUp, PointerUp
      // If user clicks anywhere into an empty quote pair (""), force cursor between quotes
      const handleUserFocusOrClick = () => {
        if (!CONFIG.get('autoQuoteDo')) return;
        if (!this.isDoMode(textarea)) return;
        if (this.optedOutQuotes) return;

        const cleanVal = textarea.value.replace(/\s+/g, '');
        if (cleanVal === '' || cleanVal === '""') {
          if (textarea.value !== '""') {
            setNativeValue(textarea, '""');
          }
          this.setCaretBetweenQuotes(textarea, true);
        }
      };

      textarea.addEventListener('focus', handleUserFocusOrClick);
      textarea.addEventListener('click', handleUserFocusOrClick);
      textarea.addEventListener('mouseup', handleUserFocusOrClick);
      textarea.addEventListener('pointerup', handleUserFocusOrClick);

      // 4. Keyboard shortcuts & Turn submission
      textarea.addEventListener('keydown', (e) => {
        // Ctrl+U / Cmd+U: Toggle quotes on/off (intercepts browser "View Source")
        if ((e.ctrlKey || e.metaKey) && !e.altKey && !e.shiftKey && e.key.toLowerCase() === 'u') {
          e.preventDefault();
          e.stopPropagation();
          this.toggleQuotes(textarea);
          return;
        }

        // Backspace on empty quotes: delete quotes and opt out of quotes for this turn
        if (e.key === 'Backspace' && !e.ctrlKey && !e.altKey && !e.metaKey) {
          if (this.isDoMode(textarea)) {
            const cleanVal = textarea.value.replace(/\s+/g, '');
            if (cleanVal === '""') {
              e.preventDefault();
              setNativeValue(textarea, '');
              this.optedOutQuotes = true;
              textarea.focus();
              Logger.log('Backspace on empty quotes: Cleared quotes and opted out for turn');
              return;
            }
          }
        }

        // Turn submission via Enter key
        if (e.key === 'Enter' && !e.shiftKey && !e.altKey && !e.ctrlKey && !e.metaKey) {
          // Pure WYSIWYG: never modify or wrap user input on submission!
          this.optedOutQuotes = false;
          checkPostSubmit();
        }
      });

      // 5. Global clicks on Submit / Take Turn / Mode switch buttons
      document.addEventListener('click', (e) => {
        const target = e.target;
        if (!target) return;

        // Mode switch buttons or dropdown options
        if (target.closest('[aria-label="Change input mode" i], [aria-label*="mode" i]')) {
          this.optedOutQuotes = false;
          [60, 150, 300].forEach(delay => setTimeout(applyQuotesLogic, delay));
        }

        // Submit action button / Paper plane / Take a turn
        if (target.closest('[data-fs-element="AID Submit" i], [aria-label="Submit action" i], [aria-label="Command: take a turn" i]')) {
          // Pure WYSIWYG: never modify or wrap user input on submission!
          this.optedOutQuotes = false;
          checkPostSubmit();
        }
      }, { passive: true });

      // 6. Auto-focus input when returning to the gameplay view
      if (CONFIG.get('autoFocusInput')) {
        setTimeout(() => {
          try {
            if (this.isDoMode(textarea) && !this.optedOutQuotes && textarea.value.replace(/\s+/g, '') === '""') {
              this.setCaretBetweenQuotes(textarea, true);
            } else {
              textarea.focus();
            }
          } catch (_) {}
        }, 150);
      }
    }
  };

  // =========================================================================
  // Feature Module 2: Hotkeys & Keyboard Navigation
  // =========================================================================
  const HotkeysModule = {
    name: 'Hotkeys & Navigation',

    isMac: navigator.userAgentData?.platform?.toLowerCase().includes('mac') ||
           navigator.platform?.toLowerCase().includes('mac'),

    isTypingContext(target) {
      if (!target) return false;
      return target.isContentEditable ||
             ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName);
    },

    init() {
      Logger.info('Initializing HotkeysModule...');
      document.addEventListener('keydown', (e) => this.handleKeyDown(e));
    },

    handleKeyDown(e) {
      if (!CONFIG.get('hotkeysEnabled') || e.repeat) return;

      const key = e.key.toUpperCase();

      // Check configured modifier keys
      const reqAlt = CONFIG.get('hotkeyModifierAlt', true);
      const reqCtrl = CONFIG.get('hotkeyModifierCtrl', true);
      const reqShift = CONFIG.get('hotkeyModifierShift', false);

      const ctrlOrCmd = this.isMac ? e.metaKey : e.ctrlKey;
      const modifsActive =
        (e.altKey === reqAlt) &&
        (ctrlOrCmd === reqCtrl) &&
        (e.shiftKey === reqShift);

      // Dialog navigation (ArrowLeft / Enter / ArrowRight when modal dialog is active)
      const selectKeys = ['ARROWLEFT', 'ENTER', 'ARROWRIGHT'];
      if (selectKeys.includes(key)) {
        const dialog = document.querySelector('[role="dialog"], [role="alertdialog"]');
        if (dialog) {
          const buttons = dialog.querySelectorAll('[role="button"], button');
          const btnIndex = selectKeys.indexOf(key);
          if (buttons[btnIndex]) {
            e.preventDefault();
            triggerClick(buttons[btnIndex]);
            return;
          }
        }
      }

      // Settings dialog hotkey (Alt+Ctrl+,)
      const settingsKey = String(CONFIG.get('keyOpenSettings', ',')).toUpperCase();
      if (modifsActive && (key === settingsKey || e.key === settingsKey)) {
        e.preventDefault();
        ConfigUIModule.open();
        return;
      }

      // If user is actively typing in a field and no modifiers are pressed, ignore
      if (this.isTypingContext(e.target) && !e.ctrlKey && !e.metaKey && !e.altKey) {
        return;
      }

      // Modifier-based Hotkeys
      if (!modifsActive) return;

      const fullURL = window.location.href;
      const isPlayPage = fullURL.includes('/play');

      // Configurable action mappings
      const keyMap = [
        // Gameplay Turn Commands
        { key: CONFIG.get('keyTakeTurn'), isPlay: true, action: () => this.triggerSelector('[aria-label="Command: take a turn" i], [data-fs-element="AID Take a turn" i]') },
        { key: CONFIG.get('keyContinue'), isPlay: true, action: () => this.triggerSelector('[aria-label="Command: continue" i], [data-fs-element="AID Continue" i]') },
        { key: CONFIG.get('keyRetry'), isPlay: true, action: () => this.triggerSelector('[aria-label="Command: retry" i], [data-fs-element="AID Retry" i]') },
        { key: CONFIG.get('keyRetryHistory'), isPlay: true, action: () => this.triggerSelector('[aria-label="Retry history" i]') },
        { key: CONFIG.get('keyErase'), isPlay: true, action: () => this.triggerSelector('[aria-label="Command: erase" i], [aria-label="Undo change" i], [data-fs-element="AID Undo" i]') },

        // Mode Switching
        { key: CONFIG.get('keyModeDo'), isPlay: true, action: () => this.switchMode('Do') },
        { key: CONFIG.get('keyModeSay'), isPlay: true, action: () => this.switchMode('Say') },
        { key: CONFIG.get('keyModeStory'), isPlay: true, action: () => this.switchMode('Story') },
        { key: CONFIG.get('keyModeSee'), isPlay: true, action: () => this.switchMode('See') },

        // Action Visibility Toggle
        { key: CONFIG.get('keyToggleActions'), isPlay: false, action: () => ActionToggleModule.toggle() },

        // Menus & Navigation
        { key: CONFIG.get('keyGameMenu'), isPlay: true, action: () => this.triggerSelector('[aria-label="Game Menu" i], [data-fs-element="AID Open game menu" i]') },
        { key: CONFIG.get('keyScrollTop'), isPlay: true, action: () => this.scrollToTop() },
        { key: CONFIG.get('keyToggleSite'), isPlay: false, action: () => this.toggleSite() },
        { key: CONFIG.get('keyUserProfile'), isPlay: false, action: () => this.openUserProfile(isPlayPage) },
        { key: CONFIG.get('keyContinueAdventure'), isPlay: false, action: () => this.continueAdventure() },
        { key: CONFIG.get('keyCharacterName'), isPlay: true, action: () => this.editCharacterName() },
      ];

      for (const item of keyMap) {
        if (key === String(item.key).toUpperCase()) {
          if (item.isPlay && !isPlayPage) return;
          e.preventDefault();
          item.action();
          return;
        }
      }
    },

    triggerSelector(selector) {
      const el = document.querySelector(selector);
      if (el) {
        Logger.log('Triggering click on selector:', selector);
        triggerClick(el);
        return true;
      }
      Logger.warn('Element not found for selector:', selector);
      return false;
    },

    /**
     * Switches input mode to Do, Say, Story, or See.
     * Opens mode dropdown if needed and selects target mode.
     */
    async switchMode(modeName) {
      Logger.log(`Switching mode to: ${modeName}`);
      const targetLabelSelector = `[aria-label*="'${modeName}' mode" i], [aria-label="${modeName}" i]`;

      // 1. If mode option is already open/visible, click it directly
      const visibleOption = document.querySelector(targetLabelSelector);
      if (visibleOption) {
        triggerClick(visibleOption);
        return;
      }

      // 2. Otherwise open input mode dropdown and select
      await executeSequence([
        () => {
          // If turn input is closed, open it
          const takeTurnBtn = document.querySelector('[aria-label="Command: take a turn" i]');
          if (takeTurnBtn) triggerClick(takeTurnBtn);
        },
        () => {
          // Click "Change input mode"
          const changeModeBtn = document.querySelector('[aria-label="Change input mode" i]');
          if (changeModeBtn) triggerClick(changeModeBtn);
        },
        () => {
          // Select requested mode
          const option = document.querySelector(targetLabelSelector);
          if (option) {
            triggerClick(option);
          } else {
            Logger.warn(`Option for mode '${modeName}' not found.`);
          }
        },
        () => {
          // Refocus input and ensure quotes if in Do mode
          const input = document.getElementById('game-text-input');
          if (input) {
            if (modeName.toLowerCase() === 'do') {
              const clean = input.value.replace(/\s+/g, '');
              if (clean === '' || clean === '""') {
                if (input.value !== '""') setNativeValue(input, '""');
                StoryInputModule.setCaretBetweenQuotes(input, true);
              } else {
                input.focus();
              }
            } else {
              input.focus();
            }
          }
        }
      ], 60);
    },

    scrollToTop() {
      Logger.log('Scrolling story to top...');
      const scroller = document.getElementById('gameplay-story-scrollview') ||
                       document.querySelector('[id*="scrollview" i]') ||
                       document.querySelector('main') ||
                       window;
      scroller.scrollTo({ top: 0, behavior: 'smooth' });
    },

    toggleSite() {
      const currentURL = window.location.href;
      const betaHost = 'beta.aidungeon.com';
      const playHost = 'play.aidungeon.com';
      let newURL = currentURL;

      if (currentURL.includes(betaHost)) {
        newURL = currentURL.replace(betaHost, playHost);
      } else if (currentURL.includes(playHost)) {
        newURL = currentURL.replace(playHost, betaHost);
      }

      if (newURL !== currentURL) {
        Logger.info(`Toggling site to: ${newURL}`);
        window.location.href = newURL;
      }
    },

    openUserProfile(isPlayPage) {
      if (isPlayPage) {
        executeSequence([
          () => this.triggerSelector('[aria-label="Game Menu" i]'),
          () => this.triggerSelector('[role="button"][aria-label*="profile" i]')
        ], 100);
      } else {
        executeSequence([
          () => this.triggerSelector('[aria-label="User Menu" i]'),
          () => this.triggerSelector('[role="button"][aria-label*="Profile" i]')
        ], 100);
      }
    },

    continueAdventure() {
      executeSequence([
        () => this.triggerSelector('[role="button"][aria-label="Play" i]'),
        () => this.triggerSelector('[role="button"][aria-label*="Continue Adventure" i]')
      ], 100);
    },

    editCharacterName() {
      executeSequence([
        () => this.triggerSelector('[aria-label="Game Menu" i]'),
        () => this.triggerSelector('[role="button"][aria-label*="player menu" i]'),
        () => this.triggerSelector('[role="button"][aria-label*="Character Name" i]'),
        () => {
          const input = document.querySelector('input#flameplayername, input[placeholder*="name" i]');
          if (input) input.focus();
        }
      ], 100);
    }
  };

  // =========================================================================
  // Feature Module 3: Action Visibility Toggle (A+ / A-)
  // =========================================================================
  const ActionToggleModule = {
    name: 'Action Visibility Toggle',
    buttonId: 'aid-qol-action-toggle',

    init() {
      Logger.info('Initializing ActionToggleModule...');

      // Inject CSS rules for hiding actions and toggle styling
      this.injectStyles();

      // Apply initial saved visibility state to the document
      this.applyVisibility();

      // Watch for the Undo button in the navigation bar to inject cloned native buttons
      observeSelector('[aria-label="Undo change" i], [data-fs-element="AID Undo" i]', (target) => {
        this.injectButton(target);
      });

      // Synchronize theme on user interactions (e.g. clicking themes in Display drawer)
      document.addEventListener('click', () => {
        requestAnimationFrame(() => this.syncTheme());
        setTimeout(() => this.syncTheme(), 80);
        setTimeout(() => this.syncTheme(), 300);
      }, { passive: true });

      // Observe root class changes when theme changes
      try {
        const themeObserver = new MutationObserver(() => {
          this.syncTheme();
        });
        themeObserver.observe(document.documentElement, {
          attributes: true,
          attributeFilter: ['class', 'style', 'data-theme']
        });
        if (document.body) {
          themeObserver.observe(document.body, {
            attributes: true,
            attributeFilter: ['class', 'style', 'data-theme']
          });
        }
      } catch (err) {
        Logger.warn('Theme observer registration skipped:', err);
      }
    },

    injectStyles() {
      GM_addStyle(`
        /* 
         * Collapse story actions to a blank line (paragraph separator).
         * Replaces full removal (display: none) with an invisible 1.5em spacer block
         * so paragraphs separated by actions maintain natural story paragraph separation.
         */
        body.aid-actions-hidden .gameplay-story-edit-dim-target:has(#action-icon),
        body.aid-actions-hidden .gameplay-story-edit-dim-target:has(#action-text) {
          display: block !important;
          visibility: hidden !important;
          height: 1.5em !important;
          min-height: 1.5em !important;
          max-height: 1.5em !important;
          margin-top: 0 !important;
          margin-bottom: 0 !important;
          padding-top: 0 !important;
          padding-bottom: 0 !important;
          padding-left: 0 !important;
          padding-right: 0 !important;
          border: none !important;
          background: transparent !important;
          box-shadow: none !important;
          overflow: hidden !important;
          pointer-events: none !important;
          user-select: none !important;
        }

        body.aid-actions-hidden .gameplay-story-edit-dim-target:has(#action-icon) *,
        body.aid-actions-hidden .gameplay-story-edit-dim-target:has(#action-text) * {
          display: none !important;
          visibility: hidden !important;
        }

        /* Read page blockquote support - collapse to blank line */
        body.aid-actions-hidden [aria-label="Adventure content" i] blockquote {
          display: block !important;
          visibility: hidden !important;
          height: 1.5em !important;
          min-height: 1.5em !important;
          max-height: 1.5em !important;
          margin-top: 0 !important;
          margin-bottom: 0 !important;
          margin-left: 0 !important;
          margin-right: 0 !important;
          padding: 0 !important;
          border: none !important;
          background: transparent !important;
          box-shadow: none !important;
          overflow: hidden !important;
          pointer-events: none !important;
          user-select: none !important;
        }

        body.aid-actions-hidden [aria-label="Adventure content" i] blockquote * {
          display: none !important;
          visibility: hidden !important;
        }

        /* Native-cloned QoL Buttons in Navigation Bar */
        #${this.buttonId},
        #aid-qol-settings-btn {
          cursor: pointer !important;
          pointer-events: auto !important;
          user-select: none !important;
          opacity: 1 !important;
        }

        #${this.buttonId}:hover,
        #aid-qol-settings-btn:hover {
          filter: brightness(1.25) !important;
        }

        #${this.buttonId}:active,
        #aid-qol-settings-btn:active {
          transform: scale(0.92) !important;
        }

        .aid-qol-btn-label {
          display: inline-flex !important;
          align-items: center !important;
          justify-content: center !important;
          font-weight: 700 !important;
          font-family: var(--f-family, ui-sans-serif, system-ui, sans-serif) !important;
          line-height: 1 !important;
          letter-spacing: 0 !important;
          pointer-events: none !important;
          user-select: none !important;
          color: inherit !important;
        }

        #${this.buttonId} .aid-qol-btn-label {
          font-size: 12px !important;
        }

        #aid-qol-settings-btn .aid-qol-btn-label {
          font-size: 14px !important;
        }
      `);
    },

    applyVisibility() {
      const isVisible = CONFIG.get('actionsVisible', true);
      if (isVisible) {
        document.body.classList.remove('aid-actions-hidden');
      } else {
        document.body.classList.add('aid-actions-hidden');
      }
      this.updateButtonDisplay();
    },

    toggle() {
      const current = CONFIG.get('actionsVisible', true);
      const next = !current;
      CONFIG.set('actionsVisible', next);
      Logger.info(`Toggled Action Visibility: ${next ? 'VISIBLE (A+)' : 'HIDDEN (A-)'}`);
      this.applyVisibility();
    },

    updateButtonDisplay() {
      const btn = document.getElementById(this.buttonId);
      if (!btn) return;

      const isVisible = CONFIG.get('actionsVisible', true);
      const label = btn.querySelector('.aid-qol-btn-label');
      if (label) {
        label.textContent = isVisible ? 'A+' : 'A-';
      } else {
        btn.textContent = isVisible ? 'A+' : 'A-';
      }

      const titleText = isVisible 
        ? 'Actions: Visible (Click or Alt+Ctrl+U to hide)' 
        : 'Actions: Hidden (Click or Alt+Ctrl+U to show)';
      btn.title = titleText;
      btn.setAttribute('aria-label', titleText);

      this.syncTheme();
    },

    syncTheme() {
      const undoBtn = document.querySelector('[aria-label="Undo change" i], [data-fs-element="AID Undo" i]');
      const btn = document.getElementById(this.buttonId);
      const settingsBtn = document.getElementById('aid-qol-settings-btn');
      if (!undoBtn || !btn || !settingsBtn) return;

      const undoWrapper = undoBtn.parentElement;
      const actionWrapper = document.getElementById('aid-qol-action-toggle-wrapper');
      const settingsWrapper = document.getElementById('aid-qol-settings-wrapper');

      if (undoWrapper && actionWrapper && settingsWrapper) {
        if (actionWrapper.className !== undoWrapper.className) {
          actionWrapper.className = undoWrapper.className;
        }
        if (settingsWrapper.className !== undoWrapper.className) {
          settingsWrapper.className = undoWrapper.className;
        }
      }

      // Sync button classes (keeping buttons active and enabled)
      if (undoBtn.className) {
        const cleanClasses = undoBtn.className
          .replace(/\b_pe-none\b/g, '')
          .replace(/\b_o-0--5\b/g, '')
          .replace(/\b_o-0\b/g, '')
          .replace(/\b_o-0--4\b/g, '')
          .trim();

        btn.className = cleanClasses;
        settingsBtn.className = cleanClasses;
      }

      // Ensure colors match active theme font & background colors
      try {
        const comp = getComputedStyle(undoBtn);
        const iconEl = undoBtn.querySelector('.font_icons, [class*="font_icons"]') || undoBtn.firstElementChild || undoBtn;
        const iconComp = getComputedStyle(iconEl);

        const borderColor = comp.borderTopColor || comp.borderColor;
        const bgColor = comp.backgroundColor;
        const color = iconComp.color || comp.color;

        [btn, settingsBtn].forEach(el => {
          el.style.pointerEvents = 'auto';
          el.style.opacity = '1';
          el.style.cursor = 'pointer';

          if (borderColor && borderColor !== 'transparent' && borderColor !== 'rgba(0, 0, 0, 0)') {
            el.style.borderColor = borderColor;
          }
          if (bgColor && bgColor !== 'transparent' && bgColor !== 'rgba(0, 0, 0, 0)') {
            el.style.backgroundColor = bgColor;
          }
          if (color && color !== 'transparent' && color !== 'rgba(0, 0, 0, 0)') {
            el.style.color = color;
            const label = el.querySelector('.aid-qol-btn-label');
            if (label) label.style.color = color;
          }
        });
      } catch (err) {
        Logger.warn('Error syncing theme from undoBtn:', err);
      }
    },

    injectButton(targetElement) {
      const undoBtn = document.querySelector('[aria-label="Undo change" i], [data-fs-element="AID Undo" i]');
      if (!undoBtn || !undoBtn.parentElement) return;

      const buttonRow = undoBtn.parentElement.parentElement || undoBtn.parentElement;
      if (!buttonRow) return;

      const actionWrapper = document.getElementById('aid-qol-action-toggle-wrapper');
      const settingsWrapper = document.getElementById('aid-qol-settings-wrapper');

      // If both elements already exist and are seated inside buttonRow, just sync theme
      if (actionWrapper && settingsWrapper && buttonRow.contains(actionWrapper) && buttonRow.contains(settingsWrapper)) {
        this.syncTheme();
        return;
      }

      // Clean up any stale wrappers or buttons
      actionWrapper?.remove();
      settingsWrapper?.remove();
      document.getElementById(this.buttonId)?.remove();
      document.getElementById('aid-qol-settings-btn')?.remove();

      // Clone undoBtn's parent theme wrapper to perfectly inherit native layout, sizing, and squircle shape
      const newActionWrapper = undoBtn.parentElement.cloneNode(true);
      newActionWrapper.id = 'aid-qol-action-toggle-wrapper';
      const actionBtn = newActionWrapper.querySelector('[role="button"]') || newActionWrapper.firstElementChild;
      if (!actionBtn) return;

      actionBtn.id = this.buttonId;
      actionBtn.removeAttribute('data-fs-element');
      actionBtn.removeAttribute('aria-disabled');
      actionBtn.classList.remove('_pe-none', '_o-0--5', '_o-0', '_o-0--4');
      actionBtn.style.pointerEvents = 'auto';
      actionBtn.style.opacity = '1';
      actionBtn.style.cursor = 'pointer';

      // CRITICAL: completely clear innerHTML to prevent any duplicate/ghost w_undo icon
      actionBtn.innerHTML = '';

      const actionLabel = document.createElement('span');
      actionLabel.className = 'aid-qol-btn-label';
      actionLabel.textContent = CONFIG.get('actionsVisible', true) ? 'A+' : 'A-';
      actionBtn.appendChild(actionLabel);

      actionBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.toggle();
      });
      actionBtn.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          e.stopPropagation();
          this.toggle();
        }
      });

      // Clone for Settings button as well
      const newSettingsWrapper = undoBtn.parentElement.cloneNode(true);
      newSettingsWrapper.id = 'aid-qol-settings-wrapper';
      const settingsBtn = newSettingsWrapper.querySelector('[role="button"]') || newSettingsWrapper.firstElementChild;
      if (!settingsBtn) return;

      settingsBtn.id = 'aid-qol-settings-btn';
      settingsBtn.title = 'AID-QoL Settings (Alt+Ctrl+,)';
      settingsBtn.setAttribute('aria-label', 'AID-QoL Settings');
      settingsBtn.removeAttribute('data-fs-element');
      settingsBtn.removeAttribute('aria-disabled');
      settingsBtn.classList.remove('_pe-none', '_o-0--5', '_o-0', '_o-0--4');
      settingsBtn.style.pointerEvents = 'auto';
      settingsBtn.style.opacity = '1';
      settingsBtn.style.cursor = 'pointer';

      // CRITICAL: completely clear innerHTML
      settingsBtn.innerHTML = '';

      const settingsLabel = document.createElement('span');
      settingsLabel.className = 'aid-qol-btn-label';
      settingsLabel.textContent = '⚙';
      settingsBtn.appendChild(settingsLabel);

      settingsBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        ConfigUIModule.open();
      });
      settingsBtn.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          e.stopPropagation();
          ConfigUIModule.open();
        }
      });

      buttonRow.appendChild(newActionWrapper);
      buttonRow.appendChild(newSettingsWrapper);

      this.updateButtonDisplay();
      this.syncTheme();
      Logger.log('Injected Action Toggle and Settings buttons cleanly via native clone');
    }
  };

  // =========================================================================
  // Feature Module 4: Story Card & Context Viewer Modals (Drag & Anchored Resize)
  // =========================================================================
  const StoryCardModalModule = {
    name: 'Story Card & Context Modals',

    init() {
      Logger.info('Initializing StoryCardModalModule...');

      this.injectStyles();
      this.updateModalDimmingState();

      if (!CONFIG.get('storyCardModalsEnabled', true) && !CONFIG.get('contextModalEnabled', true)) return;

      // Observe for dialogs appearing in the DOM with immediate synchronous setup (zero-blink)
      observeSelector('[role="dialog"], [role="alertdialog"]', (modalNode) => {
        if (CONFIG.get('disableModalDimming', true)) {
          this.neutralizeModalOverlays(modalNode);
        }

        const checkModal = (retries = 6) => {
          if (!modalNode.isConnected) return true;
          if (modalNode.dataset.aidQolModal || modalNode.dataset.aidQolContextModal) return true;

          if (CONFIG.get('storyCardModalsEnabled', true) && this.isStoryCardModal(modalNode)) {
            this.setupStoryCardModal(modalNode);
            return true;
          }
          if (CONFIG.get('contextModalEnabled', true) && this.isContextViewerModal(modalNode)) {
            this.setupContextViewerModal(modalNode);
            return true;
          }

          if (retries > 0) {
            requestAnimationFrame(() => checkModal(retries - 1));
          }
          return false;
        };

        // Check immediately on the synchronous mutation tick before browser paint
        checkModal(6);
      });

      // Observe for overlay elements appearing in the DOM to neutralize dimming & blur instantly
      observeSelector('[data-slot*="overlay"], [data-radix-dialog-overlay]', (overlayNode) => {
        if (CONFIG.get('disableModalDimming', true)) {
          if (overlayNode.id === 'aid-qol-config-overlay') return;
          overlayNode.style.setProperty('background', 'transparent', 'important');
          overlayNode.style.setProperty('background-color', 'transparent', 'important');
          overlayNode.style.setProperty('backdrop-filter', 'none', 'important');
          overlayNode.style.setProperty('-webkit-backdrop-filter', 'none', 'important');
          overlayNode.style.setProperty('opacity', '0', 'important');
          overlayNode.style.setProperty('pointer-events', 'none', 'important');
        }
      });
    },

    injectStyles() {
      GM_addStyle(`
        /* 
         * Gentle zero-transform fade animation to replace Radix UI translate keyframes
         */
        @keyframes aid-qol-modal-fade {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        /* 
         * Resizable Story Card modal styling (native resize & zero-blink positioning).
         * Explicit right: auto !important and bottom: auto !important prevents Tailwind's
         * inset-0 and w-full from stretching the modal across the entire viewport!
         */
        [data-block-gameplay-undo-redo="story-card"],
        [role="dialog"]:has([data-keyboard-scroll-region*="story-card"]),
        [role="dialog"]:has(#scTitleLabel),
        [role="dialog"]:has(#scEntryLabel),
        .aid-qol-story-card-modal {
          resize: both !important;
          overflow: auto !important;
          right: auto !important;
          bottom: auto !important;
          margin: 0px !important;
          min-width: 320px !important;
          min-height: 200px !important;
          max-width: 98vw !important;
          max-height: 96vh !important;
          border-bottom-right-radius: 0px !important;
          box-sizing: border-box !important;
          transform: none !important;
          transition: none !important;
          animation: aid-qol-modal-fade 0.08s ease-out !important;
          --tw-translate-x: 0px !important;
          --tw-translate-y: 0px !important;
          --tw-enter-translate-x: 0px !important;
          --tw-enter-translate-y: 0px !important;
          --tw-enter-scale: 1 !important;
          --tw-scale-x: 1 !important;
          --tw-scale-y: 1 !important;
        }

        /* Pre-paint fallback centering for Story Card modals before inline styles execute */
        [data-block-gameplay-undo-redo="story-card"]:not(.aid-qol-story-card-modal),
        [role="dialog"]:has([data-keyboard-scroll-region*="story-card"]):not(.aid-qol-story-card-modal),
        [role="dialog"]:has(#scTitleLabel):not(.aid-qol-story-card-modal),
        [role="dialog"]:has(#scEntryLabel):not(.aid-qol-story-card-modal) {
          left: calc(50vw - 340px) !important;
          top: calc(50vh - 41vh) !important;
          width: 680px !important;
          height: 82vh !important;
          transform: none !important;
          transition: none !important;
        }

        /* 
         * Resizable Context Viewer modal styling (zero-blink positioning).
         * Disables Radix slide-in / translate keyframes and Tailwind transitions so the dialog
         * and all its subdialogs (Adventure, Memories, AI Instructions, Plot Essentials, etc.)
         * open cleanly at their deterministic position without animation artifacts or jumping.
         * Outer modal uses overflow: hidden !important so the header is pinned and NEVER scrolls!
         * Resizing is handled smoothly by the dedicated .aid-qol-modal-corner-resizer handle.
         */
        [role="dialog"][data-slot="aid-dialog-content"],
        [role="dialog"][data-slot="platform-dialog-content"],
        [role="dialog"]:has([data-slot="aid-dialog-title"]),
        [role="dialog"]:has([data-memory-action-id]),
        [role="dialog"]:has([aria-label*="close context" i]),
        [role="dialog"]:has([aria-label*="close memories" i]),
        .aid-qol-context-modal {
          resize: none !important;
          overflow: hidden !important;
          right: auto !important;
          bottom: auto !important;
          margin: 0px !important;
          min-width: 320px !important;
          min-height: 200px !important;
          max-width: 98vw !important;
          max-height: 96vh !important;
          border-bottom-right-radius: 0px !important;
          box-sizing: border-box !important;
          transform: none !important;
          transition: none !important;
          animation: aid-qol-modal-fade 0.08s ease-out !important;
          --tw-translate-x: 0px !important;
          --tw-translate-y: 0px !important;
          --tw-enter-translate-x: 0px !important;
          --tw-enter-translate-y: 0px !important;
          --tw-enter-scale: 1 !important;
          --tw-scale-x: 1 !important;
          --tw-scale-y: 1 !important;
        }

        /* Pre-paint fallback centering for Context Overview dialog (max-w-[420px]) before inline styles execute */
        [role="dialog"][data-slot="aid-dialog-content"].max-w-\[420px\]:not(.aid-qol-context-modal),
        [role="dialog"].max-w-\[420px\]:has([data-slot="aid-dialog-title"]):not(.aid-qol-context-modal) {
          left: calc(50vw - 210px) !important;
          top: calc(50vh - 160px) !important;
          width: 420px !important;
          transform: none !important;
          transition: none !important;
        }

        /* Pre-paint fallback centering for Context Subdialogs (Adventure, Memories, AI Instructions, etc.) */
        [role="dialog"][data-slot="aid-dialog-content"]:not(.max-w-\[420px\]):not(.aid-qol-context-modal),
        [role="dialog"][data-slot="platform-dialog-content"]:not(.max-w-\[420px\]):not(.aid-qol-context-modal),
        [role="dialog"]:has([data-slot="aid-dialog-title"]):not(.max-w-\[420px\]):not(.aid-qol-context-modal),
        [role="dialog"]:has([data-memory-action-id]):not(.max-w-\[420px\]):not(.aid-qol-context-modal) {
          left: calc(50vw - 240px) !important;
          top: calc(50vh - 256px) !important;
          width: 480px !important;
          height: 512px !important;
          transform: none !important;
          transition: none !important;
        }

        /* 
         * Eliminate background darkening / blur overlays behind modals when configured.
         * Targets all overlay slots for Story Cards, Context Viewer, subdialogs, and platform modals
         * without touching main application layout (#__next).
         */
        html.aid-qol-no-modal-dimming [data-slot="aid-dialog-overlay"],
        html.aid-qol-no-modal-dimming [data-slot="platform-dialog-overlay"],
        html.aid-qol-no-modal-dimming [data-slot*="dialog-overlay"],
        html.aid-qol-no-modal-dimming [data-slot*="sheet-overlay"],
        html.aid-qol-no-modal-dimming [data-slot*="overlay"]:not([role="dialog"]):not([role="alertdialog"]):not(#aid-qol-config-overlay),
        html.aid-qol-no-modal-dimming [data-radix-dialog-overlay],
        html.aid-qol-no-modal-dimming body:has([role="dialog"]) [data-slot*="overlay"]:not(#aid-qol-config-overlay),
        html.aid-qol-no-modal-dimming body:has([role="dialog"]) [data-radix-dialog-overlay],
        html.aid-qol-no-modal-dimming body:has([role="dialog"]) div.fixed.inset-0:not([role="dialog"]):not(:has([role="dialog"])):not(#aid-qol-config-overlay),
        html.aid-qol-no-modal-dimming body:has(.aid-qol-story-card-modal) div.fixed.inset-0:not([role="dialog"]):not(:has([role="dialog"])):not(#aid-qol-config-overlay),
        html.aid-qol-no-modal-dimming body:has(.aid-qol-context-modal) div.fixed.inset-0:not([role="dialog"]):not(:has([role="dialog"])):not(#aid-qol-config-overlay),
        body.aid-qol-no-modal-dimming [data-slot="aid-dialog-overlay"],
        body.aid-qol-no-modal-dimming [data-slot="platform-dialog-overlay"],
        body.aid-qol-no-modal-dimming [data-slot*="dialog-overlay"],
        body.aid-qol-no-modal-dimming [data-slot*="sheet-overlay"],
        body.aid-qol-no-modal-dimming [data-slot*="overlay"]:not([role="dialog"]):not([role="alertdialog"]):not(#aid-qol-config-overlay),
        body.aid-qol-no-modal-dimming [data-radix-dialog-overlay],
        body.aid-qol-no-modal-dimming:has([role="dialog"]) [data-slot*="overlay"]:not(#aid-qol-config-overlay),
        body.aid-qol-no-modal-dimming:has([role="dialog"]) [data-radix-dialog-overlay],
        body.aid-qol-no-modal-dimming:has([role="dialog"]) div.fixed.inset-0:not([role="dialog"]):not(:has([role="dialog"])):not(#aid-qol-config-overlay),
        body.aid-qol-no-modal-dimming:has(.aid-qol-story-card-modal) div.fixed.inset-0:not([role="dialog"]):not(:has([role="dialog"])):not(#aid-qol-config-overlay),
        body.aid-qol-no-modal-dimming:has(.aid-qol-context-modal) div.fixed.inset-0:not([role="dialog"]):not(:has([role="dialog"])):not(#aid-qol-config-overlay),
        body:has([role="dialog"].aid-qol-context-modal) [data-slot*="overlay"]:not(#aid-qol-config-overlay),
        body:has([role="dialog"][data-slot="aid-dialog-content"]) [data-slot*="overlay"]:not(#aid-qol-config-overlay),
        body:has([role="dialog"]:has([data-slot="aid-dialog-title"])) [data-slot*="overlay"]:not(#aid-qol-config-overlay),
        body:has([role="dialog"].aid-qol-story-card-modal) [data-slot*="overlay"]:not(#aid-qol-config-overlay),
        body:has([role="dialog"].aid-qol-story-card-modal) [data-slot="platform-dialog-overlay"],
        body:has([role="dialog"].aid-qol-story-card-modal) [data-radix-dialog-overlay] {
          background-color: transparent !important;
          background: transparent !important;
          backdrop-filter: none !important;
          -webkit-backdrop-filter: none !important;
          opacity: 0 !important;
          pointer-events: none !important;
        }

        html.aid-qol-no-modal-dimming #__next,
        body.aid-qol-no-modal-dimming #__next,
        html.aid-qol-no-modal-dimming #root,
        body.aid-qol-no-modal-dimming #root {
          filter: none !important;
          -webkit-filter: none !important;
        }

        /* Allow inner content containers of Context Viewer and subdialogs to fluidly expand with modal width */
        .aid-qol-context-modal > .is_View:only-of-type > div:first-child,
        .aid-qol-context-modal > .is_View:only-of-type > div:last-child,
        .aid-qol-context-modal > .is_View:first-of-type:not(:only-of-type) > div,
        .aid-qol-context-modal > .flex.min-h-0,
        .aid-qol-context-modal > .flex.min-h-0 .is_ScrollView {
          max-width: none !important;
          min-width: 0 !important;
          width: 100% !important;
        }

        /* Ensure token badges inside token viewer flow inline naturally and never expand to full line width */
        .aid-qol-context-modal .is_ScrollView:not([role="tablist"]) [class*="_maw-480px"] {
          width: auto !important;
          max-width: none !important;
          min-width: 0 !important;
          flex: none !important;
        }

        /* Ensure tablist pill buttons remain fully symmetrical rounded pills */
        .aid-qol-context-modal [role="tab"] {
          border-radius: 9999px !important;
        }

        /* 
         * Main View Context overview dialog layout:
         * Top summary (header, token bar, legend, explanation) is pinned (flex-shrink: 0).
         * Bottom "Details" toggle button is pinned (flex-shrink: 0).
         * Middle details section expands to fill modal and scrolls its inner is_ScrollView ONLY.
         */
        .aid-qol-context-modal > .is_View:first-of-type:not(:only-of-type) {
          flex-shrink: 0 !important;
        }

        .aid-qol-context-modal > .flex.min-h-0:not([style*="height: 0px"]):not([style*="height:0px"]):not([style*="height: 0"]):not([style*="height:0"]) {
          flex: 1 1 0px !important;
          min-height: 0 !important;
          height: auto !important;
          max-height: none !important;
          overflow: hidden !important;
        }

        .aid-qol-context-modal > .is_View:last-of-type:not(:only-of-type) {
          flex-shrink: 0 !important;
        }

        /* Context Viewer subdialogs: single inner container expands fluidly to fill modal height */
        .aid-qol-context-modal > .is_View:only-of-type {
          flex: 1 1 0px !important;
          height: 100% !important;
          min-height: 0 !important;
          overflow: hidden !important;
          display: flex !important;
          flex-direction: column !important;
        }

        /* Header in subdialogs stays pinned at top */
        .aid-qol-context-modal > .is_View:only-of-type > div:first-child {
          flex-shrink: 0 !important;
        }

        /* 
         * Ensure the content card in Context Viewer subdialogs strictly respects modal height.
         * Uses structural selector so token badges and inner elements are never deformed.
         * Eliminates content blowout, restores the inner scrollbar, and keeps the Copy button pinned in view.
         */
        .aid-qol-context-modal > .is_View:only-of-type > div:last-child {
          flex: 1 1 0px !important;
          min-height: 0 !important;
          max-height: 100% !important;
          overflow: hidden !important;
          position: relative !important;
          display: flex !important;
          flex-direction: column !important;
          border-bottom-right-radius: 0px !important;
        }

        .aid-qol-context-modal > .is_View:only-of-type > div:last-child > div:first-child {
          flex: 1 1 0px !important;
          min-height: 0 !important;
          height: 100% !important;
          max-height: 100% !important;
          overflow: hidden !important;
          display: flex !important;
          flex-direction: column !important;
        }

        /* Non-absolute secondary elements inside content card (such as token approximation notice) stay pinned */
        .aid-qol-context-modal > .is_View:only-of-type > div:last-child > div:not(:first-child):not([class*="_pos-absolute"]) {
          flex-shrink: 0 !important;
        }

        /* Scroll container for subdialogs, memories, and main view details */
        .aid-qol-context-modal .is_ScrollView:not([role="tablist"]),
        .aid-qol-context-modal [data-keyboard-scroll-region] {
          flex: 1 1 0px !important;
          min-height: 0 !important;
          height: 100% !important;
          max-height: 100% !important;
          overflow-y: auto !important;
          overflow-x: hidden !important;
          scrollbar-gutter: stable !important;
          scrollbar-width: thin !important;
          scrollbar-color: rgba(255, 255, 255, 0.3) rgba(0, 0, 0, 0.15) !important;
        }

        /* Scroll content inside ScrollView must expand naturally to fit its content */
        .aid-qol-context-modal .is_ScrollView:not([role="tablist"]) > .css-g5y9jx,
        .aid-qol-context-modal [data-keyboard-scroll-region] > .css-g5y9jx {
          height: auto !important;
          min-height: min-content !important;
          flex: none !important;
        }

        /* Visible sleek 7px scrollbar styling for context viewer scrollables */
        .aid-qol-context-modal .is_ScrollView:not([role="tablist"])::-webkit-scrollbar,
        .aid-qol-context-modal [data-keyboard-scroll-region]::-webkit-scrollbar {
          width: 7px !important;
          height: 7px !important;
          display: block !important;
        }

        .aid-qol-context-modal .is_ScrollView:not([role="tablist"])::-webkit-scrollbar-track,
        .aid-qol-context-modal [data-keyboard-scroll-region]::-webkit-scrollbar-track {
          background-color: rgba(0, 0, 0, 0.15) !important;
          border-radius: 0px !important;
        }

        .aid-qol-context-modal .is_ScrollView:not([role="tablist"])::-webkit-scrollbar-thumb,
        .aid-qol-context-modal [data-keyboard-scroll-region]::-webkit-scrollbar-thumb {
          background-color: var(--borderColor, rgba(255, 255, 255, 0.25)) !important;
          border-radius: 3px !important;
        }

        .aid-qol-context-modal .is_ScrollView:not([role="tablist"])::-webkit-scrollbar-thumb:hover,
        .aid-qol-context-modal [data-keyboard-scroll-region]::-webkit-scrollbar-thumb:hover {
          background-color: var(--color, rgba(255, 255, 255, 0.5)) !important;
        }

        /* Dedicated 2D corner resizer handle for Context Viewer dialogs */
        .aid-qol-modal-corner-resizer {
          position: absolute !important;
          right: 0px !important;
          bottom: 0px !important;
          width: 18px !important;
          height: 18px !important;
          cursor: nwse-resize !important;
          z-index: 100000 !important;
          pointer-events: auto !important;
          user-select: none !important;
          -webkit-user-select: none !important;
          touch-action: none !important;
          box-sizing: border-box !important;
          background-color: transparent !important;
          background-repeat: no-repeat !important;
          background-position: bottom right !important;
          background-size: 12px 12px !important;
          background-image: linear-gradient(135deg, transparent 0%, transparent 45%, var(--borderColor, rgba(255, 255, 255, 0.4)) 45%, var(--borderColor, rgba(255, 255, 255, 0.4)) 58%, transparent 58%, transparent 75%, var(--borderColor, rgba(255, 255, 255, 0.4)) 75%, var(--borderColor, rgba(255, 255, 255, 0.4)) 88%, transparent 88%) !important;
        }

        .aid-qol-modal-corner-resizer:hover,
        .aid-qol-modal-corner-resizer.resizing {
          background-image: linear-gradient(135deg, transparent 0%, transparent 45%, var(--color-aid-primary, rgba(249, 115, 22, 0.9)) 45%, var(--color-aid-primary, rgba(249, 115, 22, 0.9)) 58%, transparent 58%, transparent 75%, var(--color-aid-primary, rgba(249, 115, 22, 0.9)) 75%, var(--color-aid-primary, rgba(249, 115, 22, 0.9)) 88%, transparent 88%) !important;
        }

        /* Drag handle on the visible header bar */
        .aid-qol-modal-handle {
          cursor: grab !important;
          user-select: none !important;
        }
        .aid-qol-modal-handle:active {
          cursor: grabbing !important;
        }

        /* Maximized / Fullscreen modal state */
        .aid-qol-modal-maximized {
          left: 2vw !important;
          top: 2vh !important;
          width: 96vw !important;
          height: 94vh !important;
          max-width: 96vw !important;
          max-height: 94vh !important;
          transform: none !important;
          --tw-translate-x: 0px !important;
          --tw-translate-y: 0px !important;
        }
      `);
    },

    /**
     * Toggles or updates the body and documentElement classes that eliminate modal dimming and blur.
     */
    updateModalDimmingState() {
      const disabled = CONFIG.get('disableModalDimming', true);
      if (document.body) document.body.classList.toggle('aid-qol-no-modal-dimming', disabled);
      if (document.documentElement) document.documentElement.classList.toggle('aid-qol-no-modal-dimming', disabled);
      if (disabled) {
        this.neutralizeModalOverlays();
      }
    },

    /**
     * Neutralizes modal backdrop overlays across the page.
     * @param {HTMLElement} [modal]
     */
    neutralizeModalOverlays(modal = null) {
      if (!CONFIG.get('disableModalDimming', true)) return;

      const clearOverlay = (el) => {
        if (!el || el.nodeType !== Node.ELEMENT_NODE) return;
        if (modal && (el === modal || el.contains(modal))) return;
        if (el.id === 'aid-qol-config-overlay') return;
        if (el.getAttribute('role') === 'dialog' || el.getAttribute('role') === 'alertdialog') return;
        el.style.setProperty('background', 'transparent', 'important');
        el.style.setProperty('background-color', 'transparent', 'important');
        el.style.setProperty('backdrop-filter', 'none', 'important');
        el.style.setProperty('-webkit-backdrop-filter', 'none', 'important');
        el.style.setProperty('opacity', '0', 'important');
        el.style.setProperty('pointer-events', 'none', 'important');
      };

      if (modal && modal.parentElement) {
        Array.from(modal.parentElement.children).forEach(clearOverlay);
      }

      document.querySelectorAll('[data-slot*="overlay"], [data-radix-dialog-overlay]').forEach(clearOverlay);
    },

    /**
     * Parses dimension string (e.g. "680px", "82vh", "50vw", "70%") into pixel value.
     * @param {string|number} dim
     * @param {number} totalSize
     * @returns {number}
     */
    parseDimension(dim, totalSize) {
      if (typeof dim === 'number') return dim;
      const str = String(dim).trim().toLowerCase();
      if (str.endsWith('vh')) {
        return (parseFloat(str) / 100) * window.innerHeight;
      }
      if (str.endsWith('vw')) {
        return (parseFloat(str) / 100) * window.innerWidth;
      }
      if (str.endsWith('%')) {
        return (parseFloat(str) / 100) * totalSize;
      }
      if (str.endsWith('px')) {
        return parseFloat(str);
      }
      return parseFloat(str) || totalSize;
    },

    /**
     * Determines whether a given modal element represents a Story Card editor or previewer.
     * @param {HTMLElement} modal
     * @returns {boolean}
     */
    isStoryCardModal(modal) {
      if (!modal || modal.nodeType !== Node.ELEMENT_NODE) return false;

      // 1. Explicit AID attribute on Story Card Edit modal
      if (modal.getAttribute('data-block-gameplay-undo-redo') === 'story-card') {
        return true;
      }

      // 2. Story Card editor specific fields
      if (modal.querySelector('#scTypeLabel, #scEntryLabel, #scTitleLabel, [data-slot="story-card-publishing-fields"], [data-keyboard-scroll-region*="story-card"]')) {
        return true;
      }

      // 3. Title mentions story card
      const title = modal.querySelector('[data-slot="platform-dialog-title"], h2');
      if (title && /story\s*card/i.test(title.textContent)) {
        return true;
      }

      // 4. Previewer modal: has platform-badge and description paragraph
      if (modal.querySelector('[data-slot="platform-badge"]') && modal.querySelector('[data-slot="platform-dialog-description"]')) {
        return true;
      }

      return false;
    },

    /**
     * Determines whether a given modal element represents the Context Viewer dialog or any of its subdialogs
     * (e.g. Adventure, Explore Memories, AI Instructions, Plot Essentials, Author's Note, Complete Text, token breakdown, etc.).
     * @param {HTMLElement} modal
     * @returns {boolean}
     */
    isContextViewerModal(modal) {
      if (!modal || modal.nodeType !== Node.ELEMENT_NODE) return false;

      // 1. Ignore alert / confirm dialogs
      if (modal.getAttribute('role') === 'alertdialog') return false;

      // 2. Ignore our own QoL config dialog
      if (modal.id && modal.id.startsWith('aid-qol-')) return false;

      // 3. Never treat Story Card modals as Context Viewer
      if (this.isStoryCardModal(modal)) return false;

      // 4. Standard AID Radix dialog content or close button signatures
      if (modal.getAttribute('data-slot') === 'aid-dialog-content') return true;
      if (modal.querySelector('[data-slot="aid-dialog-title"], [data-slot="aid-dialog-close"]')) return true;

      // 5. Explicit title check (screen-reader or visible)
      const title = modal.querySelector('[data-slot="aid-dialog-title"], [data-slot="platform-dialog-title"], h1, h2, h3');
      if (title) {
        const titleText = title.textContent.trim().toLowerCase();
        if (/context|memories|adventure|instruction|plot|author'?s\s*note|complete\s*text|token|action/i.test(titleText)) {
          return true;
        }
      }

      // 6. Close button aria-label checks
      const closeBtn = modal.querySelector('button[data-slot="aid-dialog-close"], button[aria-label*="close" i]');
      if (closeBtn) {
        const ariaLabel = (closeBtn.getAttribute('aria-label') || '').toLowerCase();
        if (ariaLabel.includes('context') || ariaLabel.includes('memories') || ariaLabel.includes('instructions')) {
          return true;
        }
      }

      // 7. Characteristic Context Viewer or Subdialog UI signatures
      if (
        modal.querySelector('[aria-label="Section tabs" i], [aria-label="Copy context text" i], [data-memory-action-id], [data-slot="memory-action-item"]') ||
        modal.querySelector('[aria-label*="Close context viewer" i], [aria-label*="Close memories" i]')
      ) {
        return true;
      }

      // 8. Visible text content fallback
      const text = modal.textContent || '';
      if (text.includes('Context used for this action') || /view\s*context|context\s*viewer/i.test(text)) {
        return true;
      }

      return false;
    },

    /**
     * Enhances a Story Card modal with drag and top-left anchored resize capabilities.
     * @param {HTMLElement} modal
     */
    setupStoryCardModal(modal) {
      if (modal.dataset.aidQolModal) return;
      modal.dataset.aidQolModal = 'true';

      Logger.log('Setting up Story Card modal:', modal);

      // 1. Strip Tailwind classes that stretch or center the modal:
      modal.classList.remove(
        'inset-0',
        'w-full',
        '-translate-x-1/2', 
        '-translate-y-1/2', 
        'translate-x-1/2', 
        'translate-y-1/2', 
        'm-auto',
        'max-w-[512px]',
        'max-w-lg'
      );

      // 2. Calculate initial dimensions from configured defaults or saved preferences
      const configuredWidth = CONFIG.get('scModalWidth', '680px');
      const configuredHeight = CONFIG.get('scModalHeight', '82vh');

      const widthPx = Math.min(window.innerWidth - 30, Math.round(this.parseDimension(configuredWidth, window.innerWidth)));
      const heightPx = Math.min(window.innerHeight - 40, Math.round(this.parseDimension(configuredHeight, window.innerHeight)));

      // Center symmetrically with equal margins on all four sides:
      const leftPx = Math.max(10, Math.round((window.innerWidth - widthPx) / 2));
      const topPx = Math.max(10, Math.round((window.innerHeight - heightPx) / 2));

      // 3. Anchor top-left with fixed pixel coordinates
      modal.style.setProperty('position', 'fixed', 'important');
      modal.style.setProperty('left', `${leftPx}px`, 'important');
      modal.style.setProperty('top', `${topPx}px`, 'important');
      modal.style.setProperty('width', `${widthPx}px`, 'important');
      modal.style.setProperty('height', `${heightPx}px`, 'important');
      modal.style.setProperty('right', 'auto', 'important');
      modal.style.setProperty('bottom', 'auto', 'important');
      modal.style.setProperty('margin', '0px', 'important');
      modal.style.setProperty('transform', 'none', 'important');
      modal.style.setProperty('transition', 'none', 'important');

      // Bring newly opened modal immediately to front
      StoryCardModalModule.highestZ = Math.max(StoryCardModalModule.highestZ || 100000, 100000) + 1;
      modal.style.zIndex = `${StoryCardModalModule.highestZ}`;

      // Clicking or interacting with the modal brings it to the top
      modal.addEventListener('pointerdown', () => {
        StoryCardModalModule.highestZ = Math.max(StoryCardModalModule.highestZ || 100000, 100000) + 1;
        modal.style.zIndex = `${StoryCardModalModule.highestZ}`;
      }, { capture: true });

      // Unset parent flex centering
      if (modal.parentElement) {
        modal.parentElement.style.justifyContent = 'unset';
        modal.parentElement.style.alignItems = 'unset';
      }

      // Neutralize any sibling/backdrop overlays if dimming removal is enabled
      if (CONFIG.get('disableModalDimming', true)) {
        this.neutralizeModalOverlays(modal);
      }

      // 4. Enable native resize
      modal.classList.add('aid-qol-story-card-modal');

      // 5. Watch for user manual resize and save dimensions if enabled
      this.bindResizeSaver(modal);

      // 6. Locate the visible header row to use as the drag handle
      const tryAttachHeader = (retries = 6) => {
        if (!modal.isConnected) return;
        const header = this.findModalHeader(modal);
        if (header) {
          header.classList.add('aid-qol-modal-handle');
          Logger.log('Attached drag handle to Story Card header:', header);
          this.bindDragEvents(modal, header);
          header.addEventListener('dblclick', (e) => {
            if (this.isInteractiveElement(e.target)) return;
            this.toggleMaximize(modal);
          });
        } else if (retries > 0) {
          requestAnimationFrame(() => tryAttachHeader(retries - 1));
        } else {
          Logger.warn('Visible header not found for Story Card modal:', modal);
        }
      };

      tryAttachHeader();
    },

    /**
     * Enhances the Context Viewer modal with drag and top-left anchored resize capabilities.
     * @param {HTMLElement} modal
     */
    setupContextViewerModal(modal) {
      if (!CONFIG.get('contextModalEnabled', true)) return;
      if (modal.dataset.aidQolContextModal) return;
      modal.dataset.aidQolContextModal = 'true';

      Logger.log('Setting up Context Viewer modal:', modal);

      // Check classes and title BEFORE stripping classes
      const hasH512 = modal.classList.contains('h-[512px]');
      const hasMaxW420 = modal.classList.contains('max-w-[420px]');
      const titleEl = modal.querySelector('[data-slot="aid-dialog-title"], [data-slot="platform-dialog-title"], h1, h2, h3');
      const titleText = (titleEl?.textContent || '').trim().toLowerCase();
      const isOverview = hasMaxW420 || titleText === 'view context' || titleText === 'context viewer';

      // 1. Strip Tailwind classes that lock width or center via transform/transitions:
      const stripClasses = () => {
        modal.classList.remove(
          'left-1/2',
          'top-1/2',
          'inset-0',
          'w-full',
          'w-[calc(100vw-var(--spacing-overlay-viewport-total))]',
          '-translate-x-1/2', 
          '-translate-y-1/2', 
          'translate-x-1/2', 
          'translate-y-1/2', 
          'm-auto',
          'max-w-[480px]',
          'max-w-[420px]',
          'max-w-md',
          'max-w-lg',
          'h-[512px]',
          'duration-200',
          'overflow-hidden'
        );
      };
      stripClasses();

      // 2. Calculate initial dimensions from configured defaults or saved preferences
      const configuredWidth = CONFIG.get('contextModalWidth', '480px');
      const configuredHeight = CONFIG.get('contextModalHeight', 'auto');

      const defaultWidth = isOverview ? 420 : 480;
      let widthPx = defaultWidth;
      if (configuredWidth && configuredWidth !== 'auto' && configuredWidth !== '480px') {
        widthPx = Math.min(window.innerWidth - 30, Math.round(this.parseDimension(configuredWidth, window.innerWidth)));
      } else if (configuredWidth === '480px' && !isOverview) {
        widthPx = Math.min(window.innerWidth - 30, 480);
      } else if (configuredWidth === '480px' && isOverview) {
        widthPx = Math.min(window.innerWidth - 30, 420);
      }

      let heightPx = null;
      if (configuredHeight && configuredHeight !== 'auto') {
        heightPx = Math.min(window.innerHeight - 40, Math.round(this.parseDimension(configuredHeight, window.innerHeight)));
      } else if (!isOverview || hasH512) {
        heightPx = Math.min(window.innerHeight - 40, 512);
      }

      // Symmetrically center horizontally and vertically
      const leftPx = Math.max(10, Math.round((window.innerWidth - widthPx) / 2));
      const expectedHeight = heightPx || (isOverview ? 320 : 512);
      const topPx = Math.max(20, Math.round((window.innerHeight - expectedHeight) / 2));

      // 3. Anchor top-left with fixed pixel coordinates
      modal.style.setProperty('position', 'fixed', 'important');
      modal.style.setProperty('left', `${leftPx}px`, 'important');
      modal.style.setProperty('top', `${topPx}px`, 'important');
      modal.style.setProperty('width', `${widthPx}px`, 'important');
      if (heightPx) {
        modal.style.setProperty('height', `${heightPx}px`, 'important');
      } else {
        modal.style.removeProperty('height');
      }
      modal.style.setProperty('right', 'auto', 'important');
      modal.style.setProperty('bottom', 'auto', 'important');
      modal.style.setProperty('margin', '0px', 'important');
      modal.style.setProperty('transform', 'none', 'important');
      modal.style.setProperty('transition', 'none', 'important');

      // Bring newly opened modal immediately to front
      StoryCardModalModule.highestZ = Math.max(StoryCardModalModule.highestZ || 100000, 100000) + 1;
      modal.style.zIndex = `${StoryCardModalModule.highestZ}`;

      // Clicking or interacting with the modal brings it to the top
      modal.addEventListener('pointerdown', () => {
        StoryCardModalModule.highestZ = Math.max(StoryCardModalModule.highestZ || 100000, 100000) + 1;
        modal.style.zIndex = `${StoryCardModalModule.highestZ}`;
      }, { capture: true });

      // Unset parent flex centering
      if (modal.parentElement) {
        modal.parentElement.style.justifyContent = 'unset';
        modal.parentElement.style.alignItems = 'unset';
      }

      // Neutralize any sibling/backdrop overlays if dimming removal is enabled
      if (CONFIG.get('disableModalDimming', true)) {
        this.neutralizeModalOverlays(modal);
      }

      // 4. Enable Context Viewer styling (with pinned header and overflow: hidden)
      modal.classList.add('aid-qol-context-modal');

      // 5. Append dedicated corner resize handle to outer dialog and bind drag resize
      const ensureResizer = () => {
        if (!modal.isConnected) return;
        let resizer = modal.querySelector(':scope > .aid-qol-modal-corner-resizer');
        if (!resizer) {
          resizer = document.createElement('div');
          resizer.className = 'aid-qol-modal-corner-resizer';
          resizer.title = 'Drag to resize modal';
          modal.appendChild(resizer);
          this.bindCornerResizeEvents(modal, resizer);
        }
      };
      ensureResizer();

      // Ensure resizer remains attached to outer dialog and classes stay stripped if React re-renders modal
      const resizerObserver = new MutationObserver(() => {
        if (!modal.isConnected) {
          resizerObserver.disconnect();
          return;
        }
        stripClasses();
        if (!modal.classList.contains('aid-qol-context-modal')) {
          modal.classList.add('aid-qol-context-modal');
        }
        if (!modal.querySelector(':scope > .aid-qol-modal-corner-resizer')) {
          ensureResizer();
        }
      });
      resizerObserver.observe(modal, { childList: true, attributes: true, attributeFilter: ['class'] });

      // 6. Locate the visible header row to use as the drag handle
      const tryAttachHeader = (retries = 6) => {
        if (!modal.isConnected) return;
        const header = this.findContextModalHeader(modal);
        if (header) {
          header.classList.add('aid-qol-modal-handle');
          Logger.log('Attached drag handle to Context Viewer header:', header);
          this.bindDragEvents(modal, header);
          header.addEventListener('dblclick', (e) => {
            if (this.isInteractiveElement(e.target)) return;
            this.toggleMaximize(modal);
          });
        } else if (retries > 0) {
          requestAnimationFrame(() => tryAttachHeader(retries - 1));
        } else {
          Logger.warn('Visible header not found for Context Viewer modal:', modal);
        }
      };

      tryAttachHeader();
    },

    /**
     * Saves user's resized modal dimensions so future modals remember it.
     * Uses ResizeObserver with debouncing for clean, leak-free persistence.
     * @param {HTMLElement} modal
     */
    bindResizeSaver(modal) {
      if (!CONFIG.get('rememberSCSize') || typeof ResizeObserver === 'undefined') return;

      let isInitial = true;
      let debounceTimer = null;

      const observer = new ResizeObserver(() => {
        // Skip the initial layout pass right after opening
        if (isInitial) {
          isInitial = false;
          return;
        }

        // Never remember maximized dimensions
        if (modal.classList.contains('aid-qol-modal-maximized')) return;

        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
          if (!modal.isConnected) {
            observer.disconnect();
            return;
          }
          if (modal.classList.contains('aid-qol-modal-maximized')) return;

          const currentW = Math.round(modal.offsetWidth);
          const currentH = Math.round(modal.offsetHeight);
          if (currentW > 250 && currentH > 200) {
            CONFIG.set('scModalWidth', `${currentW}px`);
            CONFIG.set('scModalHeight', `${currentH}px`);
            Logger.log(`Saved new Story Card dimensions: ${currentW}px × ${currentH}px`);
          }
        }, 300);
      });

      observer.observe(modal);
    },

    /**
     * Binds mouse drag listeners to the dedicated corner resizer handle.
     * Enables smooth 2D resizing and saves preferred dimensions on release.
     * @param {HTMLElement} modal
     * @param {HTMLElement} resizer
     */
    bindCornerResizeEvents(modal, resizer) {
      let isDragging = false;
      let startX = 0;
      let startY = 0;
      let startWidth = 0;
      let startHeight = 0;

      // Transparent full-screen overlay during drag to prevent mouse events being captured by inner elements
      let dragOverlay = document.getElementById('aid-qol-modal-resize-overlay');
      if (!dragOverlay) {
        dragOverlay = document.createElement('div');
        dragOverlay.id = 'aid-qol-modal-resize-overlay';
        dragOverlay.style.cssText = 'position:fixed;inset:0;z-index:999999;cursor:nwse-resize;user-select:none;display:none;';
        document.body.appendChild(dragOverlay);
      }

      const onMouseDown = (e) => {
        if (e.button !== 0) return;
        e.preventDefault();
        e.stopPropagation();

        if (modal.classList.contains('aid-qol-modal-maximized')) {
          modal.classList.remove('aid-qol-modal-maximized');
        }

        startX = e.clientX;
        startY = e.clientY;
        startWidth = modal.offsetWidth;
        startHeight = modal.offsetHeight;
        isDragging = false;

        StoryCardModalModule.highestZ = Math.max(StoryCardModalModule.highestZ || 999999, 999999) + 1;
        modal.style.zIndex = `${StoryCardModalModule.highestZ}`;

        const onMouseMove = (moveEvent) => {
          const deltaX = moveEvent.clientX - startX;
          const deltaY = moveEvent.clientY - startY;

          if (!isDragging && (Math.abs(deltaX) > 2 || Math.abs(deltaY) > 2)) {
            isDragging = true;
            resizer.classList.add('resizing');
            document.body.style.cursor = 'nwse-resize';
            document.body.style.userSelect = 'none';
            dragOverlay.style.display = 'block';
          }

          if (isDragging) {
            const minW = 320;
            const maxW = Math.max(minW, window.innerWidth - 20);
            const minH = 160;
            const maxH = Math.max(minH, window.innerHeight - 20);

            const newW = Math.max(minW, Math.min(maxW, Math.round(startWidth + deltaX)));
            const newH = Math.max(minH, Math.min(maxH, Math.round(startHeight + deltaY)));

            modal.style.setProperty('width', `${newW}px`, 'important');
            modal.style.setProperty('height', `${newH}px`, 'important');
          }
        };

        const onMouseUp = () => {
          document.removeEventListener('mousemove', onMouseMove);
          document.removeEventListener('mouseup', onMouseUp);

          if (isDragging) {
            isDragging = false;
            dragOverlay.style.display = 'none';
            resizer.classList.remove('resizing');
            document.body.style.cursor = '';
            document.body.style.userSelect = '';

            const finalW = Math.round(modal.offsetWidth);
            const finalH = Math.round(modal.offsetHeight);
            if (CONFIG.get('rememberContextSize', true) && finalW >= 300 && finalH >= 150) {
              CONFIG.set('contextModalWidth', `${finalW}px`);
              CONFIG.set('contextModalHeight', `${finalH}px`);
              Logger.log(`Saved resized Context Viewer dimensions: ${finalW}px × ${finalH}px`);
            }
          }
        };

        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
      };

      resizer.addEventListener('mousedown', onMouseDown);
    },

    /**
     * Checks if a clicked element inside the header is an interactive button/input.
     * @param {HTMLElement} target
     * @returns {boolean}
     */
    isInteractiveElement(target) {
      return !!target.closest('button, [role="button"], input, textarea, select, a, [role="tab"], [role="tablist"], [role="switch"], [data-slot="platform-dropdown-menu-trigger"], [data-slot="platform-dialog-close"], [data-slot="aid-dialog-close"], [data-slot="aid-button"], [data-memory-action-id], [aria-label*="close" i], [aria-label*="Copy" i], .aid-qol-modal-corner-resizer');
    },

    /**
     * Finds the modal's visible top header row to use as the drag handle.
     * Explicitly skips visually hidden screen-reader titles (.sr-only).
     * @param {HTMLElement} modal
     * @returns {HTMLElement|null}
     */
    findModalHeader(modal) {
      // 1. Look for a VISIBLE heading (ignore .sr-only!)
      const headings = modal.querySelectorAll('h2, h3, h4, [data-slot="platform-dialog-title"]');
      for (const h of headings) {
        if (!h.classList.contains('sr-only')) {
          const parentRow = h.parentElement;
          if (parentRow && parentRow !== modal) {
            return parentRow;
          }
        }
      }

      // 2. Look for explicit platform-dialog-header container
      const headerSlot = modal.querySelector('[data-slot="platform-dialog-header"]');
      if (headerSlot) return headerSlot;

      // 3. Look for the top row containing the "More" button or Close button
      const moreBtn = modal.querySelector('button[aria-label="More" i], [data-slot="platform-dialog-close"]');
      if (moreBtn && moreBtn.parentElement && moreBtn.parentElement !== modal) {
        return moreBtn.parentElement;
      }

      // 4. Fallback to first element child
      return modal.firstElementChild;
    },

    /**
     * Finds the visible top header row specifically for Context Viewer dialogs and submenus.
     * Skips .sr-only titles and targets the row containing the title, category icon, or close button.
     * @param {HTMLElement} modal
     * @returns {HTMLElement|null}
     */
    findContextModalHeader(modal) {
      // 1. Look for explicit aid-dialog-header container
      const dialogHeader = modal.querySelector('[data-slot="aid-dialog-header"], [data-slot="platform-dialog-header"]');
      if (dialogHeader) return dialogHeader;

      // 2. Look for the top row containing the close button (present in submenus: Adventure, Memories, AI Instructions, Complete Text, etc.)
      const closeBtn = modal.querySelector('button[data-slot="aid-dialog-close"], button[aria-label*="close" i]');
      if (closeBtn) {
        const row = closeBtn.closest('._jc-space-betwe3241') || closeBtn.closest('._fd-row') || closeBtn.closest('[data-slot="aid-dialog-header"]') || closeBtn.parentElement;
        if (row && row !== modal) {
          return row;
        }
      }

      // 3. Look for visible h1 heading row
      const h1 = modal.querySelector('h1');
      if (h1 && !h1.classList.contains('sr-only')) {
        const row = h1.closest('._jc-space-betwe3241') || h1.closest('._fd-row') || h1.parentElement;
        if (row && row !== modal) {
          return row;
        }
      }

      // 4. Look for visible element with "View Context", "Context viewer", or "Memories"
      const candidates = modal.querySelectorAll('span, div, h2, h3');
      for (const el of candidates) {
        if (!el.classList.contains('sr-only')) {
          const t = el.textContent.trim().toLowerCase();
          if (t === 'view context' || t === 'memories' || t === 'context viewer') {
            const row = el.closest('._jc-space-betwe3241') || el.closest('._fd-row') || el.parentElement;
            if (row && row !== modal) {
              return row;
            }
          }
        }
      }

      // 5. Look for the first row containing the w_search icon
      const icon = modal.querySelector('span.font_icons');
      if (icon && icon.textContent.includes('w_search')) {
        const row = icon.closest('._jc-space-betwe3241') || icon.closest('._fd-row');
        if (row && row !== modal) {
          return row;
        }
      }

      // 6. Fallback to first visible row in the modal
      const firstRow = modal.querySelector('._fd-row');
      if (firstRow && firstRow !== modal) return firstRow;

      // 7. Fallback to standard modal header finder
      return this.findModalHeader(modal);
    },

    /**
     * Binds mouse drag listeners to the modal header.
     * @param {HTMLElement} modal
     * @param {HTMLElement} header
     */
    bindDragEvents(modal, header) {
      const onMouseDown = (e) => {
        // Left click only
        if (e.button !== 0) return;

        // Skip dragging when clicking interactive buttons, tabs, or close icons
        if (this.isInteractiveElement(e.target)) {
          return;
        }

        e.preventDefault();

        // If maximized, restore normal size on drag
        if (modal.classList.contains('aid-qol-modal-maximized')) {
          modal.classList.remove('aid-qol-modal-maximized');
        }

        // Lock in current screen position before moving
        const rect = modal.getBoundingClientRect();
        modal.style.setProperty('position', 'fixed', 'important');
        modal.style.setProperty('margin', '0px', 'important');
        modal.style.setProperty('transform', 'none', 'important');
        modal.style.setProperty('transition', 'none', 'important');
        modal.style.setProperty('right', 'auto', 'important');
        modal.style.setProperty('bottom', 'auto', 'important');
        modal.style.setProperty('left', `${rect.left}px`, 'important');
        modal.style.setProperty('top', `${rect.top}px`, 'important');
        StoryCardModalModule.highestZ = Math.max(StoryCardModalModule.highestZ || 999999, 999999) + 1;
        modal.style.zIndex = `${StoryCardModalModule.highestZ}`;

        const startX = e.clientX;
        const startY = e.clientY;
        const initialLeft = rect.left;
        const initialTop = rect.top;

        const onMouseMove = (moveEvent) => {
          const deltaX = moveEvent.clientX - startX;
          const deltaY = moveEvent.clientY - startY;

          // Clamp within viewport so the modal header remains reachable
          const newLeft = Math.max(0, Math.min(window.innerWidth - 80, initialLeft + deltaX));
          const newTop = Math.max(0, Math.min(window.innerHeight - 40, initialTop + deltaY));

          modal.style.setProperty('left', `${newLeft}px`, 'important');
          modal.style.setProperty('top', `${newTop}px`, 'important');
        };

        const onMouseUp = () => {
          document.removeEventListener('mousemove', onMouseMove);
          document.removeEventListener('mouseup', onMouseUp);
        };

        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
      };

      header.addEventListener('mousedown', onMouseDown);
    },

    /**
     * Toggles modal between maximized and restored size.
     * @param {HTMLElement} modal
     */
    toggleMaximize(modal) {
      if (modal.classList.contains('aid-qol-modal-maximized')) {
        // Restore
        modal.classList.remove('aid-qol-modal-maximized');
        if (modal._preMaxStyle) {
          modal.style.setProperty('left', modal._preMaxStyle.left, 'important');
          modal.style.setProperty('top', modal._preMaxStyle.top, 'important');
          modal.style.setProperty('width', modal._preMaxStyle.width, 'important');
          modal.style.setProperty('height', modal._preMaxStyle.height, 'important');
        }
        Logger.log('Restored modal size');
      } else {
        // Maximize
        modal._preMaxStyle = {
          left: modal.style.left,
          top: modal.style.top,
          width: modal.style.width,
          height: modal.style.height,
        };
        modal.style.setProperty('position', 'fixed', 'important');
        modal.style.setProperty('margin', '0px', 'important');
        modal.classList.add('aid-qol-modal-maximized');
        Logger.log('Maximized modal');
      }
    }
  };

  // =========================================================================
  // Feature Module 5: Game Menu Horizontal Resize (Right Sidebar Splitter)
  // =========================================================================
  const GameMenuResizeModule = {
    name: 'Game Menu Resize',
    resizerId: 'aid-qol-game-menu-resizer',

    init() {
      if (!CONFIG.get('gameMenuResizeEnabled', true)) return;
      Logger.info('Initializing GameMenuResizeModule...');

      this.injectStyles();
      this.observeMenu();
    },

    injectStyles() {
      GM_addStyle(`
        /* 
         * Resizable Game Menu column styling.
         * Ensures inner Tamagui containers expand fluidly to fill 100% of the column.
         * Explicitly excludes the #${this.resizerId} handle so it remains strictly an 8px strip.
         */
        .aid-qol-game-menu-resizable {
          position: relative !important;
          max-width: none !important;
        }

        .aid-qol-game-menu-resizable > div:not(#${this.resizerId}) {
          width: 100% !important;
          max-width: none !important;
        }

        .aid-qol-game-menu-resizable > div:not(#${this.resizerId}) > div {
          width: 100% !important;
          max-width: none !important;
        }

        /* Draggable splitter strictly on the left 8px border */
        #${this.resizerId} {
          position: absolute !important;
          top: 0 !important;
          bottom: 0 !important;
          left: 0 !important;
          width: 8px !important;
          min-width: 8px !important;
          max-width: 8px !important;
          cursor: col-resize !important;
          z-index: 10000 !important;
          user-select: none !important;
          background-color: transparent !important;
          transition: background-color 0.15s ease-in-out;
          pointer-events: auto !important;
        }

        #${this.resizerId}:hover,
        #${this.resizerId}.resizing {
          background-color: var(--color-aid-primary, rgba(249, 115, 22, 0.75)) !important;
          box-shadow: 0 0 8px var(--color-aid-primary, rgba(249, 115, 22, 0.9)) !important;
        }
      `);
    },

    /**
     * Clamps and validates menu width to prevent viewport overflows.
     * Default stock width is 424px.
     */
    getValidWidth(val) {
      let num = parseInt(val, 10);
      if (isNaN(num)) num = 424;
      const minW = 320;
      const maxW = Math.max(minW, Math.min(window.innerWidth - 250, Math.round(window.innerWidth * 0.85)));
      if (num < minW || num > maxW) {
        return 424;
      }
      return num;
    },

    /**
     * Walks up from the settings region to locate the top-level flex column.
     * @param {HTMLElement} settingsRegion
     * @returns {HTMLElement|null}
     */
    findMenuRoot(settingsRegion) {
      if (!settingsRegion) return null;
      let current = settingsRegion;
      while (current && current.parentElement) {
        const parent = current.parentElement;
        if (parent.style && parent.style.flexDirection === 'row') {
          return current;
        }
        current = parent;
      }
      return settingsRegion.closest('[style*="flex-shrink"]') || null;
    },

    /**
     * Attaches the resize handle and applies custom width when menu is mounted.
     * @param {HTMLElement} rootCol
     */
    setupMenu(rootCol) {
      if (!rootCol || !rootCol.isConnected) return;
      if (rootCol.querySelector(`#${this.resizerId}`)) return;

      Logger.log('Setting up resizable Game Menu:', rootCol);
      rootCol.classList.add('aid-qol-game-menu-resizable');

      // Apply saved preferred width if valid and different from stock default (424px)
      const savedWidth = this.getValidWidth(CONFIG.get('gameMenuWidth', '424px'));
      if (savedWidth !== 424) {
        rootCol.style.width = `${savedWidth}px`;
      }

      // Create and insert the draggable left splitter handle
      const resizer = document.createElement('div');
      resizer.id = this.resizerId;
      resizer.title = 'Drag left edge to resize menu (Double-click to reset to 424px)';
      rootCol.prepend(resizer);

      this.bindDragEvents(resizer, rootCol);
    },

    /**
     * Binds mouse drag and double-click listeners to the resize handle.
     * @param {HTMLElement} resizer
     * @param {HTMLElement} rootCol
     */
    bindDragEvents(resizer, rootCol) {
      let lastMouseDownTime = 0;
      let lastMouseDownX = 0;
      let lastMouseDownY = 0;

      resizer.addEventListener('mousedown', (e) => {
        if (e.button !== 0) return;

        // Double-click detection via rapid successive clicks (within 350ms and 10px)
        const now = Date.now();
        const dist = Math.hypot(e.clientX - lastMouseDownX, e.clientY - lastMouseDownY);
        if (now - lastMouseDownTime < 350 && dist < 10) {
          lastMouseDownTime = 0;
          e.preventDefault();
          e.stopPropagation();
          this.handleToggleWidth(rootCol);
          return;
        }
        lastMouseDownTime = now;
        lastMouseDownX = e.clientX;
        lastMouseDownY = e.clientY;

        e.preventDefault();
        e.stopPropagation();

        const startX = e.clientX;
        const startWidth = rootCol.offsetWidth;
        let isDragging = false;

        // Transparent full-screen overlay during drag to prevent iframe / selection traps
        let dragOverlay = document.getElementById('aid-qol-menu-drag-overlay');
        if (!dragOverlay) {
          dragOverlay = document.createElement('div');
          dragOverlay.id = 'aid-qol-menu-drag-overlay';
          dragOverlay.style.cssText = 'position:fixed;inset:0;z-index:999999;cursor:col-resize;user-select:none;display:none;';
          document.body.appendChild(dragOverlay);
        }

        const onMouseMove = (moveEvent) => {
          const deltaX = startX - moveEvent.clientX;

          // Only activate drag mode once mouse has actually moved > 3px
          if (!isDragging && Math.abs(deltaX) > 3) {
            isDragging = true;
            resizer.classList.add('resizing');
            document.body.style.cursor = 'col-resize';
            document.body.style.userSelect = 'none';
            dragOverlay.style.display = 'block';
          }

          if (isDragging) {
            const minW = 320;
            const maxW = Math.max(minW, Math.min(window.innerWidth - 250, Math.round(window.innerWidth * 0.85)));
            const targetW = Math.max(minW, Math.min(maxW, Math.round(startWidth + deltaX)));

            rootCol.style.width = `${targetW}px`;
          }
        };

        const onMouseUp = () => {
          document.removeEventListener('mousemove', onMouseMove);
          document.removeEventListener('mouseup', onMouseUp);

          if (isDragging) {
            dragOverlay.style.display = 'none';
            resizer.classList.remove('resizing');
            document.body.style.cursor = '';
            document.body.style.userSelect = '';

            const finalW = rootCol.offsetWidth;
            if (finalW >= 320) {
              CONFIG.set('gameMenuWidth', `${finalW}px`);
              Logger.log(`Saved Game Menu width: ${finalW}px`);
            }
          }
        };

        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
      });

      // Also listen to native dblclick event as a backup
      resizer.addEventListener('dblclick', (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.handleToggleWidth(rootCol);
      });
    },

    /**
     * Toggles Game Menu between custom width and default 424px.
     * @param {HTMLElement} rootCol
     */
    handleToggleWidth(rootCol) {
      if (!rootCol || !rootCol.isConnected) return;
      const currentW = rootCol.offsetWidth;
      const defaultW = 424;

      if (Math.abs(currentW - defaultW) > 10) {
        // Custom width -> Reset to default 424px
        rootCol._lastCustomWidth = `${currentW}px`;
        rootCol.style.width = `${defaultW}px`;
        CONFIG.set('gameMenuWidth', `${defaultW}px`);
        Logger.log('Reset Game Menu width to default 424px');
      } else if (rootCol._lastCustomWidth && parseInt(rootCol._lastCustomWidth, 10) !== defaultW) {
        // Default width -> Restore previously used custom width
        const restoreW = this.getValidWidth(rootCol._lastCustomWidth);
        rootCol.style.width = `${restoreW}px`;
        CONFIG.set('gameMenuWidth', `${restoreW}px`);
        Logger.log(`Restored Game Menu width to ${restoreW}px`);
      } else {
        // Default width -> Expand to 600px preview
        const expandedW = Math.min(650, Math.round(window.innerWidth * 0.5));
        rootCol._lastCustomWidth = `${expandedW}px`;
        rootCol.style.width = `${expandedW}px`;
        CONFIG.set('gameMenuWidth', `${expandedW}px`);
        Logger.log(`Expanded Game Menu width to ${expandedW}px`);
      }
    },

    /**
     * Observes DOM purely for Game Menu additions.
     * Uses childList only to completely prevent infinite loops and freezes.
     */
    observeMenu() {
      const checkAndSetup = () => {
        if (!CONFIG.get('gameMenuResizeEnabled', true)) return;

        const settingsRegion = document.querySelector('[aria-label="Game settings" i]');
        if (!settingsRegion || !settingsRegion.isConnected) return;

        const rootCol = this.findMenuRoot(settingsRegion);
        if (!rootCol || !rootCol.isConnected) return;

        if (rootCol.querySelector(`#${this.resizerId}`)) return;

        this.setupMenu(rootCol);
      };

      // Check on initial load
      checkAndSetup();

      // Observe childList additions ONLY
      const observer = new MutationObserver((mutations) => {
        for (const m of mutations) {
          if (!m.addedNodes || m.addedNodes.length === 0) continue;
          for (const node of m.addedNodes) {
            if (node.nodeType !== Node.ELEMENT_NODE) continue;
            if (node.id === this.resizerId) continue;

            if (node.matches && node.matches('[aria-label="Game settings" i]')) {
              checkAndSetup();
              return;
            }
            if (node.querySelector && node.querySelector('[aria-label="Game settings" i]')) {
              checkAndSetup();
              return;
            }
          }
        }
      });

      observer.observe(document.body, { childList: true, subtree: true });
    }
  };

  // =========================================================================
  // Feature Module 6: Textarea Vertical Resizing
  // =========================================================================
  const TextareaResizeModule = {
    name: 'Textarea Vertical Resizing',
    styleId: 'aid-qol-textarea-resize-style',

    init() {
      Logger.info('Initializing TextareaResizeModule...');
      this.updateStyles();
      this.observeTextareas();
    },

    updateStyles() {
      const existing = document.getElementById(this.styleId);
      if (!CONFIG.get('textareaResizeEnabled', true)) {
        if (existing) existing.remove();
        return;
      }
      if (existing) return;

      const nonStorySelector = 'textarea:not(#game-text-input, [aria-label="Action input" i], [data-undo-redo-editor-field="actionInput"], .aid-qol-config-modal *, #gameplay-output *, #gameplay-story-scrollview *, [aria-label="Story" i] *, #game-text-input-controller *, [data-gameplay-story-row-index] *, [data-gameplay-story-item-index] *, [data-gameplay-story-action-id] *)';

      const css = `
        /* 
         * Textarea Vertical Resizing.
         * Adds vertical resize capability to textareas across Story Cards, Memory,
         * Notes, and Scenarios by grabbing the small box at the bottom of the scrollbar.
         * Explicitly excludes textareas inside the story half of the screen:
         * running story paragraphs, story actions, and next prompt input dock.
         */
        ${nonStorySelector} {
          resize: vertical !important;
          overflow-y: auto !important;
          min-height: 48px !important;
          max-height: unset !important;
          border-bottom-right-radius: 0px !important;
          scrollbar-gutter: stable !important;
          scrollbar-width: thin !important;
        }

        /* 
         * Square bottom-right corner on any ancestor container wrapping the resizable textarea.
         * Handles direct parents, grandparents, and outer card wrappers (e.g. Gear Menu -> Adventure -> Plot essentials / Author's Note).
         */
        *:has(> ${nonStorySelector}),
        *:has(> * > ${nonStorySelector}),
        *:has(> * > * > ${nonStorySelector}),
        *:has(> * > * > * > ${nonStorySelector}) {
          border-bottom-right-radius: 0px !important;
        }

        /* Target Tamagui and Tailwind radius classes on containers enclosing resizable textareas */
        [class*="_bbrr-"]:has(${nonStorySelector}),
        [class*="rounded"]:has(${nonStorySelector}) {
          border-bottom-right-radius: 0px !important;
        }

        /* Specifically inside Game Menu / Settings drawer (Adventure -> Plot textarea items) */
        .aid-qol-game-menu-resizable div:has(${nonStorySelector}),
        [aria-label="Game settings" i] div:has(${nonStorySelector}),
        [aria-label="Game settings" i] *:has(${nonStorySelector}) {
          border-bottom-right-radius: 0px !important;
        }

        /* Thinned, sleek scrollbar on resizable textareas */
        ${nonStorySelector}::-webkit-scrollbar {
          width: 7px !important;
          height: 7px !important;
          display: block !important;
        }

        ${nonStorySelector}::-webkit-scrollbar-track {
          background-color: rgba(0, 0, 0, 0.15) !important;
          border-radius: 0px !important;
          border-bottom-right-radius: 0px !important;
        }

        ${nonStorySelector}::-webkit-scrollbar-thumb {
          background-color: var(--borderColor, rgba(255, 255, 255, 0.22)) !important;
          border-radius: 3px !important;
        }

        ${nonStorySelector}::-webkit-scrollbar-thumb:hover {
          background-color: var(--color, rgba(255, 255, 255, 0.45)) !important;
        }

        /* 
         * Square bottom-right corner and thinned resizer handle.
         * Rendered flush at the bottom of the scroller with clean diagonal grip lines.
         * Explicitly locks background-size and dimension limits to 7px x 7px so the handle
         * never inflates when content fits and the vertical scrollbar track is unneeded.
         */
        ${nonStorySelector}::-webkit-resizer {
          display: block !important;
          width: 7px !important;
          height: 7px !important;
          max-width: 7px !important;
          max-height: 7px !important;
          border-radius: 0px !important;
          border-bottom-right-radius: 0px !important;
          background-color: transparent !important;
          background-size: 7px 7px !important;
          background-repeat: no-repeat !important;
          background-position: bottom right !important;
          background-image: 
            linear-gradient(135deg, transparent 0%, transparent 45%, rgba(255, 255, 255, 0.35) 45%, rgba(255, 255, 255, 0.35) 58%, transparent 58%, transparent 75%, rgba(255, 255, 255, 0.35) 75%, rgba(255, 255, 255, 0.35) 88%, transparent 88%) !important;
          cursor: ns-resize !important;
        }

        ${nonStorySelector}::-webkit-scrollbar-corner {
          background-color: transparent !important;
          width: 7px !important;
          height: 7px !important;
        }

        /* 
         * Explicitly disable resizing and hide resize handle for textareas in the story half of the screen:
         * running story paragraphs, story actions, and next prompt input dock.
         */
        #gameplay-output textarea,
        #gameplay-story-scrollview textarea,
        [aria-label="Story" i] textarea,
        #game-text-input-controller textarea,
        [data-gameplay-story-row-index] textarea,
        [data-gameplay-story-item-index] textarea,
        [data-gameplay-story-action-id] textarea,
        #game-text-input,
        [aria-label="Action input" i],
        [data-undo-redo-editor-field="actionInput"] {
          resize: none !important;
        }

        #gameplay-output textarea::-webkit-resizer,
        #gameplay-story-scrollview textarea::-webkit-resizer,
        [aria-label="Story" i] textarea::-webkit-resizer,
        #game-text-input-controller textarea::-webkit-resizer,
        [data-gameplay-story-row-index] textarea::-webkit-resizer,
        [data-gameplay-story-item-index] textarea::-webkit-resizer,
        [data-gameplay-story-action-id] textarea::-webkit-resizer,
        #game-text-input::-webkit-resizer,
        [aria-label="Action input" i]::-webkit-resizer,
        [data-undo-redo-editor-field="actionInput"]::-webkit-resizer {
          display: none !important;
          width: 0 !important;
          height: 0 !important;
        }
      `;

      const style = document.createElement('style');
      style.id = this.styleId;
      style.textContent = css;
      (document.head || document.documentElement).appendChild(style);
    },

    /**
     * Helper to determine if a textarea belongs to the story half of the screen.
     */
    isStoryTextarea(textarea) {
      if (!textarea) return false;
      if (textarea.id === 'game-text-input') return true;
      if (textarea.matches && textarea.matches('[aria-label="Action input" i], [data-undo-redo-editor-field="actionInput"]')) return true;
      return !!textarea.closest('#gameplay-output, #gameplay-story-scrollview, [aria-label="Story" i], #game-text-input-controller, [data-gameplay-story-row-index], [data-gameplay-story-item-index], [data-gameplay-story-action-id], .aid-qol-config-modal');
    },

    /**
     * Observes DOM to actively square corners on textarea wrappers and card containers.
     * Ensures any dynamic or React Native Web / Tamagui elements in the Gear Menu
     * have their bottom-right corners squared even with deeply nested wrapper markup.
     */
    observeTextareas() {
      const squareCorners = (textarea) => {
        if (!CONFIG.get('textareaResizeEnabled', true)) return;
        if (!textarea || !textarea.isConnected) return;
        if (this.isStoryTextarea(textarea)) return;

        textarea.style.setProperty('border-bottom-right-radius', '0px', 'important');

        // Walk up parents (up to 4 levels) to square enclosing cards, input wrappers, and disclosure containers
        let parent = textarea.parentElement;
        let depth = 0;
        while (parent && depth < 4) {
          if (parent.matches && (
            parent.matches('.aid-qol-game-menu-resizable, body, html, #__next')
          )) {
            break;
          }
          parent.style.setProperty('border-bottom-right-radius', '0px', 'important');
          parent = parent.parentElement;
          depth++;
        }
      };

      observeSelector('textarea', (textarea) => {
        if (!this.isStoryTextarea(textarea)) {
          squareCorners(textarea);
        }
      });
    }
  };

  // =========================================================================
  // =========================================================================
  // Feature Module 7: Theme & Typography Manager
  // =========================================================================
  const ThemeManagerModule = {
    name: 'Theme & Typography Manager',
    styleElId: 'aid-qol-theme-style',

    PRESETS: {
      default: {
        themeFontSize: '18px',
        themeFontWeight: '400',
        themeLineHeight: '1.7',
        themeParagraphSpacing: '1.25em',
        themeStoryWidth: '900px',
        themeTextColor: '',
        themeBgColor: '',
        themeActionStyle: 'default',
        themeActionColor: '#fb923c',
        themeCardHeight: '64px',
        themeMenuSpacing: '12px',
        themeMenuFontSize: '14px',
        themeTextareaHeight: '96px'
      },
      compact: {
        themeFontSize: '15px',
        themeFontWeight: '400',
        themeLineHeight: '1.45',
        themeParagraphSpacing: '0.85em',
        themeStoryWidth: '780px',
        themeTextColor: '',
        themeBgColor: '',
        themeActionStyle: 'dimmed',
        themeActionColor: '#fb923c',
        themeCardHeight: '44px',
        themeMenuSpacing: '4px',
        themeMenuFontSize: '12px',
        themeTextareaHeight: '54px'
      },
      large: {
        themeFontSize: '21px',
        themeFontWeight: '500',
        themeLineHeight: '1.85',
        themeParagraphSpacing: '1.5em',
        themeStoryWidth: '980px',
        themeTextColor: '#f4efe6',
        themeBgColor: '',
        themeActionStyle: 'italic',
        themeActionColor: '#fb923c',
        themeCardHeight: '64px',
        themeMenuSpacing: '12px',
        themeMenuFontSize: '15px',
        themeTextareaHeight: '110px'
      },
      oled: {
        themeFontSize: '18px',
        themeFontWeight: '400',
        themeLineHeight: '1.7',
        themeParagraphSpacing: '1.25em',
        themeStoryWidth: '900px',
        themeTextColor: '#e4e4e7',
        themeBgColor: '#000000',
        themeActionStyle: 'accent',
        themeActionColor: '#38bdf8',
        themeCardHeight: '46px',
        themeMenuSpacing: '6px',
        themeMenuFontSize: '13px',
        themeTextareaHeight: '64px'
      }
    },

    init() {
      Logger.info('Initializing ThemeManagerModule...');
      this.applySavedConfig();
      this.initActionObserver();
    },

    initActionObserver() {
      const markActions = () => {
        const actionEls = document.querySelectorAll('#gameplay-story-scrollview [data-gameplay-story-action-id]');
        actionEls.forEach(el => {
          const text = (el.textContent || '').trim();
          if (text.startsWith('>') || el.classList.contains('_col-core9')) {
            el.classList.add('aid-qol-player-action');
          }
        });
      };
      observeSelector('#gameplay-story-scrollview [data-gameplay-story-action-id]', () => {
        markActions();
      });
    },

    getSavedSettings() {
      const preset = CONFIG.get('themePreset', 'default');
      return {
        themePreset: preset,
        themeFontSize: CONFIG.get('themeFontSize', '18px'),
        themeFontWeight: CONFIG.get('themeFontWeight', '400'),
        themeLineHeight: CONFIG.get('themeLineHeight', '1.7'),
        themeParagraphSpacing: CONFIG.get('themeParagraphSpacing', '1.25em'),
        themeStoryWidth: CONFIG.get('themeStoryWidth', '900px'),
        themeTextColor: CONFIG.get('themeTextColor', ''),
        themeBgColor: CONFIG.get('themeBgColor', ''),
        themeActionStyle: CONFIG.get('themeActionStyle', 'default'),
        themeActionColor: CONFIG.get('themeActionColor', '#fb923c'),
        themeCardHeight: CONFIG.get('themeCardHeight', '64px'),
        themeMenuSpacing: CONFIG.get('themeMenuSpacing', '12px'),
        themeMenuFontSize: CONFIG.get('themeMenuFontSize', '14px'),
        themeTextareaHeight: CONFIG.get('themeTextareaHeight', '96px')
      };
    },

    buildCSS(settings) {
      const {
        themePreset,
        themeFontSize,
        themeFontWeight,
        themeLineHeight,
        themeParagraphSpacing,
        themeStoryWidth,
        themeTextColor,
        themeBgColor,
        themeActionStyle,
        themeActionColor,
        themeCardHeight,
        themeMenuSpacing,
        themeMenuFontSize,
        themeTextareaHeight
      } = settings;

      const cardHeightNum = parseInt(themeCardHeight) || 64;
      const menuSpacingNum = parseInt(themeMenuSpacing) || 12;
      const menuFontSizeNum = parseInt(themeMenuFontSize) || 14;
      const textareaHeightNum = parseInt(themeTextareaHeight) || 96;

      // When preset is default and no custom styling is requested, produce no overriding CSS
      if (themePreset === 'default' && !themeTextColor && !themeBgColor &&
          themeFontSize === '18px' && themeFontWeight === '400' &&
          themeLineHeight === '1.7' && themeParagraphSpacing === '1.25em' &&
          themeStoryWidth === '900px' && themeActionStyle === 'default' &&
          cardHeightNum === 64 && menuSpacingNum === 12 && menuFontSizeNum === 14 &&
          textareaHeightNum === 96) {
        return '';
      }

      let css = `/* AID-QoL Dynamic Theme Styles */\n`;

      // 1. Typography & Colors for story text and story-editing textareas
      css += `
        #gameplay-story-scrollview [data-gameplay-story-action-id],
        #gameplay-story-scrollview [role="document"],
        #gameplay-story-scrollview .font_gameplaySans,
        #gameplay-story-scrollview .fs-aid-story-content span.is_Text,
        #gameplay-story-scrollview #action-edit-textarea,
        #gameplay-story-scrollview #story-edit-textarea,
        #game-text-input,
        textarea#game-text-input {
          font-size: ${themeFontSize || '18px'} !important;
          font-weight: ${themeFontWeight || '400'} !important;
          ${themeTextColor ? `color: ${themeTextColor} !important;` : ''}
        }

        #game-text-input::placeholder,
        textarea#game-text-input::placeholder {
          font-size: ${themeFontSize || '18px'} !important;
        }
      `;

      // 2. Action / Paragraph Spacing
      if (themeParagraphSpacing && themeParagraphSpacing !== '1.25em') {
        css += `
          #gameplay-story-scrollview [data-gameplay-story-action-id] {
            margin-bottom: ${themeParagraphSpacing} !important;
            display: inline-block !important;
            width: 100% !important;
          }
          #gameplay-story-scrollview .fs-aid-story-content {
            row-gap: ${themeParagraphSpacing} !important;
          }
        `;
      }

      // 3. Story Column Max Width
      if (themeStoryWidth) {
        css += `
          #gameplay-story-scrollview .fs-aid-story-content,
          #gameplay-story-scrollview .fs-aid-story-controls,
          #gameplay-story-scrollview [data-gameplay-story-item-index] > div > div,
          #gameplay-story-scrollview ._maw-900px,
          .gameplay-action-input-dock #game-text-input-controller,
          .gameplay-action-input-dock ._maw-900px {
            max-width: ${themeStoryWidth} !important;
          }
        `;
      }

      // 4. Background Color Overrides
      if (themeBgColor) {
        css += `
          body.t_dark,
          #gameplay-output,
          #gameplay-story-scrollview,
          .gameplay-viewport-root {
            background-color: ${themeBgColor} !important;
          }
          .gameplay-action-input-dock #game-text-input-controller {
            background-color: ${themeBgColor} !important;
          }
          .gameplay-action-input-dock #game-text-input-controller > .is_Row {
            background-color: ${themeBgColor} !important;
          }
        `;

        const isPureBlack = themeBgColor.toLowerCase() === '#000000' || themeBgColor.toLowerCase() === '#000' || themeBgColor.toLowerCase() === 'black';
        if (isPureBlack) {
          css += `
            #gameplay-saturate {
              opacity: 0.05 !important;
            }
            .gameplay-action-input-dock #game-text-input-controller {
              border-color: rgba(255, 255, 255, 0.12) !important;
            }
            .gameplay-action-input-dock #game-text-input-controller > .is_Row {
              box-shadow: 0 0 24px rgba(0, 0, 0, 0.95) !important;
            }
          `;
        }
      }

      // 5. Action Text Styling
      const actionCol = themeActionColor || '#fb923c';
      if (themeActionStyle === 'dimmed') {
        css += `
          #gameplay-story-scrollview [data-gameplay-story-action-id]._col-core9,
          #gameplay-story-scrollview [data-gameplay-story-action-id].aid-qol-player-action {
            opacity: 0.72 !important;
          }
        `;
      } else if (themeActionStyle === 'italic') {
        css += `
          #gameplay-story-scrollview [data-gameplay-story-action-id]._col-core9,
          #gameplay-story-scrollview [data-gameplay-story-action-id].aid-qol-player-action {
            font-style: italic !important;
          }
        `;
      } else if (themeActionStyle === 'accent') {
        css += `
          #gameplay-story-scrollview [data-gameplay-story-action-id]._col-core9,
          #gameplay-story-scrollview [data-gameplay-story-action-id].aid-qol-player-action {
            color: ${actionCol} !important;
          }
        `;
      } else if (themeActionStyle === 'italic-accent') {
        css += `
          #gameplay-story-scrollview [data-gameplay-story-action-id]._col-core9,
          #gameplay-story-scrollview [data-gameplay-story-action-id].aid-qol-player-action {
            font-style: italic !important;
            color: ${actionCol} !important;
          }
        `;
      } else if (themeActionStyle === 'underlined') {
        css += `
          #gameplay-story-scrollview [data-gameplay-story-action-id]._col-core9,
          #gameplay-story-scrollview [data-gameplay-story-action-id].aid-qol-player-action {
            text-decoration: underline !important;
            text-decoration-color: ${actionCol} !important;
            text-underline-offset: 4px !important;
          }
        `;
      }


      // 6. Interface & Menu Density Overrides (Story Cards, Sidebar & Gear Menu)
      if (cardHeightNum < 64 || menuSpacingNum < 12 || textareaHeightNum !== 96) {
        const cardPaddingV = Math.max(2, Math.round((cardHeightNum - 26) / 2));
        const cardFontSize = cardHeightNum <= 38 ? '13px' : cardHeightNum <= 48 ? '14px' : '15px';
        const catHeight = Math.max(28, Math.round(cardHeightNum * 0.72));
        const itemGap = Math.max(2, Math.round(menuSpacingNum * 0.4));
        const catGapTop = Math.max(4, Math.round(menuSpacingNum * 0.7));
        const catGapBottom = Math.max(1, Math.round(menuSpacingNum * 0.25));
        const textareaPaddingV = Math.max(3, Math.min(10, Math.round(textareaHeightNum * 0.08)));

        css += `
          /* AID-QoL Compact Interface & Story Card Overrides */
          [data-slot="platform-story-card"] {
            height: ${cardHeightNum}px !important;
            max-height: ${cardHeightNum}px !important;
            min-height: ${cardHeightNum}px !important;
            padding-top: ${cardPaddingV}px !important;
            padding-bottom: ${cardPaddingV}px !important;
          }

          [data-slot="platform-story-card"] h2[data-slot="platform-heading"] {
            font-size: ${cardFontSize} !important;
            line-height: 1.25 !important;
          }

          /* Tighten category headers in Story Cards list */
          [aria-label="Story cards"] button[aria-label$="story cards section" i] {
            height: ${catHeight}px !important;
            min-height: ${catHeight}px !important;
            padding-top: 2px !important;
            padding-bottom: 2px !important;
            margin-top: ${catGapTop}px !important;
            margin-bottom: ${catGapBottom}px !important;
          }

          /* Reduce separation between category header and story cards */
          [aria-label="Story cards"] [data-slot="platform-box"].pb-tamagui-1 {
            padding-bottom: ${catGapBottom}px !important;
          }

          [aria-label="Story cards"] [data-slot="platform-xstack"].pb-tamagui-1 {
            padding-bottom: ${itemGap}px !important;
          }

          /* Compact spacing for gear menu tabs and controls */
          .aid-qol-game-menu-resizable [data-slot="platform-row"].gap-tamagui-2 {
            gap: ${itemGap}px !important;
          }

          .aid-qol-game-menu-resizable [data-slot="platform-button"].py-tamagui-2 {
            padding-top: ${cardPaddingV}px !important;
            padding-bottom: ${cardPaddingV}px !important;
          }

          /* Gear Menu Sub-menu Textareas (Plot Essentials, Author's Note, AI Instructions, Details, Story Cards) */
          .aid-qol-game-menu-resizable textarea,
          .aid-qol-game-menu-resizable [data-slot="aid-textarea"],
          .aid-qol-game-menu-resizable [data-slot="platform-textarea"],
          [aria-label="Game settings" i] textarea,
          [aria-label="Game settings" i] [data-slot="aid-textarea"],
          [aria-label="Game settings" i] [data-slot="platform-textarea"],
          .aid-qol-story-card-modal textarea,
          .aid-qol-story-card-modal [data-slot="aid-textarea"] {
            min-height: ${textareaHeightNum}px !important;
            padding-top: ${textareaPaddingV}px !important;
            padding-bottom: ${textareaPaddingV}px !important;
          }
        `;
      }


      // 7. Gear Menu (Adventure & Gameplay) Font Size
      if (menuFontSizeNum !== 14) {
        css += `
          /* Gear Menu (Adventure & Gameplay) Font Size */
          .aid-qol-game-menu-resizable,
          .aid-qol-game-menu-resizable .is_Text:not(.font_icons):not([data-slot="platform-icon-glyph"]),
          .aid-qol-game-menu-resizable .font_body,
          .aid-qol-game-menu-resizable [data-slot="platform-text"],
          .aid-qol-game-menu-resizable [data-slot="platform-button"]:not(:has(.font_icons:only-child)),
          .aid-qol-game-menu-resizable [data-slot="platform-button-text"],
          .aid-qol-game-menu-resizable [data-slot="platform-input"],
          .aid-qol-game-menu-resizable input,
          .aid-qol-game-menu-resizable textarea,
          .aid-qol-game-menu-resizable [data-slot="aid-textarea"],
          .aid-qol-game-menu-resizable [data-slot="platform-textarea"],
          .aid-qol-game-menu-resizable button:not(:has(.font_icons:only-child)),
          .aid-qol-game-menu-resizable label,
          .aid-qol-game-menu-resizable p,
          [aria-label="Game settings" i],
          [aria-label="Game settings" i] .is_Text:not(.font_icons):not([data-slot="platform-icon-glyph"]),
          [aria-label="Game settings" i] .font_body,
          [aria-label="Game settings" i] [data-slot="platform-text"],
          [aria-label="Game settings" i] [data-slot="platform-button"]:not(:has(.font_icons:only-child)),
          [aria-label="Game settings" i] [data-slot="platform-button-text"],
          [aria-label="Game settings" i] [data-slot="platform-input"],
          [aria-label="Game settings" i] input,
          [aria-label="Game settings" i] textarea,
          [aria-label="Game settings" i] [data-slot="aid-textarea"],
          [aria-label="Game settings" i] [data-slot="platform-textarea"],
          [aria-label="Game settings" i] button:not(:has(.font_icons:only-child)),
          [aria-label="Game settings" i] label,
          [aria-label="Game settings" i] p,
          .aid-qol-story-card-modal textarea,
          .aid-qol-story-card-modal [data-slot="aid-textarea"],
          .aid-qol-story-card-modal [data-slot="platform-textarea"],
          .aid-qol-story-card-modal input,
          .aid-qol-story-card-modal label,
          .aid-qol-story-card-modal p {
            font-size: ${menuFontSizeNum}px !important;
          }

          /* Ensure textareas in gear menu sub-menus scale line-height and placeholders */
          .aid-qol-game-menu-resizable textarea,
          .aid-qol-game-menu-resizable [data-slot="aid-textarea"],
          .aid-qol-game-menu-resizable [data-slot="platform-textarea"],
          [aria-label="Game settings" i] textarea,
          [aria-label="Game settings" i] [data-slot="aid-textarea"],
          [aria-label="Game settings" i] [data-slot="platform-textarea"],
          .aid-qol-story-card-modal textarea,
          .aid-qol-story-card-modal [data-slot="aid-textarea"],
          .aid-qol-story-card-modal [data-slot="platform-textarea"] {
            line-height: 1.45 !important;
          }

          .aid-qol-game-menu-resizable textarea::placeholder,
          .aid-qol-game-menu-resizable [data-slot="aid-textarea"]::placeholder,
          [aria-label="Game settings" i] textarea::placeholder,
          [aria-label="Game settings" i] [data-slot="aid-textarea"]::placeholder,
          .aid-qol-story-card-modal textarea::placeholder {
            font-size: ${menuFontSizeNum}px !important;
          }

          .aid-qol-game-menu-resizable h1,
          .aid-qol-game-menu-resizable h2,
          .aid-qol-game-menu-resizable h3,
          .aid-qol-game-menu-resizable [data-slot="platform-heading"],
          [aria-label="Game settings" i] h1,
          [aria-label="Game settings" i] h2,
          [aria-label="Game settings" i] h3,
          [aria-label="Game settings" i] [data-slot="platform-heading"] {
            font-size: ${menuFontSizeNum + 1}px !important;
          }

          .aid-qol-game-menu-resizable [role="tablist"] [role="tab"] span.is_ButtonText,
          [aria-label="Game settings" i] [role="tablist"] [role="tab"] span.is_ButtonText {
            font-size: ${menuFontSizeNum}px !important;
          }
        `;
      }

      return css;
    },

    getOrCreateStyleTag() {
      let tag = document.getElementById(this.styleElId);
      if (!tag) {
        tag = document.createElement('style');
        tag.id = this.styleElId;
        tag.type = 'text/css';
        (document.head || document.documentElement).appendChild(tag);
      }
      return tag;
    },

    applySavedConfig() {
      const settings = this.getSavedSettings();
      const css = this.buildCSS(settings);
      const tag = this.getOrCreateStyleTag();
      tag.textContent = css;
    },

    applyLiveStyles(settings) {
      const css = this.buildCSS(settings);
      const tag = this.getOrCreateStyleTag();
      tag.textContent = css;
    },

    revertToSaved() {
      this.applySavedConfig();
    }
  };

  // Feature Module 8: Configuration Dialog (Native In-Game Settings Modal)
  // =========================================================================
  const ConfigUIModule = {
    name: 'Configuration Dialog',
    overlayId: 'aid-qol-config-overlay',
    overlay: null,
    currentPreset: 'default',
    initialThemeSettings: null,

    bindSliderWithDirectInput(sliderId, inputId, resetBtnId, defaultVal, unit, decimals = null) {
      const slider = document.getElementById(sliderId);
      const input = document.getElementById(inputId);
      const resetBtn = document.getElementById(resetBtnId);
      if (!slider || !input) return;

      const format = (v) => {
        const num = Number(v);
        if (isNaN(num)) return v;
        const formatted = decimals !== null ? num.toFixed(decimals) : String(num);
        return unit ? `${formatted}${unit}` : formatted;
      };

      slider.addEventListener('input', () => {
        input.value = format(slider.value);
        this.markCustomPreset();
        this.updateThemeLivePreview();
      });

      const onDirectType = () => {
        const raw = input.value.trim();
        const num = parseFloat(raw);
        if (!isNaN(num)) {
          slider.value = num;
          this.markCustomPreset();
          this.updateThemeLivePreview();
        }
      };

      input.addEventListener('input', onDirectType);
      input.addEventListener('change', () => {
        onDirectType();
        input.value = format(slider.value);
      });
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          input.blur();
        }
      });

      if (resetBtn) {
        resetBtn.addEventListener('click', () => {
          slider.value = defaultVal;
          input.value = format(defaultVal);
          this.markCustomPreset();
          this.updateThemeLivePreview();
        });
      }
    },

    gatherCurrentThemeUI() {
      const fontSize = document.getElementById('cfg-theme-font-size')?.value || '18';
      const fontWeight = document.getElementById('cfg-theme-font-weight')?.value || '400';
      const lineHeight = document.getElementById('cfg-theme-line-height')?.value || '1.7';
      const paragraphSpacing = document.getElementById('cfg-theme-paragraph-spacing')?.value || '1.25';
      const storyWidth = document.getElementById('cfg-theme-story-width')?.value || '900';
      const cardHeight = document.getElementById('cfg-theme-card-height')?.value || '64';
      const menuSpacing = document.getElementById('cfg-theme-menu-spacing')?.value || '12';
      const menuFontSize = document.getElementById('cfg-theme-menu-font-size')?.value || '14';
      const textareaHeight = document.getElementById('cfg-theme-textarea-height')?.value || '96';
      const textColor = document.getElementById('cfg-theme-text-color-hex')?.value.trim() || '';
      const bgColor = document.getElementById('cfg-theme-bg-color-hex')?.value.trim() || '';
      const actionStyle = document.getElementById('cfg-theme-action-style')?.value || 'default';
      const actionColor = document.getElementById('cfg-theme-action-color-hex')?.value.trim() || '#fb923c';

      return {
        themePreset: this.currentPreset || 'custom',
        themeFontSize: `${fontSize}px`,
        themeFontWeight: fontWeight,
        themeLineHeight: lineHeight,
        themeParagraphSpacing: `${paragraphSpacing}em`,
        themeStoryWidth: `${storyWidth}px`,
        themeCardHeight: `${cardHeight}px`,
        themeMenuSpacing: `${menuSpacing}px`,
        themeMenuFontSize: `${menuFontSize}px`,
        themeTextareaHeight: `${textareaHeight}px`,
        themeTextColor: textColor,
        themeBgColor: bgColor,
        themeActionStyle: actionStyle,
        themeActionColor: actionColor
      };
    },

    updateThemeLivePreview() {
      const settings = this.gatherCurrentThemeUI();

      // Readout inputs (only update if not currently being typed into)
      const updateIfNotActive = (id, val) => {
        const el = document.getElementById(id);
        if (el && document.activeElement !== el) {
          el.value = val;
        }
      };

      updateIfNotActive('cfg-theme-font-size-val', settings.themeFontSize);
      updateIfNotActive('cfg-theme-line-height-val', Number(settings.themeLineHeight).toFixed(2));
      updateIfNotActive('cfg-theme-paragraph-spacing-val', settings.themeParagraphSpacing);
      updateIfNotActive('cfg-theme-story-width-val', settings.themeStoryWidth);
      updateIfNotActive('cfg-theme-card-height-val', settings.themeCardHeight);
      updateIfNotActive('cfg-theme-menu-spacing-val', settings.themeMenuSpacing);
      updateIfNotActive('cfg-theme-menu-font-size-val', settings.themeMenuFontSize);
      updateIfNotActive('cfg-theme-textarea-height-val', settings.themeTextareaHeight);

      // In-dialog Story Preview Box
      const previewCard = document.getElementById('aid-theme-preview-card');
      const previewContent = document.getElementById('aid-theme-preview-content');
      const previewAction = document.getElementById('aid-preview-action');
      const previewStory = document.getElementById('aid-preview-story');

      if (previewCard && previewContent && previewAction && previewStory) {
        if (settings.themeBgColor) {
          previewCard.style.backgroundColor = settings.themeBgColor;
        } else {
          previewCard.style.backgroundColor = 'rgba(0, 0, 0, 0.45)';
        }

        previewContent.style.fontSize = settings.themeFontSize;
        previewContent.style.fontWeight = settings.themeFontWeight;
        previewContent.style.lineHeight = settings.themeLineHeight;
        previewContent.style.color = settings.themeTextColor || '#e4e4e7';

        previewAction.style.marginBottom = settings.themeParagraphSpacing;
        previewStory.style.marginBottom = '0px';

        // Action styling
        previewAction.style.opacity = '1';
        previewAction.style.fontStyle = 'normal';
        previewAction.style.textDecoration = 'none';
        previewAction.style.color = settings.themeTextColor || '#e4e4e7';

        if (settings.themeActionStyle === 'dimmed') {
          previewAction.style.opacity = '0.72';
        } else if (settings.themeActionStyle === 'italic') {
          previewAction.style.fontStyle = 'italic';
        } else if (settings.themeActionStyle === 'accent') {
          previewAction.style.color = settings.themeActionColor;
        } else if (settings.themeActionStyle === 'italic-accent') {
          previewAction.style.fontStyle = 'italic';
          previewAction.style.color = settings.themeActionColor;
        } else if (settings.themeActionStyle === 'underlined') {
          previewAction.style.textDecoration = 'underline';
          previewAction.style.textDecorationColor = settings.themeActionColor;
        }
      }

      // Live updates to game page
      ThemeManagerModule.applyLiveStyles(settings);
    },

    markCustomPreset() {
      this.currentPreset = 'custom';
      document.querySelectorAll('.aid-qol-preset-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.preset === 'custom');
      });
    },

    applyPresetToUI(presetKey) {
      this.currentPreset = presetKey;

      document.querySelectorAll('.aid-qol-preset-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.preset === presetKey);
      });

      const presetValues = ThemeManagerModule.PRESETS[presetKey];
      if (!presetValues) return;

      const fontSizeNum = parseInt(presetValues.themeFontSize) || 18;
      const lineHeightNum = parseFloat(presetValues.themeLineHeight) || 1.7;
      const paraSpacingNum = parseFloat(presetValues.themeParagraphSpacing) || 1.25;
      const storyWidthNum = parseInt(presetValues.themeStoryWidth) || 900;

      const fsEl = document.getElementById('cfg-theme-font-size');
      if (fsEl) fsEl.value = fontSizeNum;

      const fwEl = document.getElementById('cfg-theme-font-weight');
      if (fwEl) fwEl.value = presetValues.themeFontWeight;

      const lhEl = document.getElementById('cfg-theme-line-height');
      if (lhEl) lhEl.value = lineHeightNum;

      const psEl = document.getElementById('cfg-theme-paragraph-spacing');
      if (psEl) psEl.value = paraSpacingNum;

      const swEl = document.getElementById('cfg-theme-story-width');
      if (swEl) swEl.value = storyWidthNum;

      const cardHeightNum = parseInt(presetValues.themeCardHeight) || 64;
      const chEl = document.getElementById('cfg-theme-card-height');
      if (chEl) chEl.value = cardHeightNum;

      const menuSpacingNum = parseInt(presetValues.themeMenuSpacing) || 12;
      const msEl = document.getElementById('cfg-theme-menu-spacing');
      if (msEl) msEl.value = menuSpacingNum;

      const menuFontSizeNum = parseInt(presetValues.themeMenuFontSize) || 14;
      const mfEl = document.getElementById('cfg-theme-menu-font-size');
      if (mfEl) mfEl.value = menuFontSizeNum;

      const textareaHeightNum = parseInt(presetValues.themeTextareaHeight) || 96;
      const thEl = document.getElementById('cfg-theme-textarea-height');
      if (thEl) thEl.value = textareaHeightNum;

      const textHex = document.getElementById('cfg-theme-text-color-hex');
      const textPicker = document.getElementById('cfg-theme-text-color-picker');
      if (textHex) textHex.value = presetValues.themeTextColor;
      if (textPicker && presetValues.themeTextColor) textPicker.value = presetValues.themeTextColor;

      const bgHex = document.getElementById('cfg-theme-bg-color-hex');
      const bgPicker = document.getElementById('cfg-theme-bg-color-picker');
      if (bgHex) bgHex.value = presetValues.themeBgColor;
      if (bgPicker && presetValues.themeBgColor) bgPicker.value = presetValues.themeBgColor;

      const actStyle = document.getElementById('cfg-theme-action-style');
      if (actStyle) actStyle.value = presetValues.themeActionStyle;

      const actHex = document.getElementById('cfg-theme-action-color-hex');
      const actPicker = document.getElementById('cfg-theme-action-color-picker');
      if (actHex) actHex.value = presetValues.themeActionColor;
      if (actPicker && presetValues.themeActionColor) actPicker.value = presetValues.themeActionColor;

      this.updateThemeLivePreview();
    },


    init() {
      Logger.info('Initializing ConfigUIModule...');
      this.injectStyles();
    },

    injectStyles() {
      GM_addStyle(`
        #aid-qol-config-overlay {
          position: fixed;
          inset: 0;
          background: transparent !important;
          backdrop-filter: none !important;
          -webkit-backdrop-filter: none !important;
          z-index: 1000000;
          display: none;
          align-items: center;
          justify-content: center;
          font-family: var(--font-tamagui-gameplay-sans, var(--f-family, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif));
          box-sizing: border-box;
          color-scheme: dark;
        }

        .aid-qol-config-modal {
          background: var(--aid-theme-bg, var(--background, #0c0c0e));
          color: var(--color, #f4f4f5);
          width: 650px;
          max-width: 94vw;
          max-height: 90vh;
          border: 1px solid var(--borderColor, rgba(255, 255, 255, 0.12));
          border-radius: 14px;
          box-shadow: 0 25px 60px -10px rgba(0, 0, 0, 0.95), 0 0 0 1px rgba(255, 255, 255, 0.05);
          display: flex;
          flex-direction: column;
          overflow: hidden;
          box-sizing: border-box;
          animation: aid-qol-modal-in 0.18s ease-out;
        }

        @keyframes aid-qol-modal-in {
          from { opacity: 0; transform: scale(0.96); }
          to { opacity: 1; transform: scale(1); }
        }

        .aid-qol-config-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 16px 20px;
          background: rgba(255, 255, 255, 0.03);
          border-bottom: 1px solid var(--borderColor, rgba(255, 255, 255, 0.08));
          cursor: grab;
          user-select: none;
        }

        .aid-qol-config-title {
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 16px;
          font-weight: 600;
          color: var(--color, #ffffff);
        }

        .aid-qol-config-badge {
          font-size: 11px;
          font-weight: 600;
          background: rgba(249, 115, 22, 0.15);
          color: var(--color-aid-primary, #fb923c);
          border: 1px solid rgba(249, 115, 22, 0.35);
          padding: 2px 7px;
          border-radius: 10px;
          letter-spacing: 0.3px;
        }

        .aid-qol-config-close-btn {
          background: transparent;
          border: none;
          color: #a1a1aa;
          font-size: 18px;
          cursor: pointer;
          padding: 4px 8px;
          border-radius: 6px;
          transition: all 0.15s;
        }
        .aid-qol-config-close-btn:hover {
          background: rgba(255, 255, 255, 0.08);
          color: #ffffff;
        }

        .aid-qol-config-tabs {
          display: flex;
          background: rgba(0, 0, 0, 0.25);
          border-bottom: 1px solid var(--borderColor, rgba(255, 255, 255, 0.08));
          padding: 0 16px;
          gap: 8px;
        }

        .aid-qol-tab-btn {
          background: transparent;
          border: none;
          border-bottom: 2px solid transparent;
          color: #a1a1aa;
          font-size: 13px;
          font-weight: 500;
          padding: 12px 14px;
          cursor: pointer;
          transition: all 0.15s;
        }
        .aid-qol-tab-btn:hover {
          color: #ffffff;
        }
        .aid-qol-tab-btn.active {
          color: var(--color-aid-primary, #f97316);
          border-bottom-color: var(--color-aid-primary, #f97316);
          font-weight: 600;
        }

        .aid-qol-config-body {
          padding: 20px;
          overflow-y: auto;
          flex: 1;
        }

        .aid-qol-section-title {
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          font-weight: 700;
          color: var(--color-aid-primary, #fb923c);
          margin: 18px 0 10px 0;
        }
        .aid-qol-section-title:first-child {
          margin-top: 0;
        }

        .aid-qol-modifiers-row {
          display: flex;
          align-items: center;
          flex-wrap: wrap;
          gap: 16px;
          background: rgba(255, 255, 255, 0.025);
          padding: 12px 16px;
          border-radius: 8px;
          border: 1px solid var(--borderColor, rgba(255, 255, 255, 0.08));
        }

        .aid-qol-checkbox-label {
          display: flex;
          align-items: center;
          gap: 12px;
          font-size: 13px;
          color: #d4d4d8;
          cursor: pointer;
          user-select: none;
          padding: 10px 14px;
          border-radius: 8px;
          background: rgba(255, 255, 255, 0.025);
          border: 1px solid rgba(255, 255, 255, 0.08);
          transition: background-color 0.15s ease, border-color 0.15s ease, color 0.15s ease;
        }

        .aid-qol-checkbox-label:hover {
          background: rgba(255, 255, 255, 0.06);
          border-color: rgba(255, 255, 255, 0.18);
          color: #ffffff;
        }

        /* Highlight the card when checked */
        .aid-qol-checkbox-label:has(input[type="checkbox"]:checked) {
          border-color: rgba(249, 115, 22, 0.45);
          background: rgba(249, 115, 22, 0.08);
          color: #ffffff;
        }

        /* Modifier row has its own wrapper, so style labels inside lighter */
        .aid-qol-modifiers-row .aid-qol-checkbox-label {
          background: transparent;
          border: 1px solid transparent;
          padding: 6px 10px;
        }
        .aid-qol-modifiers-row .aid-qol-checkbox-label:hover {
          background: rgba(255, 255, 255, 0.05);
          border-color: rgba(255, 255, 255, 0.12);
        }
        .aid-qol-modifiers-row .aid-qol-checkbox-label:has(input[type="checkbox"]:checked) {
          background: rgba(249, 115, 22, 0.14);
          border-color: rgba(249, 115, 22, 0.35);
        }

        /* High-contrast custom checkbox box */
        .aid-qol-checkbox-label input[type="checkbox"] {
          appearance: none;
          -webkit-appearance: none;
          width: 20px;
          height: 20px;
          min-width: 20px;
          min-height: 20px;
          border-radius: 5px;
          border: 2px solid rgba(255, 255, 255, 0.3);
          background-color: rgba(0, 0, 0, 0.5);
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          margin: 0;
          padding: 0;
          transition: background-color 0.15s ease, border-color 0.15s ease, box-shadow 0.15s ease;
          position: relative;
          flex-shrink: 0;
          box-sizing: border-box;
        }

        .aid-qol-checkbox-label input[type="checkbox"]:hover {
          border-color: var(--color-aid-primary, #f97316);
          background-color: rgba(0, 0, 0, 0.7);
        }

        .aid-qol-checkbox-label input[type="checkbox"]:checked {
          background-color: var(--color-aid-primary, #ea580c) !important;
          border-color: var(--color-aid-primary, #ea580c) !important;
          box-shadow: 0 0 10px rgba(249, 115, 22, 0.55);
        }

        .aid-qol-checkbox-label input[type="checkbox"]:checked::after {
          content: "";
          width: 5px;
          height: 10px;
          border: solid #ffffff;
          border-width: 0 2.5px 2.5px 0;
          transform: rotate(45deg);
          margin-bottom: 2px;
          display: block;
        }

        .aid-qol-checkbox-label input[type="checkbox"]:focus-visible {
          outline: 2px solid var(--color-aid-primary, #f97316);
          outline-offset: 2px;
        }

        /* Dynamic ON / OFF badge on the right of option cards */
        .aid-qol-checkbox-label::after {
          content: "OFF";
          margin-left: auto;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.05em;
          padding: 2px 7px;
          border-radius: 10px;
          background: rgba(255, 255, 255, 0.05);
          color: #71717a;
          border: 1px solid rgba(255, 255, 255, 0.1);
          transition: all 0.15s ease-in-out;
        }

        .aid-qol-checkbox-label:has(input[type="checkbox"]:checked)::after {
          content: "ON";
          background: rgba(249, 115, 22, 0.18);
          color: var(--color-aid-primary, #fb923c);
          border-color: rgba(249, 115, 22, 0.45);
          box-shadow: 0 0 8px rgba(249, 115, 22, 0.25);
        }

        /* Modifiers row has its own dedicated combo preview, so hide the ON/OFF badge there */
        .aid-qol-modifiers-row .aid-qol-checkbox-label::after {
          display: none;
        }

        .aid-qol-combo-preview {
          margin-left: auto;
          font-size: 12px;
          color: #a1a1aa;
        }
        .aid-qol-combo-preview code {
          background: rgba(0, 0, 0, 0.45);
          color: var(--color-aid-primary, #fb923c);
          border: 1px solid rgba(249, 115, 22, 0.3);
          padding: 2px 6px;
          border-radius: 4px;
          font-family: ui-monospace, monospace;
        }

        .aid-qol-keys-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
          gap: 10px 16px;
        }

        .aid-qol-key-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          background: rgba(255, 255, 255, 0.025);
          padding: 8px 12px;
          border-radius: 8px;
          border: 1px solid rgba(255, 255, 255, 0.08);
        }

        .aid-qol-key-label {
          font-size: 13px;
          color: #d4d4d8;
        }

        .aid-qol-key-input {
          width: 38px;
          height: 32px;
          text-align: center;
          font-weight: 700;
          font-size: 14px;
          font-family: ui-monospace, monospace;
          background: rgba(0, 0, 0, 0.45);
          color: var(--color-aid-primary, #fb923c);
          border: 1px solid rgba(255, 255, 255, 0.15);
          border-radius: 6px;
          outline: none;
          transition: all 0.15s;
        }
        .aid-qol-key-input:focus {
          border-color: var(--color-aid-primary, #f97316);
          box-shadow: 0 0 0 2px rgba(249, 115, 22, 0.35);
          background: rgba(0, 0, 0, 0.65);
        }

        .aid-qol-field-group {
          margin-bottom: 14px;
        }

        .aid-qol-inline-fields {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
          margin-top: 10px;
        }

        .aid-qol-input-block label {
          display: block;
          font-size: 12px;
          color: #a1a1aa;
          margin-bottom: 6px;
        }

        .aid-qol-text-input {
          width: 100%;
          box-sizing: border-box;
          background: rgba(0, 0, 0, 0.45);
          border: 1px solid var(--borderColor, rgba(255, 255, 255, 0.15));
          border-radius: 6px;
          color: #ffffff;
          padding: 8px 12px;
          font-size: 13px;
          font-family: ui-monospace, monospace;
          outline: none;
          transition: all 0.15s;
        }
        .aid-qol-text-input:focus {
          border-color: var(--color-aid-primary, #f97316);
          box-shadow: 0 0 0 2px rgba(249, 115, 22, 0.35);
          background: rgba(0, 0, 0, 0.65);
        }

        .aid-qol-config-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 14px 20px;
          background: rgba(255, 255, 255, 0.02);
          border-top: 1px solid var(--borderColor, rgba(255, 255, 255, 0.08));
        }

        .aid-qol-footer-right {
          display: flex;
          gap: 10px;
        }

        .aid-qol-btn {
          padding: 8px 16px;
          border-radius: 6px;
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
          border: none;
          transition: all 0.15s;
        }

        .aid-qol-btn-primary {
          background: var(--color-aid-primary, #ea580c);
          color: #ffffff;
          box-shadow: 0 2px 8px rgba(234, 88, 12, 0.35);
        }
        .aid-qol-btn-primary:hover {
          background: #d94e07;
          box-shadow: 0 4px 12px rgba(234, 88, 12, 0.5);
        }

        .aid-qol-btn-secondary {
          background: rgba(255, 255, 255, 0.07);
          color: #e4e4e7;
          border: 1px solid rgba(255, 255, 255, 0.12);
        }
        .aid-qol-btn-secondary:hover {
          background: rgba(255, 255, 255, 0.12);
          color: #ffffff;
        }

        .aid-qol-btn-danger {
          background: transparent;
          color: #f87171;
          border: 1px solid rgba(239, 68, 68, 0.3);
        }
        .aid-qol-btn-danger:hover {
          background: rgba(239, 68, 68, 0.15);
          color: #fca5a5;
        }

        /* Toast notification */
        .aid-qol-toast {
          position: fixed;
          bottom: 24px;
          right: 24px;
          background: var(--aid-theme-bg, var(--background, #0c0c0e));
          color: var(--color-aid-primary, #fb923c);
          border: 1px solid var(--color-aid-primary, #ea580c);
          padding: 10px 18px;
          border-radius: 8px;
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.7);
          font-size: 13px;
          font-weight: 500;
          z-index: 10000000;
          animation: aid-qol-toast-in 0.25s ease-out;
        }
        @keyframes aid-qol-toast-in {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        /* Theme & Typography Manager Styles */
        .aid-qol-presets-row {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-bottom: 16px;
        }

        .aid-qol-preset-btn {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.15);
          color: #d4d4d8;
          padding: 6px 14px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.15s ease;
          display: inline-flex;
          align-items: center;
          gap: 6px;
        }

        .aid-qol-preset-btn:hover {
          background: rgba(255, 255, 255, 0.12);
          color: #ffffff;
          border-color: rgba(255, 255, 255, 0.28);
        }

        .aid-qol-preset-btn.active {
          background: rgba(249, 115, 22, 0.2);
          color: var(--color-aid-primary, #fb923c);
          border-color: var(--color-aid-primary, #f97316);
          box-shadow: 0 0 10px rgba(249, 115, 22, 0.35);
          font-weight: 600;
        }

        .aid-qol-theme-preview-card {
          background: rgba(0, 0, 0, 0.45);
          border: 1px solid rgba(255, 255, 255, 0.14);
          border-radius: 10px;
          padding: 14px 18px;
          margin-bottom: 18px;
          box-shadow: inset 0 2px 8px rgba(0, 0, 0, 0.5);
          transition: background-color 0.2s ease, border-color 0.2s ease;
        }

        .aid-qol-preview-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: #a1a1aa;
          padding-bottom: 8px;
          margin-bottom: 12px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
        }

        .aid-qol-preview-indicator {
          color: var(--color-aid-primary, #fb923c);
          font-weight: 600;
        }

        .aid-qol-preview-content {
          transition: font-size 0.15s ease, line-height 0.15s ease, color 0.15s ease;
        }

        .aid-qol-preview-action {
          margin: 0;
          padding: 0;
          transition: all 0.15s ease;
        }

        .aid-qol-preview-story {
          margin: 0;
          padding: 0;
          transition: all 0.15s ease;
        }

        .aid-qol-slider-row {
          background: rgba(255, 255, 255, 0.025);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 8px;
          padding: 10px 14px;
          margin-bottom: 10px;
        }

        .aid-qol-slider-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 13px;
          color: #d4d4d8;
          margin-bottom: 8px;
        }


        .aid-qol-slider-controls {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .aid-qol-value-input {
          width: 65px;
          height: 24px;
          text-align: center;
          font-size: 12px;
          font-family: ui-monospace, monospace;
          background: rgba(249, 115, 22, 0.12);
          color: var(--color-aid-primary, #fb923c);
          border: 1px solid rgba(249, 115, 22, 0.35);
          border-radius: 5px;
          padding: 0 4px;
          box-sizing: border-box;
          outline: none;
          transition: all 0.15s ease;
        }

        .aid-qol-value-input:hover,
        .aid-qol-value-input:focus {
          background: rgba(0, 0, 0, 0.7);
          border-color: var(--color-aid-primary, #f97316);
          box-shadow: 0 0 0 2px rgba(249, 115, 22, 0.3);
          color: #ffffff;
        }

        .aid-qol-btn-reset-field {
          width: 24px;
          height: 24px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.15);
          border-radius: 5px;
          color: #a1a1aa;
          font-size: 13px;
          line-height: 1;
          cursor: pointer;
          padding: 0;
          transition: all 0.15s ease;
        }

        .aid-qol-btn-reset-field:hover {
          background: rgba(249, 115, 22, 0.2);
          border-color: var(--color-aid-primary, #f97316);
          color: #ffffff;
          transform: rotate(-45deg);
        }


        .aid-qol-range-slider {
          -webkit-appearance: none;
          appearance: none;
          width: 100%;
          height: 6px;
          border-radius: 3px;
          background: rgba(255, 255, 255, 0.15);
          outline: none;
          margin: 4px 0;
          cursor: pointer;
        }

        .aid-qol-range-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: var(--color-aid-primary, #f97316);
          cursor: pointer;
          border: 2px solid #ffffff;
          box-shadow: 0 0 6px rgba(0, 0, 0, 0.6);
          transition: transform 0.1s ease, box-shadow 0.1s ease;
        }

        .aid-qol-range-slider::-webkit-slider-thumb:hover {
          transform: scale(1.15);
          box-shadow: 0 0 10px rgba(249, 115, 22, 0.6);
        }

        .aid-qol-select-input {
          width: 100%;
          padding: 7px 10px;
          background: rgba(0, 0, 0, 0.5);
          color: #f4f4f5;
          border: 1px solid rgba(255, 255, 255, 0.15);
          border-radius: 6px;
          font-size: 13px;
          outline: none;
          cursor: pointer;
        }

        .aid-qol-select-input:focus {
          border-color: var(--color-aid-primary, #f97316);
          box-shadow: 0 0 0 2px rgba(249, 115, 22, 0.3);
        }

        .aid-qol-color-control-group {
          background: rgba(255, 255, 255, 0.025);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 8px;
          padding: 10px 14px;
        }

        .aid-qol-color-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .aid-qol-color-title {
          font-size: 13px;
          color: #d4d4d8;
          font-weight: 500;
        }

        .aid-qol-color-inputs {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .aid-qol-color-picker {
          -webkit-appearance: none;
          appearance: none;
          width: 28px;
          height: 28px;
          border: 1px solid rgba(255, 255, 255, 0.25);
          border-radius: 6px;
          background: transparent;
          cursor: pointer;
          padding: 0;
        }

        .aid-qol-color-picker::-webkit-color-swatch-wrapper {
          padding: 0;
        }

        .aid-qol-color-picker::-webkit-color-swatch {
          border: none;
          border-radius: 5px;
        }

        .aid-qol-hex-input {
          width: 125px;
          height: 28px;
          padding: 0 8px;
          font-family: ui-monospace, monospace;
          font-size: 12px;
          background: rgba(0, 0, 0, 0.5);
          border: 1px solid rgba(255, 255, 255, 0.15);
          border-radius: 6px;
          color: #ffffff;
          outline: none;
        }

        .aid-qol-hex-input:focus {
          border-color: var(--color-aid-primary, #f97316);
          box-shadow: 0 0 0 2px rgba(249, 115, 22, 0.3);
        }

        .aid-qol-btn-clear {
          font-size: 11px;
          padding: 4px 8px;
          background: rgba(255, 255, 255, 0.08);
          border: 1px solid rgba(255, 255, 255, 0.15);
          border-radius: 5px;
          color: #a1a1aa;
          cursor: pointer;
          transition: all 0.15s;
        }

        .aid-qol-btn-clear:hover {
          background: rgba(255, 255, 255, 0.15);
          color: #ffffff;
        }

        .aid-qol-swatches-row {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-top: 8px;
        }

        .aid-qol-swatch-label {
          font-size: 11px;
          color: #71717a;
          margin-right: 2px;
        }

        .aid-qol-swatch {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          border: 2px solid rgba(255, 255, 255, 0.3);
          cursor: pointer;
          padding: 0;
          transition: transform 0.15s ease, border-color 0.15s ease;
        }

        .aid-qol-swatch:hover {
          transform: scale(1.2);
          border-color: #ffffff;
        }

      `);
    },

    render() {
      if (this.overlay) return;

      const overlay = document.createElement('div');
      overlay.id = this.overlayId;

      overlay.innerHTML = `
        <div class="aid-qol-config-modal">
          <div class="aid-qol-config-header">
            <div class="aid-qol-config-title">
              <span>⚙️</span>
              <span>AID-QoL Configuration</span>
              <span class="aid-qol-config-badge">v3.7.0</span>
            </div>
            <button class="aid-qol-config-close-btn" id="cfg-btn-x" title="Close (Esc)">✕</button>
          </div>

          <div class="aid-qol-config-tabs">
            <button class="aid-qol-tab-btn active" data-tab="aid-tab-hotkeys">Hotkeys</button>
            <button class="aid-qol-tab-btn" data-tab="aid-tab-theme">Theme & Style</button>
            <button class="aid-qol-tab-btn" data-tab="aid-tab-storycards">Modals & Menus</button>
            <button class="aid-qol-tab-btn" data-tab="aid-tab-general">General</button>
            <button class="aid-qol-tab-btn" data-tab="aid-tab-bridge">Dev Bridge</button>
          </div>

          <div class="aid-qol-config-body">
            <!-- Hotkeys Tab -->
            <div class="aid-qol-tab-panel" id="aid-tab-hotkeys">
              <div class="aid-qol-section-title">Modifier Keys</div>
              <div class="aid-qol-modifiers-row">
                <label class="aid-qol-checkbox-label">
                  <input type="checkbox" id="cfg-mod-alt"> Alt / Option
                </label>
                <label class="aid-qol-checkbox-label">
                  <input type="checkbox" id="cfg-mod-ctrl"> Ctrl / Cmd
                </label>
                <label class="aid-qol-checkbox-label">
                  <input type="checkbox" id="cfg-mod-shift"> Shift
                </label>
                <div class="aid-qol-combo-preview">Combo: <code id="cfg-combo-preview">Alt + Ctrl + [Key]</code></div>
              </div>

              <div class="aid-qol-section-title">Turn Commands</div>
              <div class="aid-qol-keys-grid">
                <div class="aid-qol-key-item">
                  <span class="aid-qol-key-label">Take a Turn</span>
                  <input type="text" maxlength="1" id="cfg-keyTakeTurn" class="aid-qol-key-input">
                </div>
                <div class="aid-qol-key-item">
                  <span class="aid-qol-key-label">Continue</span>
                  <input type="text" maxlength="1" id="cfg-keyContinue" class="aid-qol-key-input">
                </div>
                <div class="aid-qol-key-item">
                  <span class="aid-qol-key-label">Retry (Regenerate)</span>
                  <input type="text" maxlength="1" id="cfg-keyRetry" class="aid-qol-key-input">
                </div>
                <div class="aid-qol-key-item">
                  <span class="aid-qol-key-label">Retry History</span>
                  <input type="text" maxlength="1" id="cfg-keyRetryHistory" class="aid-qol-key-input">
                </div>
                <div class="aid-qol-key-item">
                  <span class="aid-qol-key-label">Erase / Undo</span>
                  <input type="text" maxlength="1" id="cfg-keyErase" class="aid-qol-key-input">
                </div>
              </div>

              <div class="aid-qol-section-title">Input Modes</div>
              <div class="aid-qol-keys-grid">
                <div class="aid-qol-key-item">
                  <span class="aid-qol-key-label">Do Mode</span>
                  <input type="text" maxlength="1" id="cfg-keyModeDo" class="aid-qol-key-input">
                </div>
                <div class="aid-qol-key-item">
                  <span class="aid-qol-key-label">Say Mode</span>
                  <input type="text" maxlength="1" id="cfg-keyModeSay" class="aid-qol-key-input">
                </div>
                <div class="aid-qol-key-item">
                  <span class="aid-qol-key-label">Story Mode</span>
                  <input type="text" maxlength="1" id="cfg-keyModeStory" class="aid-qol-key-input">
                </div>
                <div class="aid-qol-key-item">
                  <span class="aid-qol-key-label">See Mode</span>
                  <input type="text" maxlength="1" id="cfg-keyModeSee" class="aid-qol-key-input">
                </div>
              </div>

              <div class="aid-qol-section-title">Navigation & Menus</div>
              <div class="aid-qol-keys-grid">
                <div class="aid-qol-key-item">
                  <span class="aid-qol-key-label">Toggle Actions (A+/A-)</span>
                  <input type="text" maxlength="1" id="cfg-keyToggleActions" class="aid-qol-key-input">
                </div>
                <div class="aid-qol-key-item">
                  <span class="aid-qol-key-label">Game Menu (Flame)</span>
                  <input type="text" maxlength="1" id="cfg-keyGameMenu" class="aid-qol-key-input">
                </div>
                <div class="aid-qol-key-item">
                  <span class="aid-qol-key-label">Scroll to Top</span>
                  <input type="text" maxlength="1" id="cfg-keyScrollTop" class="aid-qol-key-input">
                </div>
                <div class="aid-qol-key-item">
                  <span class="aid-qol-key-label">Toggle Play / Beta</span>
                  <input type="text" maxlength="1" id="cfg-keyToggleSite" class="aid-qol-key-input">
                </div>
                <div class="aid-qol-key-item">
                  <span class="aid-qol-key-label">User Profile</span>
                  <input type="text" maxlength="1" id="cfg-keyUserProfile" class="aid-qol-key-input">
                </div>
                <div class="aid-qol-key-item">
                  <span class="aid-qol-key-label">Continue Adventure</span>
                  <input type="text" maxlength="1" id="cfg-keyContinueAdventure" class="aid-qol-key-input">
                </div>
                <div class="aid-qol-key-item">
                  <span class="aid-qol-key-label">Edit Character Name</span>
                  <input type="text" maxlength="1" id="cfg-keyCharacterName" class="aid-qol-key-input">
                </div>
              </div>
            </div>

            <!-- Theme & Style Tab -->
            <div class="aid-qol-tab-panel" id="aid-tab-theme" style="display:none">
              <!-- Presets Header -->
              <div class="aid-qol-section-title">Theme Presets</div>
              <div class="aid-qol-presets-row">
                <button type="button" class="aid-qol-preset-btn" data-preset="default">⚙️ Default</button>
                <button type="button" class="aid-qol-preset-btn" data-preset="compact">📱 Compact</button>
                <button type="button" class="aid-qol-preset-btn" data-preset="large">📖 Large / Cozy</button>
                <button type="button" class="aid-qol-preset-btn" data-preset="oled">🌑 OLED Black</button>
                <button type="button" class="aid-qol-preset-btn" data-preset="custom">🎨 Custom</button>
              </div>

              <!-- Live Story Preview Box -->
              <div class="aid-qol-theme-preview-card" id="aid-theme-preview-card">
                <div class="aid-qol-preview-header">
                  <span>Live Story Preview</span>
                  <span class="aid-qol-preview-indicator">● Real-time</span>
                </div>
                <div class="aid-qol-preview-content" id="aid-theme-preview-content">
                  <div class="aid-qol-preview-action" id="aid-preview-action">&gt; You examine the ancient stone altar.</div>
                  <div class="aid-qol-preview-story" id="aid-preview-story">The runes hum with faint starlight as your fingers trace the weathered engravings. The chamber falls silent, waiting for your next command.</div>
                </div>
              </div>

              <!-- Typography Section -->
              <div class="aid-qol-section-title">Typography & Reading</div>
              <div class="aid-qol-slider-row">
                <div class="aid-qol-slider-header">
                  <label for="cfg-theme-font-size">Font Size</label>
                  <div class="aid-qol-slider-controls">
                    <input type="text" id="cfg-theme-font-size-val" class="aid-qol-value-input" value="18px" title="Click to type exact value (e.g. 18px)">
                    <button type="button" class="aid-qol-btn-reset-field" id="cfg-theme-font-size-reset" title="Reset to default (18px)">↺</button>
                  </div>
                </div>
                <input type="range" id="cfg-theme-font-size" class="aid-qol-range-slider" min="13" max="26" step="1" value="18">
              </div>

              <div class="aid-qol-inline-fields" style="margin-top: 10px;">
                <div class="aid-qol-input-block" style="flex: 1;">
                  <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 4px;">
                    <label for="cfg-theme-font-weight">Font Boldness / Weight:</label>
                    <button type="button" class="aid-qol-btn-reset-field" id="cfg-theme-font-weight-reset" title="Reset to default (400 Regular)">↺</button>
                  </div>
                  <select id="cfg-theme-font-weight" class="aid-qol-select-input">
                    <option value="300">300 (Light)</option>
                    <option value="400">400 (Regular)</option>
                    <option value="500">500 (Medium)</option>
                    <option value="600">600 (Semi-Bold)</option>
                    <option value="700">700 (Bold)</option>
                  </select>
                </div>
                <div class="aid-qol-input-block" style="flex: 1;">
                  <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 4px;">
                    <label for="cfg-theme-action-style">Action Text Style:</label>
                    <button type="button" class="aid-qol-btn-reset-field" id="cfg-theme-action-style-reset" title="Reset to default (Default)">↺</button>
                  </div>
                  <select id="cfg-theme-action-style" class="aid-qol-select-input">
                    <option value="default">Default (Native)</option>
                    <option value="dimmed">Dimmed / Subdued</option>
                    <option value="italic">Italicized</option>
                    <option value="accent">Accent Colored</option>
                    <option value="italic-accent">Italic + Accent</option>
                    <option value="underlined">Underlined</option>
                  </select>
                </div>
              </div>

              <div class="aid-qol-slider-row" style="margin-top: 10px;">
                <div class="aid-qol-slider-header">
                  <label for="cfg-theme-line-height">Line Height</label>
                  <div class="aid-qol-slider-controls">
                    <input type="text" id="cfg-theme-line-height-val" class="aid-qol-value-input" value="1.70" title="Click to type exact value (e.g. 1.70)">
                    <button type="button" class="aid-qol-btn-reset-field" id="cfg-theme-line-height-reset" title="Reset to default (1.70)">↺</button>
                  </div>
                </div>
                <input type="range" id="cfg-theme-line-height" class="aid-qol-range-slider" min="1.20" max="2.40" step="0.05" value="1.70">
              </div>

              <!-- Spacing & Layout Section -->
              <div class="aid-qol-section-title" style="margin-top: 18px;">Spacing & Layout</div>
              <div class="aid-qol-slider-row">
                <div class="aid-qol-slider-header">
                  <label for="cfg-theme-paragraph-spacing">Paragraph & Action Spacing</label>
                  <div class="aid-qol-slider-controls">
                    <input type="text" id="cfg-theme-paragraph-spacing-val" class="aid-qol-value-input" value="1.25em" title="Click to type exact value (e.g. 1.25em)">
                    <button type="button" class="aid-qol-btn-reset-field" id="cfg-theme-paragraph-spacing-reset" title="Reset to default (1.25em)">↺</button>
                  </div>
                </div>
                <input type="range" id="cfg-theme-paragraph-spacing" class="aid-qol-range-slider" min="0.40" max="2.40" step="0.05" value="1.25">
              </div>

              <div class="aid-qol-slider-row" style="margin-top: 10px;">
                <div class="aid-qol-slider-header">
                  <label for="cfg-theme-story-width">Story Max Width</label>
                  <div class="aid-qol-slider-controls">
                    <input type="text" id="cfg-theme-story-width-val" class="aid-qol-value-input" value="900px" title="Click to type exact value (e.g. 900px)">
                    <button type="button" class="aid-qol-btn-reset-field" id="cfg-theme-story-width-reset" title="Reset to default (900px)">↺</button>
                  </div>
                </div>
                <input type="range" id="cfg-theme-story-width" class="aid-qol-range-slider" min="600" max="1400" step="20" value="900">
              </div>

              <!-- Interface & Menu Density Section -->
              <div class="aid-qol-section-title" style="margin-top: 18px;">Interface & Menu Density (Story Cards & Gear Menu)</div>
              <div class="aid-qol-slider-row">
                <div class="aid-qol-slider-header">
                  <label for="cfg-theme-card-height">Story Card Item Height</label>
                  <div class="aid-qol-slider-controls">
                    <input type="text" id="cfg-theme-card-height-val" class="aid-qol-value-input" value="64px" title="Click to type exact value (e.g. 44px, 64px)">
                    <button type="button" class="aid-qol-btn-reset-field" id="cfg-theme-card-height-reset" title="Reset to default (64px)">↺</button>
                  </div>
                </div>
                <input type="range" id="cfg-theme-card-height" class="aid-qol-range-slider" min="32" max="64" step="2" value="64">
              </div>

              <div class="aid-qol-slider-row" style="margin-top: 10px;">
                <div class="aid-qol-slider-header">
                  <label for="cfg-theme-menu-spacing">Category & Item Separation</label>
                  <div class="aid-qol-slider-controls">
                    <input type="text" id="cfg-theme-menu-spacing-val" class="aid-qol-value-input" value="12px" title="Click to type exact value (e.g. 4px, 12px)">
                    <button type="button" class="aid-qol-btn-reset-field" id="cfg-theme-menu-spacing-reset" title="Reset to default (12px)">↺</button>
                  </div>
                </div>
                <input type="range" id="cfg-theme-menu-spacing" class="aid-qol-range-slider" min="2" max="16" step="1" value="12">
              </div>

              <div class="aid-qol-slider-row" style="margin-top: 10px;">
                <div class="aid-qol-slider-header">
                  <label for="cfg-theme-menu-font-size">Gear Menu Font Size (Adventure & Gameplay)</label>
                  <div class="aid-qol-slider-controls">
                    <input type="text" id="cfg-theme-menu-font-size-val" class="aid-qol-value-input" value="14px" title="Click to type exact value (e.g. 12px, 14px)">
                    <button type="button" class="aid-qol-btn-reset-field" id="cfg-theme-menu-font-size-reset" title="Reset to default (14px)">↺</button>
                  </div>
                </div>
                <input type="range" id="cfg-theme-menu-font-size" class="aid-qol-range-slider" min="11" max="20" step="1" value="14">
              </div>

              <div class="aid-qol-slider-row" style="margin-top: 10px;">
                <div class="aid-qol-slider-header">
                  <label for="cfg-theme-textarea-height">Sub-menu Textarea Height (Plot, Gameplay, Details)</label>
                  <div class="aid-qol-slider-controls">
                    <input type="text" id="cfg-theme-textarea-height-val" class="aid-qol-value-input" value="96px" title="Click to type exact value (e.g. 54px, 96px, 120px)">
                    <button type="button" class="aid-qol-btn-reset-field" id="cfg-theme-textarea-height-reset" title="Reset to default (96px)">↺</button>
                  </div>
                </div>
                <input type="range" id="cfg-theme-textarea-height" class="aid-qol-range-slider" min="44" max="160" step="2" value="96">
              </div>

              <!-- Colors & Background Section -->
              <div class="aid-qol-section-title" style="margin-top: 18px;">Colors & Atmosphere</div>

              <!-- Story Text Color -->
              <div class="aid-qol-color-control-group">
                <div class="aid-qol-color-header">
                  <span class="aid-qol-color-title">Story Text Color</span>
                  <div class="aid-qol-color-inputs">
                    <input type="color" id="cfg-theme-text-color-picker" class="aid-qol-color-picker" value="#ffffff">
                    <input type="text" id="cfg-theme-text-color-hex" class="aid-qol-hex-input" placeholder="Native / #f4efe6">
                    <button type="button" class="aid-qol-btn-clear" id="cfg-theme-text-color-clear" title="Reset to native AID color">Reset</button>
                  </div>
                </div>
                <div class="aid-qol-swatches-row" id="cfg-theme-text-swatches">
                  <span class="aid-qol-swatch-label">Quick:</span>
                  <button type="button" class="aid-qol-swatch" data-color="" title="Native AID text" style="background: repeating-linear-gradient(45deg, #222, #222 3px, #444 3px, #444 6px);"></button>
                  <button type="button" class="aid-qol-swatch" data-color="#ffffff" title="Pure White" style="background: #ffffff;"></button>
                  <button type="button" class="aid-qol-swatch" data-color="#f4efe6" title="Warm Paper" style="background: #f4efe6;"></button>
                  <button type="button" class="aid-qol-swatch" data-color="#d4d4d8" title="Soft Neutral Gray" style="background: #d4d4d8;"></button>
                  <button type="button" class="aid-qol-swatch" data-color="#fde68a" title="Golden Amber" style="background: #fde68a;"></button>
                  <button type="button" class="aid-qol-swatch" data-color="#a7f3d0" title="Sage Mint" style="background: #a7f3d0;"></button>
                </div>
              </div>

              <!-- Background Color -->
              <div class="aid-qol-color-control-group" style="margin-top: 10px;">
                <div class="aid-qol-color-header">
                  <span class="aid-qol-color-title">Background Color</span>
                  <div class="aid-qol-color-inputs">
                    <input type="color" id="cfg-theme-bg-color-picker" class="aid-qol-color-picker" value="#000000">
                    <input type="text" id="cfg-theme-bg-color-hex" class="aid-qol-hex-input" placeholder="Native / #000000">
                    <button type="button" class="aid-qol-btn-clear" id="cfg-theme-bg-color-clear" title="Reset to native AID background">Reset</button>
                  </div>
                </div>
                <div class="aid-qol-swatches-row" id="cfg-theme-bg-swatches">
                  <span class="aid-qol-swatch-label">Quick:</span>
                  <button type="button" class="aid-qol-swatch" data-color="" title="Native AID background" style="background: repeating-linear-gradient(45deg, #222, #222 3px, #444 3px, #444 6px);"></button>
                  <button type="button" class="aid-qol-swatch" data-color="#000000" title="OLED Pure Black" style="background: #000000; border-color: #555;"></button>
                  <button type="button" class="aid-qol-swatch" data-color="#0f172a" title="Midnight Slate" style="background: #0f172a;"></button>
                  <button type="button" class="aid-qol-swatch" data-color="#18181b" title="Deep Charcoal" style="background: #18181b;"></button>
                  <button type="button" class="aid-qol-swatch" data-color="#141210" title="Espresso Dark" style="background: #141210;"></button>
                </div>
              </div>

              <!-- Action Accent Color -->
              <div class="aid-qol-color-control-group" id="cfg-theme-action-color-group" style="margin-top: 10px;">
                <div class="aid-qol-color-header">
                  <span class="aid-qol-color-title">Action Accent Color</span>
                  <div class="aid-qol-color-inputs">
                    <input type="color" id="cfg-theme-action-color-picker" class="aid-qol-color-picker" value="#fb923c">
                    <input type="text" id="cfg-theme-action-color-hex" class="aid-qol-hex-input" placeholder="#fb923c">
                    <button type="button" class="aid-qol-btn-clear" id="cfg-theme-action-color-clear" title="Reset to default action color">Reset</button>
                  </div>
                </div>
                <div class="aid-qol-swatches-row" id="cfg-theme-action-swatches">
                  <span class="aid-qol-swatch-label">Quick:</span>
                  <button type="button" class="aid-qol-swatch" data-color="#fb923c" title="AID Amber" style="background: #fb923c;"></button>
                  <button type="button" class="aid-qol-swatch" data-color="#38bdf8" title="Electric Sky" style="background: #38bdf8;"></button>
                  <button type="button" class="aid-qol-swatch" data-color="#34d399" title="Emerald" style="background: #34d399;"></button>
                  <button type="button" class="aid-qol-swatch" data-color="#f43f5e" title="Crimson Rose" style="background: #f43f5e;"></button>
                  <button type="button" class="aid-qol-swatch" data-color="#c084fc" title="Mystic Violet" style="background: #c084fc;"></button>
                </div>
              </div>
            </div>

            <!-- Story Cards & Menus Tab -->
            <div class="aid-qol-tab-panel" id="aid-tab-storycards" style="display:none">
              <div class="aid-qol-section-title">Story Card Modals</div>
              <div class="aid-qol-field-group">
                <label class="aid-qol-checkbox-label">
                  <input type="checkbox" id="cfg-sc-enabled"> Enable Story Card Drag & Resize
                </label>
              </div>
              <div class="aid-qol-field-group">
                <label class="aid-qol-checkbox-label">
                  <input type="checkbox" id="cfg-sc-remember"> Automatically remember resized dimensions
                </label>
              </div>
              <div class="aid-qol-inline-fields">
                <div class="aid-qol-input-block">
                  <label for="cfg-scModalWidth">Default Width (e.g. 680px, 50vw):</label>
                  <input type="text" id="cfg-scModalWidth" class="aid-qol-text-input">
                </div>
                <div class="aid-qol-input-block">
                  <label for="cfg-scModalHeight">Default Height (e.g. 82vh, 850px):</label>
                  <input type="text" id="cfg-scModalHeight" class="aid-qol-text-input">
                </div>
              </div>

              <div class="aid-qol-section-title">Context Viewer Modal</div>
              <div class="aid-qol-field-group">
                <label class="aid-qol-checkbox-label">
                  <input type="checkbox" id="cfg-context-enabled"> Enable Context Viewer Drag & Resize
                </label>
              </div>
              <div class="aid-qol-field-group">
                <label class="aid-qol-checkbox-label">
                  <input type="checkbox" id="cfg-context-remember"> Automatically remember resized dimensions
                </label>
              </div>
              <div class="aid-qol-inline-fields">
                <div class="aid-qol-input-block">
                  <label for="cfg-contextModalWidth">Default Width (e.g. 480px, 50vw):</label>
                  <input type="text" id="cfg-contextModalWidth" class="aid-qol-text-input">
                </div>
                <div class="aid-qol-input-block">
                  <label for="cfg-contextModalHeight">Default Height (e.g. auto, 600px):</label>
                  <input type="text" id="cfg-contextModalHeight" class="aid-qol-text-input">
                </div>
              </div>

              <div class="aid-qol-section-title">Modal Backdrops & Overlays</div>
              <div class="aid-qol-field-group">
                <label class="aid-qol-checkbox-label">
                  <input type="checkbox" id="cfg-modal-dimming"> Remove background dimming and blur behind modals
                </label>
                <div style="font-size: 11px; color: #a1a1aa; margin-top: 4px; padding-left: 28px;">
                  Removes the dark translucent shading and blur behind all modals (Story Cards, Context Viewer, subdialogs, etc.) so the story and game interface remain clearly visible and accessible.
                </div>
              </div>

              <div class="aid-qol-section-title">Game Play Menu (Right Sidebar)</div>
              <div class="aid-qol-field-group">
                <label class="aid-qol-checkbox-label">
                  <input type="checkbox" id="cfg-menu-enabled"> Enable Game Menu Left-Border Resizing
                </label>
              </div>
              <div class="aid-qol-field-group">
                <div class="aid-qol-input-block" style="max-width: 280px;">
                  <label for="cfg-gameMenuWidth">Saved Menu Width (Default: 424px):</label>
                  <input type="text" id="cfg-gameMenuWidth" class="aid-qol-text-input">
                </div>
              </div>

              <div class="aid-qol-section-title">Textareas & Editors</div>
              <div class="aid-qol-field-group">
                <label class="aid-qol-checkbox-label">
                  <input type="checkbox" id="cfg-textarea-resize"> Enable Vertical Textarea Resizing
                </label>
                <div style="font-size: 11px; color: #a1a1aa; margin-top: 4px; padding-left: 28px;">
                  Allows resizing any textarea vertically (Story Cards, Memory, Notes, Scenarios) by grabbing the small box at the bottom of the scrollbar.
                </div>
              </div>
            </div>

            <!-- General Tab -->
            <div class="aid-qol-tab-panel" id="aid-tab-general" style="display:none">
              <div class="aid-qol-section-title">General Preferences</div>
              <div class="aid-qol-field-group">
                <label class="aid-qol-checkbox-label">
                  <input type="checkbox" id="cfg-gen-autoquote"> Auto-quote empty "Do" actions with quotes ("")
                </label>
              </div>
              <div class="aid-qol-field-group">
                <label class="aid-qol-checkbox-label">
                  <input type="checkbox" id="cfg-gen-autofocus"> Auto-focus prompt input when entering gameplay
                </label>
              </div>
              <div class="aid-qol-field-group">
                <label class="aid-qol-checkbox-label">
                  <input type="checkbox" id="cfg-gen-hotkeys-enabled"> Enable Hotkeys & Keyboard Navigation
                </label>
              </div>
              <div class="aid-qol-field-group">
                <label class="aid-qol-checkbox-label">
                  <input type="checkbox" id="cfg-gen-debug"> Enable Debug Logging in Developer Console
                </label>
              </div>
            </div>

            <!-- Dev Bridge Tab -->
            <div class="aid-qol-tab-panel" id="aid-tab-bridge" style="display:none">
              <div class="aid-qol-section-title">Antigravity Dev Bridge & Token Sync</div>
              <div style="font-size: 13px; color: #a1a1aa; margin-bottom: 16px; line-height: 1.5;">
                Sync your active session token directly to <strong>AID-LLM-connector</strong> for automated testing and scenario deployments without typing passwords.
              </div>

              <div style="background: rgba(255, 255, 255, 0.03); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 8px; padding: 14px 16px; margin-bottom: 16px;">
                <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px;">
                  <span style="font-size: 13px; color: #d4d4d8; font-weight: 500;">Auth Session Status:</span>
                  <span id="aid-bridge-token-badge" style="font-size: 11px; font-weight: 600; padding: 2px 8px; border-radius: 6px; background: rgba(249, 115, 22, 0.15); color: #fb923c; border: 1px solid rgba(249, 115, 22, 0.3);">Checking...</span>
                </div>
                <div style="font-size: 12px; color: #71717a;" id="aid-bridge-context-info">Current context: Detecting...</div>
              </div>

              <div style="display: flex; gap: 10px; margin-bottom: 14px;">
                <button type="button" class="aid-qol-btn aid-qol-btn-primary" id="aid-bridge-sync-btn" style="flex: 1;">
                  🔄 Sync to Antigravity (Port 8765)
                </button>
                <button type="button" class="aid-qol-btn aid-qol-btn-secondary" id="aid-bridge-copy-btn" style="flex: 1;">
                  📋 Copy Token for .env
                </button>
              </div>

              <div id="aid-bridge-result-msg" style="font-size: 12px; color: #a1a1aa; min-height: 18px;">
                Bridge Server: <code>http://127.0.0.1:8765/sync</code> (run <code>npm run bridge</code> in AID-LLM-connector)
              </div>
            </div>
          </div>

          <div class="aid-qol-config-footer">
            <button class="aid-qol-btn aid-qol-btn-danger" id="cfg-btn-reset">Reset to Defaults</button>
            <div class="aid-qol-footer-right">
              <button class="aid-qol-btn aid-qol-btn-secondary" id="cfg-btn-cancel">Cancel</button>
              <button class="aid-qol-btn aid-qol-btn-primary" id="cfg-btn-save">Save & Apply</button>
            </div>
          </div>
        </div>
      `;

      document.body.appendChild(overlay);
      this.overlay = overlay;

      // Close on backdrop click
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) this.close();
      });

      // Make modal draggable by header
      const header = overlay.querySelector('.aid-qol-config-header');
      const modal = overlay.querySelector('.aid-qol-config-modal');
      if (header && modal) {
        let isDragging = false;
        let startX = 0, startY = 0;
        let startLeft = 0, startTop = 0;

        header.addEventListener('pointerdown', (e) => {
          if (e.target.closest('#cfg-btn-x') || e.target.closest('button')) return;
          isDragging = true;
          header.setPointerCapture(e.pointerId);
          header.style.cursor = 'grabbing';

          const rect = modal.getBoundingClientRect();
          modal.style.position = 'absolute';
          modal.style.margin = '0';
          modal.style.left = `${rect.left}px`;
          modal.style.top = `${rect.top}px`;

          startX = e.clientX;
          startY = e.clientY;
          startLeft = rect.left;
          startTop = rect.top;
        });

        header.addEventListener('pointermove', (e) => {
          if (!isDragging) return;
          const dx = e.clientX - startX;
          const dy = e.clientY - startY;

          const newLeft = Math.max(10, Math.min(window.innerWidth - modal.offsetWidth - 10, startLeft + dx));
          const newTop = Math.max(10, Math.min(window.innerHeight - modal.offsetHeight - 10, startTop + dy));

          modal.style.left = `${newLeft}px`;
          modal.style.top = `${newTop}px`;
        });

        const stopDrag = (e) => {
          if (!isDragging) return;
          isDragging = false;
          try {
            header.releasePointerCapture(e.pointerId);
          } catch (_) {}
          header.style.cursor = 'grab';
        };

        header.addEventListener('pointerup', stopDrag);
        header.addEventListener('pointercancel', stopDrag);
      }

      // Close button
      document.getElementById('cfg-btn-x')?.addEventListener('click', () => this.close());
      document.getElementById('cfg-btn-cancel')?.addEventListener('click', () => this.close());

      // Save button
      document.getElementById('cfg-btn-save')?.addEventListener('click', () => this.save());

      // Reset button
      document.getElementById('cfg-btn-reset')?.addEventListener('click', () => this.resetDefaults());

      // Modifier change listeners
      ['cfg-mod-alt', 'cfg-mod-ctrl', 'cfg-mod-shift'].forEach(id => {
        document.getElementById(id)?.addEventListener('change', () => this.updateComboPreview());
      });

      // Quick key input event handling (press key to set)
      overlay.querySelectorAll('.aid-qol-key-input').forEach(input => {
        input.addEventListener('focus', () => input.select());
        input.addEventListener('keydown', (e) => {
          if (['Tab', 'Escape'].includes(e.key)) return;
          e.preventDefault();
          if (e.key === 'Backspace' || e.key === 'Delete') {
            input.value = '';
            return;
          }
          if (e.key.length === 1) {
            input.value = e.key.toUpperCase();
          }
        });
      });

      // Tab switching
      const tabs = overlay.querySelectorAll('.aid-qol-tab-btn');
      const panels = overlay.querySelectorAll('.aid-qol-tab-panel');
      tabs.forEach(tab => {
        tab.addEventListener('click', () => {
          const targetId = tab.dataset.tab;
          tabs.forEach(t => t.classList.toggle('active', t === tab));
          panels.forEach(p => {
            p.style.display = p.id === targetId ? 'block' : 'none';
          });
          if (targetId === 'aid-tab-bridge') {
            DevBridgeModule.updateUI();
          }
        });
      });


      // Theme Preset Buttons
      overlay.querySelectorAll('.aid-qol-preset-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          const preset = btn.dataset.preset;
          if (preset === 'custom') {
            this.markCustomPreset();
          } else {
            this.applyPresetToUI(preset);
          }
        });
      });

      // Theme Sliders & Direct Typed Inputs
      this.bindSliderWithDirectInput('cfg-theme-font-size', 'cfg-theme-font-size-val', 'cfg-theme-font-size-reset', 18, 'px');
      this.bindSliderWithDirectInput('cfg-theme-line-height', 'cfg-theme-line-height-val', 'cfg-theme-line-height-reset', 1.7, '', 2);
      this.bindSliderWithDirectInput('cfg-theme-paragraph-spacing', 'cfg-theme-paragraph-spacing-val', 'cfg-theme-paragraph-spacing-reset', 1.25, 'em');
      this.bindSliderWithDirectInput('cfg-theme-story-width', 'cfg-theme-story-width-val', 'cfg-theme-story-width-reset', 900, 'px');
      this.bindSliderWithDirectInput('cfg-theme-card-height', 'cfg-theme-card-height-val', 'cfg-theme-card-height-reset', 64, 'px');
      this.bindSliderWithDirectInput('cfg-theme-menu-spacing', 'cfg-theme-menu-spacing-val', 'cfg-theme-menu-spacing-reset', 12, 'px');
      this.bindSliderWithDirectInput('cfg-theme-menu-font-size', 'cfg-theme-menu-font-size-val', 'cfg-theme-menu-font-size-reset', 14, 'px');
      this.bindSliderWithDirectInput('cfg-theme-textarea-height', 'cfg-theme-textarea-height-val', 'cfg-theme-textarea-height-reset', 96, 'px');

      // Dropdown Reset Buttons
      document.getElementById('cfg-theme-font-weight-reset')?.addEventListener('click', () => {
        const el = document.getElementById('cfg-theme-font-weight');
        if (el) el.value = '400';
        this.markCustomPreset();
        this.updateThemeLivePreview();
      });
      document.getElementById('cfg-theme-action-style-reset')?.addEventListener('click', () => {
        const el = document.getElementById('cfg-theme-action-style');
        if (el) el.value = 'default';
        this.markCustomPreset();
        this.updateThemeLivePreview();
      });
      document.getElementById('cfg-theme-action-color-clear')?.addEventListener('click', () => {
        const hex = document.getElementById('cfg-theme-action-color-hex');
        const picker = document.getElementById('cfg-theme-action-color-picker');
        if (hex) hex.value = '#fb923c';
        if (picker) picker.value = '#fb923c';
        this.markCustomPreset();
        this.updateThemeLivePreview();
      });

      // Theme Selects
      ['cfg-theme-font-weight', 'cfg-theme-action-style'].forEach(id => {
        const sel = document.getElementById(id);
        if (sel) {
          sel.addEventListener('change', () => {
            this.markCustomPreset();
            this.updateThemeLivePreview();
          });
        }
      });

      // Story Text Color
      const textPicker = document.getElementById('cfg-theme-text-color-picker');
      const textHex = document.getElementById('cfg-theme-text-color-hex');
      const textClear = document.getElementById('cfg-theme-text-color-clear');

      textPicker?.addEventListener('input', () => {
        if (textHex) textHex.value = textPicker.value;
        this.markCustomPreset();
        this.updateThemeLivePreview();
      });
      textHex?.addEventListener('input', () => {
        const val = textHex.value.trim();
        if (/^#[0-9a-fA-F]{6}$/.test(val) && textPicker) {
          textPicker.value = val;
        }
        this.markCustomPreset();
        this.updateThemeLivePreview();
      });
      textClear?.addEventListener('click', () => {
        if (textHex) textHex.value = '';
        this.markCustomPreset();
        this.updateThemeLivePreview();
      });

      // Text Swatches
      overlay.querySelectorAll('#cfg-theme-text-swatches .aid-qol-swatch').forEach(btn => {
        btn.addEventListener('click', () => {
          const col = btn.dataset.color;
          if (textHex) textHex.value = col;
          if (textPicker && col) textPicker.value = col;
          this.markCustomPreset();
          this.updateThemeLivePreview();
        });
      });

      // Background Color
      const bgPicker = document.getElementById('cfg-theme-bg-color-picker');
      const bgHex = document.getElementById('cfg-theme-bg-color-hex');
      const bgClear = document.getElementById('cfg-theme-bg-color-clear');

      bgPicker?.addEventListener('input', () => {
        if (bgHex) bgHex.value = bgPicker.value;
        this.markCustomPreset();
        this.updateThemeLivePreview();
      });
      bgHex?.addEventListener('input', () => {
        const val = bgHex.value.trim();
        if (/^#[0-9a-fA-F]{6}$/.test(val) && bgPicker) {
          bgPicker.value = val;
        }
        this.markCustomPreset();
        this.updateThemeLivePreview();
      });
      bgClear?.addEventListener('click', () => {
        if (bgHex) bgHex.value = '';
        this.markCustomPreset();
        this.updateThemeLivePreview();
      });

      // Background Swatches
      overlay.querySelectorAll('#cfg-theme-bg-swatches .aid-qol-swatch').forEach(btn => {
        btn.addEventListener('click', () => {
          const col = btn.dataset.color;
          if (bgHex) bgHex.value = col;
          if (bgPicker && col) bgPicker.value = col;
          this.markCustomPreset();
          this.updateThemeLivePreview();
        });
      });

      // Action Accent Color
      const actPicker = document.getElementById('cfg-theme-action-color-picker');
      const actHex = document.getElementById('cfg-theme-action-color-hex');

      actPicker?.addEventListener('input', () => {
        if (actHex) actHex.value = actPicker.value;
        this.markCustomPreset();
        this.updateThemeLivePreview();
      });
      actHex?.addEventListener('input', () => {
        const val = actHex.value.trim();
        if (/^#[0-9a-fA-F]{6}$/.test(val) && actPicker) {
          actPicker.value = val;
        }
        this.markCustomPreset();
        this.updateThemeLivePreview();
      });

      // Action Swatches
      overlay.querySelectorAll('#cfg-theme-action-swatches .aid-qol-swatch').forEach(btn => {
        btn.addEventListener('click', () => {
          const col = btn.dataset.color;
          if (actHex) actHex.value = col;
          if (actPicker && col) actPicker.value = col;
          this.markCustomPreset();
          this.updateThemeLivePreview();
        });
      });

      // Dev Bridge buttons
      document.getElementById('aid-bridge-sync-btn')?.addEventListener('click', () => {
        DevBridgeModule.syncToBridge();
      });
      document.getElementById('aid-bridge-copy-btn')?.addEventListener('click', () => {
        DevBridgeModule.copyToken();
      });
    },

    updateComboPreview() {
      const isMac = navigator.userAgentData?.platform?.toLowerCase().includes('mac') ||
                    navigator.platform?.toLowerCase().includes('mac');
      const altName = isMac ? 'Option' : 'Alt';
      const ctrlName = isMac ? 'Cmd' : 'Ctrl';

      const parts = [];
      if (document.getElementById('cfg-mod-ctrl')?.checked) parts.push(ctrlName);
      if (document.getElementById('cfg-mod-alt')?.checked) parts.push(altName);
      if (document.getElementById('cfg-mod-shift')?.checked) parts.push('Shift');
      parts.push('[Key]');

      const preview = document.getElementById('cfg-combo-preview');
      if (preview) {
        preview.innerText = parts.length > 1 ? parts.join(' + ') : '[Key] (No modifiers)';
      }
    },

    populateFields() {
      // Modifiers
      const altEl = document.getElementById('cfg-mod-alt');
      const ctrlEl = document.getElementById('cfg-mod-ctrl');
      const shiftEl = document.getElementById('cfg-mod-shift');
      if (altEl) altEl.checked = !!CONFIG.get('hotkeyModifierAlt', true);
      if (ctrlEl) ctrlEl.checked = !!CONFIG.get('hotkeyModifierCtrl', true);
      if (shiftEl) shiftEl.checked = !!CONFIG.get('hotkeyModifierShift', false);
      this.updateComboPreview();

      // Key Inputs
      const keyFields = [
        'keyTakeTurn', 'keyContinue', 'keyRetry', 'keyRetryHistory', 'keyErase',
        'keyModeDo', 'keyModeSay', 'keyModeStory', 'keyModeSee', 'keyToggleActions',
        'keyGameMenu', 'keyScrollTop', 'keyToggleSite', 'keyUserProfile',
        'keyContinueAdventure', 'keyCharacterName'
      ];
      for (const fieldId of keyFields) {
        const input = document.getElementById(`cfg-${fieldId}`);
        if (input) {
          input.value = String(CONFIG.get(fieldId, DEFAULT_CONFIG[fieldId])).toUpperCase();
        }
      }

      // Story Card options
      const scEnabled = document.getElementById('cfg-sc-enabled');
      const scRemember = document.getElementById('cfg-sc-remember');
      const scW = document.getElementById('cfg-scModalWidth');
      const scH = document.getElementById('cfg-scModalHeight');
      if (scEnabled) scEnabled.checked = !!CONFIG.get('storyCardModalsEnabled', true);
      if (scRemember) scRemember.checked = !!CONFIG.get('rememberSCSize', true);
      if (scW) scW.value = CONFIG.get('scModalWidth', '680px');
      if (scH) scH.value = CONFIG.get('scModalHeight', '82vh');

      // Context Viewer options
      const contextEnabled = document.getElementById('cfg-context-enabled');
      const contextRemember = document.getElementById('cfg-context-remember');
      const contextW = document.getElementById('cfg-contextModalWidth');
      const contextH = document.getElementById('cfg-contextModalHeight');
      if (contextEnabled) contextEnabled.checked = !!CONFIG.get('contextModalEnabled', true);
      if (contextRemember) contextRemember.checked = !!CONFIG.get('rememberContextSize', true);
      if (contextW) contextW.value = CONFIG.get('contextModalWidth', '480px');
      if (contextH) contextH.value = CONFIG.get('contextModalHeight', 'auto');

      // Modal Dimming options
      const modalDimming = document.getElementById('cfg-modal-dimming');
      if (modalDimming) modalDimming.checked = !!CONFIG.get('disableModalDimming', true);

      // Game Menu options
      const menuEnabled = document.getElementById('cfg-menu-enabled');
      const menuW = document.getElementById('cfg-gameMenuWidth');
      if (menuEnabled) menuEnabled.checked = !!CONFIG.get('gameMenuResizeEnabled', true);
      if (menuW) menuW.value = CONFIG.get('gameMenuWidth', '424px');

      // Textarea Resizing
      const textareaResize = document.getElementById('cfg-textarea-resize');
      if (textareaResize) textareaResize.checked = !!CONFIG.get('textareaResizeEnabled', true);

      // General options
      const genAutoQuote = document.getElementById('cfg-gen-autoquote');
      const genAutoFocus = document.getElementById('cfg-gen-autofocus');
      const genHotkeys = document.getElementById('cfg-gen-hotkeys-enabled');
      const genDebug = document.getElementById('cfg-gen-debug');
      if (genAutoQuote) genAutoQuote.checked = !!CONFIG.get('autoQuoteDo', true);
      if (genAutoFocus) genAutoFocus.checked = !!CONFIG.get('autoFocusInput', true);
      if (genHotkeys) genHotkeys.checked = !!CONFIG.get('hotkeysEnabled', true);
      if (genDebug) genDebug.checked = !!CONFIG.get('debugLogging', false);

      // Theme & Typography Settings
      const savedPreset = CONFIG.get('themePreset', 'default');
      this.currentPreset = savedPreset;

      document.querySelectorAll('.aid-qol-preset-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.preset === savedPreset);
      });

      const fontSize = CONFIG.get('themeFontSize', '18px');
      const fsEl = document.getElementById('cfg-theme-font-size');
      if (fsEl) fsEl.value = parseInt(fontSize) || 18;

      const fontWeight = CONFIG.get('themeFontWeight', '400');
      const fwEl = document.getElementById('cfg-theme-font-weight');
      if (fwEl) fwEl.value = fontWeight;

      const lineHeight = CONFIG.get('themeLineHeight', '1.7');
      const lhEl = document.getElementById('cfg-theme-line-height');
      if (lhEl) lhEl.value = parseFloat(lineHeight) || 1.7;

      const paraSpacing = CONFIG.get('themeParagraphSpacing', '1.25em');
      const psEl = document.getElementById('cfg-theme-paragraph-spacing');
      if (psEl) psEl.value = parseFloat(paraSpacing) || 1.25;

      const storyWidth = CONFIG.get('themeStoryWidth', '900px');
      const swEl = document.getElementById('cfg-theme-story-width');
      if (swEl) swEl.value = parseInt(storyWidth) || 900;

      const cardHeight = CONFIG.get('themeCardHeight', '64px');
      const chEl = document.getElementById('cfg-theme-card-height');
      if (chEl) chEl.value = parseInt(cardHeight) || 64;

      const menuSpacing = CONFIG.get('themeMenuSpacing', '12px');
      const msEl = document.getElementById('cfg-theme-menu-spacing');
      if (msEl) msEl.value = parseInt(menuSpacing) || 12;

      const menuFontSize = CONFIG.get('themeMenuFontSize', '14px');
      const mfEl = document.getElementById('cfg-theme-menu-font-size');
      if (mfEl) mfEl.value = parseInt(menuFontSize) || 14;

      const textareaHeight = CONFIG.get('themeTextareaHeight', '96px');
      const thEl = document.getElementById('cfg-theme-textarea-height');
      if (thEl) thEl.value = parseInt(textareaHeight) || 96;

      const textColor = CONFIG.get('themeTextColor', '');
      const textHex = document.getElementById('cfg-theme-text-color-hex');
      const textPicker = document.getElementById('cfg-theme-text-color-picker');
      if (textHex) textHex.value = textColor;
      if (textPicker && textColor) textPicker.value = textColor;

      const bgColor = CONFIG.get('themeBgColor', '');
      const bgHex = document.getElementById('cfg-theme-bg-color-hex');
      const bgPicker = document.getElementById('cfg-theme-bg-color-picker');
      if (bgHex) bgHex.value = bgColor;
      if (bgPicker && bgColor) bgPicker.value = bgColor;

      const actionStyle = CONFIG.get('themeActionStyle', 'default');
      const actStyle = document.getElementById('cfg-theme-action-style');
      if (actStyle) actStyle.value = actionStyle;

      const actionColor = CONFIG.get('themeActionColor', '#fb923c');
      const actHex = document.getElementById('cfg-theme-action-color-hex');
      const actPicker = document.getElementById('cfg-theme-action-color-picker');
      if (actHex) actHex.value = actionColor;
      if (actPicker && actionColor) actPicker.value = actionColor;

      this.updateThemeLivePreview();

    },

    applyThemeStyles() {
      if (!this.overlay) return;

      let detectedBg = '';

      // 1. Inspect CSS custom properties on documentElement and body
      for (const el of [document.documentElement, document.body]) {
        if (!el) continue;
        const style = getComputedStyle(el);
        const bgVar = style.getPropertyValue('--background')?.trim();
        if (bgVar && bgVar !== 'transparent' && bgVar !== 'inherit') {
          detectedBg = bgVar;
          break;
        }
      }

      // 2. If no variable is found or resolves to transparent, sample computed background-color from game containers
      if (!detectedBg) {
        const sampleTargets = [
          document.body,
          document.documentElement,
          document.getElementById('gameplay-output'),
          document.querySelector('.gameplay-viewport-root'),
          document.querySelector('[role="main"]'),
          document.querySelector('main')
        ];
        for (const el of sampleTargets) {
          if (!el) continue;
          const comp = getComputedStyle(el).backgroundColor;
          if (comp && comp !== 'transparent' && comp !== 'rgba(0, 0, 0, 0)') {
            detectedBg = comp;
            break;
          }
        }
      }

      // 3. Fallback to clean, neutral true dark
      if (!detectedBg) {
        detectedBg = '#0c0c0e';
      }

      this.overlay.style.setProperty('--aid-theme-bg', detectedBg);
    },

    open() {
      this.render();
      this.initialThemeSettings = ThemeManagerModule.getSavedSettings();
      this.applyThemeStyles();
      this.populateFields();
      if (typeof DevBridgeModule !== 'undefined') {
        DevBridgeModule.updateUI();
      }
      if (this.overlay) {
        const modal = this.overlay.querySelector('.aid-qol-config-modal');
        if (modal) {
          modal.style.position = '';
          modal.style.left = '';
          modal.style.top = '';
          modal.style.margin = '';
        }
        this.overlay.style.display = 'flex';
      }

      // Bind Escape key
      this._escHandler = (e) => {
        if (e.key === 'Escape') this.close();
      };
      document.addEventListener('keydown', this._escHandler);
    },

    close() {
      ThemeManagerModule.revertToSaved();
      if (this.overlay) {
        this.overlay.style.display = 'none';
      }
      if (this._escHandler) {
        document.removeEventListener('keydown', this._escHandler);
        this._escHandler = null;
      }
    },

    save() {
      if (!this.overlay) return;

      // Modifiers
      CONFIG.set('hotkeyModifierAlt', document.getElementById('cfg-mod-alt')?.checked ?? true);
      CONFIG.set('hotkeyModifierCtrl', document.getElementById('cfg-mod-ctrl')?.checked ?? true);
      CONFIG.set('hotkeyModifierShift', document.getElementById('cfg-mod-shift')?.checked ?? false);

      // Key inputs
      const keyFields = [
        'keyTakeTurn', 'keyContinue', 'keyRetry', 'keyRetryHistory', 'keyErase',
        'keyModeDo', 'keyModeSay', 'keyModeStory', 'keyModeSee', 'keyToggleActions',
        'keyGameMenu', 'keyScrollTop', 'keyToggleSite', 'keyUserProfile',
        'keyContinueAdventure', 'keyCharacterName'
      ];
      for (const fieldId of keyFields) {
        const input = document.getElementById(`cfg-${fieldId}`);
        if (input && input.value.trim()) {
          CONFIG.set(fieldId, input.value.trim().toUpperCase());
        }
      }

      // Story Card options
      const scEnabled = document.getElementById('cfg-sc-enabled');
      const scRemember = document.getElementById('cfg-sc-remember');
      const scW = document.getElementById('cfg-scModalWidth');
      const scH = document.getElementById('cfg-scModalHeight');
      if (scEnabled) CONFIG.set('storyCardModalsEnabled', scEnabled.checked);
      if (scRemember) CONFIG.set('rememberSCSize', scRemember.checked);
      if (scW && scW.value.trim()) CONFIG.set('scModalWidth', scW.value.trim());
      if (scH && scH.value.trim()) CONFIG.set('scModalHeight', scH.value.trim());

      // Context Viewer options
      const contextEnabled = document.getElementById('cfg-context-enabled');
      const contextRemember = document.getElementById('cfg-context-remember');
      const contextW = document.getElementById('cfg-contextModalWidth');
      const contextH = document.getElementById('cfg-contextModalHeight');
      if (contextEnabled) CONFIG.set('contextModalEnabled', contextEnabled.checked);
      if (contextRemember) CONFIG.set('rememberContextSize', contextRemember.checked);
      if (contextW && contextW.value.trim()) CONFIG.set('contextModalWidth', contextW.value.trim());
      if (contextH && contextH.value.trim()) CONFIG.set('contextModalHeight', contextH.value.trim());

      // Modal Dimming options
      const modalDimming = document.getElementById('cfg-modal-dimming');
      if (modalDimming) {
        CONFIG.set('disableModalDimming', modalDimming.checked);
        StoryCardModalModule.updateModalDimmingState();
      }

      // Game Menu options
      const menuEnabled = document.getElementById('cfg-menu-enabled');
      const menuW = document.getElementById('cfg-gameMenuWidth');
      if (menuEnabled) CONFIG.set('gameMenuResizeEnabled', menuEnabled.checked);
      if (menuW && menuW.value.trim()) {
        const val = menuW.value.trim();
        const validW = GameMenuResizeModule.getValidWidth(val);
        CONFIG.set('gameMenuWidth', `${validW}px`);
        const settingsRegion = document.querySelector('[aria-label="Game settings" i]');
        if (settingsRegion) {
          const root = GameMenuResizeModule.findMenuRoot(settingsRegion);
          if (root && root.classList.contains('aid-qol-game-menu-resizable')) {
            root.style.width = `${validW}px`;
          }
        }
      }

      // Textarea Resizing
      const textareaResize = document.getElementById('cfg-textarea-resize');
      if (textareaResize) {
        CONFIG.set('textareaResizeEnabled', textareaResize.checked);
        TextareaResizeModule.updateStyles();
      }

      // General options
      const genAutoQuote = document.getElementById('cfg-gen-autoquote');
      const genAutoFocus = document.getElementById('cfg-gen-autofocus');
      const genHotkeys = document.getElementById('cfg-gen-hotkeys-enabled');
      const genDebug = document.getElementById('cfg-gen-debug');
      if (genAutoQuote) CONFIG.set('autoQuoteDo', genAutoQuote.checked);
      if (genAutoFocus) CONFIG.set('autoFocusInput', genAutoFocus.checked);
      if (genHotkeys) CONFIG.set('hotkeysEnabled', genHotkeys.checked);
      if (genDebug) CONFIG.set('debugLogging', genDebug.checked);

      // Save Theme & Typography Settings
      const themeSettings = this.gatherCurrentThemeUI();
      CONFIG.set('themePreset', this.currentPreset || 'custom');
      CONFIG.set('themeFontSize', themeSettings.themeFontSize);
      CONFIG.set('themeFontWeight', themeSettings.themeFontWeight);
      CONFIG.set('themeLineHeight', themeSettings.themeLineHeight);
      CONFIG.set('themeParagraphSpacing', themeSettings.themeParagraphSpacing);
      CONFIG.set('themeStoryWidth', themeSettings.themeStoryWidth);
      CONFIG.set('themeCardHeight', themeSettings.themeCardHeight);
      CONFIG.set('themeMenuSpacing', themeSettings.themeMenuSpacing);
      CONFIG.set('themeMenuFontSize', themeSettings.themeMenuFontSize);
      CONFIG.set('themeTextareaHeight', themeSettings.themeTextareaHeight);
      CONFIG.set('themeTextColor', themeSettings.themeTextColor);
      CONFIG.set('themeBgColor', themeSettings.themeBgColor);
      CONFIG.set('themeActionStyle', themeSettings.themeActionStyle);
      CONFIG.set('themeActionColor', themeSettings.themeActionColor);

      ThemeManagerModule.applySavedConfig();

      Logger.info('Configuration updated via Settings dialog.');
      this.showToast('✓ AID-QoL Settings saved successfully!');
      this.close();
    },

    resetDefaults() {
      if (!confirm('Are you sure you want to reset all AID-QoL settings to defaults?')) return;
      CONFIG.resetToDefaults();
      this.applyPresetToUI('default');
      this.populateFields();
      this.showToast('✓ Settings reset to defaults!');
    },

    showToast(msg) {
      const existing = document.querySelector('.aid-qol-toast');
      if (existing) existing.remove();

      const toast = document.createElement('div');
      toast.className = 'aid-qol-toast';
      toast.innerText = msg;
      document.body.appendChild(toast);

      setTimeout(() => {
        toast.style.transition = 'opacity 0.3s ease-out';
        toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 300);
      }, 2200);
    }
  };

  // =========================================================================
  // Feature Module 8: Antigravity Dev Bridge & API Token Sync
  // =========================================================================
  const DevBridgeModule = {
    name: 'Antigravity Dev Bridge',
    activeToken: null,

    init() {
      Logger.info('Initializing DevBridgeModule...');
      this.hookFetch();
      this.retrieveToken();

      GM_registerMenuCommand(
        '🔄 Sync Token to Antigravity (Local Bridge)',
        () => this.syncToBridge()
      );
      GM_registerMenuCommand(
        '📋 Copy Auth Token for .env',
        () => this.copyToken()
      );
    },

    hookFetch() {
      const origFetch = window.fetch;
      const self = this;
      window.fetch = async function (...args) {
        try {
          const [res, init] = args;
          if (init && init.headers) {
            let auth = null;
            if (typeof init.headers.get === 'function') {
              auth = init.headers.get('Authorization') || init.headers.get('authorization');
            } else if (typeof init.headers === 'object') {
              auth = init.headers['Authorization'] || init.headers['authorization'];
            }
            if (auth && typeof auth === 'string') {
              const clean = auth.replace(/^firebase\s+/i, '').trim();
              if (clean.length > 20) {
                self.activeToken = clean;
                GM_setValue('aid_last_auth_token', clean);
                self.updateUI();
              }
            }
          }
        } catch (_) {}
        return origFetch.apply(this, args);
      };
    },

    getTokenFromStorage() {
      const storages = [];
      try { if (typeof unsafeWindow !== 'undefined' && unsafeWindow.localStorage) storages.push(unsafeWindow.localStorage); } catch (_) {}
      try { if (typeof window !== 'undefined' && window.localStorage) storages.push(window.localStorage); } catch (_) {}
      try { if (typeof unsafeWindow !== 'undefined' && unsafeWindow.sessionStorage) storages.push(unsafeWindow.sessionStorage); } catch (_) {}
      try { if (typeof window !== 'undefined' && window.sessionStorage) storages.push(window.sessionStorage); } catch (_) {}

      for (const st of storages) {
        try {
          for (let i = 0; i < st.length; i++) {
            const key = st.key(i);
            if (key && (key.startsWith('firebase:authUser:') || key.includes('authUser') || key === 'sessionTransferToken')) {
              const raw = st.getItem(key);
              if (raw) {
                try {
                  const data = JSON.parse(raw);
                  const tok = data?.stsTokenManager?.accessToken || data?.accessToken || data?.token;
                  if (tok && typeof tok === 'string' && tok.length > 20) {
                    return tok;
                  }
                } catch (_) {
                  if (typeof raw === 'string' && raw.length > 30 && raw.startsWith('eyJ')) {
                    return raw;
                  }
                }
              }
            }
          }
        } catch (_) {}
      }
      return null;
    },

    async retrieveToken() {
      if (this.activeToken) return this.activeToken;

      // 1. Direct from window/unsafeWindow localStorage or sessionStorage
      const stToken = this.getTokenFromStorage();
      if (stToken) {
        this.activeToken = stToken;
        GM_setValue('aid_last_auth_token', stToken);
        return this.activeToken;
      }

      // 2. Cached in GM_getValue from a previous turn
      const saved = GM_getValue('aid_last_auth_token', null);
      if (saved) {
        this.activeToken = saved;
        return this.activeToken;
      }

      // 3. Fallback: IndexedDB
      try {
        const idbToken = await new Promise((resolve) => {
          const req = indexedDB.open('firebaseLocalStorageDb');
          req.onsuccess = () => {
            const db = req.result;
            if (!db.objectStoreNames.contains('firebaseLocalStorage')) return resolve(null);
            const tx = db.transaction('firebaseLocalStorage', 'readonly');
            const store = tx.objectStore('firebaseLocalStorage');
            const getAll = store.getAll();
            getAll.onsuccess = () => {
              const items = getAll.result || [];
              for (const item of items) {
                const tok = item?.value?.stsTokenManager?.accessToken;
                if (tok) return resolve(tok);
              }
              resolve(null);
            };
            getAll.onerror = () => resolve(null);
          };
          req.onerror = () => resolve(null);
        });
        if (idbToken) {
          this.activeToken = idbToken;
          GM_setValue('aid_last_auth_token', idbToken);
          return this.activeToken;
        }
      } catch (_) {}

      return this.activeToken;
    },

    getContextInfo() {
      const path = window.location.pathname || '';
      let adventureId = null;
      let scenarioId = null;
      const advMatch = path.match(/\/(?:adventure|play)\/([a-zA-Z0-9_-]+)/);
      if (advMatch) adventureId = advMatch[1];
      const scnMatch = path.match(/\/scenario\/([a-zA-Z0-9_-]+)/);
      if (scnMatch) scenarioId = scnMatch[1];
      return { adventureId, scenarioId, pathname: path };
    },

    async updateUI() {
      await this.retrieveToken();
      const badge = document.getElementById('aid-bridge-token-badge');
      const ctxInfo = document.getElementById('aid-bridge-context-info');
      const ctx = this.getContextInfo();

      if (badge) {
        if (this.activeToken) {
          const preview = this.activeToken.slice(-6);
          badge.textContent = `✓ Ready (...${preview})`;
          badge.style.background = 'rgba(34, 197, 94, 0.15)';
          badge.style.color = '#4ade80';
          badge.style.borderColor = 'rgba(34, 197, 94, 0.3)';
        } else {
          badge.textContent = '⚠️ Not Detected';
          badge.style.background = 'rgba(239, 68, 68, 0.15)';
          badge.style.color = '#f87171';
          badge.style.borderColor = 'rgba(239, 68, 68, 0.3)';
        }
      }

      if (ctxInfo) {
        const parts = [];
        if (ctx.adventureId) parts.push(`Adventure: ${ctx.adventureId}`);
        if (ctx.scenarioId) parts.push(`Scenario: ${ctx.scenarioId}`);
        ctxInfo.textContent = parts.length > 0 ? `Current context: ${parts.join(' | ')}` : `Current context: Global (${ctx.pathname || '/'})`;
      }
    },

    async copyToken() {
      const token = await this.retrieveToken();
      if (!token) {
        ConfigUIModule.showToast('⚠️ No active auth token found. Please take a turn or sign in first.');
        return false;
      }
      const textToCopy = `AID_ACCESS_TOKEN=${token}`;
      if (typeof GM_setClipboard === 'function') {
        GM_setClipboard(textToCopy, 'text');
      } else if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(textToCopy);
      }
      ConfigUIModule.showToast('✓ Copied AID_ACCESS_TOKEN to clipboard!');
      return true;
    },

    async syncToBridge() {
      const token = await this.retrieveToken();
      if (!token) {
        ConfigUIModule.showToast('⚠️ No auth token detected. Please take a turn or sign in.');
        return;
      }
      const ctx = this.getContextInfo();
      const payload = {
        token,
        adventureId: ctx.adventureId,
        scenarioId: ctx.scenarioId
      };

      const bridgeUrl = 'http://127.0.0.1:8765/sync';

      if (typeof GM_xmlhttpRequest === 'function') {
        GM_xmlhttpRequest({
          method: 'POST',
          url: bridgeUrl,
          headers: { 'Content-Type': 'application/json' },
          data: JSON.stringify(payload),
          onload: (res) => {
            if (res.status === 200) {
              try {
                const data = JSON.parse(res.responseText);
                const user = data.user?.username ? ` (${data.user.username})` : '';
                ConfigUIModule.showToast(`✓ Synced with Antigravity!${user}`);
              } catch (_) {
                ConfigUIModule.showToast('✓ Synced with Antigravity Dev Bridge!');
              }
            } else {
              ConfigUIModule.showToast(`⚠️ Sync failed: HTTP ${res.status}`);
            }
          },
          onerror: () => {
            ConfigUIModule.showToast('⚠️ Bridge offline. Run \'npm run bridge\' in AID-LLM-connector!');
          }
        });
      } else {
        try {
          const res = await fetch(bridgeUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          });
          if (res.ok) {
            ConfigUIModule.showToast('✓ Synced with Antigravity Dev Bridge!');
          } else {
            ConfigUIModule.showToast(`⚠️ Sync failed: HTTP ${res.status}`);
          }
        } catch (_) {
          ConfigUIModule.showToast('⚠️ Bridge offline. Run \'npm run bridge\' in AID-LLM-connector!');
        }
      }
    }
  };

  // =========================================================================
  // Module Manager (Bootstrap)
  // =========================================================================
  const modules = [
    StoryInputModule,
    HotkeysModule,
    ActionToggleModule,
    StoryCardModalModule,
    GameMenuResizeModule,
    TextareaResizeModule,
    ThemeManagerModule,
    ConfigUIModule,
    DevBridgeModule,
  ];

  function bootstrap() {
    Logger.info(`Bootstrapping AID-QoL-Tool v3.5.2 (${modules.length} active modules)...`);

    for (const mod of modules) {
      try {
        mod.init();
        Logger.info(`Module [${mod.name}] initialized successfully.`);
      } catch (err) {
        Logger.error(`Module [${mod.name}] failed to initialize:`, err);
      }
    }
  }

  // Ensure DOM is ready before bootstrapping
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bootstrap);
  } else {
    bootstrap();
  }

})();
