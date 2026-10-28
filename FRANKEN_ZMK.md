# Frankenstein Some Tools Together
Goal: I want to combine functionality from two repositories to allow me to import the physical board layouts, set keymaps and define key combination behaviors, and output a keymap file for use in ZMK firmware.

Keymap Editor Example: https://github.com/nickcoutsos/keymap-editor
Physical Layout Editor: https://zmk-layout-helper.netlify.app/

The desired flow: 
- Import the physical layout
- Import the existing keymap
- Have an editor to define layers, keybinds, and combinations
- Output the keymap file for use in ZMK firmware

You can reuse code per the repo license agreements or reimplement the features from scratch. Make it a web app that runs locally in the browser, working in client side javascript, so it can later be hosted on a static site provider like GitHub pages.

You have an empty repository initialized. Implement features in small chunks, commit as you go. Define the functionality, write the tests, write the functions until they pass the test. Keep files small, keep functions under 100 lines.

Start by refinding the functional design, planning a structure for the application, and then implementing the functionality. 

Ease of use is important, no action should take more than three clicks.

Visuals should be dark mode only, with a modern minimal design that does not distract from the task.
