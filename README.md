# AID-QoL-Tool


Enhanced Tampermonkey Script for AI Dungeon.


This script is based on AliH2K's script. It adds features and enhancements.

- Modal window drag and resize.
- Modal window fullsize screen toggle.
- Sitewide Textarea resizing.
- Hide Actions Toggle.
- Credits Being Used Indicator.
- Script Editor Fixes.
- Additional hotkeys:
  - Flame menu.
  - beta/play toggle.
  - change player name.
  - goto user profile.
  - continue adventure.
- StoryCard Editor enhancements:
  - Container Delimiter entry.
  - Default notes entry.
- Code editor window size fix.

Future enhancements:
- Gear Menu:
  - Horizontal Resize/fullscreen.

The way it works: React structures are parsed to add unique ids to the AIDs HTML elements. Then CSS for those elements is preloaded so when the IDs are added they get the appropriate styling.


Note, drag and resize broken on multiple choice editing. Needs fix.