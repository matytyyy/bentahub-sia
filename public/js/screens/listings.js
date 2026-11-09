// Dinglasan's screen: listings.
Screens.register({
  id: 'listings', title: 'Listings', owner: 'Dinglasan',
  base: '/api/listings', listLabel: 'Active listings with category (RIGHT JOIN)', deleteLabel: 'Remove',
  hint: 'You can only edit or remove your own listings (403 otherwise). Listings without a category show as Uncategorized.',
  reports: [{ label: 'Categories (lookup)', path: '/api/listings/categories' }],
  fields: [
    { name: 'title', label: 'Title', required: true },
    { name: 'price', label: 'Price (PHP)', type: 'number', required: true },
    { name: 'category_id', label: 'Category id (1 Electronics, 2 Clothing, 3 Books, 4 Furniture)', type: 'number' },
    { name: 'description', label: 'Description', type: 'textarea' },
    { name: 'status', label: 'Status', type: 'select', options: ['active', 'sold', 'removed'], editOnly: true }
  ]
});
