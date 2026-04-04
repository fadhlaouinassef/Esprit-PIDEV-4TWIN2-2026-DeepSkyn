
const BANNED_WORDS = [
    "badword1", "badword2", 
];

export const filterBadWords = (text: string): { isClean: boolean; filteredText: string } => {
    let isClean = true;
    let filteredText = text;

    for (const word of BANNED_WORDS) {
        const regex = new RegExp(`\\b${word}\\b`, 'gi');
        if (regex.test(filteredText)) {
            isClean = false;
            filteredText = filteredText.replace(regex, '*'.repeat(word.length));
        }
    }

    return { isClean, filteredText };
};
