const { Sequelize } = require('sequelize');
require('dotenv').config();

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

async function check() {
  try {
    await sequelize.authenticate();
    console.log('Connection OK.');
    
    const [tables] = await sequelize.query("SHOW TABLES");
    console.log('Tables:', tables.map(t => Object.values(t)[0]));

    // Try both cases to be sure
    const [results1] = await sequelize.query("SELECT * FROM coffees").catch(() => [[], []]);
    // const [results2] = await sequelize.query("SELECT * FROM Coffees").catch(() => [[], []]);
    
    // const results = results1.length > 0 ? results1 : results2;
    const results = results1;

    console.log(`Found ${results.length} coffee items in 'coffees' table.`);
    results.forEach(r => console.log(`- ${r.name} ($${r.price})`));

  } catch (error) {
    console.error('Check failed:', error);
  } finally {
    await sequelize.close();
  }
}

check();
