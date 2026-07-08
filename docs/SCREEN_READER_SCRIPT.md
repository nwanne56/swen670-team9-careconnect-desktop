# VoiceOver Walkthrough Script

This script drives the three-to-five-minute screen-reader demonstration on macOS with
VoiceOver. Follow the steps in order. The expected announcement in each step is what
VoiceOver should say, so the recording matches the intended behavior.

Before recording, start the application with `npm start`. Turn VoiceOver on and off with
**Cmd+F5**. The VoiceOver modifier is **Ctrl+Option**, written here as **VO**. Move to the
next item with **VO+Right Arrow**, activate an item with **VO+Space**, and open the rotor
with **VO+U**.

| # | Action | Expected announcement |
|---|---|---|
| 1 | Launch the application with VoiceOver on. | "CareConnect, window", and then focus lands on the email field. |
| 2 | Open the rotor with VO+U and choose Landmarks. | It lists the login main region, and after sign-in the banner, navigation, main, and complementary regions. |
| 3 | Focus the email field. | "Email address, edit text". |
| 4 | Type an email and move to the password field. | "Password, secure edit text". |
| 5 | Focus the show-password button and activate it. | "Show password, button", and after activation "Hide password, button, pressed". |
| 6 | Move to the remember-me checkbox. | "Remember me, unchecked, checkbox". |
| 7 | Move to the high-contrast switch and activate it. | "High contrast mode, off, switch", and then "High contrast mode, on" from the live region. |
| 8 | Activate Sign In. | The screen changes, and "Good morning, Alex, heading level 1" is announced. |
| 9 | Open the rotor and choose Landmarks again. | It lists the banner, the navigation named "Main navigation", the main, and the complementary region named "Quick info". |
| 10 | Tab to the toolbar and arrow through the tabs. | "Home, button" and "Notifications, button", each with its current state. |
| 11 | Press Ctrl+2 for Notifications. | "Notifications, heading level 1", and the badge announces four unread. |
| 12 | Press Ctrl+3 for Profile and activate Edit. | "Edit Profile, heading level 1", and the fields are announced with their labels. |
| 13 | In the allergies tag input, type a value and press Enter. | The new tag is announced, and its remove button reads "Remove Penicillin, button". |
| 14 | Press Ctrl+, for Settings and open the Accessibility tab. | "Accessibility, selected, tab", and the panel content is announced. |
| 15 | Toggle the Reduce motion switch. | "Reduce motion, off, switch", and then "Reduce motion, on". |
| 16 | Move to the text-scale slider and arrow up. | "Text scale, 1.1 times", read from the `aria-valuetext`. |
| 17 | Press Ctrl+F, type "dashboard", and press Enter. | "Search results, heading level 1", and the result count is announced. |
| 18 | Press F1 for the help dialog. | "Keyboard Shortcuts, dialog", with focus trapped inside. |
| 19 | Press Esc. | The dialog closes, and focus returns to the button that opened it. |

To close the recording, note on camera that every interactive element exposes a name, a
role, and a state, that the polite live region announces the status changes, that
navigation moves focus to the new heading, and that the modal traps and then restores
focus. The walkthrough met no unlabeled control.
