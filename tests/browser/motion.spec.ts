import { test, expect } from "@playwright/test";
import { compareMotion, MotionRule } from "../../src/motion";

test("motion ignores still frames, exposure changes, and isolated sensor noise", () => {
  const first = new Uint8Array(160 * 90).fill(60);
  expect(compareMotion(first, first, 160, 90, "full").percent).toBe(0);
  const brighter = new Uint8Array(160 * 90).fill(120);
  expect(compareMotion(first, brighter, 160, 90, "full").percent).toBe(0);
  const noisy = first.slice();
  for (let i = 0; i < noisy.length; i += 100) noisy[i] += 60;
  expect(compareMotion(first, noisy, 160, 90, "full").percent).toBe(0);
});

test("motion localizes changed area and excludes the unmonitored half", () => {
  const first = new Uint8Array(160 * 90).fill(60);
  const next = first.slice();
  for (let y = 20; y < 70; y++) for (let x = 10; x < 60; x++) next[y * 160 + x] = 220;
  const full = compareMotion(first, next, 160, 90, "full");
  expect(full.percent).toBeGreaterThan(15);
  expect(full.box![0]).toBeLessThan(.1);
  expect(full.box![2]).toBeGreaterThan(.3);
  expect(compareMotion(first, next, 160, 90, "left").percent).toBeGreaterThan(30);
  expect(compareMotion(first, next, 160, 90, "right").percent).toBe(0);
});

test("activity rule requires sustained movement and limits repeated alerts", () => {
  const rule = new MotionRule();
  for (let t = 0; t < 2000; t += 200) expect(rule.update(20, t, 12, 2000)).toBe(false);
  expect(rule.update(20, 2000, 12, 2000)).toBe(true);
  for (let t = 2200; t < 12000; t += 200) expect(rule.update(20, t, 12, 2000)).toBe(false);
  expect(rule.update(20, 12000, 12, 2000)).toBe(true);
});

test("quiet frames and capture gaps reset sustained motion", () => {
  const rule = new MotionRule();
  expect(rule.update(20, 0, 12, 1000)).toBe(false);
  expect(rule.update(0, 500, 12, 1000)).toBe(false);
  expect(rule.update(20, 1000, 12, 1000)).toBe(false);
  expect(rule.update(20, 5000, 12, 1000)).toBe(false);
  expect(rule.update(20, 5500, 12, 1000)).toBe(false);
  expect(rule.update(20, 6000, 12, 1000)).toBe(true);
});
