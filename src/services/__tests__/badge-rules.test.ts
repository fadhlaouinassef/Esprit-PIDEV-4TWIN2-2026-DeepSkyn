import assert from 'node:assert/strict';
import {
  computeBronzeRule,
  computeSilverRule,
  computeGoldRule,
  computePlatinumRule,
  computeRubyMasterRule,
  type BadgeRuleMetrics,
} from '@/services/badge.service';

const baseMetrics: BadgeRuleMetrics = {
  completedDays7: 0,
  streakDays: 0,
  loginCountToday: 0,
  finalAnalysisCount30d: 0,
  finalAnalysisCountAll: 0,
  netScoreImproveLast3: 0,
  netScoreImproveAll: 0,
  avgHydrationLast5: 0,
  avgProtectionLast5: 0,
  activeDays30: 0,
};

const bronzeByRoutine = computeBronzeRule({ ...baseMetrics, completedDays7: 3 });
assert.equal(bronzeByRoutine.earned, true, 'Bronze should be earned with 3/7 completed days');

const silver = computeSilverRule({ ...baseMetrics, streakDays: 7, finalAnalysisCount30d: 1 });
assert.equal(silver.earned, true, 'Silver should be earned with 7-day streak + 1 recent final analysis');

const gold = computeGoldRule({ ...baseMetrics, netScoreImproveLast3: 10 });
assert.equal(gold.earned, true, 'Gold should be earned with enough net score improvement');

const platinum = computePlatinumRule({
  ...baseMetrics,
  streakDays: 16,
  avgHydrationLast5: 74,
  avgProtectionLast5: 69,
});
assert.equal(platinum.earned, true, 'Platinum should be earned when all quality thresholds are met');

const ruby = computeRubyMasterRule({
  ...baseMetrics,
  streakDays: 35,
  finalAnalysisCountAll: 8,
  netScoreImproveAll: 18,
  activeDays30: 26,
});
assert.equal(ruby.earned, true, 'Ruby Master should be earned when elite requirements are met');

console.log('badge-rules.test.ts: all badge rule checks passed');
