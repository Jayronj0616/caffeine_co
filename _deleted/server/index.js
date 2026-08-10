const express = require('express');
const cors = require('cors');
const { Sequelize, DataTypes } = require('sequelize');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const app = express();
const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_key_change_in_production';

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

// Define User Model
const User = sequelize.define('User', {
    username: { type: DataTypes.STRING, allowNull: false, unique: true },
    email: { type: DataTypes.STRING, allowNull: false, unique: true },
    phone: { type: DataTypes.STRING, allowNull: true },
    password: { type: DataTypes.STRING, allowNull: false },
    role: { type: DataTypes.ENUM('user', 'admin'), defaultValue: 'user' }
});

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

// Define CartItem Model
const CartItem = sequelize.define('CartItem', {
  quantity: { type: DataTypes.INTEGER, defaultValue: 1, allowNull: false }
});

// Associations
User.hasMany(CartItem);
CartItem.belongsTo(User);
Coffee.hasMany(CartItem);
CartItem.belongsTo(Coffee);

// Auth Middleware
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN
    if (!token) return res.status(401).json({ message: 'Access denied' });

    jwt.verify(token, JWT_SECRET, async (err, user) => {
        if (err) return res.status(403).json({ message: 'Invalid token' });

        try {
            // Check if user still exists in DB (handling server resets)
            const dbUser = await User.findByPk(user.id);
            if (!dbUser) {
                return res.status(401).json({ message: 'User not found. Please login again.' });
            }
            req.user = user;
            next();
        } catch (dbErr) {
            return res.status(500).json({ message: 'Database error checking user' });
        }
    });
};

const isAdmin = (req, res, next) => {
    if (req.user.role !== 'admin') return res.status(403).json({ message: 'Admin access required' });
    next();
};

// --- ROUTES ---

// Public Routes
app.get('/api/menu', async (req, res) => {
  try {
    const menu = await Coffee.findAll();
    res.json(menu);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.post('/api/register', async (req, res) => {
    try {
        const { username, email, phone, password } = req.body;
        if (!username || !email || !password) return res.status(400).json({ message: 'Username, email, and password required' });
        
        const existingUser = await User.findOne({ where: { username } });
        if (existingUser) return res.status(400).json({ message: 'Username already exists' });

        const existingEmail = await User.findOne({ where: { email } });
        if (existingEmail) return res.status(400).json({ message: 'Email already exists' });

        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = await User.create({ username, email, phone, password: hashedPassword, role: 'user' });
        
        res.status(201).json({ message: 'User registered successfully' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

app.post('/api/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        const user = await User.findOne({ where: { username } });
        if (!user) return res.status(400).json({ message: 'Invalid credentials' });

        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) return res.status(400).json({ message: 'Invalid credentials' });

        const token = jwt.sign({ id: user.id, username: user.username, role: user.role }, JWT_SECRET, { expiresIn: '1h' });
        res.json({ token, user: { id: user.id, username: user.username, role: user.role } });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Cart Routes (Protected)
app.get('/api/cart', authenticateToken, async (req, res) => {
    try {
        const cartItems = await CartItem.findAll({ 
            where: { UserId: req.user.id },
            include: [Coffee]
        });
        res.json(cartItems);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

app.post('/api/cart', authenticateToken, async (req, res) => {
    try {
        const { coffeeId, quantity } = req.body;
        const qty = quantity || 1;

        let cartItem = await CartItem.findOne({ 
            where: { UserId: req.user.id, CoffeeId: coffeeId }
        });

        if (cartItem) {
            cartItem.quantity += qty;
            await cartItem.save();
        } else {
            cartItem = await CartItem.create({ 
                UserId: req.user.id, 
                CoffeeId: coffeeId, 
                quantity: qty 
            });
        }
        
        const updatedItem = await CartItem.findOne({
            where: { id: cartItem.id },
            include: [Coffee]
        });
        res.json(updatedItem);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

app.put('/api/cart/:id', authenticateToken, async (req, res) => {
    try {
        const { quantity } = req.body;
        const { id } = req.params;
        
        if (quantity < 1) {
            await CartItem.destroy({ where: { id, UserId: req.user.id } });
            return res.json({ message: 'Item removed', id });
        }

        await CartItem.update({ quantity }, { where: { id, UserId: req.user.id } });
        const updatedItem = await CartItem.findOne({
            where: { id },
            include: [Coffee]
        });
        res.json(updatedItem);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

app.delete('/api/cart/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        await CartItem.destroy({ where: { id, UserId: req.user.id } });
        res.json({ message: 'Item removed', id });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Admin Routes (Protected)
app.post('/api/menu', authenticateToken, isAdmin, async (req, res) => {
    try {
        const newItem = await Coffee.create(req.body);
        res.status(201).json(newItem);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

app.put('/api/menu/:id', authenticateToken, isAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const [updated] = await Coffee.update(req.body, { where: { id } });
        if (updated) {
            const updatedItem = await Coffee.findByPk(id);
            res.json(updatedItem);
        } else {
            res.status(404).json({ message: 'Item not found' });
        }
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

app.delete('/api/menu/:id', authenticateToken, isAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const deleted = await Coffee.destroy({ where: { id } });
        if (deleted) {
            res.json({ message: 'Item deleted' });
        } else {
            res.status(404).json({ message: 'Item not found' });
        }
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Seeder Function
const seedDatabase = async () => {
    try {
        console.log('🌱 Seeding database...');
        
        // Create Default Admin (if not exists)
        const adminExists = await User.findOne({ where: { username: 'admin' } });
        if (!adminExists) {
            const adminPassword = await bcrypt.hash('admin123', 10);
            await User.create({ 
                username: 'admin', 
                email: 'admin@caffeine.co', 
                phone: '1234567890', 
                password: adminPassword, 
                role: 'admin' 
            });
            console.log('👤 Admin user created');
        }

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
        
        await Coffee.bulkCreate(items);
        console.log('✅ Default menu items seeded');
        return items;
    } catch (err) {
        console.error('❌ Seeding failed:', err);
        throw err;
    }
};

// Seed Route (Public for demo, but ideally protected)
app.post('/api/seed', async (req, res) => {
  try {
    console.log('🔄 Resetting database...');

    // Delete data in order to respect Foreign Key constraints
    // 1. Delete CartItems (references User and Coffee)
    await CartItem.destroy({ where: {}, truncate: false });
    
    // 2. Delete Menu Items (Coffee)
    await Coffee.destroy({ where: {}, truncate: false });

    // 3. Delete Users
    await User.destroy({ where: {}, truncate: false });

    // Re-seed
    const items = await seedDatabase();
    res.status(201).json({ message: 'Database reset and seeded successfully', items });
  } catch (err) {
    console.error('❌ Reset failed:', err);
    res.status(500).json({ message: 'Failed to reset database: ' + err.message });
  }
});

const PORT = process.env.PORT || 5000;

// Sync database then start server
sequelize.sync({ alter: true }).then(async () => {
  console.log('✅ Connected to MySQL: Caffeine Co. Database');
  
  // Auto-seed if empty
  const count = await Coffee.count();
  if (count === 0) {
      await seedDatabase();
  }

  app.listen(PORT, () => {
    console.log(`☕ Server simmering on port ${PORT}`);
  });
}).catch(err => {
  console.error('❌ MySQL Connection Error:', err);
});
