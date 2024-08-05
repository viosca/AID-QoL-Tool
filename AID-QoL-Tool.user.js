// ==UserScript==
// @name         AID-QoL-ToolZ
// @version      1.3.0.01z
// @description  A QoL script for AID, adding customizable hotkeys, increases performance, providing draggable and resizable modal windows.
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

/// @downloadURL https://update.greasyfork.org/scripts/1302066/AIDungeon%20QoL%20Tool.user.js
/// @updateURL https://update.greasyfork.org/scripts/1302066/AIDungeon%20QoL%20Tool.meta.js
/// require      https://cdn.jsdelivr.net/npm/tampermonkey-require-for-react

const $ = jQuery.noConflict(true);

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

    Modal_Dimensions: {
      type: 'custom',
      html: `
        <label for="Modal_Width">Width:</label>
        <input id="Modal_Width" type="number" min="100" style="width: 100px" /> px
        <label for="Modal_Height">Height:</label>
        <input id="Modal_Height" type="number" min="100" style="width: 100px" /> px`,
      set: (values, parent) => {
        const [width, height] = values.map(Number); // Convert to numbers
        parent.querySelector('#Modal_Width').value = width;
        parent.querySelector('#Modal_Height').value = height;
      },
      get: (parent) => {
        return [parent.querySelector('#Modal_Width').value, parent.querySelector('#Modal_Height').value];
      },
      default: [512, 512] // Default values for width and height
    },

    Save_Raw_Text: { type: 'checkbox', default: false },

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
          /*
          , () => {
            const playersGroup = $('[role="group"][aria-label="Players"]');
            //const viewProfileButton = $('[role="group"][aria-label="Players"]');
            const inputField = playersGroup.find('button[aria-label^="View"][aria-label$="profile"]').next().find('input')[0];

            //const playersGroup = $('[role="group"][aria-label="Players"]');
            //const viewProfileButton = playersGroup.querySelector('button[aria-label^="View"][aria-label$="profile"]');
            //const inputField = viewProfileButton?.nextSibling?.firstChild; // Path to input from profile button.
            if (inputField) {
              inputField.id = "flameplayername"; // This works, can see in dev console.
              const focusElement = inputField.parentElement;
              setTimeout(
                () => {
                  //const inputField = document.querySelector('input#flameplayername');
                  focusElement.dispatchEvent(new CustomEvent('forceFocus', { bubbles: true }));
                  //const inputField = document.querySelector('input#flameplayername');
                  //focusElement.dispatchEvent(new CustomEvent('forceFocus', { bubbles: true }));

                  //focusElement.click(); // Doesn't work.
                  //focusElement.focus(); // Doesn't work.
                  //focusElement.trigger('click'); // Doesn't work.

                  //focusElement.dispatchEvent(new Event('focus', { bubbles: true }));  // Doesn't work.
                  //focusElement.dispatchEvent(new MouseEvent('click', { bubbles: true })); // Doesn't work.

                  const mouseDownEvent = new MouseEvent('mousedown', { bubbles: true }); // Doesn't work.
                  const mouseUpEvent = new MouseEvent('mouseup', { bubbles: true }); // Doesn't work.
                  focusElement.dispatchEvent(mouseDownEvent); // Doesn't work.
                  focusElement.dispatchEvent(mouseUpEvent); // Doesn't work.
                  if (0) { // This doesn't work.
                    const existingClickListener = inputField.onclick; // Get the existing click handler
                    focusElement.onclick = null; // Remove it
                    focusElement.click(); // Or use dispatchEvent as shown above
                    focusElement.onclick = existingClickListener;
                  }
                }, 2000
              );

            }
          },
        */
          () => $('input#flameplayername').click(), // Doesn't work.
          () => $('input#flameplayername').trigger('click'), // Doesn't work.
          () => $('input#flameplayername').focus() // Doesn't work.
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
    } // End isPageActive

  }
  const selectKeys = ['ARROWLEFT', 'ENTER', 'ARROWRIGHT'];
  if (selectKeys.includes(key) && $('[role="dialog"]').length) {
    setTimeout(() => $("[role='dialog']").find("[role='button']")[selectKeys.indexOf(key)].click(), 50);
  }
};

const delayedClicks = (clicks, i = 0) => {
  if (i < clicks.length) {
    setTimeout(() => {
      clicks[i]();
      delayedClicks(clicks, i + 1);
    }, 50);
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

modalHeightCfg = !modalHeightCfg ? '50%' : `${modalHeightCfg}px`;
modalWidthCfg = !modalWidthCfg ? '50%' : `${modalWidthCfg}px`;

//textarea:not(#game-text-input, #transition-opacity, #shadow-box, #do-not-copy) {
//div#__next > div > span > div > div > div > div > div > div:nth-child(3) > div._mah-960px,
//div#__next > div > span > div > div > div > div > div > div._mah-960px {
//div#__next > div > span > div > div > div > div > div > div > div > div > div
//div#__next > div > span > div > div > div > div > div.is_Column._dsp-flex._ai-stretch._fd-column._fb-auto._bxs-border-box._pos-relative._mih-0px._miw-0px._fs-0._pt-1316335167._pr-0px._pb-1316335167._pl-0px
//div#__next > div > span > div > div > div > div > div.is_Column > div.is_Row._pr-1316335167._pl-1316335167
//div#__next > div > span > div > div > div > div > div.is_Column
//div#__next > div > span > div > div > div > div > div.is_Column._dsp-flex._ai-stretch._fd-column._fb-auto._bxs-border-box._pos-relative._mih-0px._miw-0px._fs-0._pt-1316335167._pr-0px._pb-1316335167._pl-0px
//div#__next > div > span > div > div > div > div > div.is_Column > div.is_Row > div > div > div > span > div
//div#__next > div > span > div > div > div > div > div.is_Column > div._mah-960px
//._pt-1316335167._pr-1316335167._pb-1316335167._pl-1316335167
//  div#__next ._pr-1316335167,
//  div#__next ._pl-1316335167 {
//    padding: 8px !important;
//  }
GM_addStyle(`
  div#__next > div > span {
    & > div._dsp-flex:nth-child(1) { /* Home screen. */ }
    & > div._dsp-flex:nth-child(2) { /* Play. */
      & > div.css-175oi2r:nth-child(1) { /* Game Window. */
        & > div[role="toolbar"][aria-label="Navigation bar" i] {
        }
        & > div.game-text-mask { /* The game log. */
        }
        & > div.css-175oi2r { /* Action Entry Area. */
        }
      }
      & > div._dsp-flex:nth-child(2) { /* Gear1 Window. */
        & > div.css-175oi2r { /* Gear2 Window. */
          & > div.is_Column { /* Gear3 Window. */
            & > div.is_Column:nth-child(1) { /* Gear Header. */
            }
            & > div.is_Column:nth-child(2) { /* Gear Content. */
              & > div.is_Row:nth-child(1) { /* PILL MENU */
              }
              & > div:nth-child(2) { /* A Gap */
              }
              & > div[aria-hidden="false"]:nth-child(3) { /*********** PLOT ***********/
                max-height: 100% !important;
                margin-left: 0px !important;
                margin-right: 0px !important;
              }
              & > div._dsp-flex:nth-child(4):has(+ :nth-child(5)) { /*********** STORY CARDS ***********/
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
              & > div[aria-hidden="false"]._dsp-flex:last-child { /*********** DETAILS ***********/
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
                        /* gap: var(--space-1) !important;*/
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

  /* Pill menu stuff.  */
  div#__next > div > span > div > div:nth-child(2) > div > div > div.is_Column > div:nth-child(1).is_Row > div > div:nth-child(1) {
    margin: 0px !important;
    padding: 0px !important;
    width: 100% !important;
    max-width: 100% !important;
  }
  /* Pill menu left padding turn off. */
  div#__next > div > span > div > div:nth-child(2) > div > div > div.is_Column > div:nth-child(1).is_Row > div > div:nth-child(1) > div > div > div:nth-child(1) {
    display: none !important;
  }
  /* Pill menu right padding turn off. */
  div#__next > div > span > div > div:nth-child(2) > div > div > div.is_Column > div:nth-child(1).is_Row > div > div:nth-child(1) > div > div > div:nth-child(3) {
    display: none !important;
  }

  /* These are the scroll buttons for the pill menu. Since the sidebar is wider, we don't need them.
  div#__next > div > span > div > div:nth-child(2) > div > div > div.is_Column > div:nth-child(1).is_Row > div > div:has(div[aria-label="scroll right"], div[aria-label="scroll left"]) {
    margin: 0px !important;
    max-width: 100% !important;
  }

  /* This is the overall container for the Pill menu AND switchable context. */
  div#__next > div > span > div > div:nth-child(2) > div > div.is_Column > div:nth-child(2).is_Column {
    padding-left: 8px !important;
    padding-right: 8px !important;
  }
  /* This is the pill menu. :has(.pill-switch-mask)) */
  div#__next > div > span > div > div:nth-child(2) > div > div > div:nth-child(2).is_Column > div.is_Row {
    padding-left: 0px !important;
    padding-right: 0px !important;
  }
  /* Make this container full sized.
  div#__next > div > span > div > div:nth-child(2) > div > div > div:nth-child(2).is_Column > div.is_Row._mah-960px {
    max-height: 100% !important;
  }*/

  /* This is for the story card list container including the search and create new.
  div#__next > div > span > div:nth-child(2) > div:nth-child(2) > div > div > div:nth-child(2).is_Column > div > div > div > div {
    padding-left: 0px !important;
    padding-right: 0px !important;
  }*/

  /* This is for the story card list container, only the story cards.:not(:has(.pill-switch-mask))
  div#__next > div > span > div:nth-child(2) > div:nth-child(2) > div > div > div:nth-child(2).is_Column > div > div > div > div > div > div {
    padding-left: 0px !important;
    padding-right: 0px !important;
    width: 100% !important;
    max-width: 100% !important;
  }*/

  /* This is for each story card in the list container. :not(:has(.pill-switch-mask))
  div#__next > div > span > div:nth-child(2) > div:nth-child(2) > div > div > div:nth-child(2).is_Column > div > div > div > div > div > div > * {
    padding-left: 0px !important;
    padding-right: 0px !important;
    margin-right: 0px !important;
    width: 100% !important;
    max-width: 100% !important;
  }*/

  /* This is for each story card in the list container.:not(:has(.pill-switch-mask))
  div#__next > div > span > div:nth-child(2) > div:nth-child(2) > div > div > div:nth-child(2).is_Column > div > div > div > div > div > div > * > div > div.is_Button {
    margin-right: 0px !important;
    width: 100% !important;
    max-width: 100% !important;
  }*/
  /*
  div#__next > div > span > div:nth-child(2) > div:nth-child(2) > div > div > div:nth-child(2) > div > div > div > div {
    padding-left: 0px !important;
    padding-right: 0px !important;
  }
  div#__next > div > span > div:nth-child(2) > div:nth-child(2) > div > div > div:nth-child(2) > div > div > div > div > div {
    padding-left: 0px !important;
    padding-right: 0px !important;
  }
  */

/*
  div#__next ._mah-1611765696 {
    max-height: 100% !important;
  }
*/
  /*
  ._pt-1316335136 {
    padding-top: 6px !important;
  }
  ._pb-1316335136 {
    padding-bottom: 6px !important;
  }
  */

  /*
  ._pr-1481558400 {
    padding-right: 0px !important;
  }
  ._pl-1481558338 {
    padding-left: 8px !important;
  }
  ._pr-1481558338 {
    padding-right: 8px !important;
  }
*/

/*
  ._pt-1316335167 {
    padding-top: 8px !important;
  }
  ._pb-1316335167 {
    padding-bottom: 8px !important;
  }
  ._pl-1316335167 {
    padding-left: 8px !important;
  }
  ._pr-1316335167 {
    padding-right: 8px !important;
  }
*/
/*
  ._pl-1481558307 {
    padding-left: 8px !important;
  }
  ._pr-1481558307 {
    padding-right: 8px !important;
  }
*/
/* Make Modal bottom right border square for the resize icon.
  div:has([aria-label="Modal" i]) {
    border-bottom-right-radius: 0px !important;
  }
*/

  div[id*="ScriptEditor"] div[role="alertdialog"]:last-of-type > :last-child {
    flex-grow: 1;
  }

  div[role="alertdialog"][aria-label="Modal" i] {
    width: ${modalWidthCfg}; /* Must not be important! */
    min-width: 250px !important;
    max-width: 100% !important;

    height: ${modalHeightCfg};  /* Must not be important! */
    min-height: 250px !important;
    max-height: 100% !important;

    resize: both !important;
    overflow: hidden !important;
    /*
    overflow-y: hidden !important;
    overflow-x: hidden !important;
    */
    padding: 0px !important;
    margin: 0px !important;
    border-bottom-right-radius: 0px !important;
  }


  /* These classes must be overridden to get the square corner. */
  ._bbrr-1307609874 {
    border-bottom-right-radius: 0px !important;
  }
  ._bbrr-1881205710 {
    border-bottom-right-radius: 0px !important;
  }
  /* Tweak the padding for modals. */
  div[id^="modalHeader_" i] {
    padding: 0px !important;
    flex-grow: 0 !important;
    border-bottom-style: solid !important;
    border-bottom-width: 1px !important;
    border-bottom-color: var(--color-61) !important;
    /* overflow: hidden hidden !important; */
  }
  div[id^="modalHeader_Title_" i] {
    padding: 8px !important;
    flex-grow: 0 !important;
    /* overflow: hidden hidden !important; */
  }
  div[id^="modalHeader_Menu_" i] {
    padding: 8px !important;
    flex-grow: 0 !important;
    /* overflow: hidden hidden !important; */
  }
  div[id^="modalHeader_" i]._gap-1481558338 {
    gap: 0px !important;
    column-gap: 0px !important;
    row-gap: 0px !important;
  }
  div[id^="modalHeader_" i]._h-137px {
    height: unset !important;
  }
  div[id^="modalContent_" i] {
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
  }
  div[id^="modalContent_" i] p[role="heading"] {
    padding-left: 0px !important;
    padding-right: 0px !important;
    margin-left: 0px !important;
    margin-right: 0px !important;
  }
  div[id^="modalContent_" i] + div.has(p[role="heading"]) {
    padding-left: 0px !important;
    padding-right: 0px !important;
    margin-left: 0px !important;
    margin-right: 0px !important;
  }
  div[id^="modalContent_" i] input {
    padding-left: 8px !important;
    padding-right: 8px !important;
    margin-left: 0px !important;
    margin-right: 0px !important;
  }
  div[id^="modalContent_" i] textarea {
    padding-left: 8px !important;
    padding-right: 8px !important;
    margin-left: 0px !important;
    margin-right: 0px !important;
  }
  div[id^="modalContent_Inner_" i] {
    max-height: 100% !important;
    padding: 0px !important;
    margin: 0px !important;
    min-height: 0px !important;
    overflow-x: unset !important;
    overflow-y: unset !important;
    max-height: 100% !important;
    max-width: 100% !important;
  }
    /*
    modalContent_Inner.style.padding = '0px';
    modalContent_Inner.style.overflowX = 'unset';
    modalContent_Inner.style.overflowY = 'unset';
    modalContent_Inner.style.maxHeight = '100%';
    modalContent_Inner.style.maxWidth = '100%';
*/
div[id^="modalContent_Inner_" i] button[type="button"] {
    padding-left: 8px !important;
    padding-right: 8px !important;
    margin-left: 0px !important;
    margin-right: 0px !important;
  }

  /* Target: every storyCardsTab list of button type with pad or margin left or right */
  div#modalContent_Inner_detailsTab._gap-1481558338 {
    gap: var(--space-1) !important;
  }
  div#modalContent_Inner_storyCardsTab._gap-1481558338 {
    gap: var(--space-1) !important;
  }
  div#modalContent_Inner_storyCardsTab div[role="button"]._pl-1481558338 {
    padding-left: 0px !important;
  }
  div#modalContent_Inner_storyCardsTab div[role="button"]._pr-1481558338 {
    padding-right: 0px !important;
  }
  div#modalContent_Inner_storyCardsTab div[role="button"]._mr-1481558369 {
    margin: 0px !important;
  }
  div#modalContent_Inner_storyCardsTab > div > div {
    padding-left: 0px !important;
    padding-right: 0px !important;
    margin-left: 0px !important;
    margin-right: 0px !important;
  }

  div#modalContent_Inner_storyCardsTab > div > div > div > div:nth-child(3) {
    width: 100% !important;
  }
  div#modalContent_Inner_storyCardsTab > div > div > div > div:nth-child(3) > * {
    width: 100% !important;
  }
  div#modalContent_Inner_storyCardsTab > div > div > div > div:nth-child(5) {
    padding-bottom: 0px !important;
  }
  div#modalContent_Inner_storyCardsTab > div > div > div > div:nth-child(5) {
    padding-bottom: 0px !important;
  }
  div#modalContent_Inner_StoryCardEditor {
    padding-bottom: 8px !important;
  }

  /*
  [id^="modalContent_Inner_"] > div > div > div {
    padding-left: 0px !important;
    padding-right: 0px !important;
    margin: 0px !important;
  }
*/
  /* Target the specific modal with the selected "Story Cards" tab
  div[aria-label="Modal"] div[id^="modalHeader_"] div[role="tablist"][aria-label="Section Tabs"] div[role="tab"][aria-label^="Selected tab story cards" i]
  ~ div[id^="modelContent_"] [id^="modalContent_Inner_"] > div > div > div {
      padding-left: 0px !important;
      padding-right: 0px !important;
      margin: 0px !important;
  }
*/
  /*
  #modalContent_Inner_1722033353146 > div > div > div > div > div:nth-child(3) > div:nth-child(7) > div.css-175oi2r > div
  [id^="modalContent_Inner_"] > div > div > div {
  [id^="modalHeader_"] div[role="tablist"][aria-label="Section Tabs"] div[role="tab"][aria-label^="Selected tab story cards" i] {
    [id^="modalContent_Inner_"] > div > div > div {
      padding-left: 0px !important;
    padding-right: 0px !important;
    margin: 0px !important;
  }
      */

  /*
   > div > div:nth-child(1) > div > div > div > span > div
  [id^="modalContent_Inner_"] > div {
    padding: 0px !important;
    padding-bottom: 0px !important;
  }
  [id^="modalContent_Inner_"] > div > div > div > div > div {
    padding: 0px !important;
    margin: 0px !important;
  }
    */
  /*
  ._mah-1611765696 {
    max-height: unset !important;
  }
  ._mih-1611762875 {
    min-height: 200px !important;
  }
  input._h-606181821 {
    height: var(--size-6) !important;
  }
  input._gap-1481558338 {
    gap: var(--space-1) !important;
  }
    */

  /* max-height: none !important;  /* auto does not work, shows error. */
  /*max-height: 1024px !important;  /* auto does not work, shows error. */
  /* min-height: auto !important;  /* Or min-height: 0; */
  /* height: unset !important;  /* This seems to set the height to a value that that's not resizable. */
  /* height: initial !important;  /* This seems to set the height to a smaller value that that's not resizable. */
  /* height: 300px !important; /* This seems to set the height to a value that that's not resizable. */
  /* height: 100% !important;  /* This seems seems to set it 100% the size of the text area, but it isn't resizable. */
  /* height: 25% !important;  /* This seems seems to set the internal textarea scrollable region to 25% of the size of the text area, but it isn't resizable. */
  /* height: '' !important;       /* Makes the text area resizable, but shows as error, and it's the full size of the text. */
  /* height: 400px !important;       /* Makes the text area resizable, but shows as error, and it's the full size of the text. */

  /* Chrome/Opera Fatten up the scroll bar a bit. This also fixes textarea resize icon. */
  ::-webkit-scrollbar {
    width: 8px !important;
  }

  /* Put vertical resizers on all textareas. */
  textarea:not([aria-label="Text input field" i], #game-text-input, #shadow-box) {
    min-height: 50px !important;  /* Or min-height: 0; */
    max-height: unset !important;
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
  const container = $("[aria-label='Story']");
  if (visible) {
    container.removeClass("actions-hidden");
  } else {
    container.addClass("actions-hidden");
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
  const clonedElement = buttonClone(cloneReference, label, action); // Clone the entire reference
  container.prepend(clonedElement);
}

/**********************************
** Code for Read Pages.
*/

function handleReadPage(targetNode) {

  // Use the second button if available, otherwise use the first

  // Find all buttons with innerText 'Aa'
  const aaButtons = [...$('[role=button]')].filter((e) => e.innerText === 'Aa');
  const aaButton = aaButtons.length >= 2 ? aaButtons[1] : aaButtons[0];

  const buttonContainer = aaButton.parentElement;

  function onSave(type) {
    const story = $('[aria-label="Story"]')[0];
    const title = $('[role=heading]')[0]?.innerText;

    const saveRaw = cfg.get('Save_Raw_Text');

    if (!story || !title) return alert('Wait for content to load first!');

    let text = story.innerText.replaceAll(/w_\w+\n+\s+/g, type === 'text' ? '' : '> ');
    if (type === 'md') text = '## ' + title + '\n\n' + text;

    text = text.replaceAll(/\n+/g, '\n\n');
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
  const modalContent = modalNode.children[1];
  classListRemove.forEach(className => modalContent.classList.remove(className));
}

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

  // The width and height must be removed so that the drag resize can work.
  modalNode.style.removeProperty('width');
  modalNode.style.removeProperty('height');

  // Called by both fixModalContent, and by a mutation observer that watches the modal content
  // incase of changes.
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
    //'_h-512px',
    // '_mih-0px', '_miw-0px', '_fs-0',
    // // Padding we want removed
    // '_pt-1481558400', '_pr-1481558400', '_pb-1481558400', '_pl-1481558400',
    // 'r-150rngu', // -webkit-overflow-scrolling: touch; // (has error.)
    // 'r-1rnoaur', // overflow-y: auto; // (we don't want auto scrolling on nested divs. have unset)
    // 'r-11yh6sk', // overflow-x: auto; // (we don't want auto scrolling on nested divs. have unset)
    // 'r-eqz5dr', // flex-direction: column;
    // 'r-16y2uox', // flex-grow: 1;
    // 'r-1wbh5a2', // flex-shrink: 1;
    // 'r-agouwx' // transform: translateZ(0);

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
    if (modalHeader.querySelectorAll(
      'div[role="tablist"][aria-label="Section Tabs"] div[role="tab"][aria-label^="Selected tab story cards" i]'
    ).length >= 1) {
      modalContent_Inner.firstChild.id = 'modalContent_Inner_storyCardsTab';
      modalContent_Inner.firstChild.firstChild.classList.remove('r-150rngu', 'r-1rnoaur', 'r-11yh6sk');
    }
    else if (modalHeader.querySelectorAll(
      'div[role="tablist"][aria-label="Section Tabs"] div[role="tab"][aria-label^="Selected tab plot" i]'
    ).length >= 1) {
      modalContent_Inner.firstChild.id = 'modalContent_Inner_plotTab';
    }
    else if (modalHeader.querySelectorAll(
      'div[role="tablist"][aria-label="Section Tabs"] div[role="tab"][aria-label^="Selected tab details" i]'
    ).length >= 1) {
      modalContent_Inner.firstChild.id = 'modalContent_Inner_detailsTab';
    }
  }

  setTimeout(() => {
    fixStyles(modalNode);
    fixModalContent_Inner(timestamp, modalNode, modalContent_Inner);

    // Center the modal initially (after a slight delay for rendering)
    // To allow dragging and resizing the modal, we have to disable centering.
    // But we don't want the modal to jump to the top left of the viewport.
    // So we center it manually.
    const modalRect = modalNode.getBoundingClientRect();

    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    const left = (viewportWidth - modalRect.width) / 2.0;
    const top = (viewportHeight - modalRect.height) / 2.0;

    // The path to the div that is centering the modal preventing it from being moved.
    const centeringParent = modalNodeTree.querySelector('div > span > span > div');

    // Remove potentially conflicting classes before centering
    centeringParent.classList.remove('_ai-center', '_jc-center', '_pos-fixed');

    // Apply initial left and top positions
    modalNode.style.left = `${Math.max(0, left)}px`; // Ensure left is not negative
    modalNode.style.top = `${Math.max(0, top)}px`; // Ensure top is not negative

    // Override centering styles on the parent (AFTER centering the modal)
    centeringParent.style.justifyContent = 'unset';
    centeringParent.style.alignItems = 'unset';


    if (1) { // Turned off to experiment with using the original scroller.
      const originalScroller = modalNode.closest('[data-remove-scroll-container="true"]');
      if (originalScroller) {
        originalScroller.style.overflowY = 'hidden'; // Disable scrolling on the original element
        originalScroller.removeAttribute('data-remove-scroll-container'); // Remove the attribute
      } else {
        console.warn("Original scrolling element not found in modal.");
      }
    }

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

/*
// Global variables
let isGearMenuResizing = false;
let gearMenuStartX, gearMenuStartWidth;

// Get reference to app-root div
const appRootDiv = document.querySelector('.app-root');
const gearMenuSelector = 'body > div.app-root > div#__next > div > span > div:nth-child(1) > div:nth-child(1)';

// MutationObserver for detecting the gear menu within the app-root div
const appRootObserver = new MutationObserver((mutationsList, observer) => {
  console.log("appRootObserver Got Here:");
  for (let mutation of mutationsList) {
    if (mutation.type === 'childList') {
      console.log("appRootObserver Got Here:2");
      const gearMenu = document.querySelector(gearMenuSelector); // Target the gear menu
      if (gearMenu) {
        console.log("appRootObserver Got Here:3");
        //makeGearMenuDraggableAndResizable(gearMenu);
        observer.disconnect(); // Stop observing after the gear menu is found
      }
    }
  }
});

// MutationObserver for detecting changes in the Adventure tabs
const adventureTabObserver = new MutationObserver((mutationsList, observer) => {
  console.log("adventureTabObserver Got Here:");
  for (let mutation of mutationsList) {
    if (mutation.type === 'childList') {
      const plotTab = document.querySelector('div[role="tablist"][aria-label="Section Tabs" i] [role="tab"][aria-label*="Plot" i]');
      const detailsTab = document.querySelector('div[role="tablist"][aria-label="Section Tabs" i] [role="tab"][aria-label*="Details" i]');
      if (plotTab && plotTab.getAttribute('aria-selected') === 'true') {
        console.log("adventureTabObserver Got Here: 1");
        //resizeAllTextareasInNode(plotTab);
      } else if (detailsTab && detailsTab.getAttribute('aria-selected') === 'true') {
        console.log("adventureTabObserver Got Here: 2");
        //resizeAllTextareasInNode(detailsTab);
      }
    }
  }
});

function makeGearMenuDraggableAndResizable(gearMenu) {
  const resizeHandle = document.createElement('div');
  resizeHandle.classList.add('resize-handle');
  resizeHandle.style.left = 0; // Position on the left edge
  gearMenu.appendChild(resizeHandle);

  function toggleFullScreen(buttonTextElement) {
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

  function createFullScreenButton(cloneRef, container) {
    if (!cloneRef) return;
    const fullScreenButton = buttonClone(
      cloneRef,
      "[ ]", // Button label (you can customize this)
      toggleFullScreen  // Function to handle the toggle
    );
    container.insertBefore(fullScreenButton, container.firstChild);
    container.style.display = 'flex';
    container.style.flexDirection = 'row';
    container.style.alignItems = 'center';
  }

  // Add fullscreen button (reusing existing createFullScreenButton function)
  const header = gearMenu.querySelector('[role="tablist"]'); // Find the header within the gear menu
  //const header = gearMenu.querySelector('[role="button"][aria-label="Close settings" i]'); // Find the header within the gear menu
  const closeButton = gearMenu.querySelector('[role="button"][aria-label="Close settings" i]').parentElement; // Find the header within the gear menu
  if (header) {
    const fullScreenButton = createFullScreenButton(closeButton, closeButton.parentElement.ParentElement);
    header.insertBefore(fullScreenButton, header.firstChild);
  }

  resizeHandle.addEventListener('mousedown', handleResizeStart);
  resizeHandle.addEventListener('touchstart', handleResizeStart, { passive: true });

  function handleResizeStart(e) {
    isGearMenuResizing = true;
    gearMenuStartX = e.clientX;
    gearMenuStartWidth = parseInt(document.defaultView.getComputedStyle(gearMenu).width, 10);
    document.addEventListener('mousemove', handleResizeMove);
    document.addEventListener('mouseup', handleResizeEnd);

    // Prevent default behavior for touch events to avoid scrolling
    if (e.type === 'touchstart') {
      e.preventDefault();
    }
  }

  // Modified resize logic (horizontal resizing only)
  function handleResizeMove(e) {
    if (!isGearMenuResizing) return;
    const x = e.clientX || e.touches[0].clientX;
    const newWidth = gearMenuStartWidth + (x - gearMenuStartX);
    gearMenu.style.width = `${Math.max(200, newWidth)}px`; // Minimum width of 200px
  }


  function handleResizeEnd(e) {
    isGearMenuResizing = false;
    document.removeEventListener('mousemove', handleResizeMove);
    document.removeEventListener('mouseup', handleResizeEnd);
  }
}
*/
/*
// Start observing the app-root div
if (appRootDiv) {
  appRootObserver.observe(appRootDiv, { childList: true, subtree: true });
} else {
  console.warn("app-root div not found.");
}
*/

function skipSpan(node) {
  const tagName = node.tagName.toLowerCase();
  if (tagName === 'span') {
    return node.children[0];
  } else {
    return node;
  }
}

function getModalHeader(modalNode) {
  return modalNode?.children[0];
}
function getModalHeader_Title(modalNode) {
  return getModalHeader(modalNode)?.children[0];
}
function getModalHeader_Menu(modalNode) {
  return getModalHeader(modalNode)?.children[1];
}

function getModalContent(modalNode) {
  return skipSpan(modalNode?.children[1]);
}

function getModalContent_Inner(modalNode) {
  return getModalContent(modalNode).firstChild;
}

function getModalFooter(modalNode) {
  if (modalNode?.children.length < 3) {
    return null;
  }
  return modalNode.lastChild;
}


function modalAddFullScreenButton(cloneRef, container, eventHandler) {
  if (!cloneRef) {
    console.warn("Null cloneRef in modalAddFullScreenButton!");
    return;
  }
  const fullScreenButton = buttonClone(
    cloneRef,
    "[ ]", // Button label (you can customize this)
    eventHandler // Function to handle the toggle
  );
  container.insertBefore(fullScreenButton, container.lastChild);

  container.style.display = 'flex';
  container.style.flexDirection = 'row';
  container.style.alignItems = 'center';
  container.style.justifyContent = 'unset'; // Remove default justification

  //fullScreenButton.style.marginRight = '8px';
  fullScreenButton.style.minWidth = '30px';
  fullScreenButton.style.whiteSpace = 'nowrap';

  container.style.display = 'flex';
  container.style.alignItems = 'right';
  container.style.flexGrow = '1';
  container.style.justifyContent = 'flex-end';
}

function toggleFullScreen(buttonTextElement) {
  const modalNode = buttonTextElement.closest("div[aria-label='Modal' i]");
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

// Function to handle new modals.
// modalNodeTree is the modal's branch div from document.body.
//
function handleNewModal(modalNodeTree) {

  const timestamp = Date.now();

  // Wait for the specific modal structure
  waitForSubtreeElements(
    "div[aria-label='Modal' i]:has(div[role='button'])",
    (modalNodes) => {
      console.log(modalNodes);
      if (modalNodes.length !== 1) {
        console.warn("Modal nodes, there can be only 1. Found: ", modalNodes.length);
        return;
      }

      const modalNode = modalNodes[0];
      if (!modalNode) {
        console.warn("Null Modal node found in handleNewModle.");
        return;
      }
      // Skip a wrapping span element.
      function skipSpan(node) {
        const tagName = node.tagName.toLowerCase();
        if (tagName === 'span') {
          return node.children[0];
        } else {
          return node;
        }
      }

      function getModalHeader(modalNode) {
        return modalNode?.children[0];
      }
      function getModalHeader_Title(modalNode) {
        return getModalHeader(modalNode)?.children[0];
      }
      function getModalHeader_Menu(modalNode) {
        return getModalHeader(modalNode)?.children[1];
      }

      function getModalContent(modalNode) {
        return skipSpan(modalNode?.children[1]);
      }

      function getModalContent_Inner(modalNode) {
        return getModalContent(modalNode).firstChild;
      }

      function getModalFooter(modalNode) {
        if (modalNode?.children.length < 3) {
          return null;
        }
        return modalNode.lastChild;
      }

      // Assign IDs for CSS.

      // This is the root node for the entire modal in document.body.
      modalNodeTree.id = "modalNodeTree_" + timestamp;

      // This is the Header for the Modal.
      const modalHeader = getModalHeader(modalNode);
      modalHeader.id = "modalHeader_" + timestamp;

      // The header contains a title and an optional menu.
      const modalHeader_Title = getModalHeader_Title(modalNode);
      modalHeader_Title.id = "modalHeader_Title_" + timestamp;

      // Check for an optional menu container.
      let modalHeader_Menu = getModalHeader_Menu(modalNode);
      if (modalHeader_Menu) {
        //const modalPillMenu = modalHeader_MenuContainer.querySelectorAll('div[role="tablist"][aria-label="Section Tabs"]');
        modalHeader_Menu.id = "modalHeader_Menu_" + timestamp;
      }

      // const modalContent = modalNode?.children[1];
      // const modalContent = modalNode.children[1].querySelector('span > div') || modalNode.children[1];
      //const modalContent = modalNode.querySelector(':scope > span > div, :scope > div:nth-child(2)');
      // The modalContent may be wrappered in span classes.
      //const modalContent = modalNode.querySelector(':scope > span > div, :scope > div:nth-child(2)');
      const modalContent = getModalContent(modalNode);
      modalContent.id = "modalContent_" + timestamp;

      const modalContent_Inner = getModalContent_Inner(modalNode);
      modalContent_Inner.id = "modalContent_Inner_" + timestamp;

      const modalFooter = getModalFooter(modalNode);
      if (modalFooter) {
        modalFooter.id = "modalFooter_" + timestamp;
      }

      makeModalDraggableAndResizable(timestamp, modalNodeTree, modalNode);

      /// return;

      waitForSubtreeElements(
        'div[aria-label="Modal" i] div[role="button" i][aria-label="Close modal" i], ' +
        'div[aria-label="Modal" i] div[role="button" i]',
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
              waitForSubtreeElements(
                tablistSelector,
                (matchingElements) => {
                  if (matchingElements.length >= 4) { // Check if all 3 tabs are found
                    modalNodeTree.id += ".ScenarioAdventureEditor";

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
                },
                modalNode,
                true
              );
            }
            // Story card updates.
            else if (modalNode.querySelectorAll("textarea[aria-labelledby='scEntryLabel']").length >= 1) {
              //console.log("Found story card modal");
              //console.log("scEntryLable", modalNode);

              modalNodeTree.id += ".StoryCardEditor";
              modalContent_Inner.firstChild.id = "modalContent_Inner_StoryCardEditor";
              //  modalHeader.padding = '8px';
              setTimeout(() => {
                //modalContent.style.maxHeight = 'calc(100% - ' + modalHeader.offsetHeight + 'px)';
                /// makeModalDraggableAndResizable(timestamp, modalNodeTree, modalNode);
                modifyStoryCardEditor(modalNode);
                const closeButton = modalNode.querySelector("div[role='button'][aria-label='Close modal' i]");
                modalAddFullScreenButton(closeButton, modalHeader, toggleFullScreen);
              }, 100); // Adjust delay as needed
              // Add additional story card updates here...
              //
            }

            // #content-\:r6ji\: > div > div._dsp-flex._fb-auto._bxs-border-box._pos-relative._mih-0px._miw-0px._fs-0._pr-1481558369._pl-1481558307._pt-1481558338._pb-1481558338._gap-1481558338._w-10037._fd-row._ai-center._jc-441309761._bbw-0px._btc-43811612._brc-43811612._bbc-43811612._blc-43811612._maw-480px._btw-0px._brw-0px._blw-0px._bbs-solid._bts-solid._bls-solid._brs-solid > div > div.is_Row._dsp-flex._fd-row._fb-auto._bxs-border-box._pos-relative._mih-0px._miw-0px._fs-0._ai-center._jc-441309761 > div > h1

            else if ($(modalHeader).find("h1:contains('Adventure')").length > 0) {
              setTimeout(() => {
                modalNodeTree.id += ".ContentView.Adventure";
                /// makeModalDraggableAndResizable(timestamp, modalNodeTree, modalNode);
              }, 100); // adjust as needed
            }
            // Fix the irritating small window size for the script editor.
            //
            else if ($(modalNode).find("p:contains('Shared Library')").length > 0) {
              setTimeout(() => {
                waitForKeyElements(".monaco-editor .view-lines", (editorElements) => {
                  modalNodeTree.id += ".ScriptEditor";
                  const editorContainer = modalNode?.children[1];

                  if (editorContainer) {
                    //editorContainer.style.height = "90%";
                  } else {
                    console.warn("Editor container div not found in script editor modal");
                  }
                  //modalNode.dataset.hasEditorMods = "true";
                }, true);
              }, 100); // adjust as needed
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
          if (node.querySelector("div[aria-label='Modal' i]")) {
            console.log("New modal detected in document.bodyZ");
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
//let modalMutationObserver = new DOMObserver(modalMutationObserverCB, document.body, { childList: true, subtree: true });
//modalMutationObserver.observe();

// Fist the state.message display locking out the Navigation bar.
//
function fixNavigationBar() {
  const navBar = document.querySelector('div[aria-label="Navigation bar"]');
  const dialog = document.querySelector('.css-175oi2r[style*="z-index: 3"]');

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


waitForKeyElements("[role='article']", (targetNodes) => {

  const targetNode = targetNodes[0];

  const isReadPage = window.location.href.includes('/read');
  const isPlayPage = window.location.href.includes('/play');

  if (isReadPage || isPlayPage) {
    // This is setup code for both read and play pages.
    //targetNode = $("[role='article']")[0];

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

