const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

const isProduction = process.env.NODE_ENV === 'production';

// ✅ Use DATABASE_URL for Render
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: isProduction
    ? { rejectUnauthorized: false }
    : false,
});

// Wrapper functions
const dbRun = async (sql, params = []) => {
  const res = await pool.query(sql, params);
  return res;
};

const dbGet = async (sql, params = []) => {
  const res = await pool.query(sql, params);
  return res.rows[0];
};

const dbAll = async (sql, params = []) => {
  const res = await pool.query(sql, params);
  return res.rows;
};

// Initialize schema
const initDB = async () => {
  await dbRun(`
    CREATE TABLE IF NOT EXISTS patients (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      mobile TEXT UNIQUE NOT NULL,
      age INTEGER,
      address TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await dbRun(`
    CREATE TABLE IF NOT EXISTS visits (
      id SERIAL PRIMARY KEY,
      patient_id INTEGER REFERENCES patients(id),
      visit_date TEXT NOT NULL,
      problem TEXT,
      token_no TEXT NOT NULL,
      token_number INTEGER NOT NULL,
      diagnosis TEXT,
      medicines TEXT,
      notes TEXT,
      expiry_date TEXT,
      status TEXT DEFAULT 'waiting',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await dbRun(`
    CREATE TABLE IF NOT EXISTS admins (
      id SERIAL PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      name TEXT,
      role TEXT DEFAULT 'admin',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Indexes
  await dbRun(`CREATE INDEX IF NOT EXISTS idx_visits_date ON visits(visit_date)`);
  await dbRun(`CREATE INDEX IF NOT EXISTS idx_visits_patient ON visits(patient_id)`);
  await dbRun(`CREATE INDEX IF NOT EXISTS idx_visits_token ON visits(token_no, visit_date)`);
  await dbRun(`CREATE INDEX IF NOT EXISTS idx_patients_mobile ON patients(mobile)`);

  // Seed admin
  const admin = await dbGet('SELECT id FROM admins WHERE username = $1', ['admin']);

  if (!admin) {
    const hash = bcrypt.hashSync('admin123', 12);
    await dbRun(
      'INSERT INTO admins (username, password, name, role) VALUES ($1, $2, $3, $4)',
      ['admin', hash, 'Dr. Admin', 'superadmin']
    );
    console.log('✅ Default admin created');
  }

  console.log('✅ PostgreSQL DB ready');
};

module.exports = { dbRun, dbGet, dbAll, initDB };