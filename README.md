# AID-QoL-Tool

Enhanced Tampermonkey Script for AI Dungeon.
Warning, this TamperMonkey script may break at any time. AID may change their website without notice (as is their right.)

This script was originally based on AliH2K's script. It adds many features and enhancements and restructures their code a bit.

- Modal window drag and resize.
- Modal window fullsize screen toggle.
- Modal window undim/unmask gameplay log.
- Sitewide Textarea resizing.
- See action image resize and fullscreen.
- Enhanced memory editing.
- Hide Do/Say Actions Toggle.
- Credits Being Used Indicator.
- Additional hotkeys:
  - Flame menu.
  - beta/play toggle.
  - change player name.
  - goto user profile.
  - continue adventure.
- StoryCard Editor enhancements:
  - Container Delimiter entry.
  - Default notes entry.
- Code editor modal window size fix.
- Styling to make more efficient use of space by removing excess padding, margins, and gaps.
- Print adventure from read mode keeping '>' (raw text mode). 

Future enhancements:
- Gear Menu:
  - Horizontal Resize/fullscreen.
- Reduce image size on front page.
- Create directory style listings for scenarios with their adventures (a heavy lift.)
- Print/export story from gameplay screen so full story is available.

The way it works: React structures are parsed to add unique ids to the AIDs HTML elements. Then CSS for those elements is preloaded so when the IDs are added they get the appropriate styling.
The current method exports a nested CSS tree (GM_addStyle) for the gearMenu that is used re-style the gearMenu components. The modal handling code is mostly done through individual styling blobs for each modal type. gearMenu handling is being changed over to be more localized like the way the modals are handled.
In general, snippes of the html are parsed using JavaScript and key HTML elements are isolated and assigned unique tags. Methods such as waitForKeyElements and MutationObservers watching the react DOM are used to parse the HTML tree.

### BUGS:
- Pretty much anything to do with Multiple Choice and Character Creator scenario editing doesn't work.
- Note, drag and resize broken on multiple choice editing. Needs fix.

