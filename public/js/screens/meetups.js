// Espiritu's screen: meetups + the scheduling rules (unique feature, rules part).
Screens.register({
  id: 'meetups', title: 'Meetups', owner: 'Espiritu',
  base: '/api/meetups', listLabel: 'Scheduled meetups (INNER JOIN)', deleteLabel: 'Cancel',
  hint: 'Rules: zone open, zone not full, no double-booking, future time. Try booking the Police Station Booth (zone 2) at the same time as meetup #1 to see a 409.',
  fields: [
    { name: 'listing_id', label: 'Listing id', type: 'number', required: true, createOnly: true },
    { name: 'zone_id', label: 'Zone id', type: 'number', required: true },
    { name: 'scheduled_time', label: 'Date and time', type: 'datetime-local', required: true },
    { name: 'duration_minutes', label: 'Duration (15-120 min)', type: 'number', createOnly: true }
  ],
  rowActions: [
    { label: 'Confirm', method: 'PATCH', path: (r) => `/api/meetups/${r.id}/status`, body: () => ({ status: 'confirmed' }), show: (r) => r.status === 'pending' },
    { label: 'Check in', method: 'POST', path: (r) => `/api/meetups/${r.id}/checkin`, show: (r) => r.status === 'confirmed' },
    { label: 'Complete', method: 'PATCH', path: (r) => `/api/meetups/${r.id}/status`, body: () => ({ status: 'completed' }), show: (r) => r.status === 'confirmed' }
  ]
});
