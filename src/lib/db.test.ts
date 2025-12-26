import { describe, it, expect } from 'vitest';
import { clampOnHand, clampStationLevel } from './db';

describe('clampOnHand', () => {
  it('returns the value when positive', () => {
    expect(clampOnHand(5)).toBe(5);
    expect(clampOnHand(100)).toBe(100);
  });

  it('clamps negative values to 0', () => {
    expect(clampOnHand(-1)).toBe(0);
    expect(clampOnHand(-100)).toBe(0);
  });

  it('returns 0 for zero', () => {
    expect(clampOnHand(0)).toBe(0);
  });

  it('floors decimal values', () => {
    expect(clampOnHand(5.7)).toBe(5);
    expect(clampOnHand(5.2)).toBe(5);
  });

  it('handles edge cases', () => {
    expect(clampOnHand(0.5)).toBe(0);
    expect(clampOnHand(-0.5)).toBe(0);
  });
});

describe('clampStationLevel', () => {
  it('returns the value when within range', () => {
    expect(clampStationLevel(2, 5)).toBe(2);
    expect(clampStationLevel(0, 5)).toBe(0);
    expect(clampStationLevel(5, 5)).toBe(5);
  });

  it('clamps to 0 when negative', () => {
    expect(clampStationLevel(-1, 5)).toBe(0);
    expect(clampStationLevel(-100, 5)).toBe(0);
  });

  it('clamps to maxLevel when exceeding', () => {
    expect(clampStationLevel(6, 5)).toBe(5);
    expect(clampStationLevel(100, 5)).toBe(5);
  });

  it('floors decimal values', () => {
    expect(clampStationLevel(2.7, 5)).toBe(2);
    expect(clampStationLevel(2.2, 5)).toBe(2);
  });

  it('handles maxLevel of 0', () => {
    expect(clampStationLevel(0, 0)).toBe(0);
    expect(clampStationLevel(1, 0)).toBe(0);
  });

  it('handles edge cases', () => {
    expect(clampStationLevel(0.5, 5)).toBe(0);
    expect(clampStationLevel(4.9, 5)).toBe(4);
  });
});
