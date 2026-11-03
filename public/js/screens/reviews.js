// Gemina's screen: reviews and the automatic trust score.
Screens.register({
  id: 'reviews', title: 'Reviews and trust', owner: 'Gemina',
  base: '/api/reviews', listLabel: 'All reviews (INNER JOIN)', deleteLabel: 'Delete',
  hint: 'Only the buyer of a completed meetup can review, once. Every change recalculates the seller\'s trust tier.',
  reports: [
    { label: 'Trust leaderboard (LEFT JOIN)', path: '/api/reviews/leaderboard' },
    { label: 'Trust tiers', path: '/api/reviews/tiers' }
  ],
  fields: [
    { name: 'meetup_id', label: 'Completed meetup id', type: 'number', required: true, createOnly: true },
    { name: 'rating', label: 'Rating (1-5)', type: 'number', required: true },
    { name: 'comment', label: 'Comment', type: 'textarea' }
  ]
});
