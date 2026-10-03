import { describe, expect, test } from 'bun:test';
import { amountToSen, positiveQuantity, malaysiaDateTime, escapeCsvCell, nextFulfilment, campaignApprovalIssues } from '../../src/features/workspaces/experience-model';

describe('workspace input boundaries', () => {
  test('money is converted without rounding malformed inputs into charges', () => {
    expect(amountToSen('12.30')).toBe(1230);
    expect(amountToSen('0.01')).toBe(1);
    for (const value of ['1.001', '-1', '1e3', 'NaN', '']) expect(() => amountToSen(value)).toThrow();
  });
  test('quantities exclude zero, fractional, negative and unsafe integers', () => {
    expect(positiveQuantity('12')).toBe(12);
    for (const value of ['0', '-2', '1.2', '9007199254740992', '']) expect(() => positiveQuantity(value)).toThrow();
  });
  test('local calendar values explicitly use MYT and reject reversed dates', () => {
    expect(malaysiaDateTime('2026-10-02T09:30')).toBe('2026-10-02T01:30:00.000Z');
    expect(() => malaysiaDateTime('2026-02-30T09:30')).toThrow();
  });
  test('spreadsheet formula payloads are neutralized and commas escaped', () => {
    expect(escapeCsvCell('=HYPERLINK("x")')).toBe('"\'=HYPERLINK(""x"")"');
    expect(escapeCsvCell('a,b')).toBe('"a,b"');
    expect(escapeCsvCell(' @SUM(A1)')).toBe('"\' @SUM(A1)"');
  });
  test('customer has receiving action only and staff cannot accept unpaid request', () => {
    expect(nextFulfilment('requested', 'pending', 'staff')).toBe('review');
    expect(nextFulfilment('requested', 'verified', 'founder')).toBe('review');
    expect(nextFulfilment('review', 'pending', 'founder')).toBeNull();
    expect(nextFulfilment('review', 'verified', 'founder')).toBe('accepted');
    expect(nextFulfilment('review', 'verified', 'staff')).toBe('accepted');
    expect(nextFulfilment('requested', 'verified', 'developer')).toBeNull();
    expect(nextFulfilment('packed', 'verified', 'staff')).toBe('dispatched');
    expect(nextFulfilment('dispatched', 'verified', 'customer')).toBe('received');
    expect(nextFulfilment('packing', 'verified', 'customer')).toBeNull();
  });
  test('campaign approval requires all asset rights and consent', () => {
    expect(campaignApprovalIssues({ copy: 'Approved wording', assets: [{ rights: '', consent: '' }] })).toHaveLength(1);
    expect(campaignApprovalIssues({ copy: 'Approved wording', assets: [{ rights: 'owned', consent: 'obtained' }] })).toEqual([]);
  });
});
