// Ijan's screen: users + roles. Create = public register endpoint.
Screens.register({
  id: 'auth', title: 'Users', owner: 'Ijan',
  base: '/api/auth/users', createPath: '/api/auth/register',
  listLabel: 'Users and roles (INNER JOIN)', deleteLabel: 'Deactivate',
  hint: 'Admin only list. Deactivating is a soft delete, so history stays intact.',
  fields: [
    { name: 'username', label: 'Username', required: true, createOnly: true },
    { name: 'full_name', label: 'Full name', required: true },
    { name: 'email', label: 'Email', type: 'email', required: true },
    { name: 'password', label: 'Password (min 8 characters)', type: 'password', required: true, createOnly: true }
  ]
});
