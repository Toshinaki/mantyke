---
'@mantyke/spotlight-image': patch
---

Make the disabled fullscreen button look disabled. On devices without the Fullscreen API the button was marked as disabled but looked the same as the other buttons, because the viewer's button colors overrode Mantine's disabled styles. It is now dimmed.
