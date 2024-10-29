// ==UserScript==
// @name         AID-QoL-Toolc
// @version      2.0.0d
// @description  An Enhanced QoL script for AID, adding customizable hotkeys, increases performance, providing draggable and resizable modal windows, etc.
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
// @grant        GM_xmlhttpRequest
// @grant        GM_webRequest
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

$ = jQuery.noConflict(true);

/**
 * Attempts to retrieve and parse JSON data from a script tag with the ID '__NEXT_DATA__'.
 *
 * @returns {Object|undefined} The parsed JSON data if found and successfully parsed, otherwise undefined.
 */
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
//console.log("nextData: ", nextData);
const GRAPHQL_HOST = nextData.runtimeConfig.GRAPHQL_HOST;
const GRAPHQL_ENDPOINT = `https://${GRAPHQL_HOST}/graphql`;

/*

GM_xmlhttpRequest({
  method: "POST",
  url: GRAPHQL_ENDPOINT,
  onload: function(response) {
    // Parse the response JSON
    if (response.readyState === 4 && response.status === 200) { // Check for success
      try {
        let graphQLData = JSON.parse(response.responseText);
        console.log(graphQLData); // Log the parsed GraphQL data
        // Modify the graphQLData object as needed
      } catch (error) {
        console.error("Error parsing JSON:", error);
      }
    } else {
      console.error("GraphQL request failed with status:", response.status);
    }
  },
  onreadystatechange: function(response) {
    if (response.readyState === 4 && response.status === 200) {
      // Request completed successfully
      let requestData = JSON.parse(response.response);
      // Access and modify the request data here
    }
  }
});
*/
let CSS_Elements = {};

const scriptName = GM_info.script.name;
const currentVersion = GM_info.script.version;
let storedVersion = GM_getValue('scriptVersion');
//console.log("GM_info: ", GM_info);

GM_addStyle(`
  .css-11aywtz,._dsp_contents {
      user-select: text !important;
  }
`);

GM_addStyle(`
  /* This is nested CSS, it mostly mirrors the AID site. */
  /* div#__next > div > span, /* beta and prod. */
  div#__next > div > span > span { /* alpha */
    & > div._dsp-flex:nth-child(1) { /* Home screen. */ }
    & > div._dsp-flex:nth-child(2) { /* Play. */
      & > div.css-175oi2r:nth-child(1) { /* Game Window. */
        /* Make the Nav bar completely opaque. */
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
      /* The gear menu would pop here. But that done separately. */
    }
  }
`);

GM_addStyle(`
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
`);

GM_addStyle(`
  &:has(div:has(img[alt="Content Image" i][data-nimg="fill"])) {
    /* Styles for the grandparent div if it has the image as a descendant */
    resize: vertical !important;
    max-height: 100% !important;
    max-width: 100% !important;
    overflow: auto !important;
    flex-grow: 1 !important;
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
`);
GM_addStyle(`
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
`);
GM_addStyle(`
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
`);
GM_addStyle(`
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
`);
GM_addStyle(`
  /* This turns off the background mask for all modals so that game play text is visible during modal editing. */
  body > div[id^="modalNodeTree_"] > span > span > div > button {
    opacity: 0 !important;
  }
`);
GM_addStyle(`
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
`);
GM_addStyle(`
  /* Modal: Generic Modal Styling.
  */

  div[role="alertdialog"][aria-label*="Modal" i] {
    /* flex-grow: 1 !important; /* */

    resize: both !important;
    overflow: hidden !important;
    position: absolute !important;

    padding: 0px !important;
    margin: 0px !important;
    border-bottom-right-radius: 0px !important;

  }
  /* Story Card Editor Modal is special, it has it's own aria-label. */
  div[aria-label="Story Card Edit Modal"] {
    & input._h-606181821 { height: var(--size-6); }
    & div[id^="modalContent_Inner_detailsTab_TS"] {
      gap: 4px !important;
    }
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
`);
GM_addStyle(`
  /* Modal: Story Card Styling.
  */
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
`);
GM_addStyle(`
div[id^="modalContent_Inner_StoryCardEditor_TS" i] {
  padding-bottom: 8px !important;
}
`);
GM_addStyle(`
  /* Miscelaneous Styles.
  */
  /* These classes must be overridden to get the square corner. */
  ._bbrr-1307609874 {
    border-bottom-right-radius: 0px !important;
  }
  ._bbrr-1881205710 {
    border-bottom-right-radius: 0px !important;
  }

  /* Chrome/Opera Fatten up the scroll bar a bit. This also fixes textarea resize icon. */
  ::-webkit-scrollbar {
    width: 8px !important;
  }
  div[role=menu][aria-label="Menu" i]
    div.css-175oi2r.r-150rngu.r-eqz5dr.r-16y2uox.r-1wbh5a2.r-11yh6sk.r-1rnoaur.r-agouwx {
      user-select: text !important;
      & > div.css-175oi2r {
        user-seletc: text !important;
        & > div.is_Column._dsp-flex {
          user-seletc: text !important;
          & > h1 {
            user-select: text !important;
          }
        }
      }
    }
  }
`);
GM_addStyle(`
  /* TextArea Styling.
  */
  /* Put vertical resizers on all textareas. */
  textarea:not(
    [aria-label="Text input field" i], /* Not gameplay/action entry. */
    [aria-label="Edit memory input" i], /* Not in memory editor. */
    #game-text-input,  /* Not in game text input. */
    #shadow-box /* Not for past action editor. */
    )
    {
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
  /* Handle Notes in the Story Card Editor. */
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
`);

const styleGearMenuWrapper = `
  div[id^=gearMenu-Wrapper-TS] {
    /* put a square border radius so it doesn't clip the scrollbar. */
    border-bottom-right-radius: 0px !important;
    div[id^=gearMenu-TS]:only-child {
      div[id^=gearMenu-Header-TS]:first-child {
        /* gearMenuAdventure and gearMenuGameplay mount in here.*/
      }
    }
  }
`; // styleGearMenuWrapper
GM_addStyle(styleGearMenuWrapper);

const styleGearMenuAdventure = `
  div[id^=gearMenu-Adventure-TS] {
    flex-grow: 1 !important;
    flex-shrink: 1 !important;
    padding-left: 8px !important;
    padding-right: 0px !important; /* */
    padding-top: 8px !important;
    padding-bottom: 8px !important; /* */
    max-height: 100% !important;
    overflow-y: hidden !important;

    & .r-2eszeu { scrollbar-width: 8px !important; }
    & .r-150rngu { -webkit-overflow-scrolling: touch; }
    & .r-1rnoaur { overflow-y: unset; }
    & ._gap-1481558307 { gap: 8px !important; }
    & ._gap-1481558369 { gap: 8px !important; }
    & ._gap-1481558338 { gap: 8px !important; }

    & ._pl-1316335167 { padding-left: 8px !important; }
    & ._pr-1316335167 { padding-right: 8px !important; }
    & ._pt-1316335167 { padding-top: 8px !important; }
    & ._pb-1316335167 { padding-bottom: 8px !important; }

    & ._pl-1481558276 { padding-left: 8px !important; } /* */
    & ._pr-1481558276 { padding-right: 8px !important; } /* */
    & ._pt-1481558276 { padding-top: 8px !important; } /* */
    & ._pb-1481558276 { padding-bottom: 8px !important; } /* */

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
  }
  div[id^="gearMenu-Adventure-Pill-Header-TS"]:first-child {
    /* since the space is less of an issue, turn off the horiz scrolling arrows. */
    flex-grow: 0 !important;
    flex-shrink: 0 !important;
    padding-left: 0px !important;
    padding-right: 0px !important;
    & > div:only-child {
      & > div:nth-child(2) {
        display: none !important;
      }
    }
    div:has(> div[aria-label="Section Tabs"][role="tablist"]) {
      margin-left: unset !important;
      width: unset !important;
    }

    div[aria-label="Section Tabs"][role="tablist"] {
      & > div:only-child {
        & > div:nth-child(1) { display: none !important; }
        & > div:nth-child(3) { display: none !important; }
      }
    }

    div[role=button][aria-label="scroll right" i] {
      display: none;
    }
    div[role=button][aria-label="scroll left" i] {
      display: none;
    }
    & ._pl-1316335167 { padding-left: 0px !important; }
    & ._pr-1316335167 { padding-right: 0px !important; }
    & ._pb-1316335167 { padding-bottom: 8px !important; }
    & ._pt-1316335167 { padding-top: 0px !important; }
  }

  div[id^="gearMenu-Adventure-Pill-Content-TS"] {
    max-height: 100% !important;
    padding-bottom: 0px !important;
    overflow-y: auto !important; /* */
    scrollbar-gutter: stable !important; /* */
    flex-grow: 1 !important; /* */
    flex-shrink: 1 !important; /* */
    & ._h-606181883 { height: unset !important; }
    & > div[id^=gearMenu-Adventure-Pill-Content_Inner-TS]:only-child {
      flex-grow: 1 !important;
      flex-shrink: 0 !important; /* must be off for scroll bar to work on parent container. */
      /* max-height: 100% !important; /* must be off for scroll bar to work on parent container. */
      height: unset !important;

      & > div[id^=gearMenu-Adventure-Pill-Plot-TS][aria-hidden="false"] {
        flex-grow: 1 !important;
        flex-shrink: 1 !important;
        max-height: 100% !important;
        height: unset !important;
        & > div:only-child {
          max-height: 100% !important;
          padding-bottom: unset !important;
        }
      }

      & > div[id^="gearMenu-Adventure-Pill-Story_Cards-TS"] {
        max-width: 100% !important;
        width: 100% !important;
        & .r-11yh6sk { overflow: unset !important; }
        & > div:only-child {
          overflow: unset !important;
          height: 100% !important;
          width: 100% !important;
          & > div:only-child {
            height: 100% !important;
            width: 100% !important;
            & > div:only-child {
              height: 100% !important;
              width: 100% !important;
              padding: 0px !important;
              & > div:only-child {
                height: 100% !important;
                width: 100% !important;
                & > div:nth-child(1) {
                  /* Padding? */
                  padding-left: 0px !important;
                  padding-right: 0px !important;
                }
                & > div:nth-child(2) {
                  /* Search and Filters container. */
                  padding-bottom: 8px !important;
                }
                & > div:nth-child(3) {
                  /* The list of story card buttons and add story card begins here. */
                  height: 100% !important;
                  width: 100% !important;
                  padding-bottom: 8px !important;
                  padding-top: 8px !important;
                  & > div {
                    max-width: 100% !important;
                    width: 100% !important;
                    & > div:nth-child(1) {
                      max-width: 100% !important;
                      width: 100% !important;
                      gap: 4px !important;
                      & > div[role="button" i]:only-child {
                        width: 100% !important;
                        margin-right: 0px !important;
                        align-items: center !important;
                        /*height: unset !important;
                        max-height: unset !important; */
                        padding: 6px !important;
                        & ._h-1611761759 { height: unset !important; }
                        & > div#top-down-mask {
                          -webkit-mask-image: none !important;
                          mask-image: none !important;
                        }
                        & > div:nth-child(3) {
                          background-color: rgb(30 30 30)!important;
                          opacity: 1 !important;
                        }
                      }
                    }
                    & > div:nth-child(2) {
                      width: 100% !important;
                      height: 4px !important;
                    }
                  }
                }

                & > div:nth-child(4) {
                }
                & > div:nth-child(5) {
                  padding: 0px !important;
                }
              }
            }
          }
        }
      }
      & > div[id^="gearMenu-Adventure-Pill-Details-TS"][aria-hidden="false"] {
        flex-grow: 1 !important;
        flex-shrink: 1 !important;
        /* max-height: 100% !important; /* */
        /* height: unset !important; /* */
        & > div:only-child {
          max-height: 100% !important; /* */
          padding-bottom: unset !important;
        }
      }
    }
  }
`; // styleGearMenuAdventure
GM_addStyle(styleGearMenuAdventure);

const styleGearMenuGameplay = `
  div[id^=gearMenu-Gameplay-TS] {
    flex-grow: 1 !important;
    /* flex-shrink: 1 !important; /* */
    padding-left: 8px !important;
    padding-right: 8px !important;
    padding-top: 8px !important;
    padding-bottom: 8px !important; /* */
    overflow-y: auto !important; /* */
    scrollbar-gutter: stable !important; /* */
    /* max-height: 100% !important; /* */
    /* overflow: hidden !important; /* */

    & .r-2eszeu { scrollbar-width: 8px !important; } /* */
    /* & .r-150rngu { -webkit-overflow-scrolling: touch; } /* */
    /* & .r-1rnoaur { overflow-y: unset; } /* */

    & ._h-606181883 { height: unset; !important; }

    & ._gap-1481558307 { gap: 8px !important; }
    & ._gap-1481558369 { gap: 8px !important; }
    & ._gap-1481558338 { gap: 8px !important; }

    & ._pl-1316335167 { padding-left: 8px !important; }
    & ._pr-1316335167 { padding-right: 8px !important; }
    & ._pt-1316335167 { padding-top: 8px !important; }
    & ._pb-1316335167 { padding-bottom: 8px !important; }

    & ._pl-1481558276 { padding-left: 8px !important; } /* */
    & ._pr-1481558276 { padding-right: 8px !important; } /* */
    & ._pt-1481558276 { padding-top: 8px !important; } /* */
    & ._pb-1481558276 { padding-bottom: 8px !important; } /* */

    & ._pl-1481558338 { padding-left: 8px !important; }
    & ._pr-1481558338 { padding-right: 8px !important; }
    & ._pt-1481558338 { padding-top: 8px !important; }
    & ._pb-1481558338 { padding-bottom: 8px !important; }

    & ._pl-1481558307 { padding-left: 8px !important; }
    & ._pr-1481558307 { padding-right: 8px !important; }
    & ._pt-1481558307 { padding-top: 8px !important; }
    & ._pb-1481558307 { padding-bottom: 8px !important; }

    & ._pb-1316335136 { padding-bottom: 8px !important; }
    & ._pt-1316335136 { padding-top: 8px !important; }
    & ._pl-1316335136 { padding-left: 8px !important; }
    & ._pr-1316335136 { padding-right: 8px !important; }

    & ._ml-1481558338 { margin-left: 0px !important; }
    & ._ml-1481558369 { margin-left: 0px !important; }
    & > div:only-child {
      /* flex-grow: 1 !important; /* */
      & > div:only-child {
        /* flex-grow: 1 !important; /* */
        & > div:first-child {
          /* flex-grow: 1 !important; /* */
          padding: 0px !important;
          & > div[id^="gearMenu-Gameplay-Pill-TS"] {
            /* flex-grow: 1 !important; /* */
            & > div[id^="gearMenu-Gameplay-Pill-Header-TS"]:first-child {
              /* See below. */
            }
            & > div:nth-child(2) {
              /* height: 8px !important; /* */
              height: unset !important; /* */
              padding-top: 8px !important;/* */
            }
            /* Mount Points:
            & > div[aria-label="AI settings" i]:nth-child(3) {
            }
            & > div[aria-label="Display settings" i]:nth-child(3) {
            }
            */
          }
          & > div:last-child {
            height: unset !important;
            min-height: unset !important;
          }
        }
        & > div:last-child {
          height: unset !important;
          min-height: unset !important;
        }
      }
    }
  }

  div[id^="gearMenu-Gameplay-Pill-Header-TS"] {
    /* flex-grow: 0 !important; /* */
    /* flex-shrink: 0 !important; /* */
    padding-left: 0px !important; /* */
    padding-right: 0px !important; /* */

    & ._pl-1481558338 { padding-left: 0px !important; }

    & > div:only-child {
      & > div:nth-child(2) {
        display: none !important;
      }
    }
    div:has(> div[aria-label="Section Tabs"][role="tablist"]) {
      margin-left: unset !important;
      width: unset !important;
    }

    div[aria-label="Section Tabs"][role="tablist"] {
      & > div:only-child {
        & > div:nth-child(1) { display: none !important; }
        & > div:nth-child(3) { display: none !important; }
      }
    }

    div[role=button][aria-label="scroll right" i] {
      display: none;
    }
    div[role=button][aria-label="scroll left" i] {
      display: none;
    }
    & ._pl-1316335167 { padding-left: 0px !important; }
    & ._pr-1316335167 { padding-right: 0px !important; }
    & ._pb-1316335167 { padding-bottom: 8px !important; }
    & ._pt-1316335167 { padding-top: 0px !important; }
  }

  div[aria-label="Display settings" i] {
    /* max-height: 100% !important; /* */
    padding-bottom: 8px !important; /* */
    /* overflow-y: auto !important; /* */
    /* scrollbar-gutter: stable !important; /* */
    /* flex-grow: 1 !important; /* */
    /* flex-shrink: 1 !important; /* */
    div[aria-label="Theme"] {
      height: unset !important;
      padding: 8px !important;
    }
    div[aria-label="Accessibility"] {
      height: unset !important;
      padding: 8px !important;
    }
    div[aria-label="Behavior"] {
      height: unset !important; /* */
      padding: 8px !important;
    }
  }

  div[aria-label="AI settings" i]
  {
    /* max-height: unset !important; /* */
    padding-bottom: 0px !important;
    /* overflow-y: auto !important; /* */
    /* overflow-x: hidden !important; /* */
    /* scrollbar-gutter: stable !important; /* */
    /* flex-grow: 1 !important; /* */
    /* flex-shrink: 0 !important; /* */
    /* & ._ox-hidden { overflow-x: unset !important; } /* */
    /* & ._oy-hidden { overflow-y: unset !important; } /* */

    & div:has(> div[aria-label="Story Generator" i]) {
      /* height: unset !important; /* */
      /* overflow: unset !important; /* */
      & > div[role="button"][aria-label="Story Generator" i]:first-child {
        height: unset !important; /* */
        padding: 8px !important;
        /* overflow: unset !important; /* */
      }
      & > div:last-child {
        height: unset !important; /* */
        padding: 0px !important;
        /* overflow: unset !important; /* */
        & div[role="button"] {
          height: unset !important; /* */
          padding-top: 8px !important;
          padding-bottom: 8px !important;
        }
      }
    }

    & div:has(> div[aria-label="Image Generator" i]) {
      height: unset !important; /* */
      /* overflow: unset !important; /* */
      & > div[role="button"][aria-label="Image Generator" i]:first-child {
        height: unset !important; /* */
        padding: 8px !important;
        /* overflow: unset !important; /* */
      }
      & > div:last-child {
        height: unset !important; /* */
        padding: 0px !important;
        /* overflow: unset !important; /* */
      }
    }

    & div:has(> div[aria-label="Testing & Feedback" i]) {
      height: unset !important; /* */
      /* overflow: unset !important; /* */
      & > div[role="button"][aria-label="Testing & Feedback" i]:first-child {
        height: unset !important; /* */
        padding: 8px !important;
        /* overflow: unset !important; /* */
      }
      & > div:last-child {
        height: unset !important; /* */
        padding: 0px !important;
        /* overflow: unset !important; /* */
      }
    }
  }
`; // styleGearMenuGameplay
GM_addStyle(styleGearMenuGameplay);

if (1) {
  let disclaimerReason = '';
  if (!storedVersion || storedVersion !== currentVersion) {
    GM_setValue('scriptVersion', currentVersion);
    GM_deleteValue('disclaimerShown');
    disclaimerReason = storedVersion ? ' (version change) ' : ' (initial run) ';
  }

  document.addEventListener('DOMContentLoaded', () => {

    const popupHtml = `
<div id="disclaimerPopup" style="visibility: visible;">
  <div class="popup-content">
    <center><h1>Enhanced QoL Tool</h1></center>
    <center><h2>${scriptName} v.${currentVersion}${disclaimerReason}</h2></center>
    <center>This script provides enhancements to the AI Dungeon website.</center>
    <hr>
    <center><h2>How to prevent hoof in mouth disease</h2></center>
    <center><h3>(Please, actually read this and check the boxes.)</h3></center>
    <hr>
    <label class="disclaimer-label">
      <input type="checkbox" class="disclaimer-checkbox">
      You understand that using this tampermonkey Enhanced QoL Tool plugin modifies the AI Dungeon (AID) website code in your browser.
      It may introduce problems with the <i>display</i> of the AID website.
      While using it, if you find what looks like a bug in the AID website,
      you will disable this tampermonkey plugin, retest and verify the bug is actually with the AID website before reporting bugs.
    </label>
    <hr>
    <label class="disclaimer-label">
      <input type="checkbox" class="disclaimer-checkbox">
      Furthermore, the AI Dungeon website can change <i>without notice</i> thereby breaking this tampermonkey Enhanced QoL Tool script <i>at any time</i>.
      AI Dungeon is under no obligation to users of this script to notify users of changes that may break this script (as it shouldn't be).
    </label>
    <hr>
    <center><h3>Please, Please, Please!</h3></center>
    <label class="disclaimer-label">
      <input type="checkbox" class="disclaimer-checkbox">
      If you use this script and think you've found a bug on AID's website,
      DISABLE this script first and retest to ensure it is not a bug in this tool!
      The AID development team work diligently to maintain and enhance their website,
      the last thing any of us need is to occupy their time researching bugs that are not theirs.
      If you report a bug to AID that is not theirs, but is from this tool, <b>then that will be your walk of shame</b>. You have been warned.
      <i>If this is a problem for you, then please, do not use this tool.</i>
    </label>
    <hr>
    <div id="scDelimInputSpan">
      <button id="closePopup" disabled>I accept! (Close)</button>
    </div>
  </div>
</div>
`;

    GM_addStyle(`
  #disclaimerPopup {
    position: absolute;
    background-color: rgba(0, 0, 0, 0.5);
    display: flex;
    flex-grow: 1;
    justify-content: center;
    align-items: center;
    visibility: visible;
    z-index: 1000000;
    top: 0; /* */
    left: 0; /* */
    width: 100%; /* */
    height: 100%; /* */
  }
  .popup-content {
    z-index: 1000001;
    font-family: Arial, Helvetica, sans-serif;
    background-color: black;
    color: white;
    border: 1px solid gray;
    padding: 20px;
    width: 35%;
    border-radius: 5px;
    border-color: white;
    border-width: 1px;
    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.3);
    position: relative;
  }
  #scDelimInputSpan {
    display: flex;
    padding-top: calc(20px - 0.5em);
    justify-content: center;
  }
  #closePopup {
    font-family: Arial, Helvetica, sans-serif;
    margin: 0 auto;
    padding: 8px;
    border-width: 1px;
    border-color: white;
    border-style: solid;
  }
  .disclaimer-label {
    position: relative;
    z-index: 1000002;
    opacity: 1;
    color: white;
    accent-color: white;
    cursor: pointer;
  }
  .disclaimer-checkbox {
    appearance: checkbox;
    display: inline;
    visibility: visible;
    position: relative;
    z-index: 1000003;
    opacity: 1;
    accent-color: white;
    color: white;
    margin-right: 5px;
    margin-left: 0px;
  }
  `);

    // Check if the popup has been shown before
    //if (!localStorage.getItem('disclaimerShown')) {
    if (!GM_getValue('disclaimerShown')) {
      document.body.innerHTML += popupHtml;

      // Show the popup
      document.getElementById('disclaimerPopup').style.display = 'flex';

      // Get all disclaimer checkboxes
      const checkboxes = document.querySelectorAll('.disclaimer-checkbox');

      // Function to check if all checkboxes are checked
      function areAllCheckboxesChecked() {
        return Array.from(checkboxes).every(checkbox => checkbox.checked);
      }

      const disabledColor = 'gray';
      // Add event listeners to checkboxes
      checkboxes.forEach(checkbox => {
        checkbox.addEventListener('change', () => {
          // Enable/disable the close button based on checkbox states
          const closeButton = document.getElementById('closePopup');
          closeButton.disabled = !areAllCheckboxesChecked();
          closeButton.style.backgroundColor = areAllCheckboxesChecked() ? '' : disabledColor; // Set background color
          closeButton.style.cursor = areAllCheckboxesChecked() ? 'pointer' : 'none';
          //document.getElementById('closePopup').disabled = !areAllCheckboxesChecked();
        });
      });

      document.getElementById('closePopup').style.backgroundColor = disabledColor;

      // Handle close button click
      document.getElementById('closePopup').addEventListener('click', () => {
        const popup = document.getElementById('disclaimerPopup');
        popup.style.display = 'none';
        popup.style.visibility = 'hidden';
        popup.remove();
        GM_setValue('disclaimerShown', true);
        //localStorage.setItem('disclaimerShown', 'true'); // Mark popup as shown
        location.reload(); // Force a page refresh
      });
    }
  });
}

/**
 * Adds a button clone to a container.
 *
 * @param {HTMLElement} cloneRef - An existing button element to be cloned for styling the new button.
 * @param {HTMLElement} container - The container element where the button will be added.
 * @param {string} label - The label or font icon to use as the label for the button.
 * @param {function} eventHandler - The function to be called when the button is clicked.
 * @param {string} [placement='beforeend'] - The placement of the button relative to the container's children. Possible values: 'beforebegin', 'afterbegin', 'beforeend', 'afterend', 'before', 'after'.
 * @param {HTMLElement} [referenceChild=null] - An optional child element within the container. Used for 'before' and 'after' placements to insert the button before or after this child.
 */
function foo(cloneRef, container, label, eventHandler, placement = 'beforeend', referenceChild = null) {
  return addButtonClone(cloneRef, container, "[ ]", toggleFullScreen, placement = 'beforeend', referenceChild = null);
}
if (1) {
  const AISettings_Model_Settings_Selector = ''
    + 'div:has(> div[aria-label="Model Settings" i]) ' // The Modal Settings heading.
    ;
  waitForKeyElements(AISettings_Model_Settings_Selector, (containerNodes) => {
    if (!containerNodes || !containerNodes.length) {
      console.log("containerNodes not defined.");
      return;
    }
    //console.log("containerNodes found: ", containerNodes);
    const modelContainer = containerNodes[0];

    // Contains the menu content for the AI Model Pill Menu.
    const AI_SettingsContainer = modelContainer.closest('[aria-label="AI Settings" i]');
    //console.log("AI_SettingsContainer: ", AI_SettingsContainer);

    //
    const gearMenu = modelContainer.closest('div[id^=gearMenu-TS i]');
    if (!gearMenu) console.log("Null gearMenu in AI Settings copy.");
    const closeSettings = gearMenu?.querySelector('div[role=button][aria-label="Close settings" i]');
    if (!closeSettings)
      console.log("Cant get gear 'close settings' for cloner.");
    else {
      /**
       * Event handler for copying settings data.
       *
       * @param {HTMLElement} buttonTextElement - A reference to the copy button.
       */
      async function copySettingsData(buttonTextElement) {
        const modelNameContainer = AI_SettingsContainer.querySelector('div[aria-label^="AI Model:" i]');
        const modelName = modelNameContainer ? modelNameContainer.ariaLabel.split(': ')[1] : "Unknown Model";

        const modelSettingsAccordion = modelContainer.querySelector('div[aria-label="Model Settings"]');
        if (modelSettingsAccordion.getAttribute('aria-expanded') === "false") {
          modelSettingsAccordion.click();
          await new Promise(resolve => setTimeout(resolve, 2));
        }

        const modelSettingsContainers = modelContainer.querySelectorAll('div[aria-label="Model Settings"] + div > div:only-child > div');
        if (modelSettingsContainers.length > 0) {
          let settingsData = { "AI Model": modelName, "await": 0 };
          // if (1) {

          for (let i = 0; i < modelSettingsContainers.length; i++) {
            const element = modelSettingsContainers[i];

            const currentSettingName = element.querySelector('p:first-child').innerHTML;
            const currentSettingInputElement = element.querySelector('input[type="search"]');
            const currentSettingInputValue = currentSettingInputElement ? currentSettingInputElement.value : "null input element";

            const currentSettingSliderElement = element.querySelector('div[role="slider"]');
            const currentSettingSliderValue = currentSettingSliderElement ? currentSettingSliderElement.getAttribute('aria-valuenow') : "null slider element";

            if (currentSettingInputValue === "" || currentSettingSliderValue === "" || currentSettingInputValue !== currentSettingSliderValue) {
              await new Promise(resolve => setTimeout(resolve, 1)); // Wait for 10ms
              i--; // Decrement the counter to restart the current iteration
              settingsData["await"]++;
              continue; // Skip to the next iteration
            }
            settingsData[currentSettingName] = currentSettingInputValue;

          }
          // } else {

          //   modelSettingsContainers.forEach((element) => {
          //     const currentSettingName = element.querySelector('p:first-child').innerHTML;
          //     const currentSettingInputElement = element.querySelector('input[type="search"]');
          //     const currentSettingInputValue = currentSettingInputElement ? currentSettingInputElement.value : "null input element";

          //     const currentSettingSliderElement = element.querySelector('div[role="slider"]');
          //     const currentSettingSliderValue = currentSettingSliderElement ? currentSettingSliderElement.getAttribute('aria-valuenow') : "null slider element";

          //     if (currentSettingInputValue === "" || currentSettingSliderValue === "" || currentSettingInputValue !== currentSettingSliderValue) {

          //     }
          //     settingsData[currentSettingName] = currentSettingInputValue;
          //   });
          // }

          const jsonData = JSON.stringify(settingsData, null, 2);
          //console.log("settingsData: ", jsonData);

          // Copy to clipboard
          navigator.clipboard.writeText(jsonData)
            .then(() => {
              console.log('Settings copied to clipboard:', jsonData);
            })
            .catch((err) => {
              console.error('Failed to copy settings:', err);
            });
        }
      }
      function delayedCopy(buttonTextElement) {
        delayedClicks([() => copySettingsData(buttonTextElement)]);
      }

      const clone = addButtonClone(closeSettings, modelContainer.firstChild.lastChild, "w_copy", delayedCopy, placement = 'before', referenceChild = modelContainer.firstChild.lastChild.lastChild);
      //setTimeout(() => {
        clone.id = 'ModelSettingsCopyButton';
        clone.ariaLabel = 'ModelSettingsCopyButton';
        clone.style.margin = '0px';
        clone.style.minWidth = '0px';
        clone.style.padding = '0px';
        clone.style.paddingTop = '0px';
        clone.style.paddingBottom = '0px';
        clone.style.paddingLeft = '0px';
        clone.style.paddingRight = '0px';
        clone.style.backgroundColor = 'transparent';
        GM_addStyle(`
  div#ModelSettingsCopyButton[aria-label="ModelSettingsCopyButton"] {
    padding: 0px !important;
    margin: 0px !important;
    minWidth: 0px !important;
    backgroundColor: transparent !important;
    display: flex !important;
    justify-content: flex-end !important;
  }
`);
        console.log("clone: ", clone);

      //}, 200);
    }

    /*
        const observer = new MutationObserver((mutationsList, observer) => {
          const modelNameContainer = AI_SettingsContainer.querySelector('div[aria-label^="AI Model:" i]');
          //console.log("modelNameContainer: ", modelNameContainer);

          // Extract model name using split
          const modelName = modelNameContainer ? modelNameContainer.ariaLabel.split(': ')[1] : "Unknown Model";

          const modelSettingsAccordion = modelContainer.querySelector('div[aria-label="Model Settings"]');
          let settingsData = {};
          for (const mutation of mutationsList) {
            console.log("mutation: ", mutation);
            if (mutation.type === 'childList' && mutation.target === modelContainer) {
              const ariaExpanded = modelSettingsAccordion.getAttribute('aria-expanded');
              if (ariaExpanded === "true") {
                settingsData = { "AI Model": modelName, "aria-expanded": ariaExpanded };
              } else {

              }
            }
            else if (mutation.type === 'attributes') {
              // Check if Model Settings are now visible

              const modelSettingsContainers = modelContainer.querySelectorAll('div[aria-label="Model Settings"] + div > div:only-child > div');
              if (modelSettingsContainers.length > 0) {
                // Attach the contextmenu listener (see previous code)
                modelSettingsContainers.forEach((element) => {
                  //console.log(element);
                  const currentSettingName = element.querySelector('p:first-child').innerHTML;

                  const currentSettingSliderElement = element.querySelector('div[role="slider"]');
                  const currentSettingSliderValue = currentSettingSliderElement?.getAttribute('aria-valuenow');

                  const currentSettingInputElement = element.querySelector('input[type="search"]');
                  const currentSettingInputValue = currentSettingInputElement ? currentSettingInputElement.value : "null input element";

                  settingsData[currentSettingName] = currentSettingSliderValue;
                  settingsData[currentSettingName + '_I'] = currentSettingInputValue; // This is always an empty string "", why?
                });
                console.log("settingsData: ", JSON.stringify(settingsData));

              }
            }
          }
        });
        //const observerOptions = { childList: true, subtree: true, characterData: true };
        //const observerOptions = { childList: true, subtree: true, attributes: true, attributeFilter: ['aria-expanded']};
        const observerOptions = { childList: true, subtree: true, attributes: true, attributeFilter: ['value'] };
        observer.observe(modelContainer, observerOptions);
    */
    /*
    // Assuming `modelSettings` is the parent element of the Model Settings modal
    modelSettings.addEventListener('contextmenu', (event) => {
      event.preventDefault(); // Prevent the default context menu

      const settingsContainer = document.querySelector('div[aria-label="Model Settings"] + div > div:only-child > div');
      const settingsData = {};

      settingsContainer.querySelectorAll('p, input').forEach((element) => {
        if (element.tagName === 'P') {
          currentSettingName = element.innerHTML;
        } else if (element.tagName === 'INPUT' && element.type === 'range') {
          settingsData[currentSettingName] = element.value;
        }
      });

      const jsonData = JSON.stringify(settingsData, null, 2); // 2 spaces for indentation

      // Copy to clipboard (you might need a library for this, see below)
      navigator.clipboard.writeText(jsonData)
        .then(() => {
          console.log('Settings copied to clipboard:', jsonData);
        })
        .catch((err) => {
          console.error('Failed to copy settings:', err);
        });
    });
    */
    /*
    const settingsData = {};
    modelContainer.children.forEach((element) => {
      console.log(element);
      const currentSettingName = element.querySelector('p:first-child').innerHTML;
      const currentSettingValue = element.querySelectorAll('input')[0].value;
      console.log(currentSettingName, ": ", currentSettingValue)
      settingsData[currentSettingName] = currentSettingValue;
    });
    console.log("settingsData: ", settingsData);
    */
    /*
        modelContainer.querySelectorAll('p:first-child, input').forEach((element) => {
          if (element.tagName === 'P') {
            currentSettingName = element.innerHTML;
          } else if (element.tagName === 'INPUT' && element.type === 'range') {
            settingsData[currentSettingName] = element.value;
          }
        });
        console.log(settingsData);
    */
    /*
      const jsonData = JSON.stringify(settingsData, null, 2);

      navigator.clipboard.writeText(jsonData)
        .then(() => {
          console.log('Settings copied to clipboard:', jsonData);
        })
        .catch((err) => {
          console.error('Failed to copy settings:', err);
        });
        */
    /*
      function getCreditsElement() {
        const creditsButton = $(modelContainer).find("div[role=button]:has(> p:contains('Credits'))")[0];
        //console.log("creditsButton", creditsButton);
        if (creditsButton) {
          return creditsButton.querySelector('& > div > p');
        }
        return null;
      }

      function getCredits(creditsElement) {
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
      */
  }, false);
}



function addEventListeners(element, events, handler) {
  events.forEach((event) => {
    if (event.startsWith('touch')) {
      element.addEventListener(event, handler, { passive: true }); // Mark touch events as passive
    } else {
      element.addEventListener(event, handler); // Other events can be added normally
    }
  });
}

/**
 * Waits for elements matching a given selector to appear within a target node's subtree, then executes a callback.
 *
 * @param {string} selector - A CSS selector to identify the desired elements.
 * @param {function} callback - A function to be executed when the elements are found. It receives an array of the found elements as its argument.
 * @param {Node} targetNode - The DOM node within whose subtree to search for the elements.
 * @param {boolean} [runImmediately=false] - If true, the callback is executed immediately if elements are already present; otherwise, it waits for new elements to appear.
 */
function waitForSubtreeElements(selector, callback, targetNode, runImmediately = false, keepObserverRunning = false) {
  function mutationObserverCallback(mutationsList, observer) {
    const elements = targetNode.querySelectorAll(selector);
    if (elements.length > 0) {
      callback(elements);
      if (!keepObserverRunning) {
        observer.disconnect();
      }
    }
  }
  let observer = new MutationObserver(mutationObserverCallback);
  observer.observe(targetNode, { childList: true, subtree: true });
  if (runImmediately) {
    mutationObserverCallback([], observer);
  }

  // Return a function to disconnect the observer
  return () => {
    observer.disconnect();
    observer = null; // Optional: Help with garbage collection
  };
}


/********************************
* Code for handling the configuration menu and for handling shortcuts.
*/

/**
 * Retrieves or sets the value of an input element within a parent container.
 * Handles both text inputs and checkboxes.
 *
 * @param {string|boolean[]} value - The value to set for the input element(s).
 *                                 If `parent` is provided, this can be an array of booleans for checkboxes or a string for text inputs.
 *                                 If `parent` is not provided, this is the selector for the input element.
 * @param {string|HTMLElement|jQuery} [parent] - (Optional) The parent container or selector to find the input element(s) within.
 *
 * @returns {string|boolean[]|undefined} - If `parent` is not provided, returns the uppercase value of the input element or an array of boolean values for checkboxes.
 *                                        If `parent` is provided, returns `undefined` (the function modifies the input elements in-place).
 */
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

/**
 * Configuration object for the MonkeyConfig extension, used to customize user interactions and behavior.
 */
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

    Reset_Disclaimer: {
      label: 'Reset Disclaimer Popup',
      type: 'custom',
      default: false,
      html: '<input id="resetDisclaimer" type="checkbox" name="resetDisclaimer" />',
      //html: '<input type="button" value="Reset">',
      set: (value, parent) => {
        console.log("SET value: ", value, "parent: ", parent); //value always valse
        const checkbox = parent.querySelector('#resetDisclaimer');
        //checkbox.checked = value;
        checkbox.checked = false;
        //localStorage.setItem('disclaimerShown', 'true');
        //GM_setValue('disclaimerShown', true);
      },
      get: (parent) => {
        const checkbox = parent.querySelector('#resetDisclaimer');
        const value = checkbox.checked;
        console.log("GET value", value, "parent: ", parent); // Value always false
        if (value === true) { // Assuming the button click sets the value to true
          //localStorage.removeItem('disclaimerShown');
          GM_deleteValue('disclaimerShown');
          alert('Disclaimer popup will be shown again on the next page load.');
          checkbox.checked = false; // Reset the button
        }
        return value;
      }
    },

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

    Reward_Claimer: { type: 'checkbox', default: true }, // Enable waiting for new rewards (scales and avatars) and claim them.
    Save_Raw_Text: { type: 'checkbox', default: false }, // Save raw text rather than removing '>'
    Fix_Actions: { type: 'checkbox', default: true }, // Fix editing past actions.
    Action_Cleaner: { type: 'checkbox', default: false }, // Cleanup the current action.
    Do_Action_Verb: { type: 'text', default: null }, // RFU

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

const modalDimensions = cfg.get('Modal_Dimensions');
let [modalWidthCfg, modalHeightCfg] = modalDimensions;


/**
 * An array defining available actions within the application, potentially tied to UI elements.
 *
 * Each action object has the following properties:
 * - `name`: A unique identifier for the action (e.g., 'Take_Turn', 'Retry').
 * - `type`: Categorizes the action (e.g., 'Command', 'Mode', 'History').
 * - `aria-Label`: Provides an accessible label for screen readers.
 * - `active`: An array of routes/URLs where this action should be enabled/visible.
 */
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

/**
 * Handles key press events, ensuring non-repeating keys and normalizing key values.
 *
 * @param {KeyboardEvent} e - The keyboard event object.
 */
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


/**
 * Executes a series of click events with a delay between each, using requestAnimationFrame for optimal timing.
 *
 * @param {Function[]} clicks - An array of functions representing click events to be executed.
 * @param {number} [i=0] - An optional index indicating the current click event being processed (used for recursion).
 */
const delayedClicks = (clicks, i = 0) => {
  if (i < clicks.length) {
    requestAnimationFrame(() => {
      clicks[i]();
      delayedClicks(clicks, i + 1);
    });
  }
};

/**
 * A class that encapsulates a MutationObserver, providing convenient methods to manage and interact with it.
 */
class DOMObserver {
  /**
   * Creates a new DOMObserver instance.
   *
   * @param {MutationCallback} callback - The callback function to execute when mutations are observed.
   * @param {Node} targetNode - The DOM node to observe for mutations.
   * @param {MutationObserverInit} options - The configuration options for the MutationObserver.
   * @param {boolean} [startImmediately=false] - Whether to start observing immediately upon creation.
   */
  constructor(callback, targetNode, options, startImmediately = false) {
    this.observer = new MutationObserver(callback);
    this.targetNode = targetNode;
    this.options = options;

    if (startImmediately) {
      this.observe();
    }
  }

  /**
   * Destroys the DOMObserver instance, disconnecting the observer and clearing references.
   */
  destroy() {
    this.disconnect();
    this.observer = null;
    this.targetNode = null;
    this.options = null;
  }

  /**
   * Starts observing the target node for mutations.
   *
   * @param {Node} [targetNode=this.targetNode] - The DOM node to observe (defaults to the one provided in the constructor).
   * @param {MutationObserverInit} [options=this.options] - The configuration options (defaults to the ones provided in the constructor).
   */
  observe(targetNode = this.targetNode, options = this.options) {
    if (this.observer && targetNode && targetNode.nodeType === Node.ELEMENT_NODE) { // Ensure targetNode is an Element
      this.observer.observe(targetNode, options);
    } else {
      console.warn("Target node is not a valid element:", targetNode); // For debugging
    }
  }

  /**
   * Disconnects the MutationObserver, stopping observation.
   */
  disconnect() {
    if (this.observer !== null) {
      this.observer.disconnect();
    }
  }

  /**
   * Retrieves any pending mutation records from the observer and empties its record queue.
   *
   * @returns {MutationRecord[]} An array of MutationRecord objects representing the observed mutations.
   */
  takeRecords() {
    return this.observer ? this.observer.takeRecords() : []; // Return empty array if observer is null
  }

  /**
   * Checks if the observer is connected and actively observing.
   *
   * @returns {boolean} True if the observer is connected, false otherwise.
   */
  get isConnected() {
    return this.observer && this.observer.isConnected(); // Check if observer exists and is connected
  }
}

//console.log("CSS_Elements: ", CSS_Elements);

/**
 * Handles changes detected by a MutationObserver.
 * Clean up the the prompt area to make more efficient.
 * This is the original code from QoL tool by AliH2K
 *
 * @param {MutationRecord[]} mutationsList - An array of MutationRecord objects, each representing a single mutation.
 * @param {MutationObserver} observer - The MutationObserver instance that triggered this callback.
 */
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
}

/**
 * Deal with inserting text into textarea and input elements in the react DOM.
 * N.B. This does not handle the case of the undo buffer. Control-Z will not work!
 *
 * @param {HTMLElement} element - A refernce to the text element to insert text into.
 * @param {string} value - The value to insert into the text element.
 */
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

// CSS for toggling visibility for actions.
//
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

/**
 * Toggle action visibility by adding or removing the actions-hidden CSS class from the Scenario or Adventur divs.
 *
 * @param {boolean} visible - A boolean determining visibility.
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

/**
 * Toggle action visibility.
 *
 * @param {HTMLElement} buttonTextElement - A refernce to the toggling callback function.
 */

function toggleOnClick(buttonTextElement) {
  actionsExpanded = !actionsExpanded;
  setActionVisibility(actionsExpanded); // Use the set function
  buttonTextElement.innerText = actionsExpanded ? ActionToggleMsgOn : ActionToggleMsgOff;
}

/**
 * Helper function to remove height classes from an element.
 *
 * @param {HTMLElement} element - A refernce to the element to remove height classes from.
 */
function removeHeightClasses(element) {
  const classList = element.classList; // Get the element's classList

  for (const className of classList) {
    if (className.startsWith('_mih-') || className.startsWith('_mah-')) {
      classList.remove(className);
    }
  }
}

/**
 * Inject a cloned element into the play/read page header.
 *
 * @param {HTMLElement} cloneReference - A refernce to a button to clone.
 * @param {string} label - A string containing the button label.
 * @param {function} action - The function to call on click.
 */
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
    e.stopPropagation(); // Use stopPropagation to reliably stop propagation
    e.bubbles = false;
    action(buttonTextElement); // Pass the <p> element to the action function
  };
  return clonedElement;
}

/**
 * Inject a cloned element into the play/read page header.
 *
 * @param {HTMLElement} container - A refernce to the container to enject into.
 * @param {HTMLElement} cloneReference - A refernce to cloned object/button to inject.
 * @param {string} label - A string containing the button label.
 * @param {function} action - The function to call on click.
 */
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

/**
 * Event handler for handling play pages.
 *
 * @param {HTMLElement} targetNode - A refernce to the read page.
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
  /* Storycard delimiter styling. */
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

// This doesn't work, but is kept as example for getting computed styles.
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

/**
 * Centers a modal element within the viewport, optionally only if it overflows the viewport.
 *
 * @param {HTMLElement} modalNodeTree - The root node of the modal tree within the document body.
 * @param {HTMLElement} modalNode - The specific modal element to be centered.
 * @param {boolean} [onlyIfVPOverflow=false] - If true, the modal will only be centered if it overflows the viewport.
 */
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

/**
 * Makes a specified modal window both draggable and resizable.
 *
 * @param {string} timestamp - A timestamp associated with the modal.
 * @param {HTMLElement} modalNodeTree - The entire modal window's DOM node (the container).
 * @param {HTMLElement} modalNode - The specific DOM node within the modal that will be draggable.
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

if (0) {
  // Example for how to get the values of a slider.
  const AISettings_StoryGen_Model_Slider_Selector = ' '
    + 'div[aria-label="Story Generator" i] ' // The Story Gen Title element.
    + ' + div' // The mext sibling is the Story Gen Content div.
    //
    + ' div[aria-label="Memory System" i]' // The Memory System Title Element.
    + ' + div' // The Memory System Content element.
    // There could be intervening elements here in the tree.
    + ' div[role="slider" i]' // The specific model's container for button and info.
    + ', '
    + ' div[aria-label="Story Generator" i]:nth-child(1)' // The story Generator heading.
    + ' + div:nth-child(2)' // The mext sibling is the Story Gen content window.
    + ' > div.is_Column:only-child' // A wrapper.
    + ' > div.is_Column:nth-child(1)' // The specific model's container for button and info.
    + ' div:has(img[alt="credits" i]) + p' // The mext sibling is the Story Gen content window.
    ;
  waitForKeyElements(AISettings_StoryGen_Model_Slider_Selector, (sliderNodes) => {
    const sliderNode = sliderNodes[0]; // Get the first matching element

    console.log("sliderNodes: ", sliderNodes);

    const sliderObserver = new MutationObserver((mutationsList, observer) => {
      for (const mutation of mutationsList) {
        const currentValue = sliderNode.getAttribute('aria-valuenow');
        const maxValue = sliderNode.getAttribute('aria-valuemax');
        const minValue = sliderNode.getAttribute('aria-valuemin');

        console.log("mutation.target: ", mutation.target);
      }
    });

    // Start observing the modelContainer for changes in its child nodes
    //sliderObserver.observe(sliderNode, { childList: true, subtree: true, characterData: true });
    const mo_opts = {
      //childList: true
      //, subtree: true
      //, characterData: true
      attributes: true
      , attributeFilter: ['aria-valuemax', 'aria-valuemin', 'aria-valuenow']
    };
    sliderObserver.observe(sliderNode, mo_opts);
  }, false);
} // Slider example.

/**
 * Function to update the credits being used indicators in the UI.
 *
 * @param {boolean} indicatorFlag - If true, turns on credits being used indicator.
 */

let updateElements = [];

function changeCreditUseIndicator(indicatorFlag) {

  updateElements = [];
  const flameIcon = document.querySelector('div[aria-label="Game Menu"] p.font_icons');
  if (flameIcon) {
    updateElements.push(flameIcon);
    flameIcon.parentNode.parentNode.title = indicatorFlag > 0 ? `Context Credits Used: ${indicatorFlag}/action` : 'Context Credits Used: 0/action';
  }

  const commandBar = document.querySelector('div[role="toolbar" i][aria-label="Command Bar" i]');
  if (commandBar) updateElements.push(...commandBar.querySelectorAll('span, p'));

  const navigationBar = document.querySelector('div[role="toolbar" i][aria-label="Navigation Bar" i]');
  if (navigationBar) updateElements.push(...navigationBar.querySelectorAll('span, p'));

  const theDialog = document.querySelector('div#__next div[id^="TheDialog" i]');
  if (theDialog) updateElements.push(...theDialog.querySelectorAll('span, p'));

  const gearMenu = document.querySelector('div#__next div[id^="gearMenu-TS" i]');
  if (!gearMenu) console.log("Cant get gearMenu");

  const gearMenu_Header = gearMenu?.querySelector('div[id^="gearMenu-Header-TS" i]');
  if (gearMenu_Header) updateElements.push(...gearMenu_Header.querySelectorAll('span, p'));

  const story_Generator = gearMenu?.querySelector('div[aria-label="Story Generator" i]');
  if (story_Generator) updateElements.push(...story_Generator.querySelectorAll('span, p'));

  const pillTab_AI_Models = gearMenu?.querySelector('div[aria-label*="tab ai models" i]');
  if (pillTab_AI_Models) updateElements.push(...pillTab_AI_Models.querySelectorAll('span, p'));

  const Memory_System = gearMenu?.querySelector('div[aria-label="Memory System" i]');
  if (Memory_System) updateElements.push(...Memory_System.querySelectorAll('span, p'));

  if (gearMenu) {
    if (indicatorFlag > 0 && Memory_System.getAttribute('aria-expanded') === "false") {
      Memory_System.click();
    }
    const contentLengthDivs = $(gearMenu).find('div[aria-label="Memory System"] + div p:contains("Context Length")');
    if (contentLengthDivs.length > 0) {
      updateElements.push(contentLengthDivs[0]);
    } else {
      console.log("no content length divs.")
    }
  }

  if (story_Generator) {
    //const creditsButton = $(story_Generator).find("div[role=button]:has(> p:contains('Credits'))")[0];
    const creditsButton = $(gearMenu).find('div[aria-label="Story Generator"] + div div[role=button]:has(> p:contains("Credits"))')[0];
    if (creditsButton) updateElements.push(...creditsButton.querySelectorAll('span, p'));
    else console.log("no credits button.");

  }

  const creditsOnColor = "OrangeRed";
  const creditsOffColor = "";
  const color = indicatorFlag > 0 ? creditsOnColor : creditsOffColor;
  updateElements.forEach(element => { element.style.color = color; });

}

/*
** In the react DOM, this is a somewhat stable element to wait for. Once this is active,
** we use a mutation observer to watch for credits above 0 being used and notify the UI.
*/

if (1) {
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
    //console.log("containerNodes found: ", containerNodes);
    const modelContainer = containerNodes[0]; // Get the first matching element

    function getCreditsElement() {
      const creditsButton = $(modelContainer).find("div[role=button]:has(> p:contains('Credits'))")[0];
      //console.log("creditsButton", creditsButton);
      if (creditsButton) {
        return creditsButton.querySelector('& > div > p');
      }
      return null;
    }

    function getCredits(creditsElement) {
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
          (mutation.type === "childList" || mutation.type === "characterData" || mutation.type === "attributes") && // Observe both childList and characterData
          creditsElement && // Check if creditsElement is defined
          mutation.target.parentNode === creditsElement  // Check if target is a descendant of creditsElement
        ) {
          //console.log("mutation mutation 2.");
          updateFlameIcon();
        }
      }
    });

    // Start observing the modelContainer for changes in its child nodes
    //creditsObserver.observe(modelContainer, { childList: true, subtree: true, characterData: true, attributes: true });
    creditsObserver.observe(modelContainer, { childList: true, subtree: true, characterData: true, attributes: true });
  }, false);
}
/**
 * A helper function for inserting a string before an ID timestamp.
 *
 * @param {string} idString - The string top insert into.
 * @param {string} stringToAppend - The string insert before the Time Stamp (TS\d+).
 */
function appendBeforeTimestamp(idString, stringToAppend) {
  return idString.replace(/_TS(\d+)$/, `${stringToAppend}_TS$1`);
}
/**
 * A helper function for inserting a string before an ID timestamp.
 *
 * @param {string} idString - The string top insert into.
 * @param {string} stringToAppend - The string insert before the Time Stamp (TS\d+).
 */
function appendBeforeTimestampDashz(idString, stringToAppend) {
  return idString.replace(/-TS(\d+)$/, `-${stringToAppend}-TS$1`);
}
/**
 * Appends one or more strings before the timestamp dash in an ID string.
 *
 * @param {string} idString - The original ID string containing a timestamp dash (e.g., "someId-TS1234567890").
 * @param {...string} stringsToAppend - One or more strings to append before the timestamp dash.
 * @returns {string} - The modified ID string with the appended strings.
 */
function appendBeforeTimestampDash(idString, ...stringsToAppend) {
  const appendedString = stringsToAppend.join('-'); // Join the strings with dashes
  return idString.replace(/-TS(\d+)$/, `-${appendedString}-TS$1`);
}

/**
 * Removes the timestamp suffix (e.g., "-TS1234567890") from an ID string.
 *
 * @param {string} idString - The ID string potentially containing a timestamp suffix.
 * @returns {string} The ID string with the timestamp suffix removed, if present.
 */
function stripTimestampSuffix(idString) {
  return idString.replace(/-TS\d+$/, '');
}

/**
 * Appends one or more strings before the timestamp dash in an ID string.
 *
 * @param {string} idString - The original ID string containing a timestamp dash (e.g., "someId-TS1234567890").
 * @param {...string} stringsToAppend - One or more strings to append before the timestamp dash.
 * @returns {string} - The modified ID string with the appended strings.
 */
function appendBeforeTimestampDash(idString, ...stringsToAppend) {
  const appendedString = stringsToAppend.join('-'); // Join the strings with dashes
  return idString.replace(/-TS(\d+)$/, `-${appendedString}-TS$1`);
}

/**
 * Sets the ID of a node if it's currently null or different from the provided value.
 * Optionally disconnects and reattaches a MutationObserver if provided.
 *
 * @param {HTMLElement} node - The HTML element whose ID needs to be set.
 * @param {string} value - The desired ID value for the node.
 * @param {boolean} [ignoreTimestamp=false] - (Optional) Whether to ignore the timestamp suffix during comparison.
 * @param {MutationObserver} [observer] - (Optional) The MutationObserver to disconnect and reattach.
 * @param {MutationObserverInit} [options] - (Optional) The options for reattaching the observer.
 * @returns {string|null} - The final ID value of the node, or null if the node's ID cannot be set.
 */
function setIdIfNullOrDifferent(node, value, ignoreTimestamp, observer, options) {
  observer = observer || null;
  options = options || null;
  if (node && 'id' in node) {
    const currentId = ignoreTimestamp ? node.id.replace(/-TS\d+$/, '') : node.id;
    const targetId = ignoreTimestamp ? value.replace(/-TS\d+$/, '') : value;

    if (currentId !== targetId) {
      if (observer) {
        observer.disconnect();
      }
      node.id = value;
      if (observer) {
        observer.observe(node, options || { childList: true, subtree: true });
      }
    }
    return node.id;
  }
  return null; // No node, return null.
}

if (1) {
  /*
  ** In the react DOM, these are somewhat stable elements to wait for.
  ** The only purpose is to create unique IDs for the gearMenu elements.
  ** Other code uses the IDs, including CSS.
  */
  let gearMenuObserver = null;
  //updateGearMenu_Content(gearMenu);
  const gearMenuObserverOptions = {
    childList: true, subtree: true, attributes: true,
    attributeFilter: ['aria-label', 'aria-hidden']
  };

  const gearMenuSelector =
    //'#__next > div > span > span > div:nth-child(2) > div:nth-child(2):has(> div:only-child > div:only-child > div:nth-child(2))';
    '#__next > div > span > span > div:nth-child(2) > div:nth-child(2)';

  waitForKeyElements(gearMenuSelector, (gearMenuNodes) => {
    //console.log(gearMenuNodes);
    if (gearMenuNodes.length < 1) {
      console.warn("Missing GearMenuNode.");
      return;
    }

    const gearMenuNode = gearMenuNodes[0];
    const timestamp = "-TS" + Date.now();

    const gearBase = 'gearMenu';
    //gearMenuNode.id = `${gearBase}Node` + timestamp;
    setIdIfNullOrDifferent(gearMenuNode, `${gearBase}Node` + timestamp, true, gearMenuObserver, gearMenuObserverOptions);

    const gearMenu_Wrapper = gearMenuNode?.firstChild;
    //gearMenu_Wrapper.id = `${gearBase}-Wrapper` + timestamp;
    setIdIfNullOrDifferent(gearMenu_Wrapper, `${gearBase}-Wrapper` + timestamp, true, gearMenuObserver, gearMenuObserverOptions);

    const gearMenu = gearMenu_Wrapper?.firstChild;
    if (!gearMenu) {
      console.warn("Missing GearMenu Wrapper, Bailing.");
      return;
    }
    //gearMenu.id = `${gearBase}` + timestamp;
    if (!setIdIfNullOrDifferent(gearMenu, `${gearBase}` + timestamp, true, gearMenuObserver, gearMenuObserverOptions)) {
      console.warn("Missing GearMenu, Bailing.");
      return;
    }

    const gearMenu_Header = gearMenu?.children[0];
    //gearMenu_Header.id = appendBeforeTimestampDash(gearMenu.id, "Header");
    if (!setIdIfNullOrDifferent(gearMenu_Header, appendBeforeTimestampDash(gearMenu.id, "Header"), true, gearMenuObserver, gearMenuObserverOptions)) {
      console.warn("Missing GearMenu_Header, Bailing.");
      return;
    }

    let gearMenu_Content = null;

    /**
     * Called by the mutation observer on gearMenu that hunts for a new gearMenu_Content.
     * Waits for sub tree elements for the Pill Menu and the Pill Content.
     *
     * @param {HTMLElement} gearMenu - The the div element containing the modified or replaced gearMenu_Content element.
     */
    function updateGearMenu_Content(gearMenu) {
      //console.log("gearMenu: ", gearMenu);

      gearMenu_Content = gearMenu?.children[1];

      if (!gearMenu_Content) {
        console.warn("Cannot get gearMenu content div from gearMenu: ", gearMenu);
        return;
      }
      if (!setIdIfNullOrDifferent(gearMenu_Content,
        appendBeforeTimestampDash(gearMenu.id, "Content"), true,
        gearMenuObserver, gearMenuObserverOptions)) {
        console.warn("Cannot get gearMenu_Content.id: ", gearMenu_Content);
        return;
      }

      //gearMenuObserver.disconnect();
      //gearMenu_Content.id = appendBeforeTimestampDash(gearMenu.id, "Content");
      //gearMenuObserver.observe(gearMenu, gearMenuObserverOptions);

      //console.log("gearMenu-Content: ", gearMenu_Content);

      const gearMenu_Content_Selector = ''
        + `div[id^="${gearBase}-Content-"]:has(:nth-child(2):last-child)`
        ;
      //console.log("gearMenu_Content_Selector: ", gearMenu_Content_Selector);

      waitForSubtreeElements(
        gearMenu_Content_Selector,
        (matchingElements) => {
          //console.log("matchingElements: ", matchingElements);

          matchingElements.forEach(matchingElement => {
            if (matchingElement) {
              //console.log("matchingElement: ", matchingElement);
              let match = null;
              if (match = matchingElement.querySelector('div[aria-label="AI settings" i]')) {
                gearMenuObserver.disconnect();
                const pillNode = match.parentNode;
                gearMenu_Content.id = appendBeforeTimestampDash(gearMenu.id, "Gameplay");
                pillNode.id = appendBeforeTimestampDash(gearMenu_Content.id, "Pill");
                pillNode.firstChild.id = appendBeforeTimestampDash(pillNode.id, "Header");
                match.id = appendBeforeTimestampDash(pillNode.id, "AI_Settings");
                //match.dataset.uniqueId = "TS" + Date.now();
                gearMenuObserver.observe(gearMenu, gearMenuObserverOptions);
              }
              else if (match = matchingElement.querySelector('div[aria-label="Display settings" i]')) {
                gearMenuObserver.disconnect();
                const pillNode = match.parentNode;
                gearMenu_Content.id = appendBeforeTimestampDash(gearMenu.id, "Gameplay");
                pillNode.id = appendBeforeTimestampDash(gearMenu_Content.id, "Pill");
                pillNode.firstChild.id = appendBeforeTimestampDash(pillNode.id, "Header");
                match.id = appendBeforeTimestampDash(pillNode.id, "Display_Settings");
                //match.dataset.uniqueId = "TS" + Date.now();
                gearMenuObserver.observe(gearMenu, gearMenuObserverOptions);
              }
              else if (matchingElement.children.length === 2) {
                gearMenuObserver.disconnect();
                //gearMenu_Content.id = appendBeforeTimestampDash(gearMenu.id, "Adventure");
                if (!setIdIfNullOrDifferent(gearMenu_Content, appendBeforeTimestampDash(gearMenu.id, "Adventure"), true)) {
                  console.warn("Cannot set gearMenu_Content.id: ", gearMenu_Content);
                  return;
                }

                const pillHeader = gearMenu_Content.children[0];
                //pillHeader.id = appendBeforeTimestampDash(gearMenu_Content.id, "Pill", "Header");
                if (!setIdIfNullOrDifferent(pillHeader, appendBeforeTimestampDash(gearMenu_Content.id, "Pill", "Header"), true)) {
                  console.warn("Cannot set pillHeader.id: ", gearMenu_Content);
                  return;
                }

                const pillContent = gearMenu_Content.children[1];
                //pillContent.id = appendBeforeTimestampDash(gearMenu_Content.id, "Pill", "Content");
                if (!setIdIfNullOrDifferent(pillContent, appendBeforeTimestampDash(gearMenu_Content.id, "Pill", "Content"), true)) {
                  console.warn("Cannot set pillContent.id: ", pillContent);
                  return;
                }

                const pillContent_Inner = pillContent.firstChild;
                //pillContent_Inner.id = appendBeforeTimestampDash(gearMenu_Content.id, "Pill", "Content_Inner");
                if (!setIdIfNullOrDifferent(pillContent_Inner, appendBeforeTimestampDash(gearMenu_Content.id, "Pill", "Content_Inner"), true)) {
                  console.warn("Cannot set Content_Inner.id: ", pillContent_Inner);
                  return;
                }

                if (pillHeader.querySelector('div[aria-label="Selected tab plot" i]')) {
                  pillContent_Inner.children[0].id = appendBeforeTimestampDash(gearMenu_Content.id, "Pill", "Plot");
                }
                else if (pillHeader.querySelector('div[aria-label="Selected tab Story Cards" i]')) {
                  // Story Cards come and go from this div.
                  pillContent_Inner.children[1].id = appendBeforeTimestampDash(gearMenu_Content.id, "Pill", "Story_Cards");
                }
                else if (pillHeader.querySelector('div[aria-label="Selected tab details" i]')) {
                  pillContent_Inner.children[1].id = appendBeforeTimestampDash(gearMenu_Content.id, "Pill", "Details");
                }

                gearMenuObserver.observe(gearMenu, gearMenuObserverOptions);
              } else if (matchingElement.children.length === 1) {
                //gearMenu_Content.id = appendBeforeTimestampDash(gearMenu.id, "Content", "Adventure");
                //gearMenu_Content.children[0].id = appendBeforeTimestampDash(gearMenu_Content.id, "Pill", "Header");
                //gearMenu_Content.children[1].id = appendBeforeTimestampDash(gearMenu_Content.id, "Pill", "Content");
                // Eventually "Content" would be Plot, StoryCard, or Details.
              } else {

                //console.log("No matching selector: ", matchingElement)
              }
            }
          });
        },
        gearMenu,
        true, true
      );

    }
    let count = 0;
    // Create the mutation observer
    gearMenuObserver = new MutationObserver((mutationsList, observer) => {
      for (const mutation of mutationsList) {
        //if (mutation.type === 'childList' && mutation.target === gearMenu) {
        //if (mutation.target === gearMenu) {
        //console.log("mutation: ", mutation);
        //console.log("observer: ", observer);
        //observer.disconnect();
        //setTimeout(() => {
        updateGearMenu_Content(gearMenu);
        //}, 500);
        //gearMenuObserver.observe(gearMenu, gearMenuObserverOptions);
        //} else {
        //if (!(count++ % 100)) {
        //console.log("Cnt:", count , " Other mutation MutationEvent: ", mutation);
        //}
        //}
      }
    });
    // Start observing gearMenu for childList changes
    gearMenuObserver.observe(gearMenu, gearMenuObserverOptions);
  }, false);
}

if (cfg.get('Reward_Claimer') === true) {
  waitForKeyElements('#__next div[aria-label="Daily Rewards" i]:has(+ div)', (dailyRewards) => {
    const dailyReward = dailyRewards[0];
    //console.log("Found the flagged rewards.")
    delayedClicks([
      //() => console.log("Sending Daily Reward Click."),
      () => dailyReward.click(),
      //() => console.log("Sending reward item click."),
      () => {
        waitForKeyElements('div[aria-label="menu" i] div[aria-label*="Claim Reward" i]',
          (reward) => {
            console.log("reward: ", reward);
            reward.click();
          },
          true);
      }
      //, () => console.log("Sent the clicks.")
    ]);
  }, false);
}

/*
** These are helper functions for finding the common sub node structures within
** modal nodes. Sometimes sub nodes are placed within class wrappers that must be skipped over.
** Most modal nodes follow a reasonably common structure. These functions help parse the structure
** so ID's can be assigned.
*/

/**
  * If a node is a span, skip one layer returning the first child.
  * Otherwise return the node.
  *
  * @param {HTMLElement} node - The the div element containing the span wrapper to skip.
  * @returns {HTMLElement|null} - Return the first element of a span.
  */
function skipSpan(node) {
  const tagName = node.tagName.toLowerCase();
  if (tagName === 'span') {
    return node.children[0];
  } else {
    return node;
  }
}

/**
  * Some modal nodes have an inner div wrapper. Skip it or return null.
  *
  * @param {HTMLElement} modalNode - The modal node to extract inner content from.
  * @returns {HTMLElement|null} - The inner content node if found, or null if the modal structure is unexpected.
  */
function getModalInner(modalNode) {
  /* The entire modal node contents may be wrapped in a div. */
  return (modalNode.children.length == 1) ? modalNode.firstChild : null;
}

/**
  * Given a modalNode, return the modal node header.
  *
  * @param {HTMLElement} modalNode - The modal node to extract the header from.
  * @returns {HTMLElement} - Return the modal node header or the modal node itself.
  */
function getModalHeader(modalNode) {
  // The entire modal node contents may be wrapped in a div.
  const modalNodeInner = getModalInner(modalNode) ?? modalNode;
  // And the header node may be wrapped in a div.
  const modalHeaderInner = (modalNodeInner.children.length == 1) ? modalNodeInner.firstChild : modalNodeInner;
  return modalHeaderInner?.firstChild;
}

/**
  * Given a modalNode, return the modal node title.
  *
  * @param {HTMLElement} modalNode - The modal node to extract the title from.
  * @returns {HTMLElement|null} - Return the modal node header or null.
  */
function getModalHeader_Title(modalNode) {
  return getModalHeader(modalNode)?.children[0];
}

/**
  * Given a modalNode, return the modal node header menu (usually a pill menu).
  *
  * @param {HTMLElement} modalNode - The the div element that is the potential wrapper.
  * @returns {HTMLElement|null} - Return the modal menu or null.
  */
function getModalHeader_Menu(modalNode) {
  return getModalHeader(modalNode)?.children[1];
}

/**
  * Given a modalNode, return the modal node content div (the block under the header).
  *
  * @param {HTMLElement} modalNode - The the div element that is holds the modal node content block.
  * @returns {HTMLElement|null} - Return the modal content div or null.
  */
function getModalContent(modalNode) {
  const modalNodeInner = getModalInner(modalNode) ?? modalNode;
  return skipSpan(modalNodeInner?.children[1]);
}

/**
  * Given a modalNode, return the modal node inner content div (many modals have inner content wrappers).
  *
  * @param {HTMLElement} modalNode - The the div element that is the modal node.
  * @returns {HTMLElement|null} - Return the modal content inner div or null.
  */
function getModalContent_Inner(modalNode) {
  return skipSpan(getModalContent(modalNode).firstChild);
}

/**
  * Given a modalNode, return the modal node footer div (Most do not have footers).
  *
  * @param {HTMLElement} modalNode - The the div element that is the potential wrapper.
  * @returns {HTMLElement|null} - Return the modal footer div or null.
  */
function getModalFooter(modalNode) {
  const modalNodeInner = getModalInner(modalNode) ?? modalNode;
  if (modalNodeInner?.children.length < 3) {
    return null;
  }
  return skipSpan(modalNodeInner.lastChild);
}

/**
 * Adds a button clone to a container.
 *
 * @param {HTMLElement} cloneRef - An existing button element to be cloned for styling the new button.
 * @param {HTMLElement} container - The container element where the button will be added.
 * @param {string} label - The label or font icon to use as the label for the button.
 * @param {function} eventHandler - The function to be called when the button is clicked.
 * @param {string} [placement='beforeend'] - The placement of the button relative to the container's children. Possible values: 'beforebegin', 'afterbegin', 'beforeend', 'afterend', 'before', 'after'.
 * @param {HTMLElement} [referenceChild=null] - An optional child element within the container. Used for 'before' and 'after' placements to insert the button before or after this child.
 * @returns {HTMLElement} The cloned button element that was added to the container.
 */
function addButtonClone(cloneRef, container, label, eventHandler, placement = 'beforeend', referenceChild = null) {
  if (!cloneRef) {
    console.warn("Null cloneRef in addButtonClone!");
    return null;
  }

  const clonedButton = buttonClone(
    cloneRef,
    label,
    eventHandler
  );

  // Apply styles to the button
  clonedButton.style.marginRight = '8px';
  clonedButton.style.minWidth = '30px';
  clonedButton.style.whiteSpace = 'nowrap';

  // Insert the button based on the specified placement and referenceChild
  switch (placement) {
    case 'beforebegin':
      container.parentNode.insertBefore(clonedButton, container);
      break;
    case 'afterbegin':
      container.insertBefore(clonedButton, container.firstChild);
      break;
    case 'beforeend':
      container.appendChild(clonedButton);
      break;
    case 'afterend':
      container.parentNode.insertBefore(clonedButton, container.nextSibling);
      break;
    case 'before':
      if (referenceChild && referenceChild.parentNode === container) {
        container.insertBefore(clonedButton, referenceChild);
      } else {
        console.warn("Invalid referenceChild or referenceChild not found within container. Using default 'beforeend' placement.");
        container.appendChild(clonedButton);
      }
      break;
    case 'after':
      if (referenceChild && referenceChild.parentNode === container) {
        container.insertBefore(clonedButton, referenceChild.nextSibling);
      } else {
        console.warn("Invalid referenceChild or referenceChild not found within container. Using default 'beforeend' placement.");
        container.appendChild(clonedButton);
      }
      break;
    default:
      console.warn("Invalid placement specified. Using default 'beforeend' placement.");
      container.appendChild(clonedButton);
  }
  return clonedButton;
}
/**
 * Adds a full-screen button to a modal header, allowing the user to toggle between normal and full-screen modes.
 *
 * @param {HTMLElement} cloneRef - An existing button element to be cloned for styling the new button.
 * @param {HTMLElement} container - The container element (usually the modal header) where the button will be added.
 * @param {function} eventHandler - The function to be called when the button is clicked (typically the `toggleFullScreen` function).
 * @param {string} [placement='beforeend'] - The placement of the button relative to the container's children. Possible values: 'beforebegin', 'afterbegin', 'beforeend', 'afterend', 'before', 'after'.
 * @param {HTMLElement} [referenceChild=null] - An optional child element within the container. Used for 'before' and 'after' placements to insert the button before or after this child.
 * @returns {HTMLElement} The cloned button element that was added to the container.
 */
function modalAddFullScreenButton(cloneRef, container, placement = 'beforeend', referenceChild = null) {
  /**
   * Event handler for toggling full screen mode.
   *
   * @param {HTMLElement} buttonTextElement - A reference to the toggle button.
   */
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
  return addButtonClone(cloneRef, container, "[ ]", toggleFullScreen, placement = 'beforeend', referenceChild = null);
}

/**
 * A helper function for checking if a modal node is a token/text viewer.
 *
 * @param {HTMLElement} modalNode - A reference to the modalNode to test.
 */
function checkTokenViewer(modalNode) {
  const tabList = modalNode?.querySelector('div[role="tablist"][aria-label="Section Tabs"]');
  return tabList?.querySelector('div[role="tab"][aria-label*="tab text" i]') &&
    tabList?.querySelector('div[role="tab"][aria-label*="tab tokens" i]');
}

/**
 * Event handler for handling new modals.
 *
 * @param {HTMLElement} modalNodeTree - The modal's branch div from document.body
 */
function handleNewModal(modalNodeTree) {

  const timestamp = "TS" + Date.now();

  // Wait for the specific modal structure.
  // We wait for a button to show up somewhere in the tree.
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

      // Assign IDs that are common for all modalNodes.
      // This allows for the CSS to have hooks into the react DOM.

      // This is the root node for the entire modal in document.body.
      modalNodeTree.id = "modalNodeTree_" + timestamp;

      // This turns of the game play mask behind the modal so you can read the story in progress.
      modalNodeTree.firstChild.firstChild.firstChild.firstChild.style.opacity = "0";

      // Some modal nodes wrap their entire content in an only-child div.
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
            // Look for the Scenario/Adventure editor.
            //
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
                        modalAddFullScreenButton(closeButton, container);
                        container.style.justifyContent = 'space-between';
                        modalContent_Inner.style.minHeight = '0px';
                      }
                    }, 100); // adjust as needed
                  }
                  makeModalDraggableAndResizable(timestamp, modalNodeTree, modalNode);

                },
                modalNode,
                true
              );
            }
            // Look for the story card editor.
            //
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
                modalAddFullScreenButton(cloneButton, modalHeader_Title.firstChild);
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
            // Look for the Context Viewer.
            //
            else if ($(modalHeader_Title).find("p:contains('View Context')").length > 0) {
              modalNode.style.width = ' min-content';
              modalNode.style.height = 'max-content';
              setTimeout(() => {
                modalNodeTree.id = appendBeforeTimestamp(modalNodeTree.id, "_ViewContext");
                makeModalDraggableAndResizable(timestamp, modalNodeTree, modalNode);
              }, 100); // adjust as needed

            }
            // Look for the "See" viewer Image Options modal.
            //
            else if ($(modalHeader_Title).find("h1:contains('Image Options')").length > 0) {
              modalNode.style.width = ' min-content';
              modalNode.style.height = 'max-content';
              setTimeout(() => {
                modalNodeTree.id = appendBeforeTimestamp(modalNodeTree.id, "_ImageOptions");
                const cloneButton = modalNode.querySelector("div[role='button'][aria-label='Close modal' i]");
                modalAddFullScreenButton(cloneButton, modalHeader, 'before', cloneButton);
                makeModalDraggableAndResizable(timestamp, modalNodeTree, modalNode);
              }, 100); // adjust as needed

            }
            // Look for the "Memories" viewer/editor modal.
            //
            else if ($(modalHeader_Title).find("p:contains('Memories')").length > 0) {
              modalNode.style.width = !modalWidthCfg ? '512px' : `${modalWidthCfg}`;
              modalNode.style.height = !modalHeightCfg ? '90vh' : `${modalHeightCfg}`;
              setTimeout(() => {
                modalNodeTree.id = appendBeforeTimestamp(modalNodeTree.id, "_MemoryViewer");
                const cloneButton = modalNode.querySelector("div[role='button'][aria-label='Close modal' i]");
                modalAddFullScreenButton(cloneButton, modalHeader_Title.firstChild.lastChild);
                makeModalDraggableAndResizable(timestamp, modalNodeTree, modalNode);
              }, 100); // adjust as needed
            }
            // Check for a text/token viewer.
            //
            else if (checkTokenViewer(modalNode)) {
              modalNode.style.width = !modalWidthCfg ? '512px' : `${modalWidthCfg}`;
              modalNode.style.height = !modalHeightCfg ? '90vh' : `${modalHeightCfg}`;
              setTimeout(() => {
                modalNodeTree.id = appendBeforeTimestamp(modalNodeTree.id, "_TokenViewer");
                const cloneButton = modalNode.querySelector("div[role='button'][aria-label='Close modal' i]");
                modalAddFullScreenButton(cloneButton, modalHeader_Title.firstChild.lastChild);
                makeModalDraggableAndResizable(timestamp, modalNodeTree, modalNode);
              }, 100); // adjust as needed
            }
            // Fix the irritatingly small window size for the script editor.
            //
            else if ($(modalNode).find("p:contains('Shared Library')").length > 0) {
              setTimeout(() => {
                waitForKeyElements(".monaco-editor .view-lines", (editorElements) => {
                  modalNodeTree.id = appendBeforeTimestamp(modalNodeTree.id, "_ScriptEditor");

                }, true);
                const cloneButton = modalHeader_Title.querySelector("div[role='button'][aria-label='back' i]");
                modalAddFullScreenButton(cloneButton, modalHeader_Title);

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
// We only look for new div elements added to the top level body.
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

/**
 * Event handler for fixing the state.message display locking out the Navigation bar..
 */
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

/**
 * Event handler for handling play pages.
 *
 * @param {HTMLElement} targetNode - A refernce to the play page.
 */
function handlePlayPage(targetNode) {
  // handleChanges();
  if (cfg.get('Action_Cleaner') === true) {
    let handleChangesObserver = new DOMObserver(handleChanges, targetNode, { childList: true, subtree: true });
    handleChangesObserver.observe();
  }

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

  // Inject the action text toggle button.
  //
  const referenceSpan = [...$('[role=button]')].find((e) => e.innerText === 'w_undo').parentElement; // Select the span
  const container = referenceSpan.parentElement;
  headerInject(container, referenceSpan, toggleButtonText, toggleOnClick);

  fixNavigationBarObserver.observe();
}

// Add the keypress handler for dealing with hotkeys.
//
document.addEventListener('keydown', handleKeyPress);

// Read and Play pages both have role=article nodes at the top.
//
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

