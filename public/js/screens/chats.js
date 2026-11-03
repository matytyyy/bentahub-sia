// Cabugnason's screen: chat + audit + alerts + the automatic workflow (unique feature, workflow part).
Screens.register({
  id: 'chats', title: 'Chat and audit', owner: 'Cabugnason',
  base: '/api/chats/messages', listLabel: 'My messages', deleteLabel: 'Delete',
  hint: 'Run the expiry workflow to auto-expire overdue meetups, then check the audit report (FULL OUTER JOIN) and your alerts.',
  reports: [
    { label: 'Audit log (FULL OUTER JOIN)', path: '/api/chats/audit' },
    { label: 'My alerts', path: '/api/chats/notifications' }
  ],
  tools: [{ label: 'Run expiry workflow', method: 'POST', path: '/api/chats/workflow/run' }],
  fields: [
    { name: 'listing_id', label: 'Listing id', type: 'number', required: true, createOnly: true },
    { name: 'receiver_id', label: 'Send to user id', type: 'number', required: true, createOnly: true },
    { name: 'message', label: 'Message', type: 'textarea', required: true }
  ]
});
