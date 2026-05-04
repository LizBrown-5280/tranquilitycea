export const canastaTooltipContent = {
  bigCount:
    'The Big Count is one of the main scoring categories in Canasta, encompassing points from being first out, the count of all the requirement Canastas, counting all remaining Canasta books made, and the count of the red threes.',
  wentOutFirst:
    "Check this if your team is the first to go out, you'll earn a 200 point bonus added to your Big Count.",
  allRequirementsMet:
    "Check this if your team meets all the requirement Canastas. This will total up your requirements automatically and you'll earn 11,300 points to be added to your Big Count.",
  canastaCounts:
    'Count the number of clean and dirty Canasta books your team made, and enter the counts in the respective fields. Each clean book is worth 500 points, and each dirty book is worth 300 points, contributing to your Big Count.\n\nCount any extra 7, 5, and wild Canastas to rack up additional points all contributing to your Big Count.',
  redThrees:
    'Red threes are worth 100 points each, but each group of seven counts as a full book worth 1,000 points. Just enter the number of red threes and the scoring will be calculated accordingly in your Big Count. ',
  cardCount:
    'The Card Count is the total face value points of all cards in your hand at the end of the round (excluding Red 3s), contributing to your overall score.',
  fastCount:
    'Using Fast Count is optional, but if you choose to use it, count the number of clean 10-point books, clean 5-point books, and clean A-books your team made. Each clean 10-point book is worth 70 points, each clean 5-point book is worth 35 points, and each clean A-book is worth 140 points. These points will be added to your Card Count.',
  remainingCount:
    'This can be used one of two ways: If you used the Fast Count, you can use Remaining Cards to track all the face values of the remaining Dirty Books, Wilds, and Burn Pile. Cards 3-7 are worth 5 points, cards 8-K are worth 10 points, and Aces and 2s are worth 20 points, and Jokers are worth 50 points.\n\nAlternatively, if you did not use the Fast Count, you can use Remaining Cards to track the total face value points of all cards in your hand at the end of the round (including Red 3s), which will be added to your Card Count.',
  penaltyCount:
    'This is where you can enter any negative points from penalties, such as points from cards left in hand when the round ends, or any other deductions. These points will be subtracted from your total score. Sometimes players will manually deduct these points from their burn pile or from the card count, but you can also enter them here to have them factored into your total score.',
  cardsNotPlayed:
    'Cards Not Played are the cards remaining in your hand that were not played to the table by the end of the round. The face value of these cards is counted as a penalty against your score.',
} as const

export type CanastaTooltipKey = keyof typeof canastaTooltipContent
