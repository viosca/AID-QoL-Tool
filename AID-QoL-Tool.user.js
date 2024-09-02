// ==UserScript==
// @name         AID-QoL-Tool
// @version      2.0.0
// @description  A QoL Extreme script for AID, adding customizable hotkeys, increases performance, providing draggable and resizable modal windows.
// @author       viosca
// @match        https://*.aidungeon.com/*
// @icon         https://play-lh.googleusercontent.com/ALmVcUVvR8X3q-hOUbcR7S__iicLgIWDwM9K_9PJy87JnK1XfHSi_tp1sUlJJBVsiSc
// @require      https://code.jquery.com/jquery-3.7.1.min.js
// @require      https://update.greasyfork.org/scripts/383527/701631/Wait_for_key_elements.js
// @require      https://update.greasyfork.org/scripts/439099/1203718/MonkeyConfig%20Modern%20Reloaded.js
// @grant        GM_addStyle
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_deleteValue
// @grant        GM_registerMenuCommand
// @license      MIT
// @namespace    https://github.com/viosca/AID-QoL-Tool/tree/WIP
// @downloadURL  https://github.com/viosca/AID-QoL-Tool/raw/WIP/AID-QoL-Tool.user.js
// @updateURL    https://github.com/viosca/AID-QoL-Tool/raw/WIP/AID-QoL-Tool.user.js
// ==/UserScript==

/* global jQuery, $, waitForKeyElements, MonkeyConfig */

// Feature



/// @downloadURL https://update.greasyfork.org/scripts/1302066/AIDungeon%20QoL%20Tool.user.js
/// @updateURL https://update.greasyfork.org/scripts/1302066/AIDungeon%20QoL%20Tool.meta.js
/// require      https://cdn.jsdelivr.net/npm/tampermonkey-require-for-react

const $ = jQuery.noConflict(true);

function getNextData() {
  const nextDataTag = document.getElementById('__NEXT_DATA__');
  if (nextDataTag) {
    const jsonString = nextDataTag.textContent;
    try {
      return JSON.parse(jsonString);
    } catch (error) {
      console.error("Error parsing JSON:", error);
    }
  } else {
    console.warn("Script tag not found.");
  }
}
// Relevant scenario or adventure site info is in __NEXT_DATA__.
// I.e. The scenario/adventure id, name, etc...
const nextData = getNextData();


/********************************
* Code for handling the configuration menu and for handling shortcuts.
*/
function addEventListeners(element, events, handler) {
  events.forEach((event) => {
    if (event.startsWith('touch')) {
      element.addEventListener(event, handler, { passive: true }); // Mark touch events as passive
    } else {
      element.addEventListener(event, handler); // Other events can be added normally
    }
  });
}
if (0) {
  function disableCustomContextMenu(button) {
    console.log("called disableCustomContextMenu");
    // Remove existing listeners (optional, but good practice)
    button.removeEventListener('contextmenu', event => { });

    // Add listener using capture phase for higher priority
    button.addEventListener('contextmenu', (event) => {
      event.preventDefault();
      event.stopPropagation(); // Stop propagation to prevent AIDungeon's listener from triggering
    }, true); // true for capture phase
  }

  // Mutation observer for dynamically added buttons
  const buttonObserver = new MutationObserver((mutationsList, observer) => {
    for (const mutation of mutationsList) {
      if (mutation.type === 'childList') {
        for (const node of mutation.addedNodes) {
          if (node.nodeName === 'DIV' && node.matches('[role="button"]')) {
            disableCustomContextMenu(node);
          }
        }
      }
    }
  });

  buttonObserver.observe(document.body, { childList: true, subtree: true });

}

function waitForSubtreeElements(selector, callback, targetNode, runImmediately = false) {
  function mutationObserverCallback(mutationsList, observer) {
    const elements = targetNode.querySelectorAll(selector);
    if (elements.length > 0) {
      observer.disconnect();
      callback(elements);
    }
  }
  const observer = new MutationObserver(mutationObserverCallback);
  observer.observe(targetNode, { childList: true, subtree: true });
  if (runImmediately) {
    mutationObserverCallback([], observer);
  }

  /*
    const observer = new MutationObserver((mutationsList, observer) => {
      const elements = targetNode.querySelectorAll(selector);
      if (elements.length > 0) {
        observer.disconnect();
        callback(elements);
      }
    });
    observer.observe(targetNode, { childList: true, subtree: true });
    if (runImmediately) {
      const elements = targetNode.querySelectorAll(selector);
      if (elements.length > 0) {
        observer.disconnect();
        callback(elements);
      }
    }
  */
}

const getSetTextFunc = (value, parent) => {
  const inputElem = $(parent || value).find('input');
  if (!parent) {
    const booleans = inputElem
      .filter(':checkbox')
      .map((_, el) => el.checked)
      .get();
    if (!booleans[0]) return inputElem.val().toUpperCase();
    return booleans;
  } else {
    inputElem.each((i, el) => {
      if (el.type === 'checkbox') el.checked = value[i];
      else el.value = value.toUpperCase();
    });
  }
};

const dummy = (value, parent) => {
};

const cfg = new MonkeyConfig({
  title: 'Configure',
  menuCommand: true,
  params: {
    Modifier_Keys: {
      type: 'custom',
      html: '<input id="ALT" type="checkbox" name="ALT" /> <label for="ALT">ALT</label> <input id="CTRL" type="checkbox" name="CTRL" /> <label for="CTRL">CTRL</label> <input id="SHIFT" type="checkbox" name="SHIFT" /> <label for="SHIFT">SHIFT</label>',
      set: getSetTextFunc,
      get: getSetTextFunc,
      default: [true, true, false]
    },
    Take_Turn: { type: 'custom', html: '<input type="text" maxlength="1" />', set: getSetTextFunc, get: getSetTextFunc, default: 'C' },
    Continue: { type: 'custom', html: '<input type="text" maxlength="1" />', set: getSetTextFunc, get: getSetTextFunc, default: 'A' },
    Retry: { type: 'custom', html: '<input type="text" maxlength="1" />', set: getSetTextFunc, get: getSetTextFunc, default: 'S' },
    Retry_History: { type: 'custom', html: '<input type="text" maxlength="1" />', set: getSetTextFunc, get: getSetTextFunc, default: 'X' },
    Erase: { type: 'custom', html: '<input type="text" maxlength="1" />', set: getSetTextFunc, get: getSetTextFunc, default: 'D' },
    Do: { type: 'custom', html: '<input type="text" maxlength="1" />', set: getSetTextFunc, get: getSetTextFunc, default: 'Q' },
    Say: { type: 'custom', html: '<input type="text" maxlength="1" />', set: getSetTextFunc, get: getSetTextFunc, default: 'W' },
    Story: { type: 'custom', html: '<input type="text" maxlength="1" />', set: getSetTextFunc, get: getSetTextFunc, default: 'E' },
    See: { type: 'custom', html: '<input type="text" maxlength="1" />', set: getSetTextFunc, get: getSetTextFunc, default: 'R' },
    Response_Underline: { type: 'checkbox', default: true },
    Response_Bg_Color: { type: 'checkbox', default: false },

    '_label': {
      type: 'custom',
      label: '<HR>',
      set: dummy, get: dummy,
      html: '<HR>'
    },

    Toggle_Site: { type: 'custom', html: '<input type="text" maxlength="1" />', set: getSetTextFunc, get: getSetTextFunc, default: 'T' },
    User_Name: { type: 'custom', html: '<input type="text" maxlength="1" />', set: getSetTextFunc, get: getSetTextFunc, default: 'Z' },
    User_Profile: { type: 'custom', html: '<input type="text" maxlength="1" />', set: getSetTextFunc, get: getSetTextFunc, default: 'G' },
    Continue_Adventure: { type: 'custom', html: '<input type="text" maxlength="1" />', set: getSetTextFunc, get: getSetTextFunc, default: 'V' },
    Flame: { type: 'custom', html: '<input type="text" maxlength="1" />', set: getSetTextFunc, get: getSetTextFunc, default: 'F' },
    Scroll_Top: { type: 'custom', html: '<input type="text" maxlength="1" />', set: getSetTextFunc, get: getSetTextFunc, default: 'H' },

    Modal_Dimensions: {
      label: 'Modal Dim CSS',
      type: 'custom',
      html: `
        <label for="Modal_Width">W:</label>
        <input id="Modal_Width" type="text" style="width: 100px" />
        <label for="Modal_Height">H:</label>
        <input id="Modal_Height" type="text" style="width: 100px" />`,
      set: (values, parent) => {
        const [width, height] = values;
        parent.querySelector('#Modal_Width').value = width;
        parent.querySelector('#Modal_Height').value = height;
      },
      get: (parent) => {
        return [parent.querySelector('#Modal_Width').value, parent.querySelector('#Modal_Height').value];
      },
      default: ['512px', '80vh'] // Default values for width and height
    },

    Save_Raw_Text: { type: 'checkbox', default: false },
    Fix_Actions: { type: 'checkbox', default: false },
    Do_Action_Verb: { type: 'text', default: null },

    Default_SC_Notes: { type: 'text', default: 'Unused.' },

    'Delimiter Settings': {
      type: 'custom',
      html: 'Customize delimiters for Story Card insertion.',
      set: dummy, get: dummy,
      default: 'Customize delimiters for Story Card insertion.'
    },
    Delimiter_Start: { type: 'text', default: '{ Story Card: ' },
    Delimiter_End: { type: 'text', default: ' }' }
  }
});

const actionArray = [
  { name: 'Take_Turn', type: 'Command', 'aria-Label': 'Command: take a turn', active: ["/play"] },
  { name: 'Continue', type: 'Command', 'aria-Label': 'Command: continue', active: ["/play"] },
  { name: 'Retry', type: 'Command', 'aria-Label': 'Command: retry', active: ["/play"] },
  { name: 'Retry_History', type: 'History', 'aria-Label': 'Retry history', active: ["/play"] },
  { name: 'Erase', type: 'Command', 'aria-Label': 'Command: erase', active: ["/play"] },
  { name: 'Do', type: 'Mode', 'aria-Label': "Set to 'Do' mode", active: ["/play"] },
  { name: 'Say', type: 'Mode', 'aria-Label': "Set to 'Say' mode", active: ["/play"] },
  { name: 'Story', type: 'Mode', 'aria-Label': "Set to 'Story' mode", active: ["/play"] },
  { name: 'See', type: 'Mode', 'aria-Label': "Set to 'See' mode", active: ["/play"] },
  { name: 'Flame', type: 'Command', 'aria-Label': 'Game Menu', active: ["/play"] },
  { name: 'User_Name', type: 'User_Name', 'aria-Label': 'Game Menu', active: ["/play"] },
  { name: 'Scroll_Top', type: 'Scroll_Top', 'aria-Label': 'Scroll to top', active: ["/play"] },
  { name: 'User_Profile', type: 'User_Profile', 'aria-Label': 'Game Menu', active: ["/play", "/profile/", "/scenario/", "/adventure/"] },
  { name: 'Continue_Adventure', type: 'Continue_Adventure', 'aria-Label': 'Play', active: ["/profile/", "/scenario/", "/adventure/"] },
  { name: 'Toggle_Site', type: 'Toggle_Site', 'aria-Label': 'Toggle Site', active: ["play.aidungeon.com", "beta.aidungeon.com"] }
];

const actionKeys = actionArray.map((action) => cfg.get(action.name));
// Modified handleKeyPress function

const isMac = window.navigator.userAgentData?.platform?.toLowerCase().includes('mac');

const handleKeyPress = (e) => {
  if (e.repeat) return;
  const key = e.key.toUpperCase();

  //const modifiers = ['ALT', 'CTRL', 'SHIFT'].map((mod) => e[`${mod.toLowerCase()}Key`]);

  const modifiers = ['ALT', 'CTRL', 'SHIFT'].map((mod) => {
    // For Mac, use Cmd instead of Ctrl
    return (mod === 'CTRL' && isMac) ? e.metaKey : e[`${mod.toLowerCase()}Key`];
  });

  const modifsActive = modifiers.every((value, index) => value === cfg.get('Modifier_Keys')[index]);
  const index = actionKeys.indexOf(key);
  if (modifsActive && index !== -1) {
    const action = actionArray[index];
    let isPageActive = false;
    const fullURL = window.location.href;

    // Determine if the current page is active based on the action's "active" property
    if (Array.isArray(action.active)) {
      // Array of strings: check if pathname includes any of the strings
      isPageActive = action.active.some(path => fullURL.includes(path));
    } else if (action.active instanceof RegExp) {
      // Regular expression: check if pathname matches the regex
      isPageActive = action.active.test(fullURL);
    } else if (typeof action.active === 'function') {
      // Function: call the function to determine if the page is active
      isPageActive = action.active(fullURL);
    } else {
      console.warn("Invalid 'active' property type for action:", action.name);
    }
    if (isPageActive) {
      e.preventDefault();
      e.stopPropagation();
      const targetElem = `[aria-label="${action['aria-Label']}"]`;

      if ($("[aria-label='Close text input']").length) $("[aria-label='Close text input']").click();
      if (action.type === 'Command') setTimeout(() => $(targetElem).click(), 50);
      else if (action.type === 'Mode') delayedClicks([() => $('[aria-label="Command: take a turn"]').click(), () => $('[aria-label="Change input mode"]').click(), () => $(targetElem).click()]);
      else if (action.type === 'History' && $('[aria-label="Retry history"]').length) setTimeout(() => $(targetElem).click(), 50);
      else if (action.type === 'User_Profile') {
        if (window.location.pathname.includes('/play')) {
          delayedClicks([
            () => $('[role="button"][aria-label="Game Menu"]').click(),
            () => $('[role="button"][aria-label^="View"][aria-label$="profile"]').click()
          ]);
        } else {
          delayedClicks([
            () => $('[role="button"][aria-label="User Menu"]').click(),
            () => $('[role="button"][aria-label="My Stuff/Profile"]').click()
          ]);
        }
      }
      else if (action.type === 'Continue_Adventure') {
        console.log("Got continue Adventure");
        delayedClicks([
          () => $('[role="button"][aria-label="Play"]').click(),
          () => $('[role="button"][aria-label="Continue Adventure"]').click()
        ]);
      }
      else if (action.type === 'User_Name') {
        document.addEventListener('forceFocus', (event) => {
          //.log("Got custome forced event.");
          event.target.focus(); // Focus on the target of the event (the input field)
        });
        delayedClicks([
          () => $('[role="button"][aria-label="Game Menu"]').click(),
          () => $('[role="button"][aria-label="Open player menu"]').click(),
          () => $('[role="button"][aria-label="Edit Character Name"]').click(),
          //() => $('input#flameplayername').click(), // Doesn't work.
          //() => $('input#flameplayername').trigger('click'), // Doesn't work.
          () => $('input#flameplayername').focus()
        ]
        );
      }
      else if (action.type === 'Toggle_Site') {
        const currentURL = window.location.href;
        console.log("Got Site Toggle: ", currentURL);
        const betaSite = 'beta.aidungeon.com';
        const playSite = 'play.aidungeon.com';
        const newURL = currentURL.includes(betaSite) ? currentURL.replace(betaSite, playSite) : currentURL.replace(playSite, betaSite);
        console.log("Got Site Toggle: ", newURL);
        window.location.href = newURL;
      } // End action.type
      else if (action.type === 'Scroll_Top') {
        console.log("Got scroll cmd.");
        const scrollContainer = document.querySelector('div#__next div.is_ScrollView'); // Find the scrollable container
        if (scrollContainer) {
          let previousScrollHeight = scrollContainer.scrollHeight;
          let attempts = 0;
          const maxAttempts = 200; // Adjust as needed
          const timeout = 5000; // 5 seconds timeout (adjust as needed)
          let startTime = Date.now();

          function simulateScroll() {
            // Simulate pressing Home
            const homeEvent = new KeyboardEvent('keydown', { key: 'Home' });
            scrollContainer.dispatchEvent(homeEvent);

            setTimeout(() => {
              if (scrollContainer.scrollTop === 0 || Date.now() - startTime > timeout) {
                console.log("Reached the top or timeout.");
                return; // Stop the loop
              }

              if (scrollContainer.scrollHeight > previousScrollHeight) {
                previousScrollHeight = scrollContainer.scrollHeight;
                attempts = 0; // Reset attempts if new content is loaded

                // Simulate pressing Page Down
                const pageDownEvent = new KeyboardEvent('keydown', { key: 'PageDown' });
                scrollContainer.dispatchEvent(pageDownEvent);
              }

              if (attempts < maxAttempts) {
                attempts++;
                simulateScroll(); // Continue the loop
              } else {
                console.log("Max attempts reached. Stopping.");
              }
            }, 200); // Adjust delay as needed
          }

          simulateScroll();
        } else {
          console.warn("Scroll container not found.");
        }
      }

    } // End isPageActive

  }
  const selectKeys = ['ARROWLEFT', 'ENTER', 'ARROWRIGHT'];
  if (selectKeys.includes(key) && $('[role="dialog"]').length) {
    setTimeout(() => $("[role='dialog']").find("[role='button']")[selectKeys.indexOf(key)].click(), 50);
  }
};
/*
const delayedClicks = (clicks, i = 0) => {
  if (i < clicks.length) {
    setTimeout(() => {
      clicks[i]();
      delayedClicks(clicks, i + 1);
    }, 50);
  }
};
*/
const delayedClicks = (clicks, i = 0) => {
  if (i < clicks.length) {
    requestAnimationFrame(() => {
      clicks[i]();
      delayedClicks(clicks, i + 1);
    });
  }
};

class DOMObserver {
  constructor(callback, targetNode, options, startImmediately = false) {
    this.observer = new MutationObserver(callback);
    this.targetNode = targetNode;
    this.options = options;

    if (startImmediately) {
      this.observe();
    }
  }

  destroy() {
    this.disconnect();
    this.observer = null;
    this.targetNode = null;
    this.options = null;
  }

  observe(targetNode = this.targetNode, options = this.options) {
    if (this.observer && targetNode && targetNode.nodeType === Node.ELEMENT_NODE) { // Ensure targetNode is an Element
      this.observer.observe(targetNode, options);
    } else {
      console.warn("Target node is not a valid element:", targetNode); // For debugging
    }
  }
  disconnect() {
    if (this.observer !== null) {
      this.observer.disconnect();
    }
  }

  takeRecords() {
    return this.observer ? this.observer.takeRecords() : []; // Return empty array if observer is null
  }

  get isConnected() {
    return this.observer && this.observer.isConnected(); // Check if observer exists and is connected
  }
}

GM_addStyle(`
  .css-11aywtz,._dsp_contents {
      user-select: text !important;
  }
`);

const modalDimensions = cfg.get('Modal_Dimensions');
let [modalWidthCfg, modalHeightCfg] = modalDimensions;

GM_addStyle(`
  /* This is nested CSS, it mostly mirrors the AID site. */
  div#__next > div > span,
  div#__next > div > span > span {
    & > div._dsp-flex:nth-child(1) { /* Home screen. */ }
    & > div._dsp-flex:nth-child(2) { /* Play. */
      & > div.css-175oi2r:nth-child(1) { /* Game Window. */
        & > div[role="toolbar"][aria-label="Navigation bar" i] {
          opacity: 1 !important;
        }
        & > div.game-text-mask { /* The game log. */
          /* Make the mask just under the Nav Bar as a solid opaque block. */
          -webkit-mask-image: linear-gradient(to bottom, transparent calc(var(--navbar-height) * 1.1), black calc(var(--navbar-height) * 1.1)) !important;
          mask-image: linear-gradient(to bottom, transparent calc(var(--navbar-height) * 1.1), black calc(var(--navbar-height) * 1.1)) !important;
          &.off { /* Turn off the mask. */
            -webkit-mask-image: linear-gradient(rgba(0,0,0,0),#000 0%,#000 100%,rgba(0,0,0,0)) !important;
            mask-image: linear-gradient(rgba(0,0,0,0),#000 0%,#000 100%,rgba(0,0,0,0)) !important;
          }
        }
        & > div.css-175oi2r { /* Action Entry Area. */
        }
      }
      & > div._dsp-flex:nth-child(2) { /* Gear 1 Menu. Box + Padding. */
        & .r-2eszeu { scrollbar-width: 8px !important; }
        & > div.css-175oi2r:only-child { /* Gear 2 Menu. Flex + overflow + border. */
          & > div.is_Column:only-child { /* Gear 3 Menu. Column setup. */
            & ._gap-1481558307 { gap: 8px !important; }
            & ._gap-1481558369 { gap: 8px !important; }
            & ._gap-1481558338 { gap: 8px !important; }

            & ._pl-1316335167 { padding-left: 8px !important; }
            & ._pr-1316335167 { padding-right: 8px !important; }
            & ._pt-1316335167 { padding-top: 8px !important; }
            & ._pb-1316335167 { padding-bottom: 8px !important; }

            & ._pl-1481558338 { padding-left: 8px !important; }
            & ._pr-1481558338 { padding-right: 8px !important; }
            & ._pt-1481558338 { padding-top: 8px !important; }
            & ._pb-1481558338 { padding-bottom: 8px !important; }

            & ._pl-1481558307 { padding-left: 8px !important; }
            & ._pr-1481558307 { padding-right: 8px !important; }
            & ._pt-1481558307 { padding-top: 8px !important; }
            & ._pb-1481558307 { padding-bottom: 8px !important; }

            & ._ml-1481558338 { margin-left: 0px !important; }
            & ._ml-1481558369 { margin-left: 0px !important; }

            & > div.is_Column:nth-child(1) { /***************** Gear Header. *****************/
              & > div.is_Row:only-child {

                & > div[role="tablist"].is_Row:nth-child(1) {
                  & > span:nth-child(1) > div[role="tab"].is_Button:only-child {  /* Adventure Tab */
                    & > div._dsp-flex:nth-child(1) {
                      & > p:only-child { /* w_scroll */ }
                    }
                    & > span.is_ButtonText:nth-child(2) { /* Adventure Tab Button Text*/ }
                  }
                  & > span:nth-child(2) > div[role="tab"].is_Button:only-child {  /* Gameplay Tab */
                    & > div._dsp-flex:nth-child(1) {
                      p:only-child { /* w_controller */ }
                    }
                    & > span.is_ButtonText:nth-child(2) { /* Gameplay Tab Button Text*/ }
                  }
                }
                & > span:nth-child(2) {
                  & > div[role="button"][aria-label="Close settings i"]:only-child { /* Gear Close */
                  }
                }
              }
            }
            & > div.css-175oi2r:nth-child(2) { /***************** Gear Content Mount - Gameplay. *****************/
              & > div.css-175oi2r:only-child { /* Gear Content 2 - Gameplay. */
                & > div.is_Column:only-child { /* Gear Content 3 - Gameplay. */
                  & > div.is_Column:nth-child(1) { /* Gear Content 4 - Gameplay. */
                    & > div.css-175oi2r:nth-child(1) { /* Pill Menu and Pill Content */

                      & ._h-606181883 { height: var(--size-4); }

                      & > div._dsp-flex:nth-child(1) {  /* PILL Button Menu Outer container */

                        /* Styles for the outer container */

                        & > div:nth-child(1) { /* Pill Menu Width for scrollers. */
                          margin-left: 0px !important;
                          width: 100% !important;

                          & > div[role="tablist"]:only-child { /* The Pills. */
                            & > div.css-175oi2r:only-child {
                              & > div.css-175oi2r:nth-child(1) {
                                display: none; /* Space for the scroll button */
                              }
                              & > div.is_Row._dsp-flex:nth-child(2) {
                                &  > span {
                                /* Styles for each tab */
                                  & > div[role="tab"]:only-child {
                                  /* Styles for the div within each tab */
                                  }
                                }
                              }
                              & > div.css-175oi2r:nth-child(3) {
                                display: none; /* Space for the scroll button */
                              }
                            }
                          }

                        }
                        & > div.r-633pao {
                            /* Off the Scroll button and containers. */
                            display: none;
                          & > .r-633pao > span > [role="button"] {
                            display: none;
                          }
                        }
                      }
                      & > div._dsp-flex:nth-child(2) {
                        /* This is a little Padding after the pill menu. */
                        max-height: 8px !important;
                      }
                      & > div.is_Column._dsp-flex:nth-child(3) {
                        /* The actual content for each PILL lives here:
                           AI MODELS and APPEARANCE.
                        */
                      }
                    }
                    & > div._dsp-flex:nth-child(2) {
                      height: 8px !important; /*Looks like pad.*/
                    }
                  }
                  & > div._dsp-flex:nth-child(2) { /* Looks like pad. */ }
                }
              }
            }
            & > div.is_Column:nth-child(2) { /***************** Gear Content Mount - Adventure. *****************/
              /* PILL MENU
              & > div.is_Row:nth-child(1) {
                padding-left: 0px !important;
                padding-right: 0px !important;
              }*/
              max-height: 100% !important;
              padding-left: 8px !important;
              padding-right: 8px !important;

              & .r-150rngu { -webkit-overflow-scrolling: touch; }

              /* Pill Container */
              & > div.is_Row._dsp-flex:nth-child(1) {
                & > div._dsp-flex:nth-child(1) {
                  & > div:has(div[role="tablist"][aria-label="Section Tabs" i]) {
                    margin: 0px !important;
                    padding: 0px !important;
                    width: 100% !important;
                    max-width: 100% !important;
                    & ._pl-1316335167 { padding-left: 8px !important; }
                    & ._pr-1316335167 { padding-right: 8px !important; }
                    & > div[role="tablist"][aria-label="Section Tabs" i].css-175oi2r:nth-child(1) {
                      & > div.css-175oi2r.r-18u37iz:only-child {
                        & ._gap-1481558369 { gap: 8px !important; }
                        & > div.css-175oi2r:nth-child(1) {
                          display: none !important;
                        }
                        & > div.is_Row._dsp-flex:nth-child(2) {
                          & > span {
                            & > div[role="tab"].is_Button {
                              & > div._dsp-flex:nth-child(1) {
                                & > p:only-child {
                                }
                              }
                              & > span:nth-child(2) {
                                & > p:only-child {
                                }
                              }
                            }
                          }
                        }
                        & > div.css-175oi2r:nth-child(3) {
                          display: none !important;
                        }
                      }
                    }
                    & > div[aria-hidden="false"].css-175oi2r.r-633pao:nth-child(2) {
                      display: none !important;
                      & > div.css-175oi2r.r-633pao:only-child {
                        & > span:only-child > div[role="button"][aria-label="scroll right" i]:only-child {
                          & > div._dsp-flex:only-child {
                            & > p[area-hidden="false"] {
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }

              & > div:nth-child(2):empty { /* A Gap (not in alpha.)*/
              }
              /*********** PLOT ***********/
              & > div[aria-hidden="false"]._dsp-flex:nth-child(3), /* Beta/prod */
              & > div.is_Column:nth-child(2) > div.is_Column:only-child > div[aria-hidden="false"] { /* alpha */
                max-height: 100% !important;
                margin-left: 0px !important;
                margin-right: 0px !important;
                overflow-y: auto !important;
                & > div.css-175oi2r:only-child {
                  max-height: 100% !important;
                  padding-bottom: 15px !important;
                  & > div.css-175oi2r:only-child {
                    /* The individual styles for the plot menus would go here. */
                  }
                }
              }
              /*********** STORY CARDS LIST ***********/
              & > div._dsp-flex:nth-child(4):has(+ :nth-child(5)), /* Beta/prod */
              & > div.is_Column:nth-child(2) > div.is_Column:only-child > div._dsp-flex:nth-child(2):has(+ :nth-child(3)) { /* alpha */
                  max-width: 100% !important;
                & > div.css-175oi2r {
                  & > div.css-175oi2r {
                    & > div.css-175oi2r {
                      padding-left: 0px !important;
                      padding-right: 0px !important;
                      & > div.css-175oi2r:nth-child(1) {
                        & > div.css-175oi2r:nth-child(1) { } /* Spacer. */
                        & > div.css-175oi2r:nth-child(2) { } /* Search and Filter */
                        & > div.css-175oi2r:nth-child(3) { /* Story Card List. */
                          width: 100% !important;
                          & > * {
                            max-width: 100% !important;
                            width: 100% !important;
                          }
                          & > * [role="button" i] {
                            margin-right: 0px !important;
                            align-items: center !important;
                            height: unset !important;
                            max-height: unset !important;
                          }
                        }
                        & > div.css-175oi2r:nth-child(4) { } /* Spacer. */
                        & > div.css-175oi2r:nth-child(5) { /* Bottom Padding */
                          padding-bottom: 100px !important;
                        }
                      }
                    }
                  }
                }
              }
              /*********** DETAILS ***********/
              & > div[aria-hidden="false"]._dsp-flex:last-child, /* Beta/prod */
              & > div.is_Column:nth-child(2) > div.is_Column:only-child > div[aria-hidden="false"]._dsp-flex:last-child { /* alpha */
                  max-height: 100% !important;
                ._pl-1481558338 { padding-left: 8px !important; }
                ._pr-1481558338 { padding-right: 8px !important; }
                ._pl-1481558307 { padding-left: 8px !important; }
                ._pr-1481558307 { padding-right: 8px !important; }
                ._ml-1481558338 { margin-left: 0px !important; }
                ._gap-1481558369 {
                  row-gap: 8px !important;
                  column-gap: 8px !important;
                }
                ._gap-1481558338 {
                  row-gap: 8px !important;
                  column-gap: 8px !important;
                }
                & > div.css-175oi2r {
                  padding-bottom: 0px !important;
                  & > div.css-175oi2r {
                    & > div.is_Column:nth-child(1) {
                      & > div.is_Column {
                        & > div.is_Column {
                          & > div.is_Column:nth-child(1) { /* Title, Desc, and Tags. */
                            & > div.is_Column:nth-child(1) { /* The Adventure Image. */
                            }
                            & > div.is_Column:nth-child(2) { /* Title */
                              padding-left: 8px !important;
                              padding-right: 8px !important;
                            }
                            & > div.is_Column:nth-child(3) { /* Desc */
                              padding-left: 8px !important;
                              padding-right: 8px !important;
                            }
                            & > div.is_Column:nth-child(4) { /* Tags */
                              padding-left: 0px !important;
                              padding-right: 0px !important;
                              margin-left: 0px !important;
                              margin-right: 0px !important;
                            }
                          }
                          & > div.is_Column:nth-child(2) { /* Visibility and Content Rating. */
                            & > div.is_Column:nth-child(1) {
                              margin-left: 8px !important;
                              margin-right: 8px !important;
                            }
                            & > div.is_Column:nth-child(2) {
                              margin-left: 8px !important;
                              margin-right: 8px !important;
                            }
                          }
                          & > div.is_Column:nth-child(3) {  /* Story Card Management. */
                            padding-bottom: 8px !important;
                          }
                        }
                      }
                      & > div._dsp-flex {
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }

  div[id^="modalNodeTree_ScenarioAdventureEditor_TS" i] {
    & div[role="alertdialog"][aria-label*="Modal"] {
      flex-grow: 0 !important;
      flex-shrink: 1 !important;
      & > div[id^="modalHeader_TS" i] {
        flex-grow: 0 !important;
        flex-shrink: 0 !important;
        & > div[id^="modalHeader_Title_TS" i] {
          flex-grow: 1 !important;
        }
        & > div[id^="modalHeader_Menu_TS" i] {
          flex-grow: 1 !important;
        }
      }
      & > div[id^="modalContent_TS" i] {
        flex-shrink: 1 !important;
        flex-grow: 1 !important;
        & > div[id^="modalContent_Inner" i] {
          & > div[id^="modalContent_Inner_detailsTab" i] {
            & > div:only-child {
                & > div:nth-child(1) {
                  & > div:nth-child(1) {
                    padding: 0px !important;
                    gap: 4px !important;
                  }
              }
            }
          }
        }
      }
    }
  }
            /*
                & div:nth-child(1) {
                  resize: vertical !important;
                  max-height: 100% !important;
                  max-width: 100% !important;
                  overflow: auto !important;
                  flex-grow: 1 !important; 
                  & > div:nth-child(2) { 
                    flex-grow: 1 !important; 
                    & > img[alt="Content Image" i][data-nimg="fill"] { 
                      object-fit: contain !important;
                    }
                  }
                }
            */

                    /*
                    & > div:nth-child(1) {
                      resize: vertical !important;
                      max-height: 100% !important;
                      max-width: 100% !important;
                      overflow: auto !important;
                      flex-grow: 1 !important; 
                      & > div:nth-child(2) { /*Img container.*/
                        flex-grow: 1 !important; 
                        & img[data-nimg="fill"] { 
                          object-fit: contain !important;
                        }
                      }
                    }
                    */

div.bung {
  > div {
    > img[alt="Content Image" i][data-nimg="fill"] {
      /* Styles for the image */
      object-fit: contain !important;

      & + * { 
        /* Styles for the image's immediate siblings */
      }
    }

    &:has(img[alt="Content Image" i][data-nimg="fill"]) { 
      /* Styles for the parent div if it has the image as a descendant */
      flex-grow: 1 !important; 
    }
  }

  &:has(div:has(img[alt="Content Image" i][data-nimg="fill"])) { 
    /* Styles for the grandparent div if it has the image as a descendant */
    resize: vertical !important;
    max-height: 100% !important;
    max-width: 100% !important;
    overflow: auto !important;
    flex-grow: 1 !important; 
  }
}
div.is_Column:has(> div:nth-child(2) > img[alt="Content Image" i][data-nimg="fill"]) {
    flex-grow: 1 !important;
    max-height: 100% !important;
    max-width: 100% !important;
    overflow: auto !important;
    resize: vertical !important;
    margin: 0px !important;

    & > div:nth-child(2):has(img[alt="Content Image" i][data-nimg="fill"]) {
        /* Styles for the child div (optional) */

        & > img[alt="Content Image" i][data-nimg="fill"] {
            object-fit: contain !important;
        }
    }
}
  div[id^="modalNodeTree_ViewContext_TS" i] {
    & div[role="alertdialog"][aria-label*="Modal"] {
      flex-grow: 0;
      flex-shrink: 1;
      & div[id^="modalHeader_TS" i] {
        & div[id^="modalHeader_Title_TS" i] {
          flex-grow: 1 !important;
          flex-shrink: 1 !important;
        }
      }
      & div[id^="modalContent_TS" i] {
        /* height: min-content !important; */
        flex-grow: 1 !important;
        flex-shrink: 1 !important;
        padding: 8px !important;
        padding-top: 0px !important;
        padding-bottom: 0px !important;
        & div.is_ScrollView[id^="modalContent_Inner_TS" i] {
          /* height: unset !important; /* */
          /* width: unset !important; /* */
          flex-grow: 1 !important;
          & > div:only-child {
            & > div:only-child {
              & > div.is_Column:only-child {
                padding: 0px !important;
                flex-grow: 1 !important;
              }
            }
          }
        }
      }
      & div[id^="modalFooter_TS" i] {
        min-height: 60px !important;
      }
    }
  }
  div[id^="modalNodeTree_ImageOptions_TS" i] {
    & div[role="alertdialog"][aria-label*="Modal"] {
      flex-grow: 0;
      flex-shrink: 1;
      & div[id^="modalHeader_TS" i] {
        align-items: center !important;
        & div[id^="modalHeader_Title_TS" i] {
          padding: 0px !important;
          align-items: center !important;
          flex-grow: 1 !important;
          flex-shrink: 1 !important;
        }
      }
      & div[id^="modalContent_TS" i] {
        /* height: min-content !important; */
        flex-grow: 1 !important;
        flex-shrink: 1 !important;
        padding-left: 8px !important;
        padding-right: 8px !important;
        padding-top: 0px !important;
        padding-bottom: 0px !important;
        & div[id^="modalContent_Inner_TS" i] {
          /* height: unset !important; /* */
          /* width: unset !important; /* */
          flex-grow: 1 !important;
          & > div:only-child {
            flex-grow: 1 !important;
            & > div:only-child {
              flex-grow: 1 !important;
              & > div.is_Column:only-child {
                gap: 8px !important;
                padding: 0px !important;
                flex-grow: 1 !important;
                & > div:nth-child(1) {
                  padding: 0px !important;
                  padding-top: 8px !important;
                  flex-grow: 1 !important;
                  & > img[data-nimg="fill"] { /* Or a more specific selector if needed */
                    object-fit: contain !important;
                  }
                }
                & > div:nth-child(2) {
                  padding: 0px !important;
                  flex-grow: 0 !important;
                }
                & > div:nth-child(3) {
                  margin: 0px !important;
                  flex-grow: 0 !important;
                }
              }
            }
          }
        }
      }
      & div[id^="modalFooter_TS" i] {
        min-height: 60px !important;
        padding: 8px !important;
      }
    }
  }

  div[id^="modalNodeTree_MemoryViewer_TS" i],
  div[id^="modalNodeTree_TokenViewer_TS" i] {
    & ._maw-480px { max-width: unset !important; }
    & ._mah-d0t385478457 { max-height: unset !important; }
    & ._mah-d0t1791064059 { max-height: unset !important; }
    & div[role="alertdialog"][aria-label*="Modal"] {
      max-width: 100% !important;
      max-height: 100% !important;
      overflow: hidden !important;
      overflow-y: hidden !important;
      & > div[id^="modalNodeInner_TS" i]:only-child {
        flex-grow: 1 !important;
        flex-shrink: 1 !important;
        overflow: hidden !important;
        & > div[id^="modalHeader_TS" i] {
          & > div[id^="modalHeader_Title_TS" i] {
            flex-grow: 1 !important;
            & > div > span {
              display: flex !important;
              gap: 10px !important;
            }
          }
        }
        & > div[id^="modalContent_TS" i] {
          flex-grow: 1 !important;
          overflow: hidden !important;
          padding-left: 8px !important;
          padding-top: 8px !important;
          padding-bottom: 8px !important;
          padding-right: 0px !important;
          flex-shrink: 1 !important;
          scrollbar-gutter: stable !important;
          & > span > div[id^="modalContent_Inner_TS" i]:nth-child(1),
          & > div[id^="modalContent_Inner_TS" i]:nth-child(1) {
            flex-grow: 1 !important;
            overflow-y: auto !important;
            flex-shrink: 1 !important;
            padding: 0px !important;
            flex-shrink: 1 !important;
            & > span._dsp_contents {
              & > div:only-child {
                flex-grow: 1 !important;
                padding: 0px !important;
                overflow: unset !important;
                flex-shrink: 1 !important;
              }
            }
            & > div > span > span > textarea {
              /*height: unset !important;*/
              max-height: unset !important;
              flex-grow: 1 !important;
              padding: 0px !important;
              overflow: unset !important;
              flex-shrink: 1 !important;
            }
          }
        }
      }
    }
  }

  /* This turns off the background mask for all modals so that game play text is visible during modal editing. */
  body > div[id^="modalNodeTree_"] > span > span > div > button {
    opacity: 0 !important;
  }


  /* This is the fix for the script editor */
  div[id*="ScriptEditor_TS" i] div[role="alertdialog"][aria-label*="Modal"] {
    flex-grow: 1;

    & div[id*="modalHeader_TS" i] {
      padding-bottom: 0px !important;
    }
    & div[id*="modalContent_TS" i] {
      flex-grow: 1 !important;
      & div[id*="modalContent_Inner_TS" i] {
        padding: 8px !important;
        padding-left: 0px !important;
      }
    }
  }

  div[role="alertdialog"][aria-label*="Modal" i] {
    /* flex-grow: 1 !important; /* */

    resize: both !important;
    overflow: hidden !important;
    position: absolute !important;

    padding: 0px !important;
    margin: 0px !important;
    border-bottom-right-radius: 0px !important;

  }
  div[aria-label="Story Card Edit Modal"] {
    & input._h-606181821 { height: var(--size-6); }
    & div[id^="modalContent_Inner_detailsTab_TS"] {
      gap: 4px !important;
    }
  }
  /* These classes must be overridden to get the square corner. */
  ._bbrr-1307609874 {
    border-bottom-right-radius: 0px !important;
  }
  ._bbrr-1881205710 {
    border-bottom-right-radius: 0px !important;
  }
  /* Tweak the padding for modals.
  div[id^="modalHeader_" i]:not(:only-child) {
    padding: 0px !important;
    flex-grow: 0 !important;
    border-bottom-style: solid !important;
    border-bottom-width: 1px !important;
    border-bottom-color: var(--color-61) !important;
  }
  */
  div[id^="modalHeader_TS" i] {
    & ._h-137px { height: unset !important; }
    & ._gap-1481558338 {
      row-gap: 0px !important;
      column-gap: 0px !important;
    }
    align-items: unset !important;
    flex-grow: 0 !important;
    gap: 0px !important;
    padding: 8px !important;
    height: unset !important;
    border-bottom-width: 1px !important;
    border-bottom-color: var(--color-61) !important;
    border-bottom-style: solid !important;
  }

  div[id^="modalHeader_Title_TS" i] {
    padding: 0px !important;
    padding-bottom: 8px !important;
    flex-grow: 0 !important;
    border-bottom-width: 0px !important;
    width: unset !important;
    min-width: 0 !important;
    max-width: 100% !important;
  }
  div[id^="modalHeader_Menu_TS" i] {
    padding: 0px !important;
    flex-grow: 0 !important;
    border-bottom-width: 0px !important;
  }
  div[id^="modalContent_TS" i] {
    flex-grow: 1 !important;
    max-height: 100% !important;
    margin: 0px !important;
    padding-bottom: 8px !important;
    padding-top: 8px !important;
    padding-left: 8px !important;
    padding-right: 8px !important;
    scrollbar-gutter: stable !important;
    min-height: 0px !important;
    overflow-y: auto !important;
    overflow-x: hidden !important;

    width: unset !important;
    max-width: unset !important;
    min-width: unset !important;
    /*  height: unset !important; */
    max-height: unset !important;
    min-height: unset !important;

    ._miw-420px { width: unset !important; }
    ._maw-420px { width: unset !important; }

    & > div:only-child {
      flex-grow: 1 !important;
    }
  }
  div[id^="modalContent_TS" i] p[role="heading"] {
    padding-left: 0px !important;
    padding-right: 0px !important;
    margin-left: 0px !important;
    margin-right: 0px !important;
  }
  div[id^="modalContent_TS" i] + div.has(p[role="heading"]) {
    padding-left: 0px !important;
    padding-right: 0px !important;
    margin-left: 0px !important;
    margin-right: 0px !important;
  }
  div[id^="modalContent_TS" i] input {
    padding-left: 8px !important;
    padding-right: 8px !important;
    margin-left: 0px !important;
    margin-right: 0px !important;
  }
  div[id^="modalContent_TS" i] textarea {
    padding-left: 8px !important;
    padding-right: 8px !important;
    margin-left: 0px !important;
    margin-right: 0px !important;
  }
  div[id^="modalContent_Inner_TS" i] {
    padding: 0px !important;
    padding-bottom: 8px !important;
    margin: 0px !important;
    overflow-x: unset !important;
    overflow-y: unset !important;
    /* max-height: 100% !important;
    min-height: 0px !important; */
    max-height: unset !important;
    max-width: unset !important;
    height: unset !important;
    width: unset !important;
    ._miw-420px { width: unset !important; }
    ._maw-420px { width: unset !important; }
  }

  div[id^="modalContent_Inner_TS" i] button[type="button"] {
    padding-left: 8px !important;
    padding-right: 8px !important;
    margin-left: 0px !important;
    margin-right: 0px !important;
  }

  /* Target: every storyCardsTab list of button type with pad or margin left or right */
  div[id^="modalContent_Inner_plotTab_TS" i] {
    ._gap-1481558338 {
      gap: var(--space-1) !important;
    }
    & > div:only-child {
      padding: 0px !important;
      & > div:nth-child(1) {
        padding-bottom: 8px !important;
      }
    }
  }
  div[id^="modalContent_Inner_detailsTab_TS" i] {
    flex-grow: 1 !important;
    padding-bottom: 8px !important;
    /* ._gap-1481558338 { gap: var(--space-1) !important;  } */
    div {
          padding: 0px !important;
    }
    & > div.is_Column:only-child {
      padding: 0px !important;
      padding-bottom: 8px !important;
      & > div.is_Column:nth-child(1) {
        padding: 0px !important;
        & > div.is_Column {
          & > div.is_Column:not(:nth-child(1)) {
            /* Don't pad the image. */
            padding: 8px !important;
          }
          & > div.is_Row {
            padding: 8px !important;
          }
        }
      }
      & > div.is_Column:nth-child(2) {
        padding: 8px !important;
      }
      & > div.is_Column:nth-child(3) {
        padding: 8px !important;
      }
    }
  }
  div[id^="modalContent_Inner_generatorSettingsTab_TS" i] {
    flex-grow: 1 !important;
    padding-bottom: 8px !important;
  }

  div[id^="modalContent_Inner_storyCardsTab_TS" i] {
    ._gap-1481558338 {
      gap: var(--space-1) !important;
    }
    div:only-child > div:only-child {
      padding-bottom: 8px !important;
    }
    & div > div[role="button"] {
      /* A button in a div is the main button */
      padding: 8px !important;
      height: unset !important;
      max-height: unset !important;
      align-items: center !important;
      & span > div[role="button"][aria-label="More" i ] {
        /* A button in a span is the more... button. */
        padding: 0px !important;
      }
    }
  }
/*
  div[id^="modalContent_Inner_storyCardsTab_TS" i] div > div[role="button"] {
    padding: 8px !important;
    height: unset !important;
    max-height: unset !important;
    align-items: center !important;
    & span > div[role="button"] {
      padding: 0px !important;
    }
  }
    */
  div[id^="modalContent_Inner_storyCardsTab_TS" i] div[role="button"]._pl-1481558338 {
    padding-left: 0px !important;
  }
  div[id^="modalContent_Inner_storyCardsTab_TS" i] div[role="button"]._pr-1481558338 {
    padding-right: 0px !important;
  }
  div[id^="modalContent_Inner_storyCardsTab_TS" i] div[role="button"]._mr-1481558369 {
    margin: 0px !important;
  }
  div[id^="modalContent_Inner_storyCardsTab_TS" i] > div > div {
    padding-left: 0px !important;
    padding-right: 0px !important;
    margin-left: 0px !important;
    margin-right: 0px !important;
  }
  div[id^="modalContent_Inner_storyCardsTab_TS" i] > div > div > div > div:nth-child(3) {
    width: 100% !important;
  }
  div[id^="modalContent_Inner_storyCardsTab_TS" i] > div > div > div > div:nth-child(3) > * {
    width: 100% !important;
  }
  div[id^="modalContent_Inner_storyCardsTab_TS" i] > div > div > div > div:nth-child(5) {
    padding-bottom: 0px !important;
  }
  div[id^="modalContent_Inner_StoryCardEditor_TS" i] {
    padding-bottom: 8px !important;
  }


  /* Chrome/Opera Fatten up the scroll bar a bit. This also fixes textarea resize icon. */
  ::-webkit-scrollbar {
    width: 8px !important;
  }

  /* Put vertical resizers on all textareas. */
  textarea:not([aria-label="Text input field" i], [aria-label="Edit memory input" i], #game-text-input, #shadow-box) {
    min-height: 50px !important;  /* Or min-height: 0; */
    max-height: unset !important;
    maxlength: 1000000 !important;
    resize: vertical !important;
    overflow-y: auto !important;
    scrollbar-gutter: stable !important;
    /* This doesn't work the class is overriding it. */
    border-bottom-right-radius: 0px !important;
    /* None of these appear to do anything in chrome (maybe for Mozilla): */
    --scrollbar-width: 8px !important;
    color-scheme: dark !important;
    --vh: 11.76px !important;
  }
  /* Put vertical resizers on all textareas. */
  textarea[aria-label="Notes" i] {
    min-height: 50px !important;  /* Or min-height: 0; */
    max-height: unset !important;
    maxlength: 1000000 !important;
    resize: vertical !important;
    overflow-y: auto !important;
    scrollbar-gutter: stable !important;
    /* This doesn't work the class is overriding it. */
    border-bottom-right-radius: 0px !important;
    /* None of these appear to do anything in chrome (maybe for Mozilla): */
    --scrollbar-width: 8px !important;
    color-scheme: dark !important;
    --vh: 11.76px !important;
  }
  /* Experiments with offing the dimming gradient.
  .game-text-mask {
    transition: mask-position .3s ease, -webkit-mask-position .3s ease !important;
    -webkit-mask-image: linear-gradient(rgba(0, 0, 0, 0.5) 0%, rgba(0, 0, 0, 0.5) 100%) !important;
    mask-image: linear-gradient(rgba(0, 0, 0, 0.5) 0%, rgba(0, 0, 0, 0.5) 100%) !important;
    -webkit-mask-size: 100% 100% !important;
    mask-size: 100% 100% !important;
  }
  .game-text-mask {
    transition: mask-position .3s ease, mask-size .3s ease;
    -webkit-mask-image: linear-gradient(transparent, rgba(0, 0, 0, 0) 10%, #000 20%, #000);
    mask-image: linear-gradient(transparent, rgba(0, 0, 0, 0) 10%, #000 20%, #000);
    -webkit-mask-size: 100% 100%;
    mask-size: 100% 100%;
  }
  */
`);

// Clean up the the prompt area to make more efficient.
// This is the original code from QoL tool by AliH2K
function handleChanges(mutationsList, observer) {
  for (const mutation of mutationsList) {
    if (!window.location.href.includes('/play')) {
      return; // Exit early if not on a Play page
    }
    const targetNode = mutation.target; // Get the target node from the mutation
    let lastResponse = targetNode?.lastChild?.lastChild;
    if (lastResponse) {
      // Check if the last child exists, is a span, and if it has children
      if (lastResponse.lastChild && lastResponse.children.length > 0 && lastResponse.tagName === 'SPAN') {
        // Check if the last child is an HTMLElement before accessing style
        if (lastResponse.lastChild instanceof HTMLElement) {
          lastResponse.lastChild.style.pointerEvents = 'none'; // Set pointerEvents to none
        } else {
          console.warn("lastResponse.lastChild is not an HTMLElement:", lastResponse.lastChild);
        }
      } else if (lastResponse.lastChild instanceof HTMLElement && lastResponse.lastChild.style.pointerEvents === 'none') {
        lastResponse.lastChild.style.pointerEvents = ''; // Reset pointerEvents if it was set to none
      } else {
        // Handle the case where lastResponse doesn't have a lastChild yet
        const observer = new MutationObserver((mutations) => {
          for (const mutation of mutations) {
            if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
              handleChanges(mutations, observer); // Recursively call handleChanges for the new nodes
              observer.disconnect(); // Stop observing after the child is added
              break;
            }
          }
        });

        observer.observe(lastResponse, { childList: true }); // Observe for changes in childList
      }

      // Check if the first child exists, is not a text node, and the parent is a span
      if (lastResponse.firstChild && lastResponse.firstChild.nodeType !== 3 && lastResponse.tagName === 'SPAN') {
        //if (lastResponse.firstChild.nodeType !== 3 && lastResponse.tagName === 'SPAN') {

        const interval = setInterval(() => {
          const opacity = lastResponse.lastChild instanceof HTMLElement ? getComputedStyle(lastResponse.lastChild).opacity : '1';
          if (opacity === '1') {
            clearInterval(interval);
            const SPANS = Array.from(lastResponse.children);
            let joinedText = '';
            SPANS.forEach((span) => (joinedText += span.textContent));
            while (lastResponse.firstChild && lastResponse.firstChild.nodeType !== 3) lastResponse.removeChild(lastResponse.firstChild);
            if (joinedText.length > 1) lastResponse.textContent = joinedText;
          }
        }, 500);
      }
    }
  }
  // // Apply Custom CSS
  // const customCSS = cfg.get('Custom_CSS');
  // if (customCSS) {
  //   GM_addStyle(customCSS);
  // }
}

//setNativeValue(input, 'foo');
//input.dispatchEvent(new Event('input', { bubbles: true }));

function setNativeValue(element, value) {
  const valueSetter = Object.getOwnPropertyDescriptor(element, 'value').set;
  const prototype = Object.getPrototypeOf(element);
  const prototypeValueSetter = Object.getOwnPropertyDescriptor(prototype, 'value').set;

  if (valueSetter && valueSetter !== prototypeValueSetter) {
    prototypeValueSetter.call(element, value);
  } else {
    valueSetter.call(element, value);
  }
}


const ActionToggleMsgOn = "A+";
const ActionToggleMsgOff = "A-";

let actionsExpanded = null;
let toggleButtonText = null;

GM_addStyle(`
    [aria-label="Story"] .is_Row {
        visibility: visible;
    }
    [aria-label="Adventure content"] .is_Row {
        visibility: visible;
    }
    .actions-hidden .is_Row > * {
        visibility: hidden;
        display: none !important;
    }
    .actions-hidden .is_Row {
        visibility: hidden;
        margin-top: 2.5em !important;
        margin-right: 0 !important;
        margin-bottom: 0 !important;
        margin-left: 0 !important;
        padding: 0 !important;
    }
`);
/*
*/
function setActionVisibility(visible) {
  /* Handle toggling in Play mode. */
  const container = $("[aria-label='Story']");
  if (container) {
    if (visible) {
      container.removeClass("actions-hidden");
    } else {
      container.addClass("actions-hidden");
    }
  }
  /* Handle toggling in read mode. */
  const readContainer = $('[aria-label="Adventure content" i]');
  if (readContainer) {
    if (visible) {
      readContainer.removeClass("actions-hidden");
    } else {
      readContainer.addClass("actions-hidden");
    }

  }

  actionsExpanded = visible;
  sessionStorage.setItem("actionsExpanded", actionsExpanded); // Save state
}

function toggleOnClick(buttonTextElement) {
  actionsExpanded = !actionsExpanded;
  setActionVisibility(actionsExpanded); // Use the set function
  buttonTextElement.innerText = actionsExpanded ? ActionToggleMsgOn : ActionToggleMsgOff;
}

function removeHeightClasses(element) {
  const classList = element.classList; // Get the element's classList

  for (const className of classList) {
    if (className.startsWith('_mih-') || className.startsWith('_mah-')) {
      classList.remove(className);
    }
  }
}

function buttonClone(cloneReference, label, action) {
  if (!cloneReference) {
    console.warn("Null cloneReference in buttonClone!");
    return;
  }
  //console.log("cloneReference: ", cloneReference);

  const clonedElement = cloneReference.cloneNode(true); // Clone the entire reference

  // Determine if the cloned element is a span or a div (button)
  const isSpan = clonedElement.tagName === 'SPAN';

  // The play page wraps the button DIVs in spans, while the read page does not.
  const button = isSpan ? clonedElement.querySelector('[role=button]') : clonedElement;

  // Generate a unique ID
  const uniqueId = `custom-button-${label.replace(/\s+/g, '-').toLowerCase()}`;
  button.id = uniqueId;

  // Remove anything that might disable it.
  button.classList.remove('disabled');
  button.removeAttribute('aria-disabled');

  button.setAttribute('style', 'pointer-events: all !important; z-index:100000; font-weight: bold;');

  // Explicitly add the 'enabled' attribute to the cloned button
  button.setAttribute('aria-enabled', 'true');

  button.setAttribute('aria-label', `${label} button`);

  // Add a unique class to the cloned button for easier targeting
  const uniqueClass = `custom-button-${uniqueId}`;
  button.classList.add(uniqueClass);

  //Use GM_addStyle with a more specific selector and !important
  GM_addStyle(`
    #${uniqueId}.${uniqueClass} {
      background-color: black !important;
      color: white !important;
      opacity: 1 !important;
      font-weight: bold !important;
    }
`);

  // Cache the <p> element for later access
  const buttonTextElement = button.querySelector('p');
  //console.log("button: ", button);
  buttonTextElement.innerText = label;
  // Remove the dimming opacity class.
  buttonTextElement.classList.remove('_o-0d0t546');
  button.onclick = (e) => {
    e.preventDefault();
    e.bubbles = false;
    action(buttonTextElement); // Pass the <p> element to the action function
  };
  return clonedElement;
}

function headerInject(container, cloneReference, label, action) {
  // Only create one button type per container.
  if (container.querySelector(`div[role=button][aria-label*="${label}"]`)) {
    return;
  }
  const clonedElement = buttonClone(cloneReference, label, action); // Clone the entire reference
  container.prepend(clonedElement);
}

/**********************************
** Code for Read Pages.
*/
function handleReadPage(targetNode) {

  // Use the second button if available, otherwise use the first

  // Find all buttons with innerText 'Aa'
  //const aaButtons = [...$('[role=button]')].filter((e) => e.innerText === 'Aa');
  //const aaButton = aaButtons.length >= 2 ? aaButtons[1] : aaButtons[0];
  //const aaButton = querySelector('div[role=button][aria-label="Increase text size"]');
  const aaButton = $('[role="button"][aria-label="Increase text size" i]')[0];

  const buttonContainer = aaButton.parentElement;

  function onSave(type) {
    const saveRaw = cfg.get('Save_Raw_Text');

    if ($('[aria-label="Next page"]')[0]) {
      alert('Multi-paged story detected. Please choose the max pages. If the story is even longer than that, then you have to download them separately.');
    }
    const storyContainer = $('[aria-label="Adventure content" i]')[0]?.children[0].children[0].children;
    const title = storyContainer[1].innerText;
    const storyArr = storyContainer[2].children;

    let text = Array.from(storyArr)
      .map((str) => str.innerText.replaceAll(/w_\w+\n+\s+/g, (type === 'text' && !saveRaw) ? '' : '> '))
      .join('\n\n');

    if (type === 'md') { text = '## ' + title + '\n\n' + text; }

    const blob = URL.createObjectURL(new Blob([text], { type: type === 'text' ? 'text/plain' : 'text/x-markdown' }));
    const a = document.createElement('a');
    a.download = title + (type === 'text' ? '.txt' : '.md');
    a.href = blob;
    a.click();
    URL.revokeObjectURL(blob);
  }

  headerInject(buttonContainer, aaButton, '.txt', () => onSave('text'));
  headerInject(buttonContainer, aaButton, '.md', () => onSave('md'));
  headerInject(buttonContainer, aaButton, toggleButtonText, toggleOnClick);
}

/**********************************
** Code for Modals.
*/



function insertAfter(referenceNode, newNode) {
  referenceNode.parentNode.insertBefore(newNode, referenceNode.nextSibling);
}

function cloneAndModifyModalButton(modalNode, originalButtonSelector, newButtonText, newButtonIcon) {
  const originalButton = modalNode.querySelector(originalButtonSelector);
  if (!originalButton) {
    console.warn("Original button not found:", originalButtonSelector);
    return null;
  }

  const clonedButton = originalButton.cloneNode(true);

  // Modify the cloned button's attributes and content
  clonedButton.setAttribute('aria-label', newButtonText);
  const buttonTextElement = clonedButton.querySelector('.is_ButtonText');
  if (buttonTextElement) {
    buttonTextElement.textContent = newButtonText;
  }

  const iconElement = clonedButton.querySelector('.font_icons');
  if (iconElement) {
    iconElement.textContent = newButtonIcon;
  }

  // Remove the original button's click event handler
  clonedButton.onclick = null;
  clonedButton.removeEventListener('click', originalButton.onclick);

  return clonedButton;
}


// Function to create and insert a button and text fields into the Story Card Modal
// For adding { Story Card: } into the entry field.
function modifyStoryCardEditor(modalNode) {
  const mkycfg_startDelim = cfg.get('Delimiter_Start');
  const mkycfg_endDelim = cfg.get('Delimiter_End');

  const entryField = modalNode.querySelector("textarea[aria-labelledby='scEntryLabel']");
  const entryLabel = modalNode.querySelector("p#scEntryLabel");
  const entrySection = entryLabel.parentNode;

  //const delimEntryButton = cloneAndModifyModalButton(modalNode, "div[role='button'][aria-label='Close modal']", "Insert", "w_add");
  const delimEntryButton = cloneAndModifyModalButton(modalNode, "div[role='button' i][aria-label='More' i]", "Insert", "w_add");
  if (!delimEntryButton) return; // Handle the case where the button wasn't found
  //const buttonText = delimEntryButton.querySelector('.is_ButtonText');
  const buttonText = delimEntryButton.querySelector('.is_Paragraph');
  delimEntryButton.id = "scDelimInsertButton";
  //delimEntryButton.classList.add('is_Button', 'is_ButtonText', 'insert-button', 'css-11aywtz', 'r-6taxm2'); // Add classes for styling

  // Clone the Triggers section (get parentNode of p with id 'scTriggersLabel')
  const triggersSection = modalNode.querySelector("p#scTriggersLabel").parentNode;
  const delimEntrySection = triggersSection.cloneNode(true);

  // Modify label, placeholder, and aria-label
  const delimEntryLabel = delimEntrySection.querySelector("p");
  delimEntryLabel.setAttribute('aria-label', "Delimiter Entry Label");
  delimEntryLabel.id = "scDelimEntryLabel";
  delimEntryLabel.textContent = "DELIM ENTRY";

  const delimStartInput = delimEntrySection.querySelector("input");
  delimStartInput.placeholder = mkycfg_startDelim;
  delimStartInput.value = mkycfg_startDelim;
  delimStartInput.setAttribute('aria-label', "Delimiter Start Input");
  delimStartInput.setAttribute('aria-labelledby', "scDelimEntryLabel");
  delimStartInput.id = "scDelimStartInput";

  // Get the span that contains the input field
  const delimInputSpan = delimEntrySection.querySelector('span._dsp_contents');
  delimInputSpan.setAttribute('aria-label', "Delimiter Input Span");
  delimInputSpan.id = "scDelimInputSpan";
  delimInputSpan.setAttribute('aria-labelledby', "scDelimEntryLabel");

  const delimEndInput = delimStartInput.cloneNode(true);
  delimEndInput.placeholder = mkycfg_endDelim; // Update the placeholder text
  delimEndInput.value = mkycfg_endDelim; // Update the value text
  delimEndInput.setAttribute('aria-label', "Delimiter End Input");
  delimEndInput.setAttribute('aria-labelledby', "scDelimEntryLabel");
  delimEndInput.id = "scDelimEndInput";

  delimInputSpan.appendChild(delimEndInput);
  delimInputSpan.appendChild(delimEntryButton);

  // Insert the cloned section above the original Triggers section
  //triggersSection.parentNode.insertBefore(delimEntrySection, triggersSection);
  insertAfter(entrySection, delimEntrySection);

  delimEntryButton.onclick = () => {
    const startDelim = delimStartInput.value || delimStartInput.placeholder;
    const endDelim = delimEndInput.value || delimEndInput.placeholder;

    const selectionStart = entryField.selectionStart;
    const selectionEnd = entryField.selectionEnd;
    const currentValue = entryField.value;

    // Check if text is selected
    if (selectionStart !== selectionEnd) {
      // Bracket the selected text
      const newValue =
        currentValue.slice(0, selectionStart) +
        startDelim +
        currentValue.slice(selectionStart, selectionEnd) +
        endDelim +
        currentValue.slice(selectionEnd);

      entryField.focus();
      textFieldInsert(entryField, newValue);
      entryField.focus();
      entryField.setSelectionRange(selectionStart + startDelim.length, selectionEnd + startDelim.length);

    } else {
      // If no text is selected, insert delimiters at cursor position
      const newValue =
        currentValue.slice(0, selectionStart) +
        startDelim + endDelim +
        currentValue.slice(selectionStart);

      entryField.focus();
      textFieldInsert(entryField, newValue);
      entryField.focus();
      entryField.setSelectionRange(selectionStart + startDelim.length, selectionStart + startDelim.length);
    }
  };

  triggersSection.parentNode.insertBefore(delimEntrySection, triggersSection);

  // Find the notes textarea element and set it to a default from monkey config.
  const notesTextArea = modalNode.querySelector("textarea[aria-label='Notes']");
  if (notesTextArea) {
    const defaultSCNotes = cfg.get('Default_SC_Notes');
    if (defaultSCNotes !== "") {
      if (notesTextArea && notesTextArea.value.trim() === "") {
        textFieldInsert(notesTextArea, defaultSCNotes);
      }
    }
  }

  GM_addStyle(`

  #scDelimInputSpan { /* Use the ID of the span */
    display: flex !important;  /* Use !important to override existing styles */
    justify-content: space-between !important;
    align-items: center !important;  /* Add this to vertically center items */
    gap: 5px !important;
  }
  #scDelimInputSpan > #scDelimStartInput {
    width: 65% !important;  /* Adjust as needed to control the width of the inputs */
  }
  #scDelimInputSpan > #scDelimEndInput { /* Target the end delimiter specifically */
    width: 25% !important;  /* Set a narrower width for the end delimiter */
  }
  #scDelimInputSpan > button {
    width: auto !important; /* Make the button expand to fit its content */
    white-space: nowrap !important;
  }
`);
}

function textFieldInsert(field, text) {
  setNativeValue(field, text); // Update the value using setNativeValue

  // Trigger an input event to notify React
  const inputEvent = new InputEvent('input', { bubbles: true });
  field.dispatchEvent(inputEvent);
}

function unsetOverflowRecursively(node) {
  // Unset all overflow properties on the current node
  node.style.overflow = '';
  node.style.overflowX = '';
  node.style.overflowY = '';

  // Recursively process child nodes
  for (const child of node.children) {
    unsetOverflowRecursively(child);
  }
}


const classListRemove = [
  '_h-512px',
  '_mih-0px', '_miw-0px', '_fs-0',
  /* Padding we want removed */
  '_pt-1481558400', '_pr-1481558400', '_pb-1481558400', '_pl-1481558400',
  'r-150rngu', // -webkit-overflow-scrolling: touch; // (has error.)
  'r-1rnoaur', // overflow-y: auto; // (we don't want auto scrolling on nested divs. have unset)
  'r-11yh6sk', // overflow-x: auto; // (we don't want auto scrolling on nested divs. have unset)
  'r-eqz5dr', // flex-direction: column;
  'r-16y2uox', // flex-grow: 1;
  'r-1wbh5a2', // flex-shrink: 1;
  'r-agouwx' // transform: translateZ(0);
];
const classListRemove2 = [
  '_mih-0px', '_miw-0px', '_fs-0',
  /* Padding we want removed */
  '_pt-1481558400', '_pr-1481558400', '_pb-1481558400', '_pl-1481558400',
  'r-150rngu', // -webkit-overflow-scrolling: touch; // (has error.)
  'r-1rnoaur', // overflow-y: auto; // (we don't want auto scrolling on nested divs. have unset)
  'r-11yh6sk', // overflow-x: auto; // (we don't want auto scrolling on nested divs. have unset)
  'r-eqz5dr', // flex-direction: column;
  'r-16y2uox', // flex-grow: 1;
  'r-1wbh5a2', // flex-shrink: 1;
  'r-agouwx' // transform: translateZ(0);
];

function classListRemoveRecursively(node, classList) {
  // Unset all overflow properties on the current node
  //classList.forEach(className => node.classList.remove(className));

  // Recursively process child nodes
  for (const child of node.children) {
    classListRemoveRecursively(child);
  }
}

function fixStyles(modalNode) {
  //const modalContent = modalNode.children[1];
  //classListRemove.forEach(className => modalContent.classList.remove(className));
}

// Setting the width and height for the modal in CSS causes
// the modal to be unresizable
function setDefaultSizeStyling(modalNode) {
  // Get default width and height from CSS (if available)
  const computedStyle = window.getComputedStyle(modalNode);
  const defaultWidth = computedStyle.getPropertyValue('width');
  const defaultHeight = computedStyle.getPropertyValue('height');
  //const defaultPositionX = computedStyle.getPropertyValue('left');
  //const defaultPositionY = computedStyle.getPropertyValue('top');

  console.log("defaultWidth: ", defaultWidth);
  console.log("defaultHeight: ", defaultHeight);

  // Set initial dimensions using JavaScript (or use default values if not found in CSS)
  modalNode.style.width = defaultWidth || '512px !important';
  modalNode.style.height = defaultHeight || '80% !important';

  // Remove initial size constraints (important!)
  modalNode.style.removeProperty('width');
  modalNode.style.removeProperty('height');
}

function centerModal(modalNodeTree, modalNode, onlyIfVPOverflow) {
  const modalRect = modalNode.getBoundingClientRect();

  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;

  const left = (viewportWidth - modalRect.width) / 2.0;
  const top = (viewportHeight - modalRect.height) / 2.0;

  const centeringParent = modalNodeTree.querySelector('div > span > span > div');

  // Remove potentially conflicting classes before centering
  centeringParent.classList.remove('_ai-center', '_jc-center', '_pos-fixed');

  if (onlyIfVPOverflow) {
    if (modalRect.width + modalRect.left > viewportWidth) {
      modalNode.style.left = `${Math.max(0, left)}px`; // Ensure left is not negative
    }
    if (modalRect.height + modalRect.top > viewportHeight) {
      modalNode.style.top = `${Math.max(0, top)}px`; // Ensure top is not negative
    }
  } else {
    // Apply initial left and top positions
    modalNode.style.left = `${Math.max(0, left)}px`; // Ensure left is not negative
    modalNode.style.top = `${Math.max(0, top)}px`; // Ensure top is not negative
  }
  // Override centering styles on the parent (AFTER centering the modal)
  centeringParent.style.justifyContent = 'unset';
  centeringParent.style.alignItems = 'unset';
}

/*
const computedStyle = window.getComputedStyle(modalNode);
const initialWidth = computedStyle.getPropertyValue('width');
const initialHeight = computedStyle.getPropertyValue('height');
*/
function makeModalDraggableAndResizable(timestamp, modalNodeTree, modalNode) {
  //console.log("makeModalDraggableAndResizable");
  const modalDimensions = cfg.get('Modal_Dimensions');
  const [modalWidth, modalHeight] = modalDimensions;

  // Get some references to important things.
  const modalHeader = getModalHeader(modalNode);
  const modalContent = getModalContent(modalNode);
  let modalContent_Inner = getModalContent_Inner(modalNode);
  if (!modalContent_Inner) {
    console.error("modalContent_Inner Failed.");
    return;
  }

  let modalContent_InnerId = "modalContent_Inner_" + timestamp;
  modalContent_Inner.id = modalContent_InnerId;

  // Called by both fixModalContent, and by a mutation observer that watches the modal content
  // in case of changes.
  function fixModalContent_Inner(timestamp, modalNode, modalContent_Inner) {
    if (!modalContent_Inner) return;
    //console.log("fixModalContent_Inner");
    classListRemove.forEach(className => modalContent_Inner.classList.remove(className));
    const classListRemovez = [
      '_mih-0px', '_miw-0px', '_fs-0',
      '_pt-1481558400', '_pr-1481558400', '_pb-1481558400', '_pl-1481558400',
      'r-150rngu', 'r-1rnoaur', 'r-11yh6sk',
      '_mr-1481558369',
      'r-agouwx'
    ];

    classListRemoveRecursively(modalContent_Inner.firstChild, classListRemovez);

    //modalContent_Inner.id = modalContent_InnerId;

    unsetOverflowRecursively(modalContent_Inner);

    /* unfortunately these must be set by hand in JS.
       After react remounts a tab, they are lost and CSS doesnt appear to reload.
       */
    modalContent_Inner.style.padding = '0px';
    modalContent_Inner.style.overflowX = 'unset';
    modalContent_Inner.style.overflowY = 'unset';
    modalContent_Inner.style.maxHeight = '100%';
    modalContent_Inner.style.maxWidth = '100%';

    // When different tabs are selected, assign id's for CSS.
    // These trap in the different pill menus.
    // The edit Scenario and Adventure actions have pill menus for
    if (modalHeader.querySelectorAll(
      'div[role="tablist"][aria-label="Section Tabs"] div[role="tab"][aria-label^="Selected tab story cards" i]'
    ).length >= 1) {
      modalContent_Inner.firstChild.id = 'modalContent_Inner_storyCardsTab_' + timestamp;
      modalContent_Inner.firstChild.firstChild.classList.remove('r-150rngu', 'r-1rnoaur', 'r-11yh6sk');
    }
    else if (modalHeader.querySelectorAll(
      'div[role="tablist"][aria-label="Section Tabs"] div[role="tab"][aria-label^="Selected tab plot" i]'
    ).length >= 1) {
      modalContent_Inner.firstChild.id = 'modalContent_Inner_plotTab_' + timestamp;
    }
    else if (modalHeader.querySelectorAll(
      'div[role="tablist"][aria-label="Section Tabs"] div[role="tab"][aria-label^="Selected tab details" i]'
    ).length >= 1) {
      modalContent_Inner.firstChild.id = 'modalContent_Inner_detailsTab_' + timestamp;
    }
    else if (modalHeader.querySelectorAll(
      'div[role="tablist"][aria-label="Section Tabs"] div[role="tab"][aria-label^="Selected tab Generator Settings" i]'
    ).length >= 1) {
      modalContent_Inner.firstChild.id = 'modalContent_Inner_generatorSettingsTab_' + timestamp;
    }
    centerModal(modalNodeTree, modalNode, true);
  }


  setTimeout(() => {
    fixStyles(modalNode);
    fixModalContent_Inner(timestamp, modalNode, modalContent_Inner);

    // Center the modal initially (after a slight delay for rendering)
    // To allow dragging and resizing the modal, we have to disable centering.
    // But we don't want the modal to jump to the top left of the viewport.
    // So we center it manually.
    /*
        const modalRect = modalNode.getBoundingClientRect();

        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;

        const left = (viewportWidth - modalRect.width) / 2.0;
        const top = (viewportHeight - modalRect.height) / 2.0;
    */

    //setDefaultSizeStyling(modalNode);

    centerModal(modalNodeTree, modalNode, false);

    if (1) { // Turned off to experiment with using the original scroller.
      const originalScroller = modalNode.closest('[data-remove-scroll-container="true"]');
      if (originalScroller) {
        originalScroller.style.overflowY = 'hidden'; // Disable scrolling on the original element
        originalScroller.removeAttribute('data-remove-scroll-container'); // Remove the attribute
      } else {
        console.warn("Original scrolling element not found in modal.");
      }
    }
    /*
    */
  }, 100);

  // Use a MutationObserver to monitor changes in the modal's content
  const observer = new MutationObserver((mutationsList, observer) => {
    for (let mutation of mutationsList) {
      if (mutation.type === 'childList') {
        //let modalNode.offsetWidth; // Trigger a reflow
        //let newModalContent_Inner = modalNode?.children[1]?.children[0]; // Look for updated content div
        let newModalContent_Inner = getModalContent_Inner(modalNode); // Look for updated content div
        if (newModalContent_Inner) {
          modalContent_Inner = newModalContent_Inner;
          fixModalContent_Inner(timestamp, modalNode, newModalContent_Inner); // Apply styles to the new inner content element
        }
      }
    }
  });
  observer.observe(modalNode, { childList: true, subtree: true }); // Observe all child nodes

  let startX = null;
  let startY = null;
  let isDragging = null;

  // New event listeners for touch events (passive) for dragging
  modalHeader.addEventListener('mousedown', handleDragStart);
  modalHeader.addEventListener('touchstart', handleDragStart, { passive: true });
  // Prevent default behavior for touch events to avoid scrolling and interfering with dragging
  modalNode.addEventListener('touchmove', (e) => e.preventDefault(), { passive: false });

  function handleDragStart(e) {
    isDragging = true;
    startX = e.clientX - modalNode.offsetLeft;
    startY = e.clientY - modalNode.offsetTop;
    document.addEventListener('mousemove', handleDragMove);
    document.addEventListener('mouseup', handleDragEnd);
    //console.log("handleDragStart");

    // Prevent default behavior for touch events to avoid scrolling
    if (e.type === 'touchstart') {
      e.preventDefault();
    }

    e.stopPropagation(); // Stop event propagation to prevent conflicts
  }

  function handleDragMove(e) {
    if (!isDragging) return;
    const x = e.clientX || e.touches[0].clientX; // Get x position for mouse or touch
    const y = e.clientY || e.touches[0].clientY; // Get y position for mouse or touch
    modalNode.style.left = `${x - startX}px`;
    modalNode.style.top = `${y - startY}px`;
  }

  function handleDragEnd(e) {
    isDragging = false;
    document.removeEventListener('mousemove', handleDragMove);
    document.removeEventListener('mouseup', handleDragEnd);
    //console.log("handleDragEnd");
  }
  /*
    // This is an alternate approach that handles touch events.
    // But it is a bit jumpy and needs work.

    modalHeader.addEventListener('mousedown', handleDragStart);
    modalHeader.addEventListener('touchstart', handleDragStart);  // Remove passive here

    let activeTouches = 0; // Counter for active touch points

    function handleDragStart(e) {
      activeTouches++;
      if (activeTouches > 1) return; // Allow multi-touch for zoom/pinch gestures

      if (e.type === 'touchstart') {
        startX = e.touches[0].clientX - modalHeader.getBoundingClientRect().left;
        startY = e.touches[0].clientY - modalHeader.getBoundingClientRect().top;
      } else {
        startX = e.offsetX;
        startY = e.offsetY;
      }

      // Add touchmove and touchend listeners ONLY when touchstart occurs
      if (e.type === 'touchstart') {
        document.addEventListener('touchmove', handleDragMove);
        document.addEventListener('touchend', handleDragEnd);
      } else { // For mousedown
        document.addEventListener('mousemove', handleDragMove);
        document.addEventListener('mouseup', handleDragEnd);
      }

      console.log("handleDragStart e.type: ", e.type);
    }

    function handleDragMove(e) {
      if (activeTouches > 1) return; // Allow multi-touch for zoom/pinch gestures

      const x = e.clientX || e.touches[0].clientX; // Get x position for mouse or touch
      const y = e.clientY || e.touches[0].clientY; // Get y position for mouse or touch
      modalNode.style.left = `${x - startX}px`;
      modalNode.style.top = `${y - startY}px`;

      e.stopPropagation(); // Stop event propagation ONLY during dragging
    }

    function handleDragEnd(e) {
      activeTouches--;
      if (activeTouches > 0) return; // Wait for all touch points to be released

      // Remove touchmove and touchend listeners when touch ends
      if (e.type === 'touchend') {
        document.removeEventListener('touchmove', handleDragMove);
        document.removeEventListener('touchend', handleDragEnd);
      } else { // For mouseup
        document.removeEventListener('mousemove', handleDragMove);
        document.removeEventListener('mouseup', handleDragEnd);
      }
      console.log("handleDragEnd e.type: ", e.type);
      }
  */
}
// Function to add newline and '>' if missing
function ensureNewlineAndIndicator(textarea) {
  const text = textarea.value;

  // Regex to check for leading newline and '>'
  const leadingRegex = /^\n>/;

  // Regex to check for trailing newline
  const trailingRegex = /\n$/;

  if (!leadingRegex.test(text)) {
    textarea.value = "\n> " + text; // Prepend newline and '>'
  }

  if (!trailingRegex.test(text)) {
    textarea.value += "\n"; // Append newline
  }
}

function handleTextAreaChange(event) {
  const textarea = event.target;
  text = textarea.value;

  let needUpdate = false;

  // Store the current cursor position
  let currentCursorPosition = textarea.selectionStart;

  // Regex to check for leading newline and '>'
  const leadingRegex = /^\n+\s*>/;
  if (needUpdate ||= !leadingRegex.test(text)) {
    const startText = "\n> ";
    text = startText + text; // Prepend newline and '>'
    currentCursorPosition += startText.length;
  }

  // Regex to check for trailing newline
  const trailingRegex = /\n\s*$/;
  if (needUpdate ||= !trailingRegex.test(text)) {
    text += "\n"; // Append newline
  }

  if (needUpdate) {
    textFieldInsert(textarea, text);
    textarea.setSelectionRange(currentCursorPosition, currentCursorPosition);
  }
}
if (cfg.get('Fix_Actions') === true) {
  // Attach event listener to all relevant textareas (using event delegation for efficiency)
  document.addEventListener('input', (event) => {
    if (event.target.matches('div > div.is_Row > span._dsp_contents > textarea[aria-label="Text input field"]')) {
      handleTextAreaChange(event);
    }
  });
}

// Function to update the flame icon's color  scrollbar-color: red green; /* Thumb and track colors */

function changeCreditUseIndicator(flameIconValue) {
  const flameIcon = document.querySelector(
    'div[id="game-blur-button"][aria-label="Game Menu"] p.font_icons'
  );
  const commandBar = document.querySelector(
    'div[role="toolbar" i][aria-label="Command Bar" i]'
  );
  const navigationBar = document.querySelector(
    'div[role="toolbar" i][aria-label="Navigation Bar" i]'
  );

  const gearMenu_Header = document.querySelector(
    'div#__next div[id^="gearMenu_Header_TS" i]'
  );
  const theDialog = document.querySelector(
    'div#__next div[id^="TheDialog" i]'
  );
  const creditsOn = "red";
  const creditsOff = "";
  if (flameIcon) {
    if (flameIconValue > 0) {
      flameIcon.style.color = creditsOn; // Change to red if value is greater than 0
    } else {
      flameIcon.style.color = creditsOff; // Reset to default color if value is 0 or less
    }
  }
  if (commandBar) {
    // Target all descendant text elements within the command bar
    const textElements = commandBar.querySelectorAll('span, p'); 

    if (flameIconValue > 0) {
      textElements.forEach(element => {
        element.style.color = creditsOn; 
      });
    } else {
      textElements.forEach(element => {
        element.style.color = creditsOff; 
      });
    }
  }
  if (navigationBar) {
    // Target all descendant text elements within the command bar
    const textElements = navigationBar.querySelectorAll('span, p'); 

    if (flameIconValue > 0) {
      textElements.forEach(element => {
        element.style.color = creditsOn; 
      });
    } else {
      textElements.forEach(element => {
        element.style.color = creditsOff; 
      });
    }
  }
  if (gearMenu_Header) {
    // Target all descendant text elements within the gearMenu header
    const textElements = gearMenu_Header.querySelectorAll('span, p'); 

    if (flameIconValue > 0) {
      textElements.forEach(element => {
        element.style.color = creditsOn; 
      });
    } else {
      textElements.forEach(element => {
        element.style.color = creditsOff; 
      });
    }
  }
  if (theDialog) {
    // Target all descendant text elements within the gearMenu header
    const textElements = theDialog.querySelectorAll('span, p'); 

    if (flameIconValue > 0) {
      textElements.forEach(element => {
        element.style.color = creditsOn; 
      });
    } else {
      textElements.forEach(element => {
        element.style.color = creditsOff; 
      });
    }
  }

}
// /* Target the main div (tablist) */
// div[role="tablist"].is_Row {
//   /* Apply color to all descendant text elements */
//   color: red; /* Or your desired color */
// }
const AISettings_StoryGen_Model_Container_Selector =
  'div[aria-label="Story Generator" i]:nth-child(1)' // The story Generator heading.
   + ' + div:nth-child(2)' // The mext sibling is the Story Gen content window.
   + ' > div.is_Column:only-child' // A wrapper.
   + ' > div.is_Column:nth-child(1)' // The specific model's container for button and info.
  ;
waitForKeyElements(AISettings_StoryGen_Model_Container_Selector, (containerNodes) => {
  if (!containerNodes || !containerNodes?.length) {
    console.log("containerNodes not defined.");
    return;
  }
  console.log("containerNodes found: ", containerNodes);
  const modelContainer = containerNodes[0]; // Get the first matching element
  
  function getCreditsElement() {
    const creditsButton = $(modelContainer).find("div[role=button]:has(> p:contains('Credits'))")[0];
    console.log("creditsButton", creditsButton);
    if (creditsButton) {
      return creditsButton.querySelector('& > div > p');
    }
    return null;
  }

  function getCredits(creditsElement){
    const credits = creditsElement?.textContent;
    return parseInt(credits) || 0;
  }

  let creditsElement = getCreditsElement();
  //console.log("creditsElement found: ", creditsElement);

  function updateFlameIcon() {
    if (creditsElement) {
      const credits = getCredits(creditsElement); // Use textContent
      //console.log("Credits:", credits);
      //console.log("creditsElement found: ", creditsElement);
      changeCreditUseIndicator(credits);
    } else {
      // If creditsElement is not found (e.g., on a free Story Generator)
      changeCreditUseIndicator(0); // Set flame icon to default color
    }
  }

  // Call updateFlameIcon initially
  updateFlameIcon();
  const creditsObserver = new MutationObserver((mutationsList, observer) => {
    //console.log("mutation mutation 0.");
    for (const mutation of mutationsList) {
      //console.log("mutation: ", mutation);
      if (mutation.type === "childList") {
        // Re-query creditsElement whenever there's a childList mutation
        creditsElement = getCreditsElement();
        //console.log('new credits element: ', creditsElement);
        updateFlameIcon(); 
      } 
  
      if (
        (mutation.type === "childList" || mutation.type === "characterData") && // Observe both childList and characterData
        creditsElement && // Check if creditsElement is defined
        mutation.target.parentNode === creditsElement  // Check if target is a descendant of creditsElement
      ) {
        //console.log("mutation mutation 2."); 
        updateFlameIcon(); 
      }
    }
  });

  // Start observing the modelContainer for changes in its child nodes
  creditsObserver.observe(modelContainer, { childList: true, subtree: true, characterData: true });
}, false);


const gearMenuSelector = 
'#__next > div > span > div:nth-child(2) > div:nth-child(2), ' +
'#__next > div > span > span > div:nth-child(2) > div:nth-child(2)';
const gameScreenSelector =
'body > div.app-root > div#__next > div > span > div:nth-child(2)';
const gameScreenNode = document.querySelector(gameScreenSelector);

waitForKeyElements(gearMenuSelector, (gearMenuNodes) => {
  console.log(gearMenuNodes);
  const gearMenuNode = gearMenuNodes[0];
  const timestamp = "TS" + Date.now();

  gearMenuNode.id = 'gearMenuNode_' + timestamp;

  const gearMenu_Wrapper = gearMenuNode?.firstChild;
  gearMenu_Wrapper.id = 'gearMenu_Wrapper_' + timestamp;

  const gearMenu = gearMenu_Wrapper?.firstChild;
  gearMenu.id = 'gearMenu_' + timestamp;

  const gearMenu_Header = gearMenu?.firstChild;
  gearMenu_Header.id = 'gearMenu_Header_' + timestamp;

  // Identify the selected tab by it's border color class.
  //const selectedTab = gearMenu_Header.querySelectorAll('div[role="tab"].is_Button._bbc-137133889 span')[0];
  //const innerText = selectedTab.innerText;

  //console.log("selectedTab: ", selectedTab);
  //console.log("innerText: ", innerText);

  const gearMenu_Content= gearMenu?.lastChild;
  gearMenu_Content.id = 'gearMenu_Content_' + timestamp;

  // if (editorContainer) {
  //   //editorContainer.style.height = "90%";
  // } else {
  //   console.warn("Editor container div not found in script editor modal");
  // }
  //modalNode.dataset.hasEditorMods = "true";
}, false);

function skipSpan(node) {
  const tagName = node.tagName.toLowerCase();
  if (tagName === 'span') {
    return node.children[0];
  } else {
    return node;
  }
}

function getModalInner(modalNode) {
  /* The entire modal node contents may be wrapped in a div. */
  return (modalNode.children.length == 1) ? modalNode.firstChild : null;
}

function getModalHeader(modalNode) {
  /* The entire modal node contents may be wrapped in a div. */
  const modalNodeInner = getModalInner(modalNode) ?? modalNode;
  /* And the header node may be wrapped in a div. */
  const modalHeaderInner = (modalNodeInner.children.length == 1) ? modalNodeInner.firstChild : modalNodeInner;
  return modalHeaderInner?.firstChild;
}

function getModalHeader_Title(modalNode) {
  return getModalHeader(modalNode)?.children[0];
}
function getModalHeader_Menu(modalNode) {
  return getModalHeader(modalNode)?.children[1];
}

function getModalContent(modalNode) {
  const modalNodeInner = getModalInner(modalNode) ?? modalNode;
  return skipSpan(modalNodeInner?.children[1]);
}

function getModalContent_Inner(modalNode) {
  return skipSpan(getModalContent(modalNode).firstChild);
}

function getModalFooter(modalNode) {
  const modalNodeInner = getModalInner(modalNode) ?? modalNode;

  if (modalNodeInner?.children.length < 3) {
    return null;
  }
  return skipSpan(modalNodeInner.lastChild);
}

/**
 * Adds a full-screen button to a modal header, allowing the user to toggle between normal and full-screen modes.
 *
 * @param {HTMLElement} cloneRef - An existing button element to be cloned for styling the new button.
 * @param {HTMLElement} container - The container element (usually the modal header) where the button will be added.
 * @param {function} eventHandler - The function to be called when the button is clicked (typically the `toggleFullScreen` function).
 * @param {string} [placement='beforeend'] - The placement of the button relative to the container's children. Possible values: 'beforebegin', 'afterbegin', 'beforeend', 'afterend', 'before', 'after'.
 * @param {HTMLElement} [referenceChild=null] - An optional child element within the container. Used for 'before' and 'after' placements to insert the button before or after this child.
 */
function modalAddFullScreenButton(cloneRef, container, eventHandler, placement = 'beforeend', referenceChild = null) {
  if (!cloneRef) {
    console.warn("Null cloneRef in modalAddFullScreenButton!");
    return;
  }

  const fullScreenButton = buttonClone(
    cloneRef,
    "[ ]",
    eventHandler
  );

  // Apply styles to the button
  fullScreenButton.style.marginRight = '8px';
  fullScreenButton.style.minWidth = '30px';
  fullScreenButton.style.whiteSpace = 'nowrap';

  // Insert the button based on the specified placement and referenceChild
  switch (placement) {
    case 'beforebegin':
      container.parentNode.insertBefore(fullScreenButton, container);
      break;
    case 'afterbegin':
      container.insertBefore(fullScreenButton, container.firstChild);
      break;
    case 'beforeend':
      container.appendChild(fullScreenButton);
      break;
    case 'afterend':
      container.parentNode.insertBefore(fullScreenButton, container.nextSibling);
      break;
    case 'before':
      if (referenceChild && referenceChild.parentNode === container) {
        container.insertBefore(fullScreenButton, referenceChild);
      } else {
        console.warn("Invalid referenceChild or referenceChild not found within container. Using default 'beforeend' placement.");
        container.appendChild(fullScreenButton);
      }
      break;
    case 'after':
      if (referenceChild && referenceChild.parentNode === container) {
        container.insertBefore(fullScreenButton, referenceChild.nextSibling);
      } else {
        console.warn("Invalid referenceChild or referenceChild not found within container. Using default 'beforeend' placement.");
        container.appendChild(fullScreenButton);
      }
      break;
    default:
      console.warn("Invalid placement specified. Using default 'beforeend' placement.");
      container.appendChild(fullScreenButton);
  }
}

function toggleFullScreen(buttonTextElement) {
  const modalNode = buttonTextElement.closest("div[aria-label*='Modal' i]");
  if (!modalNode) {
    console.error("Error: Modal node not found. Fullscreen toggle failed.");
    return;
  }
  const modalRect = modalNode.getBoundingClientRect();
  if (modalNode.requestFullscreen) {
    if (document.fullscreenElement) {
      document.exitFullscreen();
      buttonTextElement.innerText = "[ ]";

      // Restore previous size and position (ensure consistent pixel values)
      modalNode.style.width = modalNode.dataset.originalWidth + 'px';
      modalNode.style.height = modalNode.dataset.originalHeight + 'px';
      modalNode.style.left = modalNode.dataset.originalLeft + 'px';
      modalNode.style.top = modalNode.dataset.originalTop + 'px';

      // Force reflow to ensure styles are applied correctly
      void modalNode.offsetWidth; // Trigger a reflow
    } else {
      // Store current size and position before going fullscreen (ensure pixel values)
      modalNode.dataset.originalWidth = modalRect.width;
      modalNode.dataset.originalHeight = modalRect.height;
      modalNode.dataset.originalLeft = modalRect.left;
      modalNode.dataset.originalTop = modalRect.top;

      modalNode.requestFullscreen();
      buttonTextElement.innerText = "[X]";
    }
  }
}

function checkTokenViewer(modalNode) {
  const tabList = modalNode?.querySelector('div[role="tablist"][aria-label="Section Tabs"]');

  return tabList?.querySelector('div[role="tab"][aria-label*="tab text" i]') &&
    tabList?.querySelector('div[role="tab"][aria-label*="tab tokens" i]');
}

// Call the function when you detect a new modal or when you want to check the conditions

function appendBeforeTimestamp(idString, stringToAppend) {
  return idString.replace(/_TS(\d+)$/, `${stringToAppend}_TS$1`);
}
// Function to handle new modals.
// modalNodeTree is the modal's branch div from document.body.
//
function handleNewModal(modalNodeTree) {

  const timestamp = "TS" + Date.now();

  const zzz = modalNodeTree.querySelector('[aria-label*="Modal"]');
  //zzz.style.width = !modalWidthCfg ? '512px' : `${modalWidthCfg}px`;
  //zzz.style.height = !modalHeightCfg ? '80vh' : `${modalHeightCfg}px`;
  //zzz.style.width = 'min-content';
  //zzz.style.height = 'max-content';

  // Wait for the specific modal structure
  waitForSubtreeElements(
    "div[aria-label*='Modal' i]:has(div[role='button'])",
    (modalNodes) => {
      //console.log(modalNodes);
      if (modalNodes.length !== 1) {
        console.warn("Modal nodes, there can be only 1. Found: ", modalNodes.length);
        return;
      }

      const modalNode = modalNodes[0];
      if (!modalNode) {
        console.warn("Null Modal node found in handleNewModle.");
        return;
      }
      // Assign IDs for CSS.

      // Defaults all modals.
      //modalNode.style.width = !modalWidthCfg ? '512px' : `${modalWidthCfg}px`;
      //modalNode.style.height = !modalHeightCfg ? '80vh' : `${modalHeightCfg}px`;


      // This is the root node for the entire modal in document.body.
      modalNodeTree.id = "modalNodeTree_" + timestamp;

      modalNodeTree.firstChild.firstChild.firstChild.firstChild.style.opacity = "0";
      /* Some modal nodes wrap their entire content in an only-child div. */
      let modalNodeInner = getModalInner(modalNode);
      if (modalNodeInner) {
        modalNodeInner.id = "modalNodeInner_" + timestamp;
      } else {
        modalNodeInner = modalNode;
      }

      /* Some modalNodeHeaders wrap their entire content in another div. */
      const modalHeaderWrapper = modalNodeInner.children.length == 1 ? modalNode.firstChild : null;
      if (modalHeaderWrapper) {
        modalHeaderWrapper.id = "modalHeaderWrapper_" + timestamp;
      }
      const modalHeader = modalHeaderWrapper ? modalHeaderWrapper : modalNodeInner.firstChild;
      // This is the Header for the Modal.
      modalHeader.id = "modalHeader_" + timestamp;

      // The header contains a title and an optional menu.
      const modalHeader_Title = getModalHeader_Title(modalNodeInner);
      modalHeader_Title.id = "modalHeader_Title_" + timestamp;

      // Check for an optional menu container.
      let modalHeader_Menu = getModalHeader_Menu(modalNodeInner);
      if (modalHeader_Menu) {
        //const modalPillMenu = modalHeader_MenuContainer.querySelectorAll('div[role="tablist"][aria-label="Section Tabs"]');
        modalHeader_Menu.id = "modalHeader_Menu_" + timestamp;
      }

      const modalContent = getModalContent(modalNodeInner);
      modalContent.id = "modalContent_" + timestamp;

      const modalContent_Inner = getModalContent_Inner(modalNodeInner);
      modalContent_Inner.id = "modalContent_Inner_" + timestamp;

      const modalFooter = getModalFooter(modalNodeInner);
      if (modalFooter) {
        modalFooter.id = "modalFooter_" + timestamp;
      }



      waitForSubtreeElements(
        'div[aria-label*="Modal" i] div[role="button" i][aria-label="Close modal" i], ' +
        'div[aria-label*="Modal" i] div[role="button" i]',
        // The selector for the element you want to wait for within the modal
        //"div[aria-label='Modal' i] > div > div", // The selector for the element you want to wait for within the modal
        //"div[aria-label='Modal' i]:has(> div:nth-child(2))", // Wait for the 2nd child to appear.
        (modalSubNodes) => {
          setTimeout(() => { // Need to wait some time for react to render the contents and post it.
            // Add resizing and dragging for edit Adventure and Scenario modals.
            const tablistSelector =
              'div[role="tablist"][aria-label="Section Tabs"] [role="tab"][aria-label*="plot" i], ' +
              'div[role="tablist"][aria-label="Section Tabs"] [role="tab"][aria-label*="Story Cards" i],' +
              'div[role="tablist"][aria-label="Section Tabs"] [role="tab"][aria-label*="details" i],' +
              'div[role="button"][aria-label="Close modal" i] > div > p';

            if (modalNode.querySelectorAll(tablistSelector).length >= 4) {
              modalNode.style.width = !modalWidthCfg ? '512px' : `${modalWidthCfg}`;
              modalNode.style.height = !modalHeightCfg ? '90vh' : `${modalHeightCfg}`;
              waitForSubtreeElements(
                tablistSelector,
                (matchingElements) => {
                  if (matchingElements.length >= 4) { // Check if all 3 tabs are found
                    modalNodeTree.id = appendBeforeTimestamp(modalNodeTree.id, "_ScenarioAdventureEditor");

                    // Find the nested button
                    setTimeout(() => {
                      let closeButton = null;
                      let container = null;
                      // Check for double button first.
                      let closeButtons = modalNode.querySelectorAll(
                        "button[role='button'][type='button' i] div[role='button'][aria-label='Close modal' i]");
                      if (closeButtons.length > 0) {
                        closeButton = closeButtons[0]; // Keep the pointer to the inner div button for cloning.
                        // Find the enclosing button element.
                        container = closeButton.closest("button[role='button'][type='button' i]")?.parentNode;
                      }
                      // It's not a double button.
                      else {
                        closeButtons = modalNode.querySelectorAll("div[role='button'][aria-label='Close modal' i]");
                        if (closeButtons.length > 0) {
                          closeButton = closeButtons[0];
                          container = closeButton.parentNode;
                        }
                      }

                      if (!closeButton || !container) {
                        console.error("Error: Close button not found in modal. Fullscreen button not added.");
                        console.log(closeButton);
                        console.log(container);
                      } else {
                        modalAddFullScreenButton(closeButton, container, toggleFullScreen);
                        container.style.justifyContent = 'space-between';
                        modalContent_Inner.style.minHeight = '0px';
                      }
                    }, 100); // adjust as needed
                  }
                  //modalNode.style.width = '512px';
                  //modalNode.style.height = '90vh';
                  makeModalDraggableAndResizable(timestamp, modalNodeTree, modalNode);

                },
                modalNode,
                true
              );
            }
            // Story card updates.
            //else if (modalNode.querySelectorAll("textarea[aria-labelledby='scEntryLabel']").length >= 1) {
            else if (modalNode.getAttribute('aria-label')?.includes("Story Card Edit Modal")) {
              //console.log("Found story card modal");
              //console.log("scEntryLable", modalNode);

              modalNodeTree.id = appendBeforeTimestamp(modalNodeTree.id, "_StoryCardEditor");
              //modalNodeTree.id += ".StoryCardEditor";
              modalContent_Inner.firstChild.id = appendBeforeTimestamp(modalContent_Inner.firstChild.id, "_StoryCardEditor");
              //modalContent_Inner.firstChild.id = "modalContent_Inner_StoryCardEditor";
              //  modalHeader.padding = '8px';
              setTimeout(() => {
                //modalContent.style.maxHeight = 'calc(100% - ' + modalHeader.offsetHeight + 'px)';
                /// makeModalDraggableAndResizable(timestamp, modalNodeTree, modalNode);
                modifyStoryCardEditor(modalNode);
                const cloneButton = modalNode.querySelector("div[role='button'][aria-label='More' i]");
                modalAddFullScreenButton(cloneButton, modalHeader_Title.firstChild, toggleFullScreen);
                modalHeader_Title.style.justifyContent = 'space-between';
                modalHeader_Title.style.alignItems = 'center';
                modalHeader_Title.firstChild.style.display = 'flex';
                modalHeader_Title.firstChild.style.gap = '10px';
                modalHeader_Title.lastChild.style.marginLeft = 'auto';
              }, 100); // Adjust delay as needed
              // Add additional story card updates here...
              //
              makeModalDraggableAndResizable(timestamp, modalNodeTree, modalNode);

            }
            else if ($(modalHeader_Title).find("p:contains('View Context')").length > 0) {
              modalNode.style.width = ' min-content';
              modalNode.style.height = 'max-content';
              setTimeout(() => {
                modalNodeTree.id = appendBeforeTimestamp(modalNodeTree.id, "_ViewContext");
                //modalNode.style.width = '512px';
                //modalNode.style.height = '400px';
                //modalNode.style.width = !modalWidthCfg ? '512px' : `${modalWidthCfg}`;
                //console.log("width: ", modalNode.style.width);
                //console.log("modalWidthCfg: ", modalWidthCfg);
                //modalNode.style.width = ' min-content';
                //modalNode.style.height = 'max-content';
                makeModalDraggableAndResizable(timestamp, modalNodeTree, modalNode);
              }, 100); // adjust as needed

            }
            else if ($(modalHeader_Title).find("h1:contains('Image Options')").length > 0) {
              modalNode.style.width = ' min-content';
              modalNode.style.height = 'max-content';
              setTimeout(() => {
                modalNodeTree.id = appendBeforeTimestamp(modalNodeTree.id, "_ImageOptions");
                //modalNode.style.width = '512px';
                //modalNode.style.height = '400px';
                //modalNode.style.width = !modalWidthCfg ? '512px' : `${modalWidthCfg}`;
                //console.log("width: ", modalNode.style.width);
                //console.log("modalWidthCfg: ", modalWidthCfg);
                //modalNode.style.width = ' min-content';
                //modalNode.style.height = 'max-content';
                const cloneButton = modalNode.querySelector("div[role='button'][aria-label='Close modal' i]");
                modalAddFullScreenButton(cloneButton, modalHeader, toggleFullScreen, 'before', cloneButton);
                makeModalDraggableAndResizable(timestamp, modalNodeTree, modalNode);
              }, 100); // adjust as needed

            }
            else if ($(modalHeader_Title).find("p:contains('Memories')").length > 0) {
              modalNode.style.width = !modalWidthCfg ? '512px' : `${modalWidthCfg}`;
              modalNode.style.height = !modalHeightCfg ? '90vh' : `${modalHeightCfg}`;
              setTimeout(() => {
                modalNodeTree.id = appendBeforeTimestamp(modalNodeTree.id, "_MemoryViewer");
                const cloneButton = modalNode.querySelector("div[role='button'][aria-label='Close modal' i]");
                modalAddFullScreenButton(cloneButton, modalHeader_Title.firstChild.lastChild, toggleFullScreen);
                makeModalDraggableAndResizable(timestamp, modalNodeTree, modalNode);
              }, 100); // adjust as needed
            }
            else if (checkTokenViewer(modalNode)) {
              modalNode.style.width = !modalWidthCfg ? '512px' : `${modalWidthCfg}`;
              modalNode.style.height = !modalHeightCfg ? '90vh' : `${modalHeightCfg}`;
              setTimeout(() => {
                modalNodeTree.id = appendBeforeTimestamp(modalNodeTree.id, "_TokenViewer");
                const cloneButton = modalNode.querySelector("div[role='button'][aria-label='Close modal' i]");
                modalAddFullScreenButton(cloneButton, modalHeader_Title.firstChild.lastChild, toggleFullScreen);
                makeModalDraggableAndResizable(timestamp, modalNodeTree, modalNode);
              }, 100); // adjust as needed
            }
            // Fix the irritating small window size for the script editor.
            //
            else if ($(modalNode).find("p:contains('Shared Library')").length > 0) {
              setTimeout(() => {
                waitForKeyElements(".monaco-editor .view-lines", (editorElements) => {
                  modalNodeTree.id = appendBeforeTimestamp(modalNodeTree.id, "_ScriptEditor");
                  const editorContainer = modalNode?.children[1];

                  if (editorContainer) {
                    //editorContainer.style.height = "90%";
                  } else {
                    console.warn("Editor container div not found in script editor modal");
                  }
                  //modalNode.dataset.hasEditorMods = "true";
                }, true);
                const cloneButton = modalHeader_Title.querySelector("div[role='button'][aria-label='back' i]");
                modalAddFullScreenButton(cloneButton, modalHeader_Title, toggleFullScreen);

                modalNode.style.position = `absolute`;
                modalNode.style.top = `8px`;
                modalNode.style.left = `8px`;
                modalNode.style.width = `calc(100vw - 16px)`;
                modalNode.style.height = `calc(100vh - 16px)`;
              }, 100); // adjust as needed
              makeModalDraggableAndResizable(timestamp, modalNodeTree, modalNode);
            } else {
              //console.log("Found other modal", modalNode);
              // ... you can add handlers for other types of modals here ...
            }
          }, 500); // adjust as needed
          //}, 1); // adjust as needed

        },
        modalNode, // Use the modal node as the targetNode
        true // Run immediately.
      );
    },
    modalNodeTree, // Use the modal node as the targetNode
    true // Run immediately.
  );
}

// Mutation observer to detect new div elements in document.body
const bodyObserver = new MutationObserver((mutationsList, observer) => {
  for (const mutation of mutationsList) {
    if (mutation.type === 'childList') {
      for (const node of mutation.addedNodes) {
        if (node.nodeName === 'DIV') {
          // Check for modals and new buttons
          if (node.querySelector("div[aria-label*='Modal' i]")) {
            //console.log("New modal detected in document.bodyZ");
            setTimeout(() => {
              handleNewModal(node);
            }, 500); // adjust as needed
          }

        }
      }
    }
  }
});


// Start observing the document body for new children added.
bodyObserver.observe(document.body, { childList: true });

/**********************************
** Code for Play Pages.
*/

// Fist the state.message display locking out the Navigation bar.
//
function fixNavigationBar() {
  const navBar = document.querySelector('div[aria-label="Navigation bar"]');
  const dialog = document.querySelector('.css-175oi2r[style*="z-index: 3"]');

  // Save off the navBar height so we can use it in CSS.
  if (navBar) {
    const navBarHeight = navBar.offsetHeight;
    document.documentElement.style.setProperty('--navbar-height', `${navBarHeight}px`);
  }


  //const circleInfoDiv = dialog?.querySelector('p.font_icons[aria-hidden="true"]:has(+ p:contains("w_circle_info"))')?.closest('div[role="button"]'); // Find the closest parent div with role="button"
  if (navBar && dialog) {
    navBar.style.zIndex = 100011; // Higher than the overlay pane
    dialog.style.zIndex = 2; // Lower z-index for the dialog
    dialog.id = 'TheDialog';

    const alertContainer = navBar.querySelectorAll('div[role="alert"]');

    const nestedOverlay = dialog.querySelector('div[style*="z-index: 100000"]'); // Select nested overlay
    if (nestedOverlay) {
      nestedOverlay.style.zIndex = 1; // Set a lower z-index for the nested overlay
      //nestedOverlay.id = 'TheNestedOverlay'
    }

    const navBarButtons = navBar.querySelectorAll('div[id="game-blur-button"]');
    navBarButtons.forEach(button => {
      button.style.zIndex = 100012; // Even higher for the buttons

      const buttonZi1Elements = button.querySelectorAll('._zi-1');
      buttonZi1Elements.forEach(element => {
        element.style.zIndex = 100013; // Highest z-index for elements inside buttons
      });
    });

    const navBarZi1Elements = navBar.querySelectorAll('._zi-1');
    navBarZi1Elements.forEach(element => {
      element.style.zIndex = 100011; // Match the navBar's z-index
    });

    // Find the 'alert' div.
    const alertDialog = dialog.querySelector("div[role='alert']");

    // Add click listener to dismiss the dialog when the circle info div is clicked
    const $circleInfoDiv = $(dialog).find(
      "div[role='alert'] > div > div > div:first-child > div:first-child"
    );

    if ($circleInfoDiv.length > 0) {
      $circleInfoDiv.on("click", () => {
        dialog.remove();
      });
    }
    // Add click listener to dismiss the dialog when the circle info div is clicked
    const circleInfoDiv = dialog.querySelector("div[role='alert'] > div > div:first-child");
    if (circleInfoDiv) {
      console.log("found circleInfoDiv:", circleInfoDiv);
      circleInfoDiv.addEventListener("click", () => {
        dialog.remove();
      });
    }
  }
}


let fixNavigationBarObserver = new DOMObserver(
  fixNavigationBar, document.body,
  { childList: true, subtree: true }
);

function handlePlayPage(targetNode) {
  // handleChanges();
  let handleChangesObserver = new DOMObserver(handleChanges, targetNode, { childList: true, subtree: true });
  handleChangesObserver.observe();

  const CSS = `
  div>span:last-child>#transition-opacity:last-child, #game-backdrop-saturate {
    border-bottom-color: ${cfg.get('Response_Underline') ? 'var(--color-61)' : 'unset'};
    border-bottom-width: ${cfg.get('Response_Underline') ? '2px' : 'unset'};
    border-bottom-style: ${cfg.get('Response_Underline') ? 'solid' : 'unset'};
    background-color: ${cfg.get('Response_Bg_Color') ? 'var(--color-60)' : 'unset'};
    backdrop-filter: unset;
  }
`;
  GM_addStyle(CSS);


  const referenceSpan = [...$('[role=button]')].find((e) => e.innerText === 'w_undo').parentElement; // Select the span
  const container = referenceSpan.parentElement;
  headerInject(container, referenceSpan, toggleButtonText, toggleOnClick);

  fixNavigationBarObserver.observe();
}

document.addEventListener('keydown', handleKeyPress);


waitForKeyElements('[role="article"]', (targetNodes) => {

  const targetNode = targetNodes[0];

  //console.log("# targetNodes: ", targetNodes.length);

  const isReadPage = window.location.href.includes('/read');
  const isPlayPage = window.location.href.includes('/play');

  if (isReadPage || isPlayPage) {
    // This is setup code for both read and play pages.

    // Load toggle state from sessionStorage (default to ON if not found)
    actionsExpanded = sessionStorage.getItem("actionsExpanded") === "true";
    toggleButtonText = actionsExpanded ? ActionToggleMsgOn : ActionToggleMsgOff;

    setActionVisibility(actionsExpanded); // Set the visibility from the session saved state.

    if (isReadPage) {
      handleReadPage(targetNode);
    } else if (isPlayPage) {
      handlePlayPage(targetNode);
    }
  }

});

