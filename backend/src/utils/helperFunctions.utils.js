export function calculatePenaltyAmount(actualMs, expectedMs) {
    const diffMs = actualMs - expectedMs;
    const diffMinutes = Math.ceil(diffMs / (1000 * 60));
    const penaltyPerMinutePaise = 200; // 2 Rupees = 200 Paise

    return diffMinutes * penaltyPerMinutePaise;
}