# Badge Motivation Backend Foundation

## Rules

- Bronze: earned if user has at least 3 completed days out of last 7, or 2 logins in the same day.
- Silver: earned if streak is at least 7 days and user has at least 1 final analysis in the last 30 days.
- Gold: earned if net score improvement across recent analyses meets threshold (`BADGE_GOLD_MIN_NET_IMPROVEMENT`, default 8).
- Platinum: earned if streak and quality thresholds are met (hydration and protection averages, defaults 14/70/65).
- Ruby Master: earned for elite long-term consistency and improvement (defaults 30 streak, 6 final analyses, +15 net score, 24 active login days over 30).

## Trigger Points

- Successful credential login: `src/services/auth.service.ts`
- Successful Google OAuth login: `src/app/api/auth/[...nextauth]/route.ts`
- Routine step completion update: `src/app/api/user/routines/[id]/steps/[stepId]/route.ts`
- Final skin analysis creation: `src/app/api/quiz/skin-score/route.ts`
- Daily recovery batch: `src/app/api/cron/recalculate-badges/route.ts`

## Recalculation Strategy

- The engine is idempotent and replayable.
- Badge creation uses `ON CONFLICT DO NOTHING` with DB unique key `(user_id, niveau, titre)`.
- Daily cron replays all active users to recover missed event-based triggers.

## Data Model Additions

- New `LoginActivity` table for 24h/day-based login tracking.
- New badge uniqueness/index constraints for anti-duplication and query performance.

## Configurable Thresholds

- `BADGE_GOLD_MIN_NET_IMPROVEMENT`
- `BADGE_PLATINUM_MIN_STREAK`
- `BADGE_PLATINUM_MIN_HYDRATION`
- `BADGE_PLATINUM_MIN_PROTECTION`
- `BADGE_RUBY_MIN_STREAK`
- `BADGE_RUBY_MIN_FINAL_ANALYSES`
- `BADGE_RUBY_MIN_NET_IMPROVEMENT`
- `BADGE_RUBY_MIN_ACTIVE_DAYS_30`
