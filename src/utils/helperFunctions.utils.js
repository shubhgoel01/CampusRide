export function calculatePenaltyAmount(actualMs, expectedMs) {
    const diffMs = actualMs - expectedMs;
    const diffMinutes = Math.ceil(diffMs / (1000 * 60));
    const penaltyPerMinute = 2;

    return diffMinutes * penaltyPerMinute;
}