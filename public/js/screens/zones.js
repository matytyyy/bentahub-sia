// Ib-Ib's screen: safe meetup zones.
Screens.register({
  id: 'zones', title: 'Safe zones', owner: 'Ib-Ib',
  base: '/api/zones', listLabel: 'Zones with upcoming meetups (LEFT JOIN)', deleteLabel: 'Deactivate',
  hint: 'Only admins can create, edit or deactivate zones. max_concurrent = how many meetups may overlap there.',
  reports: [{ label: 'Zone types (lookup)', path: '/api/zones/types' }],
  fields: [
    { name: 'zone_type_id', label: 'Zone type id (1 Mall, 2 Police, 3 Barangay, 4 Cafe)', type: 'number', required: true },
    { name: 'zone_name', label: 'Zone name', required: true },
    { name: 'city', label: 'City', required: true },
    { name: 'address', label: 'Address', required: true },
    { name: 'max_concurrent', label: 'Max meetups at once', type: 'number' },
    { name: 'open_time', label: 'Opens (default 08:00)', type: 'time', createOnly: true },
    { name: 'close_time', label: 'Closes (default 20:00)', type: 'time', createOnly: true }
  ]
});
