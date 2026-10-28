# AID-QoL-Tool (v3.3.5)

[![Install Userscript](https://img.shields.io/badge/Install_Userscript-Tampermonkey-4f46e5?style=for-the-badge&logo=tampermonkey&logoColor=white)](https://raw.githubusercontent.com/viosca/AID-QoL-Tool/main/AID-QoL-Tool.user.js)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg?style=for-the-badge)](LICENSE.md)

Modern, high-performance Quality-of-Life Tampermonkey userscript for [AI Dungeon](https://play.aidungeon.com/).

Rewritten from the ground up to support AI Dungeon's modern architecture (**React 19**, **Next.js 16**, **Tamagui v2**, and **Tailwind CSS**).

---

## Features

### 1. Story Input Tweaks
* **Auto-Quote "Do" Mode**:
  * Automatically pre-fills empty "Do" actions with quotation marks (`""`) and places the cursor right between them.
  * Quotes unquoted text automatically when sending a "Do" turn.
  * Automatically removes dangling empty quotes if you switch away from "Do" mode.
* **Auto-Focus**: Focuses the story prompt input (`#full-screen-text-input`) on page load and adventure start.
* **React 19 Compatibility**: Directly interacts with React 19 synthetic event tracking for zero input desync.

### 2. Hotkeys & Fast Navigation (`Alt+Ctrl` / `Option+Cmd`)
Configurable shortcuts for story flow and UI navigation without touching the mouse:

| Category | Shortcut | Action |
| :--- | :--- | :--- |
| **Turns** | `Alt+Ctrl+C` | Take Turn |
| | `Alt+Ctrl+A` | Continue Story |
| | `Alt+Ctrl+S` | Retry (Regenerate) |
| | `Alt+Ctrl+X` | Retry History |
| | `Alt+Ctrl+D` | Erase / Undo |
| **Modes** | `Alt+Ctrl+Q` | **Do** mode |
| | `Alt+Ctrl+W` | **Say** mode |
| | `Alt+Ctrl+E` | **Story** mode |
| | `Alt+Ctrl+R` | **See** mode |
| **Navigation** | `Alt+Ctrl+F` | Open Game / Gear Menu |
| | `Alt+Ctrl+H` | Scroll to Top |
| | `Alt+Ctrl+T` | Toggle site between `play` and `beta` |
| | `Alt+Ctrl+G` | View User Profile |
| | `Alt+Ctrl+V` | Continue Current Adventure |
| | `Alt+Ctrl+Z` | Edit Character Name |
| | `Alt+Ctrl+U` | Toggle Action Visibility |
| | `Alt+Ctrl+,` | **Open Settings Dialog** |
| **Dialogs** | `←` / `→` | Navigate dialog buttons |
| | `Enter` | Confirm / Primary action |

*All hotkeys and modifier keys (Alt, Ctrl, Shift) can be customized to any key you prefer in the Settings Dialog.*

### 3. Action Visibility Toggle (`A+` / `A-`)
* **Header Bar Integration**: Adds native-styled `A+` / `A-` and `⚙` (Settings) buttons directly into the navigation toolbar next to Undo/Redo.
* **Dynamic Theme Color Sync**: Cloned directly from native toolbar elements to match AI Dungeon's squircle shape, sizing, and spacing. Dynamically inherits colors from active game themes (Default, Atlantis, Cyber, S'mores, Orcish, etc.).
* **Preserves Story Paragraph Spacing**: Collapsing actions doesn't abruptly smash paragraphs together; actions collapse to an invisible `1.5em` blank line spacer, preserving natural book-like paragraph breaks.
* **Toggle Shortcut**: Press `Alt+Ctrl+U` to toggle action visibility anytime without using the mouse.

### 4. Story Card Modals (Drag, Top-Left Anchored Resize, Auto-Remember)
* **Smooth Header Dragging**: Grab anywhere on the visible modal header row to reposition Story Cards.
* **Anchored Resizing**: Resizes outward from the bottom-right corner without center-snapping, jumps, or Tailwind width capping.
* **Double-Click Title**: Double-click the header bar to maximize / restore.
* **Configurable Initial Size**: Centered symmetrically on open (defaults to `680px` × `82vh`).
* **Auto-Remember Dimensions**: Uses a debounced `ResizeObserver` to automatically remember any size you adjust the card to.

### 5. Game Play Menu Horizontal Resize (Split Screen)
* **Draggable Left Border**: Hover over the left edge of the right-hand Game Menu (Settings/Adventure/Story Cards) to grab the vertical split-screen resize handle.
* **Fluid Layout**: Dragging left expands the menu panel and fluidly resizes all tab contents, Story Card listings, and search bars.
* **Double-Click Reset**: Double-click the resize border to toggle/reset between custom width and default width (424px).
* **Auto-Remember Width**: Automatically saves your preferred sidebar width so it stays that size next time you open the menu.

### 6. Native In-Game Configuration Dialog
* Modern, AID-themed Settings Dialog replacing legacy config tools.
* **Seamless AID Aesthetic**: Styled with AID-native dark colors, subtle borders, and distinct toggle switch check indicators.
* Easily accessed via:
  * **Header Button**: Click the `⚙` squircle button in the story navigation bar.
  * **Keyboard Shortcut**: `Alt+Ctrl+,`.
  * **Tampermonkey Menu**: `⚙️ Configure Settings (Hotkeys, Sizes, Toggles)`.
* **Full Customization**:
  * **Hotkeys**: Interactive hotkey binder for turns, story modes, and navigation.
  * **Modifier Keys**: Choose any combination of `Alt`, `Ctrl`, and `Shift`.
  * **Story Card & Menu Dimensions**: Set default modal width/height and Game Menu sidebar width with live width updates and auto-remember toggles.
  * **General Options**: Toggle auto-quoting, auto-focus, action visibility, and debug logs.
  * **Reset to Defaults**: One-click restore button.

---

## Installation

1. Install a userscript manager such as [Tampermonkey](https://www.tampermonkey.net/).
2. Install [`AID-QoL-Tool.user.js`](https://raw.githubusercontent.com/viosca/AID-QoL-Tool/main/AID-QoL-Tool.user.js).
3. Open or refresh [AI Dungeon](https://play.aidungeon.com/).

---

## Project Structure

```
AID-QoL-Tool/
├── .gitignore                   # Repository ignore rules
├── AID-QoL-Tool.user.js         # Active v3 production script
├── AID-QoL-Tool.v2-reference.js  # Legacy v2 monolithic script reference
├── LICENSE.md                   # MIT License
└── README.md                    # Project documentation
```

---

## License

This project is licensed under the terms of the [MIT License](LICENSE.md).
