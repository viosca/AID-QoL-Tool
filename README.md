# AID-QoL-Tool (v3.0.0)

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
* Adds an **`A+` / `A-`** toggle button directly into the story header bar (next to Undo).
* Toggle with hotkey: `Alt+Ctrl+U`.
* Hides `> You ...` action text rows to provide a clean, book-like reading experience without collapsing ancestor layouts or flickering.

### 4. Story Card Modals (Drag, Top-Left Anchored Resize, Auto-Remember)
* **Smooth Header Dragging**: Grab anywhere on the visible modal header row to reposition Story Cards.
* **Anchored Resizing**: Resizes outward from the bottom-right corner without center-snapping, jumps, or Tailwind width capping.
* **Double-Click Title**: Double-click the header bar to maximize / restore.
* **Configurable Initial Size**: Centered symmetrically on open (defaults to `680px` × `82vh`).
* **Auto-Remember Dimensions**: Uses a debounced `ResizeObserver` to automatically remember any size you adjust the card to.

### 5. Native In-Game Configuration Dialog
* Modern, dark-themed Settings Dialog replacing legacy MonkeyConfig.
* Easily accessed via:
  * **Header Button**: Click the `⚙` button next to `A+` in the story navigation bar.
  * **Keyboard Shortcut**: `Alt+Ctrl+,`.
  * **Tampermonkey Menu**: `⚙️ Configure Settings (Hotkeys, Sizes, Toggles)`.
* **Full Customization**:
  * **Hotkeys**: Set custom keys for turn actions, mode switches, and navigation. Just click any key box and press your desired key.
  * **Modifier Keys**: Choose any combination of `Alt`, `Ctrl`, and `Shift`.
  * **Story Card Dimensions**: Set default width/height and toggle auto-remember.
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
