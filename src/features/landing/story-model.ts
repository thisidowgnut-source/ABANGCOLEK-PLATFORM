export const STORY_SCENE_COUNT = 4;

function finite(value: number): boolean { return Number.isFinite(value); }
function clamp(value: number): number { return Math.min(1, Math.max(0, value)); }

/** The scroll range excludes the stage itself: the stage releases at progress 1. */
export function storyProgress(sectionTop: number, sectionHeight: number, stageHeight: number, stickyTop: number): number {
  if (![sectionTop, sectionHeight, stageHeight, stickyTop].every(finite) || sectionHeight <= stageHeight) return 0;
  return clamp((stickyTop - sectionTop) / (sectionHeight - stageHeight));
}

export function sceneAtProgress(progress: number): number {
  return Math.min(STORY_SCENE_COUNT - 1, Math.floor(clamp(finite(progress) ? progress : 0) * STORY_SCENE_COUNT));
}

export function sceneScrollTarget(scene: number, sectionDocumentTop: number, sectionHeight: number, stageHeight: number, stickyTop: number): number {
  if (![scene, sectionDocumentTop, sectionHeight, stageHeight, stickyTop].every(finite)) return 0;
  const index = Math.max(0, Math.min(STORY_SCENE_COUNT - 1, Math.floor(scene)));
  // A small inset avoids landing on a chapter boundary after browser pixel rounding.
  const progress = index === 0 ? 0 : (index + 0.12) / STORY_SCENE_COUNT;
  return Math.max(0, sectionDocumentTop - stickyTop + Math.max(0, sectionHeight - stageHeight) * progress);
}

export interface StoryViewportSnapshot {
  sectionTop: number;
  sectionHeight: number;
  viewportHeight: number;
  stickyTop: number;
}

/** Media-query events see the new svh layout; preserve the last viewport's reading position. */
export function storyModeSnapshot<T extends StoryViewportSnapshot & { viewportWidth: number }>(previous: T | null, current: T): T {
  return previous && (previous.viewportHeight !== current.viewportHeight || previous.viewportWidth !== current.viewportWidth) ? previous : current;
}

/** Preserve downstream content when the story changes height; only reanchor a visible story. */
export function storyModeScrollTarget(before: StoryViewportSnapshot, nextSectionDocumentBottom: number, onscreenTarget: number): number | null {
  if (![before.sectionTop, before.sectionHeight, before.viewportHeight, before.stickyTop, nextSectionDocumentBottom, onscreenTarget].every(finite)) return null;
  if (before.sectionTop >= before.viewportHeight) return null;
  const previousViewportBottom = before.sectionTop + before.sectionHeight;
  if (previousViewportBottom <= before.stickyTop) return Math.max(0, nextSectionDocumentBottom - previousViewportBottom);
  return Math.max(0, onscreenTarget);
}
