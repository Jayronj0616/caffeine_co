const express = require('express');
const cors = require('cors');
const { Sequelize, DataTypes } = require('sequelize');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// MySQL Connection
const sequelize = new Sequelize(
  process.env.DB_NAME || 'caffeine_co',
  process.env.DB_USER || 'root',
  process.env.DB_PASSWORD !== undefined ? process.env.DB_PASSWORD : 'password',
  {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    dialect: 'mysql',
    logging: false
  }
);

// Define Coffee Model
const Coffee = sequelize.define('Coffee', {
  name: { type: DataTypes.STRING, allowNull: false },
  description: { type: DataTypes.TEXT, allowNull: false },
  price: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
  category: {
    type: DataTypes.ENUM('Espresso', 'Pour Over', 'Cold Brew', 'Signature', 'Pastry'),
    defaultValue: 'Espresso'
  },
  image: { type: DataTypes.STRING },
  available: { type: DataTypes.BOOLEAN, defaultValue: true }
});

// Routes
app.get('/api/menu', async (req, res) => {
  try {
    const menu = await Coffee.findAll();
    res.json(menu);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Seed Route (Internal use)
app.post('/api/seed', async (req, res) => {
  try {
    // Re-sync with force: true to clear table and re-create schema
    await sequelize.sync({ force: true });
    
    const items = [
      // Signatures
      { name: 'Oatmeal Honey Latte', description: 'Creamy oat milk with organic honey and double espresso.', price: 6.50, category: 'Signature', image: '/images/latte.jpg' },
      { name: 'Spiced Maple Cold Foam', description: 'Cold brew topped with maple-infused foam and cinnamon.', price: 6.75, category: 'Signature', image: '/images/cold_brew.jpg' },
      { name: 'Salted Caramel Latte', description: 'House-made caramel sauce with a pinch of sea salt.', price: 6.25, category: 'Signature', image: '/images/latte.jpg' },
      { name: 'Lavender Honey Breve', description: 'Rich half-and-half steamed with floral lavender syrup.', price: 6.50, category: 'Signature', image: '/images/latte_art_feature.jpg' },

      // Espresso
      { name: 'Espresso Macchiato', description: 'Bold double shot with a dollop of foam.', price: 4.50, category: 'Espresso', image: '/images/macchiato.jpg' },
      { name: 'Cortado', description: 'Equal parts espresso and steamed milk for perfect balance.', price: 4.75, category: 'Espresso', image: '/images/latte_art_feature.jpg' },
      { name: 'Americano', description: 'Double espresso topped with hot water for a rich, bold cup.', price: 4.00, category: 'Espresso', image: '/images/macchiato.jpg' },
      { name: 'Cappuccino', description: 'Equal parts espresso, steamed milk, and milk foam.', price: 5.00, category: 'Espresso', image: '/images/latte.jpg' },

      // Pour Over
      { name: 'Ethiopian Yirgacheffe', description: 'Light roast with floral notes and citrus finish.', price: 5.50, category: 'Pour Over', image: '/images/pour_over.jpg' },
      { name: 'Colombia Huila', description: 'Medium roast with notes of caramel and red apple.', price: 5.25, category: 'Pour Over', image: '/images/pour_over.jpg' },
      { name: 'Costa Rica Tarrazu', description: 'Bright acidity with honey and chocolate undertones.', price: 5.50, category: 'Pour Over', image: '/images/pour_over.jpg' },
      { name: 'Sumatra Mandheling', description: 'Full-bodied dark roast with earthy, spicy notes.', price: 5.75, category: 'Pour Over', image: '/images/pour_over.jpg' },

      // Cold Brew
      { name: 'Cold Brew Vanilla', description: 'Steeped for 24 hours with Madagascar vanilla beans.', price: 5.00, category: 'Cold Brew', image: '/images/cold_brew.jpg' },
      { name: 'Nitro Cold Brew', description: 'Velvety smooth nitrogen-infused cold coffee.', price: 5.50, category: 'Cold Brew', image: '/images/cold_brew.jpg' },
      { name: 'Cold Brew Lemonade', description: 'Refreshing mix of cold brew and tart lemonade.', price: 5.25, category: 'Cold Brew', image: '/images/cold_brew.jpg' },

      // Pastry
      { name: 'Almond Croissant', description: 'Flaky pastry filled with almond cream.', price: 4.50, category: 'Pastry', image: '/images/croissant.jpg' },
      { name: 'Pain au Chocolat', description: 'Classic buttery pastry with dark chocolate baton.', price: 4.25, category: 'Pastry', image: '/images/croissant.jpg' },
      { name: 'Lemon Poppyseed Scone', description: 'Zesty glaze over a tender, crumbly scone.', price: 3.75, category: 'Pastry', image: '/images/croissant.jpg' },
       { name: 'Blueberry Muffin', description: 'Bursting with fresh blueberries and topped with crumble.', price: 3.50, category: 'Pastry', image: '/images/croissant.jpg' },
      { name: 'Cinnamon Roll', description: 'Warm dough swirled with cinnamon sugar and cream cheese frosting.', price: 4.00, category: 'Pastry', image: '/images/croissant.jpg' }
    ];
    
    const createdItems = await Coffee.bulkCreate(items);
    res.status(201).json(createdItems);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

const PORT = process.env.PORT || 5000;

// Sync database then start server
// Using alter: true to update schema if it changes without dropping data (unless in seed route)
sequelize.sync({ alter: true }).then(() => {
  console.log('✅ Connected to MySQL: Caffeine Co. Database');
  app.listen(PORT, () => {
    console.log(`☕ Server simmering on port ${PORT}`);
  });
}).catch(err => {
  console.error('❌ MySQL Connection Error:', err);
});
