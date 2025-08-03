export function calculatePenaltyAmount(actual, expected) {
    const diffMs = actual - expected;
    const diffMinutes = Math.ceil(diffMs / (1000 * 60));
    const penaltyPerMinute = 2;
    return diffMinutes * penaltyPerMinute;
}