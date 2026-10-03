import { describe, expect, test } from 'bun:test';
import {
  accumulateWheelGesture, advanceScene, normalizeSceneCount, sceneCaptureEligible,
  sceneIndex, transitionToScene, verticalSwipeDirection, wheelDeltaPixels, sceneWheelCaptureEligible, nativeHeroWheelOrigin,
  type SceneState,
} from '../../src/features/landing/scene-controller-model';

const first: SceneState = { active: 0, phase: 'idle', direction: 1 };
const viewport = { top: 80, bottom: 800, header: 80, viewportHeight: 800, enabled: true, blocked: false, hidden: false };

describe('virtual landing scene controller', () => {
  test('clamps finite chapter selections and rejects invalid numbers', () => {
    expect(sceneIndex(-9, 4)).toBe(0);
    expect(sceneIndex(99, 4)).toBe(3);
    expect(sceneIndex(1.9, 4)).toBe(1);
    for (const invalid of [Number.NaN, Infinity, -Infinity]) expect(sceneIndex(invalid, 4)).toBeNull();
  });

  test('keeps at least one scene and uses four for invalid scene counts', () => {
    expect(normalizeSceneCount(1)).toBe(1);
    expect(normalizeSceneCount(2.9)).toBe(2);
    for (const count of [0, -3, Number.NaN, Infinity]) expect(normalizeSceneCount(count)).toBe(4);
  });

  test('chapter selection marks its direction and can reverse an unfinished transition', () => {
    const last = transitionToScene(first, 3, 4);
    expect(last).toEqual({ active: 3, phase: 'transition', direction: 1 });
    expect(transitionToScene(last, 1, 4)).toEqual({ active: 1, phase: 'transition', direction: -1 });
    expect(first).toEqual({ active: 0, phase: 'idle', direction: 1 });
  });

  test('same-scene and invalid chapter selection preserve state', () => {
    expect(transitionToScene(first, 0, 4)).toBe(first);
    expect(transitionToScene(first, Number.NaN, 4)).toBe(first);
  });

  test('forward and reverse gestures advance one scene', () => {
    const forward = advanceScene(first, 1, 4);
    expect(forward.consume).toBe(true);
    expect(forward.state.active).toBe(1);
    expect(advanceScene({ ...forward.state, phase: 'idle' }, -1, 4).state).toEqual({ active: 0, phase: 'transition', direction: -1 });
  });

  test('first upward and last downward gestures release native scrolling', () => {
    expect(advanceScene(first, -1, 4)).toEqual({ state: first, consume: false });
    const last: SceneState = { active: 3, phase: 'idle', direction: 1 };
    expect(advanceScene(last, 1, 4)).toEqual({ state: last, consume: false });
    expect(advanceScene(first, 1, 1)).toEqual({ state: first, consume: false });
  });

  test('transition locks duplicate gestures including attempted boundary exit', () => {
    const locked: SceneState = { active: 3, phase: 'transition', direction: 1 };
    expect(advanceScene(locked, 1, 4)).toEqual({ state: locked, consume: true });
    expect(advanceScene(locked, -1, 4)).toEqual({ state: locked, consume: true });
  });

  test('only captures a complete hero aligned beneath the header', () => {
    expect(sceneCaptureEligible(viewport)).toBe(true);
    expect(sceneCaptureEligible({ ...viewport, top: 83, bottom: 803 })).toBe(true);
    for (const changes of [{ top: 84 }, { top: 76 }, { bottom: 804 }, { bottom: 80 }, { enabled: false }, { blocked: true }, { hidden: true }, { viewportHeight: 0 }, { top: Number.NaN }]) {
      expect(sceneCaptureEligible({ ...viewport, ...changes })).toBe(false);
    }
  });

  test('normalizes pixel, line and page wheel units', () => {
    expect(wheelDeltaPixels(8, 0, 800)).toBe(8);
    expect(wheelDeltaPixels(-3, 1, 800)).toBe(-48);
    expect(wheelDeltaPixels(1, 2, 800)).toBe(800);
    expect(wheelDeltaPixels(1, 8, 800)).toBe(0);
    expect(wheelDeltaPixels(Number.NaN, 0, 800)).toBe(0);
    expect(wheelDeltaPixels(1, 2, 0)).toBe(0);
  });

  test('handles a browser wheel delivered after native movement from the aligned hero', () => {
    expect(sceneWheelCaptureEligible({ ...viewport, top: -160, bottom: 560 }, 240, false, true)).toBe(true);
    expect(sceneWheelCaptureEligible({ ...viewport, top: -820, bottom: -100 }, 900, false, true)).toBe(true);
    expect(sceneWheelCaptureEligible({ ...viewport, top: -160, bottom: 560 }, 240, true, true)).toBe(false);
    expect(sceneWheelCaptureEligible({ ...viewport, top: -300, bottom: 420 }, 240, false, true)).toBe(false);
    expect(sceneWheelCaptureEligible({ ...viewport, top: -160, bottom: 560, blocked: true }, 240, false, true)).toBe(false);
    expect(sceneWheelCaptureEligible({ ...viewport, top: -160, bottom: 560 }, Number.NaN, false, true)).toBe(false);
  });

  test('unrelated downstream wheel cannot recapture an offscreen hero even with a matching delta', () => {
    expect(sceneWheelCaptureEligible({ ...viewport, top: -820, bottom: -100 }, 900, false, false)).toBe(false);
    expect(sceneWheelCaptureEligible(viewport, 120, false, false)).toBe(false);
  });

  test('post-scroll wheel origin requires a recent matching native movement from an aligned hero', () => {
    const step = { from: 0, to: 900, fromEligible: true, at: 100 };
    expect(nativeHeroWheelOrigin(step, 900, 900, 120, 99)).toBe(true);
    expect(nativeHeroWheelOrigin({ ...step, fromEligible: false }, 900, 900, 120, 99)).toBe(false);
    expect(nativeHeroWheelOrigin(step, 900, 900, 601, 99)).toBe(false);
    expect(nativeHeroWheelOrigin(step, 900, 900, 99, 99)).toBe(false);
    expect(nativeHeroWheelOrigin(step, 240, 900, 120, 99)).toBe(false);
    expect(nativeHeroWheelOrigin(step, 900, 1200, 120, 99)).toBe(false);
    expect(nativeHeroWheelOrigin(null, 900, 900, 120, 99)).toBe(false);
    expect(nativeHeroWheelOrigin(step, Number.NaN, 900, 120, 99)).toBe(false);
    expect(nativeHeroWheelOrigin(step, 900, 900, 120, 105)).toBe(false);
  });

  test('accumulates small trackpad input within one gesture', () => {
    const begin = accumulateWheelGesture(null, 8, 0);
    const next = accumulateWheelGesture(begin, 8, 100);
    expect(next).toEqual({ total: 16, lastAt: 100 });
    expect(accumulateWheelGesture(next, 20, 200).total).toBe(36);
  });

  test('resets trackpad accumulation after quiet time, reverse input or clock reversal', () => {
    const begin = accumulateWheelGesture(null, 30, 100);
    expect(accumulateWheelGesture(begin, 8, 281).total).toBe(8);
    expect(accumulateWheelGesture(begin, -8, 110).total).toBe(-8);
    expect(accumulateWheelGesture(begin, 8, 90).total).toBe(8);
    expect(accumulateWheelGesture(begin, 8, 280).total).toBe(38);
  });

  test('invalid wheel samples cannot poison the next gesture', () => {
    expect(accumulateWheelGesture(null, Number.NaN, 10)).toEqual({ total: 0, lastAt: 10 });
    expect(accumulateWheelGesture(null, 10, Number.NaN)).toEqual({ total: 0, lastAt: 0 });
  });

  test('touch accepts vertical swipes after 45px and rejects horizontal or invalid movement', () => {
    expect(verticalSwipeDirection(100, 100, 100, 55)).toBe(1);
    expect(verticalSwipeDirection(100, 100, 100, 145)).toBe(-1);
    expect(verticalSwipeDirection(100, 100, 100, 56)).toBeNull();
    expect(verticalSwipeDirection(100, 100, 160, 50)).toBeNull();
    expect(verticalSwipeDirection(100, 100, 150, 50)).toBeNull();
    expect(verticalSwipeDirection(Number.NaN, 100, 100, 0)).toBeNull();
  });
});
