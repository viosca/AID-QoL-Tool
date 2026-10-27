// ==UserScript==
// @name         AID-EQoL-Tool
// @version      3.0.0
// @description  Modular Quality-of-Life enhancements for AI Dungeon (Auto-quoting, Hotkeys, UI Tweaks).
// @author       viosca
// @match        https://*.aidungeon.com/*
// @icon         https://play-lh.googleusercontent.com/ALmVcUVvR8X3q-hOUbcR7S__iicLgIWDwM9K_9PJy87JnK1XfHSi_tp1sUlJJBVsiSc
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_registerMenuCommand
// @grant        GM_addStyle
// @license      MIT
// @namespace    https://github.com/viosca/AID-QoL-Tool/tree/v3-rebuild
// @downloadURL  https://github.com/viosca/AID-QoL-Tool/raw/v3-rebuild/AID-QoL-Tool.user.js
// @updateURL    https://github.com/viosca/AID-QoL-Tool/raw/v3-rebuild/AID-QoL-Tool.user.js
// @run-at       document-idle
// ==/UserScript==

(function () {
  'use strict';

  // =========================================================================
  // Configuration & State
  // =========================================================================
  const CONFIG = {
    get(key, defaultValue) {
      return GM_getValue(key, defaultValue);
    },
    set(key, value) {
      GM_setValue(key, value);
    }
  };

  // Default configuration values
  if (CONFIG.get('autoQuoteDo') === undefined) CONFIG.set('autoQuoteDo', true);
  if (CONFIG.get('autoFocusInput') === undefined) CONFIG.set('autoFocusInput', true);
  if (CONFIG.get('hotkeysEnabled') === undefined) CONFIG.set('hotkeysEnabled', true);
  if (CONFIG.get('debugLogging') === undefined) CONFIG.set('debugLogging', false);

  // Register Tampermonkey menu commands
  GM_registerMenuCommand(
    `Auto-Quote "Do": ${CONFIG.get('autoQuoteDo') ? 'ENABLED' : 'DISABLED'} (Click to toggle)`,
    () => {
      CONFIG.set('autoQuoteDo', !CONFIG.get('autoQuoteDo'));
      location.reload();
    }
  );

  GM_registerMenuCommand(
    `Hotkeys (Alt+Ctrl): ${CONFIG.get('hotkeysEnabled') ? 'ENABLED' : 'DISABLED'} (Click to toggle)`,
    () => {
      CONFIG.set('hotkeysEnabled', !CONFIG.get('hotkeysEnabled'));
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

    init() {
      Logger.info('Initializing HotkeysModule...');
      document.addEventListener('keydown', (e) => this.handleKeyDown(e));
    },

    handleKeyDown(e) {
      if (!CONFIG.get('hotkeysEnabled') || e.repeat) return;

      const key = e.key.toUpperCase();
      const ctrlOrCmd = this.isMac ? e.metaKey : e.ctrlKey;
      const modifsActive = e.altKey && ctrlOrCmd && !e.shiftKey;

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

      // Modifier-based Hotkeys (Alt + Ctrl / Option + Cmd)
      if (!modifsActive) return;

      const fullURL = window.location.href;
      const isPlayPage = fullURL.includes('/play');

      switch (key) {
        // --- Gameplay Turn Commands ---
        case 'C': // Take a Turn
          if (!isPlayPage) return;
          e.preventDefault();
          this.triggerSelector('[aria-label="Command: take a turn" i], [data-fs-element="AID Take a turn" i]');
          break;

        case 'A': // Continue
          if (!isPlayPage) return;
          e.preventDefault();
          this.triggerSelector('[aria-label="Command: continue" i], [data-fs-element="AID Continue" i]');
          break;

        case 'S': // Retry
          if (!isPlayPage) return;
          e.preventDefault();
          this.triggerSelector('[aria-label="Command: retry" i], [data-fs-element="AID Retry" i]');
          break;

        case 'X': // Retry History
          if (!isPlayPage) return;
          e.preventDefault();
          this.triggerSelector('[aria-label="Retry history" i]');
          break;

        case 'D': // Erase / Undo
          if (!isPlayPage) return;
          e.preventDefault();
          this.triggerSelector('[aria-label="Command: erase" i], [aria-label="Undo change" i], [data-fs-element="AID Undo" i]');
          break;

        // --- Mode Switching (Do / Say / Story / See) ---
        case 'Q': // Do mode
          if (!isPlayPage) return;
          e.preventDefault();
          this.switchMode('Do');
          break;

        case 'W': // Say mode
          if (!isPlayPage) return;
          e.preventDefault();
          this.switchMode('Say');
          break;

        case 'E': // Story mode
          if (!isPlayPage) return;
          e.preventDefault();
          this.switchMode('Story');
          break;

        case 'R': // See mode
          if (!isPlayPage) return;
          e.preventDefault();
          this.switchMode('See');
          break;

        // --- Menus & Navigation ---
        case 'F': // Game Menu / Flame
          if (!isPlayPage) return;
          e.preventDefault();
          this.triggerSelector('[aria-label="Game Menu" i], [data-fs-element="AID Open game menu" i]');
          break;

        case 'H': // Scroll to Top
          if (!isPlayPage) return;
          e.preventDefault();
          this.scrollToTop();
          break;

        case 'T': // Toggle Site (play.aidungeon.com <-> beta.aidungeon.com)
          e.preventDefault();
          this.toggleSite();
          break;

        case 'G': // User Profile
          e.preventDefault();
          this.openUserProfile(isPlayPage);
          break;

        case 'V': // Continue Adventure
          e.preventDefault();
          this.continueAdventure();
          break;

        case 'Z': // Edit Character Name
          if (!isPlayPage) return;
          e.preventDefault();
          this.editCharacterName();
          break;

        default:
          break;
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
        () => this.triggerSelector('[role="button"][aria-label="Continue Adventure" i]')
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
  // Module Manager (Bootstrap)
  // =========================================================================
  const modules = [
    StoryInputModule,
    HotkeysModule,
  ];

  function bootstrap() {
    Logger.info(`Bootstrapping AID-EQoL-Tool v3.0.0 (${modules.length} active modules)...`);

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
