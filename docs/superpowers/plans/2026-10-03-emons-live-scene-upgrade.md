# ABANGCOLEK live scene upgrade

Date: 2026-10-03
Status: IMPLEMENTING

## Scope

Implement the recommendations from `reports/REVIEW_LIVE_SCROLL_EMONS_2026-10-03.md` in the existing landing page. Preserve the original logo, verified TikTok product photograph, real navigation and existing platform routes. Do not invent operational metrics, products, pricing or JEV confidence. No new paid model, subscription or copied Emons media.

## Implementation order and ownership

1. Scene controller worker: pure transition model, focused business logic tests and a React hook for wheel, touch, keyboard, chapter selection, idle/transition, exit and re-entry. Own new scene-controller/model files only.
2. World artwork worker: original code-native animated scene component and its isolated stylesheet. Own new `AnimatedColekWorld.tsx` and `animated-colek-world.css` only. Scene props must express active scene, phase and paused state.
3. Root: integrate the controller and artwork into `ScrollWorldHero.tsx`, chapter/hotspot content and `scroll-world.css`; preserve reduced-motion/static fallbacks, real routes and focus semantics.
4. Reviewers: review modified TypeScript and integration for lifecycle, input, accessibility, motion preference and viewport edge cases; resolve findings before completion.
5. Root: validate TypeScript/build and meaningful controller tests, then interact with the served app live. Save a completion report and runtime observations.

## Interaction contract

Animated hero occupies one viewport beneath the public header. Native wheel or vertical swipe at the hero start advances one scene; scene transition locks duplicate input briefly. Reverse returns to the previous scene. First-scene upward input and last-scene downward input release native page scrolling. End, Home, links and explicit catalogue skip remain usable. Input on form controls, buttons, links or opened hotspot panels must not be intercepted. No global body scroll lock.

Chapter buttons can select any scene and expose `aria-current`. PageDown/PageUp and arrows work when focus is within the hero and not on an interactive element. Hotspots are real buttons with clear labels, expanded state, close control and Escape; focus returns to the opener when closed. Inactive chapter content cannot receive focus.

## Original animation approach

Use the existing original world artwork plus original SVG/CSS scene layers. Each scene has purposeful idle motion (product orbit, packing conveyor, delivery route, network links). This is a live animated interpretation of the observed Emons interaction; it is not a segmented video replica. Keep product packaging faithful by displaying the verified photograph separately. Pause all idle motion when offscreen, paused or the browser is hidden.

## Fallback and evidence gates

Reduced motion, short viewport or manual static mode exposes all four chapters as ordinary content. Media/artwork failure cannot block navigation. Preserve reading position when layout changes. Validate desktop, phone portrait, short viewport, reverse, repeated input, hotspot keyboard/Escape, exit/re-entry and reduced-motion fresh load on the served app. Emulated touch input is evidence of event handling, not proof of real phone hardware performance. No unsupported WCAG or full-project completion claim.
