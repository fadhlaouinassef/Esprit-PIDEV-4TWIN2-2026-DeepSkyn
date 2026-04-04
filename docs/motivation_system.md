# DeepSkyn Motivation System - Product Documentation

## 1. Motivation Mechanics Rationale

The DeepSkyn motivation system is designed to transform skin care from a chore into a rewarding journey. We use a mix of visible milestones and surprise rewards to drive long-term habit formation.

### Core Badges (Bronze to Ruby Master)
*   **Purpose**: Progression & Status.
*   **Mechanism**: Clear, predictable growth. Users always know the "Next Milestone" and exactly what's required to get there. This taps into the "Goal Gradient Effect" where motivation increases as the user nears the target.

### Combo 24h (Micro-habit Reward)
*   **Purpose**: Consistency & Daily Win.
*   **Logic**: Rewarding the completion of both Morning and Night routines within a 24-hour window.
*   **Why it works**: Provides a high-frequency reward (daily) which is essential for habit loops. It bridges the gap between long-term skin results (weeks) and daily action.

### Badge de Rebond (Anti-Churn)
*   **Purpose**: Forgiveness & Re-engagement.
*   **Logic**: Awarded when a user returns after > 3 days of inactivity and stays active for 2 consecutive days.
*   **Why it works**: Reduces the "What the Hell" effect where a user quits entirely after missing a few days. It rewards the *act of returning*, turning a failure into a positive milestone.

### Badge Secret: Skin Glow (Quality Focus)
*   **Purpose**: Curiosity & Deep Engagement.
*   **Logic**: Hidden condition triggered by 3 consecutive analyses with a score > 80.
*   **Why it works**: Adds an element of surprise and delight. Encourages users to not just "do" the routine, but to do it effectively to keep their scores high.

---

## 2. KPI Plan (Plan de mesure)

To measure the success of these motivation mechanics, we will track the following metrics:

| Metric | Target | Description |
| :--- | :--- | :--- |
| **7-Day Retention** | +15% increase | Percentage of new users who return on Day 7. |
| **Routine Completion Rate** | > 70% | Average percentage of routine steps completed daily across the user base. |
| **Analysis Frequency** | 1.5/month -> 2.5/month | Aiming for users to perform more "Final Analyses" to track progress. |
| **Badge Sharing Rate** | 10% of earned badges | Percentage of users who use the "Share" feature. |
| **Time to Gold** | -20% | Reduce the average time for a user to reach the Gold level through better engagement. |

---

## 3. Observability & Reliability

*   **Server Logs**: Every badge attribution is logged with the trigger type and user ID for auditing.
*   **Graceful Fallbacks**: If routine data is missing, the system defaults to "0 progress" instead of crashing. If the Web Share API is unavailable, it falls back to clipboard copying.
*   **Data Integrity**: Used raw queries for complex join cases to ensure performance and reliability even with large history sets.
