# Feature Ideas & Potential Improvements for AID-QoL-Tool

A categorized list of proposed Quality-of-Life (QoL) features and enhancements for future development.

---

## 1. Context & Story Card Enhancements

- [ ] **Live In-Context Indicator on Story Cards**
  - **Concept:** When viewing the Story Cards list (in either the sidebar drawer or the Story Card manager modal), show a visual indicator (e.g. glowing colored badge, active icon, or pulse) on cards that are *actively included in the model's context* for the most recent turn.
  - **Why it matters:** Players currently have to open the Context Details modal, expand the section, and cross-reference card names to determine if a card triggered. This makes trigger verification instantaneous.
  - **Implementation approach:** Hook into the active turn's context payload (already read by Context Details) or compare recent turn text against card keywords, and add an `.aid-qol-card-in-context` class to matching cards.

- [ ] **Live Token & Word Estimator for Cards & Plot Essentials**
  - **Concept:** Display a compact, live token counter badge right below or inside the textarea in Story Card edit modals, Plot Essentials, and Author's Note as you type (e.g., `~145 tokens · 112 words`).
  - **Why it matters:** Context budgets are tight, and knowing whether an entry is 80 tokens or 250 tokens before saving avoids accidentally crowding out memory or recent story history.
  - **Implementation approach:** Use a lightweight BPE/cl100k approximation tokenizer function in JS attached to the input/change listener of story card and memory textareas.

- [ ] **One-Click Card Duplicate ("Clone Card")**
  - **Concept:** Add a "Duplicate" button in the "..." dropdown actions menu of Story Cards to instantly clone an existing card into a new draft.
  - **Why it matters:** Great for creating character variations, equipment upgrades, temporary statuses, or sub-locations without retyping descriptions and keys from scratch.

- [ ] **Trigger Keyword Highlighting in Story Text**
  - **Concept:** Optional toggle to subtly underline or highlight words in the latest story paragraph that matched Story Card trigger keys.
  - **Why it matters:** Makes it visually obvious which words in the story pulled in specific context, helping authors tune keyword sensitivity.

---

## 2. Story Stream & Reading Experience

- [ ] **Fast Virtualized Story Search (`Ctrl+Shift+F`)**
  - **Concept:** A search overlay that can search through past actions and paragraphs across the entire active adventure.
  - **Why it matters:** AI Dungeon virtualizes its story stream (`[data-gameplay-story-row-index]`), meaning rows not currently near the viewport are unmounted. Standard browser `Ctrl+F` fails to find older scenes or character introductions.
  - **Implementation approach:** Query the in-memory adventure turn cache or trigger scroll jumps to locate matching text, scrolling the virtualized container directly to the target row.

- [ ] **Scene & Turn Clean Exporter (`Alt+Ctrl+C` or Toolbar Button)**
  - **Concept:** A quick-copy tool to copy the last AI response, last $N$ turns, or the entire adventure as clean, formatted Markdown or plain text directly to the clipboard.
  - **Why it matters:** Sharing snippets on Discord, Reddit, or saving story milestones usually requires manual copying and editing to strip out player action prefixes, retry icons, and UI junk.

- [ ] **Session Word Count & Stats Bar**
  - **Concept:** A subtle, collapsible status bar or toolbar tooltip showing session stats: total adventure words, session words generated, turn count, and token usage ratio.
  - **Why it matters:** Fun and useful feedback for tracking writing session progress and monitoring total story length.

---

## 3. Gameplay Input & Prompting

- [ ] **Input History Buffer (`Up/Down` Arrow Recall)**
  - **Concept:** When the prompt input textarea (`#game-text-input`) is empty, pressing `Up Arrow` cycles backwards through previously submitted actions (terminal/interactive fiction REPL style). Pressing `Down Arrow` moves forward.
  - **Why it matters:** Allows quickly re-submitting, tweaking, or branching from a previously typed action without having to retype it.

- [ ] **Prompt Scratchpad / Staged Drafts Tray**
  - **Concept:** A collapsible slide-out drawer or mini-dock beside the input dock where users can draft alternate continuation ideas, keep temporary notes, or store canned prompt snippets.
  - **Why it matters:** When testing multiple branches or deciding between different actions, players often lose their typed prompt if they undo or switch modes.

- [ ] **Smart Trim & Punctuation Fixer**
  - **Concept:** Optional setting to auto-clean common input typos before submission (e.g. fixing mismatched quotation marks, trimming accidental double spaces, ensuring proper sentence capitalization).

---

## 4. Modal & Window Management

- [ ] **Dock / Split-Screen Preset for Context Viewer & Story Cards**
  - **Concept:** Add a "Snap to Side" (Dock Left / Dock Right) button on the Context Viewer and Story Card modal headers.
  - **Why it matters:** Allows players with wider monitors to dock the Context Viewer or Story Card editor side-by-side with the story feed in a fixed two-pane layout rather than floating over the text.

- [ ] **Per-Display Size & Position Presets**
  - **Concept:** Automatically remember modal sizes and positions based on screen resolution (e.g., separate layout coordinates for a 4K desktop monitor vs. a 1080p laptop display).

- [ ] **Multi-Card Quick Switcher (Tabs or Dropdown in Story Card Modal)**
  - **Concept:** When viewing or editing a Story Card, provide "Next" / "Previous" arrows or a quick dropdown to switch between cards directly without closing the modal and finding the next card in the sidebar.

---

## 5. Theme & Configuration Management

- [ ] **Named Custom Theme Profiles & Theme Export / Import**
  - **Concept:** Allow users to name and save multiple custom theme profiles (e.g., "Late Night Cozy", "Sci-Fi Terminal", "Compact Editing") alongside the built-in presets, as well as export and import theme settings via JSON string or file.
  - **Why it matters:** Makes it easy to switch between personalized setups for different genres or devices, back up carefully tuned typography/density settings, and share custom themes with other players.
