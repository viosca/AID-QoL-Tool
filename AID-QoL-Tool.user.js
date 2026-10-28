// ==UserScript==
// @name         AID-QoL-Tool
// @version      3.3.4
// @description  Modular Quality-of-Life enhancements for AI Dungeon (Auto-quoting, Hotkeys, Action Toggle, Story Card Modals, Game Menu Resizing).
// @author       viosca
// @match        https://*.aidungeon.com/*
// @icon         https://play-lh.googleusercontent.com/ALmVcUVvR8X3q-hOUbcR7S__iicLgIWDwM9K_9PJy87JnK1XfHSi_tp1sUlJJBVsiSc
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_registerMenuCommand
// @grant        GM_addStyle
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

    // Game Menu (Right Sidebar) Resizing
    gameMenuResizeEnabled: true,
    gameMenuWidth: '424px',

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

    // Dispatch input and change events
    element.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
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
     * Binds quote management and observers to the story input textarea.
     * @param {HTMLTextAreaElement} textarea
     */
    attachToGameplayInput(textarea) {
      const applyQuotesLogic = () => {
        if (!CONFIG.get('autoQuoteDo')) return;

        const placeholder = textarea.getAttribute('placeholder') || '';
        const trimmedVal = textarea.value.trim();

        // Mode: "Do" ("What do you do?")
        if (placeholder.startsWith('What do you do?')) {
          if (trimmedVal === '') {
            // Empty input -> insert pair of quotes and place cursor inside
            setNativeValue(textarea, '""');
            setTimeout(() => {
              textarea.focus();
              textarea.setSelectionRange(1, 1);
            }, 30);
            Logger.log('Auto-quoted empty Do action');
          } else if (!textarea.value.includes('"')) {
            // User typed text without quotes -> wrap in quotes
            const start = textarea.selectionStart;
            const end = textarea.selectionEnd;
            setNativeValue(textarea, `"${textarea.value}"`);
            setTimeout(() => {
              textarea.focus();
              // Preserve cursor position offset by leading quote
              textarea.setSelectionRange(start + 1, end + 1);
            }, 30);
            Logger.log('Wrapped text in quotes for Do action');
          }
        } 
        // Mode switched away from "Do" (e.g. Say, Story, Guide, See)
        else {
          // If the textarea only contains empty quotes left over from Do mode, remove them
          if (trimmedVal === '""') {
            setNativeValue(textarea, '');
            setTimeout(() => {
              textarea.focus();
            }, 30);
            Logger.log('Cleaned leftover quotes on mode switch');
          }
        }
      };

      // Run on initial discovery
      setTimeout(applyQuotesLogic, 100);

      // Watch for mode/placeholder changes (e.g. clicking Do -> Say -> Story)
      const attrObserver = new MutationObserver((mutations) => {
        for (const mutation of mutations) {
          if (mutation.attributeName === 'placeholder') {
            Logger.log('Placeholder changed to:', textarea.getAttribute('placeholder'));
            setTimeout(applyQuotesLogic, 50);
          }
        }
      });

      attrObserver.observe(textarea, { attributes: true, attributeFilter: ['placeholder'] });

      // Auto-focus input when returning to the gameplay view
      if (CONFIG.get('autoFocusInput')) {
        setTimeout(() => textarea.focus(), 150);
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
          // Refocus input
          const input = document.getElementById('game-text-input');
          if (input) input.focus();
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
  // Feature Module 4: Story Card Modals (Drag & Top-Left Anchored Resize)
  // =========================================================================
  const StoryCardModalModule = {
    name: 'Story Card Modals',

    init() {
      Logger.info('Initializing StoryCardModalModule...');

      if (!CONFIG.get('storyCardModalsEnabled')) return;

      this.injectStyles();

      // Observe for dialogs appearing in the DOM
      observeSelector('[role="dialog"], [role="alertdialog"]', (modalNode) => {
        // Allow a brief moment for child elements to mount
        setTimeout(() => {
          if (this.isStoryCardModal(modalNode)) {
            this.setupStoryCardModal(modalNode);
          }
        }, 60);
      });
    },

    injectStyles() {
      GM_addStyle(`
        /* 
         * Resizable Story Card modal styling.
         * Explicit right: auto !important and bottom: auto !important prevents Tailwind's
         * inset-0 and w-full from stretching the modal across the entire viewport!
         */
        .aid-qol-story-card-modal {
          resize: both !important;
          overflow: auto !important;
          right: auto !important;
          bottom: auto !important;
          margin: 0px !important;
          min-width: 320px !important;
          min-height: 250px !important;
          max-width: 98vw !important;
          max-height: 96vh !important;
          border-bottom-right-radius: 0px !important;
          box-sizing: border-box !important;
          transform: none !important;
          --tw-translate-x: 0px !important;
          --tw-translate-y: 0px !important;
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
      modal.style.position = 'fixed';
      modal.style.left = `${leftPx}px`;
      modal.style.top = `${topPx}px`;
      modal.style.width = `${widthPx}px`;
      modal.style.height = `${heightPx}px`;
      modal.style.right = 'auto';
      modal.style.bottom = 'auto';
      modal.style.margin = '0px';
      modal.style.transform = 'none';

      // Unset parent flex centering
      if (modal.parentElement) {
        modal.parentElement.style.justifyContent = 'unset';
        modal.parentElement.style.alignItems = 'unset';
      }

      // 4. Enable native resize
      modal.classList.add('aid-qol-story-card-modal');

      // 5. Watch for user manual resize and save dimensions if enabled
      this.bindResizeSaver(modal);

      // 6. Locate the visible header row to use as the drag handle
      const header = this.findModalHeader(modal);
      if (!header) {
        delete modal.dataset.aidQolModal;
        Logger.warn('Visible header not found yet for modal, will retry:', modal);
        return;
      }

      header.classList.add('aid-qol-modal-handle');
      Logger.log('Attached drag handle to header:', header);

      // 7. Bind drag events
      this.bindDragEvents(modal, header);

      // 8. Double-click title bar to maximize / restore
      header.addEventListener('dblclick', (e) => {
        if (this.isInteractiveElement(e.target)) return;
        this.toggleMaximize(modal);
      });
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
     * Checks if a clicked element inside the header is an interactive button/input.
     * @param {HTMLElement} target
     * @returns {boolean}
     */
    isInteractiveElement(target) {
      return !!target.closest('button, input, textarea, select, a, [role="tab"], [data-slot="platform-dropdown-menu-trigger"], [data-slot="platform-dialog-close"], [aria-label*="close" i]');
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
        modal.style.position = 'fixed';
        modal.style.margin = '0';
        modal.style.transform = 'none';
        modal.style.right = 'auto';
        modal.style.bottom = 'auto';
        modal.style.left = `${rect.left}px`;
        modal.style.top = `${rect.top}px`;
        modal.style.zIndex = '999999';

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

          modal.style.left = `${newLeft}px`;
          modal.style.top = `${newTop}px`;
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
          modal.style.left = modal._preMaxStyle.left;
          modal.style.top = modal._preMaxStyle.top;
          modal.style.width = modal._preMaxStyle.width;
          modal.style.height = modal._preMaxStyle.height;
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
        modal.style.position = 'fixed';
        modal.style.margin = '0';
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
  // Feature Module 6: Configuration Dialog (Native In-Game Settings Modal)
  // =========================================================================
  const ConfigUIModule = {
    name: 'Configuration Dialog',
    overlayId: 'aid-qol-config-overlay',
    overlay: null,

    init() {
      Logger.info('Initializing ConfigUIModule...');
      this.injectStyles();
    },

    injectStyles() {
      GM_addStyle(`
        #aid-qol-config-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.85);
          backdrop-filter: blur(8px);
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
          width: 620px;
          max-width: 92vw;
          max-height: 88vh;
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
              <span class="aid-qol-config-badge">v3.3.4</span>
            </div>
            <button class="aid-qol-config-close-btn" id="cfg-btn-x" title="Close (Esc)">✕</button>
          </div>

          <div class="aid-qol-config-tabs">
            <button class="aid-qol-tab-btn active" data-tab="aid-tab-hotkeys">Hotkeys</button>
            <button class="aid-qol-tab-btn" data-tab="aid-tab-storycards">Cards & Menus</button>
            <button class="aid-qol-tab-btn" data-tab="aid-tab-general">General</button>
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
        });
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

      // Game Menu options
      const menuEnabled = document.getElementById('cfg-menu-enabled');
      const menuW = document.getElementById('cfg-gameMenuWidth');
      if (menuEnabled) menuEnabled.checked = !!CONFIG.get('gameMenuResizeEnabled', true);
      if (menuW) menuW.value = CONFIG.get('gameMenuWidth', '424px');

      // General options
      const genAutoQuote = document.getElementById('cfg-gen-autoquote');
      const genAutoFocus = document.getElementById('cfg-gen-autofocus');
      const genHotkeys = document.getElementById('cfg-gen-hotkeys-enabled');
      const genDebug = document.getElementById('cfg-gen-debug');
      if (genAutoQuote) genAutoQuote.checked = !!CONFIG.get('autoQuoteDo', true);
      if (genAutoFocus) genAutoFocus.checked = !!CONFIG.get('autoFocusInput', true);
      if (genHotkeys) genHotkeys.checked = !!CONFIG.get('hotkeysEnabled', true);
      if (genDebug) genDebug.checked = !!CONFIG.get('debugLogging', false);
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
      this.applyThemeStyles();
      this.populateFields();
      if (this.overlay) {
        this.overlay.style.display = 'flex';
      }

      // Bind Escape key
      this._escHandler = (e) => {
        if (e.key === 'Escape') this.close();
      };
      document.addEventListener('keydown', this._escHandler);
    },

    close() {
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

      // General options
      const genAutoQuote = document.getElementById('cfg-gen-autoquote');
      const genAutoFocus = document.getElementById('cfg-gen-autofocus');
      const genHotkeys = document.getElementById('cfg-gen-hotkeys-enabled');
      const genDebug = document.getElementById('cfg-gen-debug');
      if (genAutoQuote) CONFIG.set('autoQuoteDo', genAutoQuote.checked);
      if (genAutoFocus) CONFIG.set('autoFocusInput', genAutoFocus.checked);
      if (genHotkeys) CONFIG.set('hotkeysEnabled', genHotkeys.checked);
      if (genDebug) CONFIG.set('debugLogging', genDebug.checked);

      Logger.info('Configuration updated via Settings dialog.');
      this.showToast('✓ AID-QoL Settings saved successfully!');
      this.close();
    },

    resetDefaults() {
      if (!confirm('Are you sure you want to reset all AID-QoL settings to defaults?')) return;
      CONFIG.resetToDefaults();
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
  // Module Manager (Bootstrap)
  // =========================================================================
  const modules = [
    StoryInputModule,
    HotkeysModule,
    ActionToggleModule,
    StoryCardModalModule,
    GameMenuResizeModule,
    ConfigUIModule,
  ];

  function bootstrap() {
    Logger.info(`Bootstrapping AID-QoL-Tool v3.3.4 (${modules.length} active modules)...`);

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
