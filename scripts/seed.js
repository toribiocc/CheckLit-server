
const dns = require("node:dns");

dns.setServers(["1.1.1.1", "8.8.8.8"]);

require("dotenv").config();

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("../models/User");
const Category = require("../models/Category");
const Product = require("../models/Product");

const categories = [
  { name: "Vegetables", description: "Fresh vegetables and greens" },
  { name: "Fruits", description: "Fresh and seasonal fruits" },
  { name: "Meat", description: "Fresh meat and poultry products" },
  { name: "Seafood", description: "Fish and seafood products" },
  { name: "Seasonings", description: "Seasonings, spices, and condiments" },
  { name: "Oils", description: "Cooking oils and edible oils" },
  { name: "Dairy", description: "Milk, eggs, cheese, and dairy products" },
  { name: "Bakery", description: "Bread and baked products" },
  { name: "Snacks", description: "Chips and snack products" },
  { name: "Beverage", description: "Coffee, tea, juice, and other beverages" },
  { name: "Other", description: "Products that do not fit other categories" },
];

const products = [
  { name: "Fresh Tomato", category: "Vegetables", unitPrice: 85, unit: "kg", icon: "🍅", description: "Ripe red organic tomatoes" },
  { name: "Spinach Bunch", category: "Vegetables", unitPrice: 45, unit: "pack", icon: "🥬", description: "Fresh green leafy spinach" },
  { name: "Red Onion", category: "Vegetables", unitPrice: 120, unit: "kg", icon: "🧅", description: "Crisp red onions" },
  { name: "Carrots", category: "Vegetables", unitPrice: 75, unit: "kg", icon: "🥕", description: "Sweet crunchy carrots" },
  { name: "Potatoes", category: "Vegetables", unitPrice: 110, unit: "bag (2kg)", icon: "🥔", description: "Baking potatoes" },
  { name: "Fresh Garlic", category: "Vegetables", unitPrice: 35, unit: "head", icon: "🧄", description: "Aromatic garlic bulb" },
  { name: "Broccoli Head", category: "Vegetables", unitPrice: 130, unit: "piece", icon: "🥦", description: "Fresh green broccoli florets" },
  { name: "Bell Pepper Set", category: "Vegetables", unitPrice: 150, unit: "pack (3pcs)", icon: "🫑", description: "Trio of red, yellow, and green peppers" },
  { name: "Fuji Apples", category: "Fruits", unitPrice: 160, unit: "kg", icon: "🍎", description: "Sweet and crisp Fuji apples" },
  { name: "Organic Bananas", category: "Fruits", unitPrice: 80, unit: "bunch", icon: "🍌", description: "Fresh ripe yellow bananas" },
  { name: "Sweet Mangoes", category: "Fruits", unitPrice: 180, unit: "kg", icon: "🥭", description: "Juicy yellow mangoes" },
  { name: "Navel Oranges", category: "Fruits", unitPrice: 140, unit: "kg", icon: "🍊", description: "Juicy citrus oranges" },
  { name: "Fresh Strawberries", category: "Fruits", unitPrice: 250, unit: "punnet", icon: "🍓", description: "Sweet farm strawberries" },
  { name: "Hass Avocado", category: "Fruits", unitPrice: 95, unit: "piece", icon: "🥑", description: "Creamy Hass avocados" },
  { name: "Fresh Lemons", category: "Fruits", unitPrice: 85, unit: "pack (4pcs)", icon: "🍋", description: "Zesty fresh yellow lemons" },
  { name: "Chicken Breast", category: "Meat", unitPrice: 280, unit: "kg", icon: "🍗", description: "Boneless skinless chicken breast" },
  { name: "Lean Ground Beef", category: "Meat", unitPrice: 390, unit: "kg", icon: "🥩", description: "90% lean ground beef" },
  { name: "Pork Chops", category: "Meat", unitPrice: 320, unit: "kg", icon: "🥩", description: "Fresh bone-in pork chops" },
  { name: "Atlantic Salmon Fillet", category: "Seafood", unitPrice: 750, unit: "kg", icon: "🐟", description: "Wild-caught fresh salmon" },
  { name: "Smoked Bacon", category: "Meat", unitPrice: 230, unit: "pack (350g)", icon: "🥓", description: "Crispy thick-cut smoked bacon" },
  { name: "Fresh Jumbo Shrimp", category: "Seafood", unitPrice: 580, unit: "kg", icon: "🦐", description: "Peeled and deveined shrimp" },
  { name: "Fine Sea Salt", category: "Seasonings", unitPrice: 45, unit: "container", icon: "🧂", description: "Pure iodized sea salt" },
  { name: "Black Peppercorns", category: "Seasonings", unitPrice: 120, unit: "grinder", icon: "🧂", description: "Whole black pepper with grinder" },
  { name: "Soy Sauce", category: "Seasonings", unitPrice: 85, unit: "bottle (500ml)", icon: "🍶", description: "Naturally brewed soy sauce" },
  { name: "Extra Virgin Olive Oil", category: "Oils", unitPrice: 420, unit: "bottle (750ml)", icon: "🫒", description: "Cold-pressed extra virgin olive oil" },
  { name: "Garlic Powder", category: "Seasonings", unitPrice: 95, unit: "jar", icon: "🧄", description: "Aromatic garlic spice powder" },
  { name: "Paprika Powder", category: "Seasonings", unitPrice: 110, unit: "jar", icon: "🌶️", description: "Sweet smoked paprika" },
  { name: "Whole Milk", category: "Dairy", unitPrice: 115, unit: "liter", icon: "🥛", description: "Pasteurized whole milk" },
  { name: "Large Eggs", category: "Dairy", unitPrice: 210, unit: "carton (12pcs)", icon: "🥚", description: "Farm fresh grade A eggs" },
  { name: "Cheddar Cheese", category: "Dairy", unitPrice: 195, unit: "block (300g)", icon: "🧀", description: "Aged sharp cheddar cheese" },
  { name: "Whole Wheat Bread", category: "Bakery", unitPrice: 85, unit: "loaf", icon: "🍞", description: "100% whole grain bread" },
  { name: "Unsalted Butter", category: "Dairy", unitPrice: 165, unit: "pack (225g)", icon: "🧈", description: "Sweet cream unsalted butter" },
  { name: "Roasted Coffee Beans", category: "Beverage", unitPrice: 450, unit: "bag (500g)", icon: "☕", description: "Medium roast Arabica coffee" },
  { name: "Green Tea Bags", category: "Beverage", unitPrice: 140, unit: "box (25pcs)", icon: "🍵", description: "Organic green tea bags" },
  { name: "100% Orange Juice", category: "Beverage", unitPrice: 165, unit: "carton (1.5L)", icon: "🧃", description: "Pure orange juice with pulp" },
  { name: "Classic Potato Chips", category: "Snacks", unitPrice: 95, unit: "bag", icon: "🥔", description: "Crispy salted potato chips" },
];

async function seed() {
  const {
    MONGO_URI,
    ADMIN_NAME,
    ADMIN_EMAIL,
    ADMIN_PASSWORD,
  } = process.env;

  if (!MONGO_URI) {
    throw new Error("MONGO_URI is missing from .env.");
  }

  if (!ADMIN_NAME || !ADMIN_EMAIL || !ADMIN_PASSWORD) {
    throw new Error(
      "ADMIN_NAME, ADMIN_EMAIL, and ADMIN_PASSWORD must be set in .env."
    );
  }

  if (ADMIN_PASSWORD.length < 8 || ADMIN_PASSWORD.length > 72) {
    throw new Error("ADMIN_PASSWORD must be between 8 and 72 characters.");
  }

  await mongoose.connect(MONGO_URI);

  console.log("Connected to MongoDB.");

  const email = ADMIN_EMAIL.trim().toLowerCase();
  let admin = await User.findOne({ email });

  if (!admin) {
    const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, 12);

    admin = await User.create({
      name: ADMIN_NAME.trim(),
      email,
      password: hashedPassword,
      role: "admin",
    });
  } else {
    admin.name = ADMIN_NAME.trim();
    admin.role = "admin";
    await admin.save();
  }

  console.log(`Admin account ready: ${admin.email}`);

  let categoriesAdded = 0;

  for (const category of categories) {
    const result = await Category.updateOne(
      { normalizedName: category.name.toLowerCase() },
      {
        $setOnInsert: {
          name: category.name,
          normalizedName: category.name.toLowerCase(),
          description: category.description,
        },
      },
      {
        upsert: true,
        runValidators: true,
        setDefaultsOnInsert: true,
      }
    );

    categoriesAdded += result.upsertedCount || 0;
  }

  let productsAdded = 0;

  for (const product of products) {
    const result = await Product.updateOne(
      { name: product.name },
      { $setOnInsert: product },
      {
        upsert: true,
        runValidators: true,
        setDefaultsOnInsert: true,
      }
    );

    productsAdded += result.upsertedCount || 0;
  }

  console.log(`Initial categories added: ${categoriesAdded}`);
  console.log(`Initial products added: ${productsAdded}`);
  console.log(`Initial categories checked: ${categories.length}`);
  console.log(`Initial products checked: ${products.length}`);
  console.log("Seeding completed successfully.");
}

seed()
  .catch((error) => {
    console.error("Seeding failed:", error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect().catch(() => {});
  });
