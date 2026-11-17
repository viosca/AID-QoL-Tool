# AID-QoL-Tool (v3.7.1)

[![Install Userscript](https://img.shields.io/badge/Install_Userscript-Tampermonkey-4f46e5?style=for-the-badge&logo=tampermonkey&logoColor=white)](https://raw.githubusercontent.com/viosca/AID-QoL-Tool/main/AID-QoL-Tool.user.js)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg?style=for-the-badge)](LICENSE.md)

Modern, high-performance Quality-of-Life Tampermonkey userscript for [AI Dungeon](https://play.aidungeon.com/).

Rewritten from the ground up to support AI Dungeon's modern architecture (**React 19**, **Next.js 16**, **Tamagui v2**, and **Tailwind CSS**).

---

## Features

### 1. Story Input Tweaks
* **Auto-Quote "Do" Mode (with WYSIWYG & Toggle)**:
  * Automatically pre-fills empty "Do" actions with quotation marks (`""`) and places the cursor right between them.
  * **`Ctrl+U` Quote Toggle**: Press `Ctrl+U` (or `Cmd+U` on macOS) inside the action input to seamlessly strip or re-wrap quotes anytime without viewing page source.
  * **Smart Backspace**: Pressing `Backspace` inside empty prefilled quotes (`""`) cleanly deletes both quotes and opts out of quoting for that turn without fighting you.
  * **Pure WYSIWYG**: Never silently modifies or wraps text on submission—what you see in the input box is exactly what is submitted to the model.
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

### 4. Story Card & Context Viewer Modals (Drag, Anchored Resize, Auto-Remember)
* **Smooth Header Dragging**: Grab anywhere on the visible modal header row to reposition Story Cards or Context Viewer windows.
* **Anchored Resizing**: Resizes outward from the bottom-right corner without center-snapping, jumps, or Tailwind width capping.
* **Dedicated 2D Corner Resizer**: Custom resize handle for Context Viewer overview and subdialogs (Adventure, Instructions, Memories).
* **Configurable Transparent Backdrop**: Eliminates modal darkening and blur by default (configurable in **Modals & Menus** settings or via the Tampermonkey menu) so background game story text remains completely visible and readable while managing cards or inspecting context.
* **Zero-Blink Pre-Paint Positioning**: Opens Story Cards, Context Viewer, and all Context Subdialogs directly at their target coordinates and dimensions with no initial size/position jump.
* **Multi-Window Layering**: Opening subdialogs places them directly in front, and clicking any open modal immediately brings it to the top.
* **Double-Click Title**: Double-click the header bar to maximize / restore.
* **Configurable Initial Size**: Centered symmetrically on open (defaults to `680px` × `82vh` for cards, `480px` for context).
* **Auto-Remember Dimensions**: Uses a debounced `ResizeObserver` to automatically remember any size you adjust modals to.

### 5. Game Play Menu Horizontal Resize (Split Screen)
* **Draggable Left Border**: Hover over the left edge of the right-hand Game Menu (Settings/Adventure/Story Cards) to grab the vertical split-screen resize handle.
* **Fluid Layout**: Dragging left expands the menu panel and fluidly resizes all tab contents, Story Card listings, and search bars.
* **Double-Click Reset**: Double-click the resize border to toggle/reset between custom width and default width (424px).
* **Auto-Remember Width**: Automatically saves your preferred sidebar width so it stays that size next time you open the menu.

### 6. Vertical Textarea Resizing
* **Draggable Bottom-Right Resizer**: Resizes any textarea vertically across Story Cards, Memory, Notes, and Scenarios by grabbing the small box at the bottom of the scrollbar.
* **Overrides Tailwind Limits**: Restores vertical resizing on fields that AI Dungeon hardcodes with `resize-none`.
* **Visual Grip Indicator**: Stylized corner resizer with diagonal grab lines and vertical resize cursor (`↕`).
* **Preserves Main Gameplay Dock**: Automatically excludes the docked action input bar (`#game-text-input`) to avoid dock clipping.

### 7. Theme & Typography Manager
* **Dedicated Configuration Tab**: Built directly into the in-game Configuration Dialog under **🎨 Theme & Style**.
* **Curated Presets**:
  * **⚙️ Default**: Restores native AI Dungeon typography, layout, and atmosphere.
  * **📱 Compact**: High-density reading with reduced font size (15px), tighter line height (1.45), snug paragraph spacing (0.85em), and narrower column width (780px).
  * **📖 Large / Cozy**: Spacious, comfortable reading with warmer paper tones (`#f4efe6`), larger typography (21px), relaxed line height (1.85), medium font weight (500), and generous paragraph spacing (1.5em).
  * **🌑 OLED Pure Black**: True `#000000` deep black background with high-contrast text (`#e4e4e7`), glowing cyan action accents (`#38bdf8`), and suppressed background saturation for pitch-black contrast and battery savings.
  * **🎨 Custom**: Full granular control over every visual attribute.
* **Granular Typography Controls (Direct Typed Entry + Sliders)**:
  * **Direct Precision Typing**: Click any value box to type exact values directly (e.g. `18.5px`, `1.65`, `850px`). Sliders update seamlessly.
  * **Individual Field Reset**: Every slider and dropdown features a `↺` button that restores that specific setting back to default with one click.
  * **Font Size**: Live slider and input from `13px` to `26px` (defaults to `18px`). Dynamically synchronizes font size across story paragraphs, inline editing textareas, and the bottom action entry prompt.
  * **Font Boldness / Weight**: Choose from `300 (Light)`, `400 (Regular)`, `500 (Medium)`, `600 (Semi-Bold)`, or `700 (Bold)`.
  * **Line Height**: Live slider and input from `1.20` to `2.40` (defaults to `1.70`).
  * **Story Text Color**: Hex input, native color picker, and 1-click quick swatches (Pure White, Warm Paper, Soft Gray, Golden Amber, Sage Mint).
* **Layout & Column Width**:
  * **Paragraph & Action Spacing**: Live slider and input from `0.40em` to `2.40em` (defaults to `1.25em`).
  * **Story Max Width**: Live slider and input from `600px` to `1400px` (defaults to `900px`). Automatically synchronizes the bottom prompt dock (`#game-text-input-controller`) to match.
* **Interface & Menu Density (Story Cards & Gear Menu)**:
  * **Gear Menu Font Size**: Live slider and input from `11px` to `20px` (defaults to `14px`) to customize text and textarea font scale across Adventure and Gameplay sidebar panels, sub-menus (Plot Essentials, Author's Note, AI Instructions, Details, Scripts), and Story Card editor modals.
  * **Sub-menu Textarea Height**: Live slider and input from `44px` to `160px` (defaults to `96px`, `54px` in compact mode) for full control over the vertical box size and density of textareas across gear menu sub-menus, while seamlessly preserving manual vertical resize handles.
  * **Story Card Item Height**: Live slider and input from `32px` to `64px` (defaults to `64px`). In compact mode, slims card rows down to `44px` or `36px` to fit significantly more cards on screen.
  * **Category & Item Separation**: Live slider and input from `2px` to `16px` (defaults to `12px`). Eliminates excessive whitespace between category titles (`Character`, `Class`, etc.) and their card listings.
  * **Gear Menu Density**: Tightens tab lists, search bars, and action buttons for streamlined navigation.
* **Atmosphere & Background Overrides**:
  * **Background Color**: Hex input, native color picker, and 1-click quick swatches (OLED Black, Midnight Slate, Deep Charcoal, Espresso Dark).
* **Player Action Styling**:
  * Style player inputs (`Do`, `Say`, `>`) independently from story text:
    * `Default (Native)`
    * `Dimmed / Subdued` (72% opacity)
    * `Italicized`
    * `Accent Colored`
    * `Italic + Accent Colored`
    * `Underlined`
  * **Action Accent Color Picker**: Quick swatches for AID Amber (`#fb923c`), Electric Sky (`#38bdf8`), Emerald (`#34d399`), Crimson Rose (`#f43f5e`), and Mystic Violet (`#c084fc`).
* **Real-Time Interactive Story Preview**:
  * Built-in live excerpt card inside the settings dialog immediately displays changes as sliders and swatches are adjusted.
  * Active story stream updates in real-time.
  * Safe revert: Closing the dialog without saving (Cancel / Esc / X) cleanly restores previously saved settings.

### 8. Native In-Game Configuration Dialog
* Modern, AID-themed Settings Dialog replacing legacy config tools.
* **Seamless AID Aesthetic**: Styled with AID-native dark colors, subtle borders, and distinct toggle switch check indicators.
* Easily accessed via:
  * **Header Button**: Click the `⚙` squircle button in the story navigation bar.
  * **Keyboard Shortcut**: `Alt+Ctrl+,`.
  * **Tampermonkey Menu**: `⚙️ Configure Settings (Hotkeys, Sizes, Toggles)`.
* **Full Customization**:
  * **Hotkeys**: Interactive hotkey binder for turns, story modes, and navigation.
  * **Modifier Keys**: Choose any combination of `Alt`, `Ctrl`, and `Shift`.
  * **Theme & Typography**: Presets, sliders, colors, and live preview.
  * **Story Card & Menu Dimensions**: Set default modal width/height and Game Menu sidebar width with live width updates and auto-remember toggles.
  * **General Options**: Toggle auto-quoting, auto-focus, action visibility, and debug logs.
  * **Reset to Defaults**: One-click restore button.

### 9. Antigravity Dev Bridge & Token Sync
* **Zero-Credential Token Extraction**: Automatically reads the active Firebase Auth session from `indexedDB` or intercepted GraphQL requests.
* **One-Click Clipboard Copy**: Click `📋 Copy Token for .env` to format `AID_ACCESS_TOKEN=<token>` straight onto your clipboard.
* **Direct Local Bridge Sync**: Click `🔄 Sync to Antigravity (Port 8765)` to push the active token and current scenario/adventure shortId directly into `AID-LLM-connector`'s `.env` file via `http://127.0.0.1:8765/sync`.
* **Tampermonkey Menu Shortcuts**: Access sync and token copy directly from Tampermonkey's extension dropdown menu anytime.

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
├── FEATURE_IDEAS.md             # Future enhancement ideas & roadmap
├── LICENSE.md                   # MIT License
├── README.md                    # Project documentation
└── REFACTORING.md               # Internal DRY & performance refactoring roadmap
```

---

## License

This project is licensed under the terms of the [MIT License](LICENSE.md).
