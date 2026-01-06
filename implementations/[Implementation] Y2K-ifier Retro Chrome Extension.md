---
title: '[Implementation] Y2K-ifier Retro Chrome Extension'
type: note
permalink: implementations/implementation-y2-k-ifier-retro-chrome-extension
tags:
- chrome-extension
- y2k-aesthetic
- frontend-only
---

# Implementation: Y2K-ifier Retro Chrome Extension

## Purpose
Developed a Chrome Extension to transform modern web pages into a 2000s retro style using surgical CSS injection.

## Key Decisions
- **Manifest V3**: Used for modern browser compatibility and performance.
- **Surgical CSS**: Focused on decoration (3D borders, fonts, filters) to avoid breaking modern site layouts.
- **Service Worker**: Used to manage dynamic injection across all tabs based on a central state.
- **Storage API**: `chrome.storage.local` ensures the user's preference is remembered.

## Components
- `manifest.json`: Core configuration.
- `background.js`: Injection logic and state management.
- `popup/`: Win2000 style UI for toggling the mode.
- `styles/retro.css`: The "soul" of the extension with detailed retro styling rules.

## Patterns
- Used `!important` in CSS to ensure overrides on complex modern sites.
- Targeted `role="button"` and common class patterns for better coverage.
- Excluded icon fonts to maintain site usability.