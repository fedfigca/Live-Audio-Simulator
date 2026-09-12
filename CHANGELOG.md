# Changelog

## Unreleased

### Added
- Mobile drag support: long-press touch fallback with viewport-fixed drag preview.
- Compact drag preview (icon + device name) visible outside the Stage.
- GSAP expand-on-drop animation for previews.

### Changed
- Hidden source element during custom/native drags to avoid duplicate visuals.
- Throttled touch/pointer move events via RAF batching for better performance.
- Global native `drag` listener to keep preview position updated during HTML5 drags.

### Fixed
- Prevent page scrolling during touch drags.
- Ensure preview remains visible when dragging outside the Stage area.

### Notes
- Browser differences for `setDragImage` and pointer capture still require physical-device testing (especially iOS Safari).