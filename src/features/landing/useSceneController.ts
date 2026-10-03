import { useCallback, useEffect, useLayoutEffect, useRef, useState, type RefObject } from 'react';
import {
  accumulateWheelGesture, advanceScene, normalizeSceneCount, sceneCaptureEligible, sceneWheelCaptureEligible, nativeHeroWheelOrigin, sceneIndex,
  SCENE_TRANSITION_MS, transitionToScene, verticalSwipeDirection, wheelDeltaPixels,
  WHEEL_GESTURE_QUIET_MS, WHEEL_SCENE_THRESHOLD,
  type SceneDirection, type SceneState, type WheelGesture, type NativeHeroScroll,
} from './scene-controller-model';

interface SceneControllerOptions {
  sectionRef: RefObject<HTMLElement | null>;
  enabled: boolean;
  blocked: boolean;
  sceneCount?: number;
}

interface TouchGesture {
  identifier: number;
  startX: number;
  startY: number;
  consumed: boolean;
}

const INTERACTIVE_SELECTOR = 'a,button,input,textarea,select,option,label,form,[contenteditable]:not([contenteditable="false"]),[role="dialog"],[role="button"],[role="link"],[role="textbox"],[role="slider"],[role="spinbutton"],[role="combobox"],[role="listbox"]';

function interactiveTarget(target: EventTarget | null): boolean {
  const element = target instanceof Element ? target : target instanceof Node ? target.parentElement : null;
  return Boolean(element?.closest(INTERACTIVE_SELECTOR));
}

/** Scene input stays local to the hero; native document scrolling is never locked. */
export function useSceneController({ sectionRef, enabled, blocked, sceneCount = 4 }: SceneControllerOptions) {
  const count = normalizeSceneCount(sceneCount);
  const [state, setState] = useState<SceneState>({ active: 0, phase: 'idle', direction: 1 });
  const [visible, setVisible] = useState(false);
  const stateRef = useRef(state);
  const optionsRef = useRef({ enabled, blocked, count });
  optionsRef.current = { enabled, blocked, count };
  const timerRef = useRef<number | null>(null);
  const wheelRestoreRef = useRef<number | null>(null);
  const invalidateOriginRef = useRef<() => void>(() => {});
  const wheelRef = useRef<WheelGesture | null>(null);
  const wheelQuietRef = useRef(false);
  const touchRef = useRef<TouchGesture | null>(null);

  const commit = useCallback((next: SceneState) => {
    stateRef.current = next;
    setState(next);
  }, []);

  const clearTransition = useCallback(() => {
    if (timerRef.current !== null) window.clearTimeout(timerRef.current);
    timerRef.current = null;
  }, []);

  const startTransition = useCallback((next: SceneState) => {
    if (next === stateRef.current) return;
    clearTransition();
    commit(next);
    wheelQuietRef.current = true;
    timerRef.current = window.setTimeout(() => {
      timerRef.current = null;
      commit({ ...stateRef.current, phase: 'idle' });
    }, SCENE_TRANSITION_MS);
  }, [clearTransition, commit]);

  const selectScene = useCallback((index: number) => {
    const options = optionsRef.current;
    if (!options.enabled || options.blocked || document.hidden) return;
    startTransition(transitionToScene(stateRef.current, index, options.count));
  }, [startTransition]);

  const releaseScene = useCallback(() => {
    clearTransition();
    if (wheelRestoreRef.current !== null) window.cancelAnimationFrame(wheelRestoreRef.current);
    wheelRestoreRef.current = null;
    wheelRef.current = null;
    wheelQuietRef.current = false;
    touchRef.current = null;
    invalidateOriginRef.current();
    if (stateRef.current.phase !== 'idle') commit({ ...stateRef.current, phase: 'idle' });
  }, [clearTransition, commit]);

  useLayoutEffect(() => {
    const active = sceneIndex(stateRef.current.active, count) ?? 0;
    if (!enabled || blocked || active !== stateRef.current.active) {
      releaseScene();
      if (stateRef.current.phase !== 'idle' || active !== stateRef.current.active) commit({ ...stateRef.current, active, phase: 'idle' });
    }
  }, [enabled, blocked, count, releaseScene, commit]);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;
    let frame: number | null = null;
    let intersects = false;

    const updateVisibility = () => setVisible(intersects && !document.hidden);
    const sampleVisibility = () => {
      frame = null;
      const bounds = section.getBoundingClientRect();
      intersects = bounds.bottom > 0 && bounds.top < window.innerHeight && bounds.right > 0 && bounds.left < window.innerWidth;
      updateVisibility();
    };
    const scheduleVisibility = () => {
      if (frame === null) frame = window.requestAnimationFrame(sampleVisibility);
    };
    const observer = typeof IntersectionObserver === 'undefined' ? null : new IntersectionObserver(entries => {
      const entry = entries.find(candidate => candidate.target === section);
      if (entry) { intersects = entry.isIntersecting; updateVisibility(); }
    });
    observer?.observe(section);
    sampleVisibility();

    const readCaptureViewport = () => {
      const bounds = section.getBoundingClientRect();
      const header = Number.parseFloat(window.getComputedStyle(section).getPropertyValue('--ac-world-header')) || 0;
      return {
        top: bounds.top, bottom: bounds.bottom, header, viewportHeight: window.innerHeight,
        enabled: optionsRef.current.enabled, blocked: optionsRef.current.blocked, hidden: document.hidden,
      };
    };
    const eligible = (delta?: number, cancelable = true, originatesInHero = false) => {
      const viewport = readCaptureViewport();
      return delta === undefined ? sceneCaptureEligible(viewport) : sceneWheelCaptureEligible(viewport, delta, cancelable, originatesInHero);
    };
    let inputSnapshot = { y: window.scrollY, viewport: readCaptureViewport() };
    let nativeStep: NativeHeroScroll | null = null;
    invalidateOriginRef.current = () => {
      nativeStep = null;
      inputSnapshot = { y: window.scrollY, viewport: { ...readCaptureViewport(), enabled: false } };
    };
    const onNativeScroll = () => {
      const y = window.scrollY;
      nativeStep = { from: inputSnapshot.y, to: y, fromEligible: sceneCaptureEligible(inputSnapshot.viewport), at: performance.now() };
      inputSnapshot = { y, viewport: readCaptureViewport() };
      scheduleVisibility();
    };
    const onResize = () => {
      nativeStep = null;
      inputSnapshot = { y: window.scrollY, viewport: readCaptureViewport() };
      scheduleVisibility();
    };
    const canConsume = (direction: SceneDirection) => advanceScene(stateRef.current, direction, optionsRef.current.count).consume;
    const advance = (direction: SceneDirection) => {
      const result = advanceScene(stateRef.current, direction, optionsRef.current.count);
      if (result.consume) startTransition(result.state);
    };
    const onWheel = (event: WheelEvent) => {
      const delta = wheelDeltaPixels(event.deltaY, event.deltaMode, window.innerHeight);
      const now = performance.now();
      const pendingStep = { from: inputSnapshot.y, to: window.scrollY, fromEligible: sceneCaptureEligible(inputSnapshot.viewport), at: now };
      const targetInHero = event.target instanceof Node && section.contains(event.target);
      // A retargeted post-scroll event needs measured input-time origin; coincidental geometry is insufficient.
      const movedFromHero = !event.cancelable && (nativeHeroWheelOrigin(nativeStep, delta, window.scrollY, now, event.timeStamp)
        || nativeHeroWheelOrigin(pendingStep, delta, window.scrollY, now, event.timeStamp));
      if (import.meta.env.DEV) section.dataset.sceneOrigin = JSON.stringify({ targetInHero, movedFromHero, nativeStep, pendingStep, now, inputAt: event.timeStamp, delta });
      if (!targetInHero && !movedFromHero) return;
      if (import.meta.env.DEV) section.dataset.sceneInput = JSON.stringify({ kind: 'wheel', trusted: event.isTrusted, cancelable: event.cancelable, interactive: interactiveTarget(event.target), eligible: eligible(), options: optionsRef.current, x: event.deltaX, y: event.deltaY });
      // ctrl+wheel is commonly a trackpad pinch; preserve browser zoom.
      if (event.defaultPrevented || event.ctrlKey || (targetInHero && interactiveTarget(event.target))
        || Math.abs(event.deltaX) >= Math.abs(event.deltaY)) return;
      if (!delta || !eligible(delta, event.cancelable, true)) return;
      nativeStep = null;
      const header = Number.parseFloat(getComputedStyle(section).getPropertyValue('--ac-world-header')) || 0;
      if (event.clientY < header || event.clientY > window.innerHeight) return;
      const reserveWheel = () => {
        if (event.cancelable) event.preventDefault();
        else {
          // Noncancelable hosts may apply native movement after dispatch. Reconcile on the next frame.
          const top = Math.max(0, section.getBoundingClientRect().top + window.scrollY - header);
          if (wheelRestoreRef.current !== null) window.cancelAnimationFrame(wheelRestoreRef.current);
          wheelRestoreRef.current = window.requestAnimationFrame(() => {
            wheelRestoreRef.current = null;
            const options = optionsRef.current;
            if (options.enabled && !options.blocked && !document.hidden) window.scrollTo({ top, behavior: 'instant' });
          });
        }
      };
      const direction: SceneDirection = delta > 0 ? 1 : -1;
      const previous = wheelRef.current;
      if (stateRef.current.phase === 'transition') {
        reserveWheel();
        wheelRef.current = { total: 0, lastAt: now };
        wheelQuietRef.current = true;
        return;
      }
      // The tail of one trackpad gesture must not advance another scene or escape the last scene.
      if (wheelQuietRef.current && previous && now - previous.lastAt < WHEEL_GESTURE_QUIET_MS) {
        reserveWheel();
        wheelRef.current = { total: 0, lastAt: now };
        return;
      }
      if (wheelQuietRef.current) { wheelQuietRef.current = false; wheelRef.current = null; }
      if (!canConsume(direction)) { wheelRef.current = null; return; }
      reserveWheel();
      const gesture = accumulateWheelGesture(wheelRef.current, delta, now);
      wheelRef.current = gesture;
      if (Math.abs(gesture.total) >= WHEEL_SCENE_THRESHOLD) advance(direction);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      const focused = document.activeElement;
      if (event.key === 'End' || event.key === 'Home') {
        nativeStep = null;
        inputSnapshot = { y: window.scrollY, viewport: { ...readCaptureViewport(), enabled: false } };
      }
      if (import.meta.env.DEV) section.dataset.sceneInput = JSON.stringify({ kind: 'keyboard', key: event.key, contained: Boolean(focused && section.contains(focused)), interactive: interactiveTarget(focused), eligible: eligible(), options: optionsRef.current });
      if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey
        || !focused || !section.contains(focused) || interactiveTarget(focused) || !eligible()) return;
      const direction: SceneDirection | null = event.key === 'PageDown' || event.key === 'ArrowDown' ? 1
        : event.key === 'PageUp' || event.key === 'ArrowUp' ? -1 : null;
      if (direction === null || !canConsume(direction)) return;
      event.preventDefault();
      if (!event.repeat) advance(direction);
    };
    const onTouchStart = (event: TouchEvent) => {
      touchRef.current = null;
      if (event.defaultPrevented || event.touches.length !== 1 || interactiveTarget(event.target) || !eligible()) return;
      const touch = event.touches[0];
      touchRef.current = { identifier: touch.identifier, startX: touch.clientX, startY: touch.clientY, consumed: false };
    };
    const onTouchMove = (event: TouchEvent) => {
      const gesture = touchRef.current;
      if (!gesture || event.defaultPrevented || !event.cancelable || event.touches.length !== 1 || !eligible()) {
        touchRef.current = null;
        return;
      }
      const touch = event.touches[0];
      if (touch.identifier !== gesture.identifier) { touchRef.current = null; return; }
      // Keep ownership of an already consumed swipe until its finger lifts, even if it curves.
      if (gesture.consumed) { event.preventDefault(); return; }
      const x = touch.clientX - gesture.startX;
      const y = gesture.startY - touch.clientY;
      if (Math.abs(x) >= 10 && Math.abs(x) >= Math.abs(y)) { touchRef.current = null; return; }
      if (Math.abs(y) <= Math.abs(x) || y === 0) return;
      const direction: SceneDirection = y > 0 ? 1 : -1;
      if (!gesture.consumed && !canConsume(direction)) return;
      // Reserve only vertical movement that can change scene, before native scrolling begins.
      event.preventDefault();
      if (gesture.consumed || stateRef.current.phase === 'transition') return;
      const swipe = verticalSwipeDirection(gesture.startX, gesture.startY, touch.clientX, touch.clientY);
      if (swipe !== null) { gesture.consumed = true; advance(swipe); }
    };
    const onTouchEnd = () => { touchRef.current = null; };
    const onVisibilityChange = () => {
      if (document.hidden) {
        releaseScene();
      }
      sampleVisibility();
    };

    window.addEventListener('wheel', onWheel, { passive: false, capture: true });
    section.addEventListener('touchstart', onTouchStart, { passive: true });
    section.addEventListener('touchmove', onTouchMove, { passive: false });
    section.addEventListener('touchend', onTouchEnd, { passive: true });
    section.addEventListener('touchcancel', onTouchEnd, { passive: true });
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('scroll', onNativeScroll, { passive: true });
    window.addEventListener('resize', onResize, { passive: true });
    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => {
      clearTransition();
      if (frame !== null) window.cancelAnimationFrame(frame);
      if (wheelRestoreRef.current !== null) window.cancelAnimationFrame(wheelRestoreRef.current);
      wheelRestoreRef.current = null;
      invalidateOriginRef.current = () => {};
      observer?.disconnect();
      window.removeEventListener('wheel', onWheel, { capture: true });
      section.removeEventListener('touchstart', onTouchStart);
      section.removeEventListener('touchmove', onTouchMove);
      section.removeEventListener('touchend', onTouchEnd);
      section.removeEventListener('touchcancel', onTouchEnd);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('scroll', onNativeScroll);
      window.removeEventListener('resize', onResize);
      document.removeEventListener('visibilitychange', onVisibilityChange);
      wheelRef.current = null;
      wheelQuietRef.current = false;
      touchRef.current = null;
    };
  }, [sectionRef, clearTransition, commit, startTransition, releaseScene]);

  return { ...state, visible, selectScene, releaseScene };
}
