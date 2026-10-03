export const SCENE_TRANSITION_MS = 680;
export const WHEEL_GESTURE_QUIET_MS = 180;
export const WHEEL_SCENE_THRESHOLD = 36;
export type SceneDirection = 1 | -1;

export interface SceneState {
  active: number;
  phase: 'idle' | 'transition';
  direction: SceneDirection;
}

export interface WheelGesture { total: number; lastAt: number }
export interface NativeHeroScroll { from: number; to: number; fromEligible: boolean; at: number }
/** Match the native movement to this input, never an earlier catalogue/scrollbar movement. */
export function nativeHeroWheelOrigin(step: NativeHeroScroll | null, delta: number, currentY: number, now: number, inputAt: number): boolean {
  return step !== null && step.fromEligible
    && [step.from, step.to, step.at, delta, currentY, now, inputAt].every(Number.isFinite)
    && now >= step.at && now - step.at <= 500 && now >= inputAt && now - inputAt <= 500
    && step.at >= inputAt - 2 && Math.abs(step.to - currentY) <= 1 && Math.abs(step.to - step.from - delta) <= 3;
}

export interface SceneCaptureViewport {
  top: number;
  bottom: number;
  header: number;
  viewportHeight: number;
  enabled: boolean;
  blocked: boolean;
  hidden: boolean;
}

export function normalizeSceneCount(count = 4): number {
  return Number.isFinite(count) && count >= 1 ? Math.floor(count) : 4;
}

export function sceneIndex(index: number, count: number): number | null {
  return Number.isFinite(index) ? Math.max(0, Math.min(normalizeSceneCount(count) - 1, Math.floor(index))) : null;
}

export function transitionToScene(state: SceneState, index: number, count: number): SceneState {
  const active = sceneIndex(index, count);
  if (active === null || active === state.active) return state;
  return { active, phase: 'transition', direction: active > state.active ? 1 : -1 };
}

export function advanceScene(state: SceneState, direction: SceneDirection, count: number): { state: SceneState; consume: boolean } {
  if (state.phase === 'transition') return { state, consume: true };
  const next = transitionToScene(state, state.active + direction, count);
  return { state: next, consume: next !== state };
}

/** Only a fully visible hero at its native start can consume scene input. */
export function sceneCaptureEligible(viewport: SceneCaptureViewport): boolean {
  const { top, bottom, header, viewportHeight, enabled, blocked, hidden } = viewport;
  return enabled && !blocked && !hidden
    && [top, bottom, header, viewportHeight].every(Number.isFinite)
    && header >= 0 && viewportHeight > header && bottom > top
    && Math.abs(top - header) <= 3 && bottom <= viewportHeight + 3;
}

/** Some hosts deliver wheel input after native scrolling; reconstruct its starting geometry. */
export function sceneWheelCaptureEligible(viewport: SceneCaptureViewport, delta: number, cancelable: boolean, originatesInHero: boolean): boolean {
  if (!originatesInHero) return false;
  if (sceneCaptureEligible(viewport)) return true;
  return !cancelable && Number.isFinite(delta)
    && sceneCaptureEligible({ ...viewport, top: viewport.top + delta, bottom: viewport.bottom + delta });
}

export function wheelDeltaPixels(delta: number, mode: number, viewport: number): number {
  if (!Number.isFinite(delta)) return 0;
  if (mode === 0) return delta;
  if (mode === 1) return delta * 16;
  if (mode === 2 && Number.isFinite(viewport) && viewport > 0) return delta * viewport;
  return 0;
}

export function accumulateWheelGesture(previous: WheelGesture | null, delta: number, now: number): WheelGesture {
  if (!Number.isFinite(now) || !Number.isFinite(delta)) return { total: 0, lastAt: Number.isFinite(now) ? now : 0 };
  const continues = previous !== null && Number.isFinite(previous.total) && Number.isFinite(previous.lastAt)
    && now >= previous.lastAt && now - previous.lastAt <= WHEEL_GESTURE_QUIET_MS
    && Math.sign(previous.total) === Math.sign(delta);
  return { total: continues ? previous.total + delta : delta, lastAt: now };
}

export function verticalSwipeDirection(startX: number, startY: number, x: number, y: number): SceneDirection | null {
  if (![startX, startY, x, y].every(Number.isFinite)) return null;
  const vertical = startY - y;
  return Math.abs(vertical) >= 45 && Math.abs(vertical) > Math.abs(startX - x) ? vertical > 0 ? 1 : -1 : null;
}
