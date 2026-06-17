require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const mongoose = require('mongoose');
const Category = require('./models/Category');
const MenuItem = require('./models/MenuItem');
const Restaurant = require('./models/Restaurant');

// Real Korean-dish photos (stable Wikimedia Commons URLs).
const IMG = {
  bibimbap: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/44/Dolsot-bibimbap.jpg/330px-Dolsot-bibimbap.jpg',
  bulgogi: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/ce/Bulgogi_2.jpg/330px-Bulgogi_2.jpg',
  tteokbokki: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4d/Tteokbokki.JPG/330px-Tteokbokki.JPG',
  kimchi: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f8/Various_kimchi.jpg/330px-Various_kimchi.jpg',
  japchae: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c8/Polish_Korean_Cuisine_and_Culture_Exchanges_Gradmother%E2%80%99s_Recipes_05.jpg/330px-Polish_Korean_Cuisine_and_Culture_Exchanges_Gradmother%E2%80%99s_Recipes_05.jpg',
  sundubu: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/02/Sundubu-jjigae.jpg/330px-Sundubu-jjigae.jpg',
  kimchiJjigae: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/db/Korean_stew_dish_-_Kimchi-jjigae_Kimchi_Stew_2019_%2801%29.jpg/330px-Korean_stew_dish_-_Kimchi-jjigae_Kimchi_Stew_2019_%2801%29.jpg',
  samgyeopsal: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/77/Samgyeopsal-gui.jpg/330px-Samgyeopsal-gui.jpg',
  chicken: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/46/Iksan_City_48_Korean_Style_Fried_chicken.jpg/330px-Iksan_City_48_Korean_Style_Fried_chicken.jpg',
  gimbap: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0e/Gimbap_%28pixabay%29.jpg/330px-Gimbap_%28pixabay%29.jpg',
  mandu: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0c/%EB%A7%8C%EB%91%90.jpg/330px-%EB%A7%8C%EB%91%90.jpg',
  pajeon: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d3/Korean_pancake-Pajeon-05.jpg/330px-Korean_pancake-Pajeon-05.jpg',
  sikhye: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c3/Korean.food-Sikhye-01.jpg/330px-Korean.food-Sikhye-01.jpg',
  patbingsu: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/75/Patbingsu.jpg/330px-Patbingsu.jpg',
  hotteok: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/97/Hotteok.jpg/330px-Hotteok.jpg',
};

const seed = async () => {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to MongoDB');

  await Category.deleteMany({});
  await MenuItem.deleteMany({});
  await Restaurant.deleteMany({});

  const restaurants = await Restaurant.create([
    {
      name: 'Banchan West Drayton',
      address: { line1: '121 Faling Lane, West Drayton', postcode: 'UB7 8AG' },
      phone: '+44 20 7123 4567',
      location: { type: 'Point', coordinates: [-0.4720, 51.5103] },
    },
  ]);
  const allRestaurants = restaurants.map((r) => r._id);

  const categories = await Category.create([
    { name: 'Meal Sets', sortOrder: 1 },
    { name: 'Rice Bowls', sortOrder: 2 },
    { name: 'Fried Chicken', sortOrder: 3 },
    { name: 'Stews & Tteok', sortOrder: 4 },
    { name: 'Sides', sortOrder: 5 },
    { name: 'Drinks & Sweets', sortOrder: 6 },
  ]);
  const [sets, bowls, chicken, stews, sides, drinks] = categories;

  await MenuItem.create([
    // ── Meal Sets ──
    { name: 'Bulgogi Beef Set', description: 'Sweet soy-marinated beef, steamed rice & two banchan', price: 8.50, category: sets._id, availableAt: allRestaurants, image: IMG.bulgogi, dietary: { isHalal: true }, allergens: ['soybeans', 'sesame'], isPopular: true, sortOrder: 1 },
    { name: 'Spicy Pork Set', description: 'Gochujang-glazed pork, steamed rice & two banchan', price: 8.50, category: sets._id, availableAt: allRestaurants, image: IMG.samgyeopsal, allergens: ['soybeans', 'sesame'], isPopular: true, sortOrder: 2 },
    { name: 'Soy-Garlic Chicken Set', description: 'Crispy soy-garlic chicken, rice & two banchan', price: 8.50, category: sets._id, availableAt: allRestaurants, image: IMG.chicken, dietary: { isHalal: true }, allergens: ['gluten', 'soybeans'], sortOrder: 3 },
    { name: 'Tofu Bibim Set', description: 'Veg bibimbap with grilled tofu, rice & banchan', price: 8.50, category: sets._id, availableAt: allRestaurants, image: IMG.bibimbap, dietary: { isVegetarian: true }, allergens: ['soybeans', 'sesame', 'eggs'], sortOrder: 4 },

    // ── Rice Bowls ──
    { name: 'Bibimbap', description: 'Rice, seasonal veg, beef, fried egg & gochujang', price: 9.50, category: bowls._id, availableAt: allRestaurants, image: IMG.bibimbap, allergens: ['eggs', 'sesame', 'soybeans'], isPopular: true, sortOrder: 1 },
    { name: 'Bulgogi Bowl', description: 'Marinated beef, rice & house pickles', price: 9.50, category: bowls._id, availableAt: allRestaurants, image: IMG.bulgogi, dietary: { isHalal: true }, allergens: ['soybeans', 'sesame'], sortOrder: 2 },
    { name: 'Spicy Pork Bowl', description: 'Gochujang pork over rice with house kimchi', price: 9.00, category: bowls._id, availableAt: allRestaurants, image: IMG.samgyeopsal, allergens: ['soybeans', 'sesame'], sortOrder: 3 },

    // ── Fried Chicken ──
    { name: 'Soy Garlic Chicken', description: 'Korean fried chicken, soy-garlic glaze · 6pc', price: 7.50, category: chicken._id, availableAt: allRestaurants, image: IMG.chicken, dietary: { isHalal: true }, allergens: ['gluten', 'soybeans'], isPopular: true, sortOrder: 1 },
    { name: 'Sweet & Spicy Chicken', description: 'Gochujang glaze, toasted sesame · 6pc', price: 7.50, category: chicken._id, availableAt: allRestaurants, image: IMG.chicken, dietary: { isHalal: true }, allergens: ['gluten', 'soybeans', 'sesame'], isPopular: true, sortOrder: 2 },

    // ── Stews & Tteok ──
    { name: 'Kimchi Jjigae', description: 'Aged kimchi & tofu stew with pork', price: 8.50, category: stews._id, availableAt: allRestaurants, image: IMG.kimchiJjigae, allergens: ['soybeans'], sortOrder: 1 },
    { name: 'Sundubu Stew', description: 'Silky soft tofu stew with egg & veg', price: 8.50, category: stews._id, availableAt: allRestaurants, image: IMG.sundubu, allergens: ['eggs', 'soybeans', 'molluscs'], sortOrder: 2 },
    { name: 'Tteokbokki', description: 'Chewy rice cakes in spicy gochujang sauce', price: 6.50, category: stews._id, availableAt: allRestaurants, image: IMG.tteokbokki, dietary: { isVegetarian: true }, allergens: ['gluten', 'soybeans'], isPopular: true, sortOrder: 3 },

    // ── Sides ──
    { name: 'Kimchi', description: 'House-fermented napa cabbage', price: 2.50, category: sides._id, availableAt: allRestaurants, image: IMG.kimchi, dietary: { isVegan: true, isGlutenFree: true }, sortOrder: 1 },
    { name: 'Japchae', description: 'Stir-fried glass noodles with vegetables', price: 5.50, category: sides._id, availableAt: allRestaurants, image: IMG.japchae, dietary: { isVegetarian: true }, allergens: ['soybeans', 'sesame'], sortOrder: 2 },
    { name: 'Gimbap', description: 'Seaweed rice rolls with veg & egg · 8pc', price: 4.50, category: sides._id, availableAt: allRestaurants, image: IMG.gimbap, allergens: ['eggs', 'sesame'], sortOrder: 3 },
    { name: 'Mandu', description: 'Pan-fried pork & veg dumplings · 5pc', price: 4.50, category: sides._id, availableAt: allRestaurants, image: IMG.mandu, allergens: ['gluten', 'soybeans'], sortOrder: 4 },
    { name: 'Haemul Pajeon', description: 'Crispy seafood & spring onion pancake', price: 6.00, category: sides._id, availableAt: allRestaurants, image: IMG.pajeon, allergens: ['gluten', 'eggs', 'crustaceans', 'molluscs'], sortOrder: 5 },

    // ── Drinks & Sweets ──
    { name: 'Sikhye', description: 'Sweet Korean rice punch', price: 2.50, category: drinks._id, availableAt: allRestaurants, image: IMG.sikhye, dietary: { isVegan: true, isGlutenFree: true }, sortOrder: 1 },
    { name: 'Patbingsu', description: 'Shaved ice with red bean & condensed milk', price: 5.50, category: drinks._id, availableAt: allRestaurants, image: IMG.patbingsu, dietary: { isVegetarian: true }, allergens: ['milk'], isPopular: true, sortOrder: 2 },
    { name: 'Hotteok', description: 'Sweet syrup-filled griddle pancake · 2pc', price: 3.50, category: drinks._id, availableAt: allRestaurants, image: IMG.hotteok, dietary: { isVegetarian: true }, allergens: ['gluten', 'nuts'], sortOrder: 3 },
  ]);

  console.log('Seed complete: 1 restaurant, 6 categories, 21 Korean dishes with photos');
  process.exit(0);
};

seed().catch((err) => { console.error(err); process.exit(1); });
