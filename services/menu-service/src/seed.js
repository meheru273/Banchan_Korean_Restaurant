require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const mongoose = require('mongoose');
const Category = require('./models/Category');
const MenuItem = require('./models/MenuItem');
const Restaurant = require('./models/Restaurant');

const seed = async () => {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to MongoDB');

  // Clear existing data
  await Category.deleteMany({});
  await MenuItem.deleteMany({});
  await Restaurant.deleteMany({});

  // Create restaurants
  const restaurants = await Restaurant.create([
    {
      name: 'Banchan Camden',
      address: { line1: '45 Camden High Street', postcode: 'NW1 7JE' },
      phone: '+44 20 7123 4567',
      location: { type: 'Point', coordinates: [-0.1427, 51.5392] },
    },
    {
      name: 'Banchan Shoreditch',
      address: { line1: '12 Brick Lane', postcode: 'E1 6RF' },
      phone: '+44 20 7234 5678',
      location: { type: 'Point', coordinates: [-0.0715, 51.5215] },
    },
  ]);

  // Create categories
  const categories = await Category.create([
    { name: 'Starters', sortOrder: 1 },
    { name: 'Mains', sortOrder: 2 },
    { name: 'Sides', sortOrder: 3 },
    { name: 'Desserts', sortOrder: 4 },
    { name: 'Drinks', sortOrder: 5 },
  ]);

  const [starters, mains, sides, desserts, drinks] = categories;
  const allRestaurants = restaurants.map((r) => r._id);

  // Create menu items
  await MenuItem.create([
    { name: 'Crispy Calamari', description: 'Lightly battered squid with garlic aioli', price: 7.95, category: starters._id, availableAt: allRestaurants, dietary: { isHalal: true }, allergens: ['gluten', 'molluscs'], preparationTime: 10, isPopular: true, sortOrder: 1 },
    { name: 'Halloumi Fries', description: 'Golden fried halloumi with sweet chilli dip', price: 6.50, category: starters._id, availableAt: allRestaurants, dietary: { isVegetarian: true, isGlutenFree: true }, allergens: ['milk'], preparationTime: 8, sortOrder: 2 },
    { name: 'Grilled Chicken Burger', description: 'Chargrilled chicken breast, lettuce, tomato, special sauce', price: 12.95, category: mains._id, availableAt: allRestaurants, dietary: { isHalal: true }, allergens: ['gluten', 'eggs'], preparationTime: 15, isPopular: true, sortOrder: 1 },
    { name: 'Lamb Kofta Wrap', description: 'Spiced lamb kofta with hummus, pickled red onion, flatbread', price: 11.50, category: mains._id, availableAt: allRestaurants, dietary: { isHalal: true }, allergens: ['gluten', 'sesame'], preparationTime: 18, sortOrder: 2 },
    { name: 'Vegan Buddha Bowl', description: 'Quinoa, roasted veg, avocado, tahini dressing', price: 10.95, category: mains._id, availableAt: allRestaurants, dietary: { isVegan: true, isGlutenFree: true }, allergens: ['sesame'], preparationTime: 12, sortOrder: 3 },
    { name: 'Sweet Potato Fries', description: 'Crispy sweet potato fries with chipotle mayo', price: 4.50, category: sides._id, availableAt: allRestaurants, dietary: { isVegan: true, isGlutenFree: true }, preparationTime: 10, sortOrder: 1 },
    { name: 'Chocolate Brownie', description: 'Warm Belgian chocolate brownie with vanilla ice cream', price: 6.95, category: desserts._id, availableAt: allRestaurants, dietary: { isVegetarian: true }, allergens: ['gluten', 'eggs', 'milk'], preparationTime: 5, isPopular: true, sortOrder: 1 },
    { name: 'Fresh Lemonade', description: 'House-made lemonade with mint', price: 3.50, category: drinks._id, availableAt: allRestaurants, dietary: { isVegan: true, isGlutenFree: true }, preparationTime: 2, sortOrder: 1 },
  ]);

  console.log('Seed complete: 2 restaurants, 5 categories, 8 menu items');
  process.exit(0);
};

seed().catch((err) => { console.error(err); process.exit(1); });
