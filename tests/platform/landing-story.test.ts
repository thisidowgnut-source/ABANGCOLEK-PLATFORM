import { describe, expect, test } from 'bun:test';
import { sceneAtProgress, storyProgress, sceneScrollTarget, storyModeScrollTarget, storyModeSnapshot } from '../../src/features/landing/story-model';

describe('landing scroll journey geometry', () => {
  test('starts below the sticky boundary, progresses while pinned and clamps after release', () => {
    expect(storyProgress(120, 3200, 720, 80)).toBe(0);
    expect(storyProgress(80, 3200, 720, 80)).toBe(0);
    expect(storyProgress(-1160, 3200, 720, 80)).toBe(0.5);
    expect(storyProgress(-2400, 3200, 720, 80)).toBe(1);
    expect(storyProgress(-5000, 3200, 720, 80)).toBe(1);
  });

  test('does not divide by zero on static or invalid geometry', () => {
    expect(storyProgress(0, 720, 720, 80)).toBe(0);
    expect(storyProgress(0, 500, 720, 80)).toBe(0);
    expect(storyProgress(Number.NaN, 3200, 720, 80)).toBe(0);
  });

  test('selects all chapters, including reverse scrolling and exact boundaries', () => {
    expect([0, 0.24, 0.25, 0.5, 0.75, 1, 0.5, 0].map(sceneAtProgress)).toEqual([0, 0, 1, 2, 3, 3, 2, 0]);
    expect(sceneAtProgress(-1)).toBe(0);
    expect(sceneAtProgress(10)).toBe(3);
    expect(sceneAtProgress(Number.NaN)).toBe(0);
  });

  test('chapter targets land inside the requested chapter after accounting for header height', () => {
    for (let scene = 0; scene < 4; scene += 1) {
      const target = sceneScrollTarget(scene, 80, 3200, 720, 80);
      expect(sceneAtProgress(storyProgress(80 - target, 3200, 720, 80))).toBe(scene);
    }
    expect(sceneScrollTarget(0, 40, 720, 720, 80)).toBe(0);
  });

  test('changing display mode in a late pinned chapter keeps the story reachable', () => {
    expect(storyModeScrollTarget({ sectionTop: -2300, sectionHeight: 3200, viewportHeight: 800, stickyTop: 80 }, 1200, 680)).toBe(680);
  });

  test('accepts the hero snapshot including chapter and manual-toggle metadata', () => {
    const snapshot = { sectionTop: -2300, sectionHeight: 3200, viewportHeight: 800, stickyTop: 80, chapter: 3, manual: false };
    const manualSnapshot = { ...snapshot, manual: true };
    expect(storyModeScrollTarget(snapshot, 1200, 680)).toBe(680);
    expect(storyModeScrollTarget(manualSnapshot, 1200, 0)).toBe(0);
  });

  test('mode changes below the story preserve the downstream viewport offset in both directions', () => {
    const below = { sectionTop: -3500, sectionHeight: 3200, viewportHeight: 800, stickyTop: 80 };
    expect(storyModeScrollTarget(below, 1200, 0)).toBe(1500);
    expect(storyModeScrollTarget({ ...below, sectionTop: -1500, sectionHeight: 1200 }, 3200, 0)).toBe(3500);
  });

  test('mode changes leave a story below the viewport alone and reject invalid geometry', () => {
    expect(storyModeScrollTarget({ sectionTop: 900, sectionHeight: 3200, viewportHeight: 800, stickyTop: 80 }, 1200, 0)).toBeNull();
    expect(storyModeScrollTarget({ sectionTop: Number.NaN, sectionHeight: 3200, viewportHeight: 800, stickyTop: 80 }, 1200, 0)).toBeNull();
  });

  test('a short-screen resize uses the previously pinned geometry before svh can classify it as below the story', () => {
    const pinned = { sectionTop: -1900, sectionHeight: 2660, viewportHeight: 760, viewportWidth: 320, stickyTop: 120, chapter: 3, manual: false };
    const resized = { ...pinned, sectionTop: -2500, sectionHeight: 2450, viewportHeight: 700, viewportWidth: 390 };
    const before = storyModeSnapshot(pinned, resized);
    expect(before.chapter).toBe(3);
    expect(storyModeScrollTarget(before, 1500, 1100)).toBe(1100);
    expect(storyModeScrollTarget(resized, 1500, 1100)).toBe(1550);
    expect(storyModeSnapshot(null, resized)).toBe(resized);
    expect(storyModeSnapshot(pinned, { ...pinned, sectionTop: -2800 })).toEqual({ ...pinned, sectionTop: -2800 });
  });
});
