# Code Architecture & Refactoring Roadmap

This document outlines internal code-quality, DRY (Don't Repeat Yourself), and runtime performance refactoring opportunities for [`AID-QoL-Tool.user.js`](AID-QoL-Tool.user.js). Unlike [`FEATURE_IDEAS.md`](FEATURE_IDEAS.md), which tracks user-facing enhancements, these items focus on maintainability, reducing code size, and minimizing browser overhead.

---

## Executive Summary: Size & Performance Impact

| Refactoring Area | Affected Lines | Estimated After | Net Reduction | Primary Impact |
| :--- | :---: | :---: | :---: | :--- |
| **1. Schema-Driven Config & Form Helpers** | ~675 | ~180 | **~495 lines** | Eliminates 5-way setting synchronization and duplicated HTML/listener boilerplate; makes Theme Export/Import trivial. |
| **2. CSS Custom Properties & `:is()` Selectors** | ~530 | ~370 | **~160 lines** | Eliminates full stylesheet string rebuilding and CSS re-parsing on every slider tick during live preview. |
| **3. Unified Modal Window Helper** | ~370 | ~230 | **~140 lines** | Consolidates positioning, `z-index` layering, header dragging, and drag-shield overlays across all modals. |
| **4. Toolbar Cloner, Theme Sampler & Menu Loop** | ~180 | ~100 | **~80 lines** | Deduplicates native toolbar button cloning, theme color detection, and `GM_registerMenuCommand` registrations. |
| **5. Multiplexed `DOMObserver` (`observeSelector`)** | ~65 | ~35 | **~30 lines** | Replaces 8 separate full-document `MutationObserver` instances with a single batched observer. |
| **Total** | **~1,820** | **~915** | **~905 lines (~16%)** | Shrinks script from **~5,720 lines to ~4,815 lines** (~38 KB reduction) while cutting DOM & style-recalc overhead. |

---

## Detailed Refactoring Areas

### 1. Schema-Driven Configuration & Form Binding (`ConfigUIModule` & `ThemeManagerModule`)
* **Current State:**
  * `ConfigUIModule` spans ~2,095 lines (36% of the entire userscript).
  * Every configuration and theme key is manually listed and synchronized across **5 separate places**:
    1. `DEFAULT_CONFIG`
    2. `ThemeManagerModule.getSavedSettings()`
    3. `ConfigUIModule.gatherCurrentThemeUI()`
    4. `ConfigUIModule.applyPresetToUI()`
    5. `ConfigUIModule.populateFields()` and `ConfigUIModule.save()`
  * In `ConfigUIModule.render()`, HTML markup and event listeners are repeated verbatim for:
    * **16 Hotkey inputs** (~72 lines of HTML)
    * **8 Range Sliders + Direct Value Inputs + Reset Buttons** (~115 lines of HTML & binding calls)
    * **3 Color Picker + Hex Input + Swatch Row + Reset Button groups** (~157 lines of HTML & duplicated event wiring)
* **Proposed Refactor:**
  * Define a single declarative `SETTINGS_SCHEMA` table (mapping config key, UI element ID, input type, default value, unit, min/max/step, and label).
  * Generate slider rows, hotkey grids, and color picker groups via small template helpers (`renderSliderRow()`, `renderColorGroup()`, `bindColorPickerGroup()`).
  * Drive `populateFields()`, `save()`, `gatherCurrentThemeUI()`, and `applyPresetToUI()` directly by iterating over the schema.
* **Benefits:**
  * **Saves ~495 lines** of repetitive DOM queries and HTML templates.
  * Adding a new setting or theme property requires editing a single schema entry instead of 5 methods.
  * Directly enables **Named Custom Theme Profiles & Export/Import** (see [`FEATURE_IDEAS.md`](FEATURE_IDEAS.md)) because serializing/deserializing a theme is just filtering the schema by `category: 'theme'`.

---

### 2. CSS Variable-Driven Theme Engine & `:is()` Selector Consolidation (`ThemeManagerModule`)
* **Current State:**
  * `ThemeManagerModule.buildCSS()` dynamically concatenates a ~300-line CSS stylesheet string and overwrites `<style id="aid-qol-theme-style">.textContent` on every `input` event while dragging sliders.
  * Long selector groups for Gear Menu sub-menus (`.aid-qol-game-menu-resizable ...`, `[aria-label="Game settings" i] ...`, `.aid-qol-story-card-modal ...`) are repeated across multiple rule blocks (~95 lines) instead of using `:is(...)`.
  * Similar selector repetition exists in `TextareaResizeModule.updateStyles()` for excluding story-area textareas.
* **Proposed Refactor:**
  * Inject static structural CSS rules once at startup referencing CSS custom properties (e.g., `var(--aid-qol-font-size)`, `var(--aid-qol-line-height)`, `var(--aid-qol-card-height)`, `var(--aid-qol-textarea-height)`).
  * Update only the root CSS variables (`document.documentElement.style.setProperty(...)`) when sliders move.
  * Consolidate repeated ancestor prefixes with `:is(.aid-qol-game-menu-resizable, [aria-label="Game settings" i], .aid-qol-story-card-modal)`.
* **Benefits:**
  * **Saves ~160 lines** of CSS string building and repeated selectors.
  * **Performance:** Dragging a slider currently triggers 30–60 full stylesheet string allocations and browser CSS parser passes per second, invalidating styles across the entire document. Updating a CSS custom property avoids stylesheet re-parsing altogether and scopes style recalculation strictly to elements referencing that variable.

---

### 3. Unified Modal Window Helper (`StoryCardModalModule` & `ConfigUIModule`)
* **Current State:**
  * `setupStoryCardModal()` and `setupContextViewerModal()` duplicate ~85 lines of window setup: stripping Tailwind centering/width classes, computing centered viewport coordinates, setting `fixed !important` inline bounds, elevating `highestZ` on open and `pointerdown`, guarding parent flex alignment, and retrying header attachment via `requestAnimationFrame`.
  * Header pointer-dragging is implemented separately in `StoryCardModalModule.bindDragEvents()` and `ConfigUIModule.render()`.
  * Full-screen transparent drag-shield overlays are created separately in `StoryCardModalModule.bindCornerResizeEvents()` and `GameMenuResizeModule.bindDragEvents()`.
* **Proposed Refactor:**
  * Extract a shared `WindowManager` / `ModalHelper` utility providing:
    * `anchorModal(modal, { width, height })`
    * `bringToFront(modal)`
    * `bindHeaderDrag(modal, header, { onDoubleClick })`
    * `withDragShield(cursor, callback)`
* **Benefits:**
  * **Saves ~140 lines** and ensures consistent drag clamping, `z-index` stacking, and pointer capture across Story Cards, Context Viewer, Subdialogs, and the Configuration Dialog.

---

### 4. Multiplexed `DOMObserver` (`observeSelector`)
* **Current State:**
  * Every call to `observeSelector(selector, callback)` creates a brand-new `MutationObserver` watching `document.body` with `{ childList: true, subtree: true }`.
  * Across all modules, **8 separate `MutationObserver` instances** are simultaneously observing the full `document.body` subtree.
  * During AI Dungeon's streaming token output (where React mutates the DOM dozens of times per second) or when opening menus, all 8 observers fire independently and each runs `node.querySelectorAll(selector)` over every added node.
* **Proposed Refactor:**
  * Replace with a single central `DOMObserver` multiplexer that maintains a registry of `{ selector, callback, processedElements }` entries.
  * When mutations arrive, collect unique added element roots and evaluate registered selectors in a single pass.
  * Migrate `GameMenuResizeModule.observeMenu()` to use this shared observer instead of maintaining its own custom `MutationObserver`.
* **Benefits:**
  * **Saves ~30 lines** of observer boilerplate.
  * **Performance:** Cuts `MutationObserver` callback dispatch and subtree traversal overhead by **~75–85%** during active AI response streaming and UI navigation.

---

### 5. Shared Toolbar Cloner, Native Theme Sampler & Menu Command Loop
* **Current State:**
  * `ActionToggleModule.injectButton()` duplicates ~35 lines of DOM cloning, class sanitization, label creation, and click/keyboard event binding for the `A+/A-` button and the `⚙` Settings button.
  * Both `ActionToggleModule.syncTheme()` and `ConfigUIModule.applyThemeStyles()` independently inspect DOM elements and computed styles to detect AI Dungeon's active theme palette (`--background`, `--color`, `--borderColor`).
  * Top-level `GM_registerMenuCommand` registrations repeat 7 nearly identical toggle blocks.
* **Proposed Refactor:**
  * Extract `cloneNativeToolbarButton({ wrapperId, buttonId, label, title, onActivate })` in `ActionToggleModule`.
  * Extract a shared `getNativeThemeColors()` utility used by both the toolbar buttons and the config modal.
  * Register Tampermonkey toggle commands via a compact declarative array loop.
* **Benefits:**
  * **Saves ~80 lines** and guarantees consistent theme color inheritance across all custom UI elements.
