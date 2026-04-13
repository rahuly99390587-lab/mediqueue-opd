require('dotenv').config();
const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { dbRun, dbGet, dbAll, initDB } = require('./db');

const app = express();
const PORT = process.env.PORT || 5001;
const JWT_SECRET = process.env.JWT_SECRET || 'mediqueue_jwt_secret_change_in_production';

// ─── MIDDLEWARE ──────────────────────────────────────────────────────────────
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',')
  : ['http://localhost:3000', 'http://localhost:3001', 'http://127.0.0.1:3000'];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin) || process.env.NODE_ENV === 'development') {
      return callback(null, true);
    }
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), service: 'MediQueue OPD API' });
});

// ─── AUTH MIDDLEWARE ─────────────────────────────────────────────────────────
const requireAuth = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token) {
    return res.status(401).json({ success: false, error: 'Authentication required' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.admin = decoded;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, error: 'Session expired. Please login again.' });
    }
    return res.status(401).json({ success: false, error: 'Invalid token' });
  }
};

// ─── HELPERS ─────────────────────────────────────────────────────────────────
const getLocalDate = () => {
  const now = new Date();
  return now.toISOString().split('T')[0];
};

const generateToken = async (visitDate) => {
  const row = await dbGet(
    'SELECT COALESCE(MAX(token_number), 0) as max_num FROM visits WHERE visit_date = $1',
    [visitDate]
  );
  const nextNum = (row?.max_num || 0) + 1;
  return { token_no: `T-${nextNum}`, token_number: nextNum };
};

const sendSuccess = (res, data, status = 200) => res.status(status).json({ success: true, ...data });
const sendError = (res, message, status = 400) => res.status(status).json({ success: false, error: message });

// ═══════════════════════════════════════════════════════════════════════════
// PUBLIC ROUTES (no auth)
// ═══════════════════════════════════════════════════════════════════════════

// POST /api/admin/login
app.post('/api/admin/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) return sendError(res, 'Username and password required');

    const admin = await dbGet('SELECT * FROM admins WHERE username = $1', [username.trim()]);
    if (!admin) return sendError(res, 'Invalid credentials', 401);

    const valid = bcrypt.compareSync(password, admin.password);
    if (!valid) return sendError(res, 'Invalid credentials', 401);

    const token = jwt.sign(
      { id: admin.id, username: admin.username, name: admin.name, role: admin.role },
      JWT_SECRET,
      { expiresIn: '12h' }
    );

    sendSuccess(res, {
      token,
      admin: { id: admin.id, username: admin.username, name: admin.name, role: admin.role }
    });
  } catch (err) {
    console.error('Login error:', err);
    sendError(res, 'Login failed. Please try again.', 500);
  }
});

// GET /api/patient/check/:mobile
app.get('/api/patient/check/:mobile', async (req, res) => {
  try {
    const { mobile } = req.params;
    if (!mobile || mobile.length < 10) return sendError(res, 'Invalid mobile number');

    const patient = await dbGet('SELECT * FROM patients WHERE mobile = $1', [mobile.trim()]);
    if (!patient) return sendSuccess(res, { exists: false });

    const lastVisit = await dbGet(
      'SELECT * FROM visits WHERE patient_id = $1 ORDER BY visit_date DESC, id DESC LIMIT 1',
      [patient.id]
    );

    sendSuccess(res, { exists: true, patient, lastVisit: lastVisit || null });
  } catch (err) {
    console.error('Check patient error:', err);
    sendError(res, 'Failed to check patient', 500);
  }
});

// POST /api/register - Patient registration
app.post('/api/register', async (req, res) => {
  try {
    const { name, mobile, age, address, problem } = req.body;

    if (!name?.trim()) return sendError(res, 'Name is required');
    if (!mobile?.trim() || mobile.trim().length < 10) return sendError(res, 'Valid mobile number is required');
    if (!problem?.trim()) return sendError(res, 'Problem/symptom description is required');

    const today = getLocalDate();
    const cleanMobile = mobile.trim();

    // Find or create patient
    let patient = await dbGet('SELECT * FROM patients WHERE mobile = $1', [cleanMobile]);

    if (!patient) {
      const result = await dbRun(
        'INSERT INTO patients (name, mobile, age, address) VALUES ($1, $2, $3, $4) RETURNING *',
        [name.trim(), cleanMobile, age ? parseInt(age) : null, address?.trim() || '']
      );
      patient = result.rows[0];
    } else {
      // Update existing patient info
      await dbRun(
        'UPDATE patients SET name = $1, age = $2, address = $3, updated_at = CURRENT_TIMESTAMP WHERE id = $4',
        [name.trim(), age ? parseInt(age) : patient.age, address?.trim() || patient.address, patient.id]
      );
      patient = await dbGet('SELECT * FROM patients WHERE id = $1', [patient.id]);
    }

    // Check if already registered today
    const existingVisit = await dbGet(
      'SELECT * FROM visits WHERE patient_id = $1 AND visit_date = $2',
      [patient.id, today]
    );

    if (existingVisit) {
      return sendSuccess(res, {
        patient,
        visit: existingVisit,
        isReturning: false,
        alreadyRegistered: true,
        message: 'Already registered today. Here is your existing token.'
      });
    }

    // Generate new token
    const { token_no, token_number } = await generateToken(today);

    const visitResult = await dbRun(
      `INSERT INTO visits (patient_id, visit_date, problem, token_no, token_number, status)
       VALUES ($1, $2, $3, $4, $5, 'waiting') RETURNING *`,
      [patient.id, today, problem.trim(), token_no, token_number]
    );

    const visit = visitResult.rows[0];

    sendSuccess(res, {
      patient,
      visit,
      isReturning: true,
      alreadyRegistered: false,
      message: 'Registration successful'
    }, 201);
  } catch (err) {
    console.error('Registration error:', err);
    if (err.message?.includes('unique')) {
      sendError(res, 'A record conflict occurred. Please try again.');
    } else {
      sendError(res, 'Registration failed. Please try again.', 500);
    }
  }
});

// GET /api/admin/me
app.get('/api/admin/me', requireAuth, (req, res) => {
  sendSuccess(res, { admin: req.admin });
});

// GET /api/dashboard
app.get('/api/dashboard', requireAuth, async (req, res) => {
  try {
    const today = getLocalDate();
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

    const [
      totalPatients,
      todayStats,
      yesterdayCount,
      currentToken,
      waitingCount,
    ] = await Promise.all([
      dbGet('SELECT COUNT(*) as count FROM patients'),
      dbGet('SELECT COUNT(*) as count, MAX(token_number) as max_token FROM visits WHERE visit_date = $1', [today]),
      dbGet('SELECT COUNT(*) as count FROM visits WHERE visit_date = $1', [yesterday]),
      dbGet('SELECT MAX(token_number) as max FROM visits WHERE visit_date = $1', [today]),
      dbGet("SELECT COUNT(*) as count FROM visits WHERE visit_date = $1 AND status = 'waiting'", [today]),
    ]);

    // Last 14 days chart
    const chartData = [];
    for (let i = 13; i >= 0; i--) {
      const d = new Date(Date.now() - i * 86400000).toISOString().split('T')[0];
      const row = await dbGet('SELECT COUNT(*) as count FROM visits WHERE visit_date = $1', [d]);
      chartData.push({
        date: d,
        label: new Date(d + 'T00:00:00').toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }),
        count: row?.count || 0,
      });
    }

    // Age distribution (NO CHANGE needed)
    const ageGroups = await dbAll(`
      SELECT
        CASE
          WHEN age < 13 THEN 'Children (0-12)'
          WHEN age < 18 THEN 'Teens (13-17)'
          WHEN age < 35 THEN 'Young Adults (18-34)'
          WHEN age < 60 THEN 'Adults (35-59)'
          ELSE 'Seniors (60+)'
        END as name,
        COUNT(*) as value
      FROM patients
      WHERE age IS NOT NULL AND age > 0
      GROUP BY name
      ORDER BY MIN(age)
    `);

    // Most common problems (NO CHANGE needed)
const commonProblems = await dbAll(`
  SELECT LOWER(TRIM(problem)) as name, COUNT(*) as count
  FROM visits
  WHERE problem IS NOT NULL AND problem != ''
  GROUP BY LOWER(TRIM(problem))
  ORDER BY count DESC
  LIMIT 8
`);

// Frequent visitors (>3 visits) (NO CHANGE needed)
const frequentVisitors = await dbAll(`
  SELECT p.name, p.mobile, p.age, COUNT(v.id) as visit_count, MAX(v.visit_date) as last_visit
  FROM patients p
  JOIN visits v ON p.id = v.patient_id
  GROUP BY p.id
  HAVING COUNT(v.id) >= 3
  ORDER BY visit_count DESC
  LIMIT 8
`);

// Today's status breakdown
const statusBreakdown = await dbAll(
  'SELECT status, COUNT(*) as count FROM visits WHERE visit_date = $1 GROUP BY status',
  [today]
);

sendSuccess(res, {
  stats: {
    totalPatients: totalPatients?.count || 0,
    todayPatients: todayStats?.count || 0,
    yesterdayPatients: yesterdayCount?.count || 0,
    currentToken: currentToken?.max || 0,
    waitingCount: waitingCount?.count || 0,
  },
  chartData,
  ageGroups,
  commonProblems,
  frequentVisitors,
  statusBreakdown,
});
} catch (err) {
  console.error('Dashboard error:', err);
  sendError(res, 'Failed to load dashboard', 500);
}
});

// GET /api/queue/today
app.get('/api/queue/today', requireAuth, async (req, res) => {
try {
  const today = getLocalDate();
  const { status } = req.query;

  let sql = `
    SELECT v.*, p.name, p.mobile, p.age, p.address
    FROM visits v
    JOIN patients p ON v.patient_id = p.id
    WHERE v.visit_date = $1
  `;
  const params = [today];

  if (status && ['waiting', 'printed', 'completed'].includes(status)) {
    sql += ' AND v.status = $2';
    params.push(status);
  }

  sql += ' ORDER BY v.token_number ASC';

  const queue = await dbAll(sql, params);
  sendSuccess(res, { queue, date: today, total: queue.length });
} catch (err) {
  console.error('Queue error:', err);
  sendError(res, 'Failed to load queue', 500);
}
});

// GET /api/search
app.get('/api/search', requireAuth, async (req, res) => {
try {
  const { q, type, date } = req.query;
  if (!q?.trim()) return sendSuccess(res, { results: [] });

  const searchDate = date || getLocalDate();
  let results = [];

  if (type === 'token') {
    const tokenQ = q.trim().toUpperCase().startsWith('T-') ? q.trim().toUpperCase() : `T-${q.trim()}`;
    results = await dbAll(`
      SELECT v.*, p.name, p.mobile, p.age, p.address,
             (SELECT COUNT(*) FROM visits WHERE patient_id = p.id) as visit_count
      FROM visits v JOIN patients p ON v.patient_id = p.id
      WHERE v.token_no = $1 AND v.visit_date = $2
      ORDER BY v.token_number ASC
    `, [tokenQ, searchDate]);
  } else if (type === 'mobile') {
    results = await dbAll(`
      SELECT v.*, p.name, p.mobile, p.age, p.address,
             (SELECT COUNT(*) FROM visits WHERE patient_id = p.id) as visit_count
      FROM visits v JOIN patients p ON v.patient_id = p.id
      WHERE p.mobile LIKE $1
      ORDER BY v.visit_date DESC, v.token_number DESC
      LIMIT 30
    `, [`%${q.trim()}%`]);
  } else {
    results = await dbAll(`
      SELECT v.*, p.name, p.mobile, p.age, p.address,
             (SELECT COUNT(*) FROM visits WHERE patient_id = p.id) as visit_count
      FROM visits v JOIN patients p ON v.patient_id = p.id
      WHERE p.name LIKE $1
      ORDER BY v.visit_date DESC, v.token_number DESC
      LIMIT 30
    `, [`%${q.trim()}%`]);
  }

  sendSuccess(res, { results, total: results.length });
} catch (err) {
  console.error('Search error:', err);
  sendError(res, 'Search failed', 500);
}
});

// GET /api/patient/:mobile/history
app.get('/api/patient/:mobile/history', requireAuth, async (req, res) => {
try {
  const patient = await dbGet('SELECT * FROM patients WHERE mobile = $1', [req.params.mobile]);
  if (!patient) return sendError(res, 'Patient not found', 404);

  const visits = await dbAll(
    'SELECT * FROM visits WHERE patient_id = $1 ORDER BY visit_date DESC, id DESC',
    [patient.id]
  );

  const visitCount = visits.length;
  const isFrequent = visitCount > 5;
  const lastVisit = visits[0] || null;

  const previousMedicines = visits
    .filter(v => v.medicines?.trim())
    .slice(0, 3)
    .map(v => ({ date: v.visit_date, diagnosis: v.diagnosis, medicines: v.medicines }));

  sendSuccess(res, { patient, visits, visitCount, isFrequent, lastVisit, previousMedicines });
} catch (err) {
  console.error('History error:', err);
  sendError(res, 'Failed to load patient history', 500);
}
});

// GET /api/visit/:id
app.get('/api/visit/:id', requireAuth, async (req, res) => {
  try {
    const visit = await dbGet(`
      SELECT v.*, p.name, p.mobile, p.age, p.address
      FROM visits v JOIN patients p ON v.patient_id = p.id
      WHERE v.id = $1
    `, [req.params.id]);

    if (!visit) return sendError(res, 'Visit not found', 404);

    const visitCount = await dbGet(
      'SELECT COUNT(*) as count FROM visits WHERE patient_id = $1',
      [visit.patient_id]
    );

    sendSuccess(res, { visit: { ...visit, visitCount: visitCount?.count || 0 } });
  } catch (err) {
    console.error('Visit error:', err);
    sendError(res, 'Failed to load visit', 500);
  }
});

// PUT /api/visit/:id
app.put('/api/visit/:id', requireAuth, async (req, res) => {
  try {
    const { diagnosis, medicines, notes, expiry_date, status } = req.body;
    const validStatuses = ['waiting', 'printed', 'completed', 'cancelled'];
    const finalStatus = validStatuses.includes(status) ? status : 'waiting';

    await dbRun(`
      UPDATE visits
      SET diagnosis = $1, medicines = $2, notes = $3, expiry_date = $4, status = $5,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $6
    `, [
      diagnosis?.trim() || null,
      medicines?.trim() || null,
      notes?.trim() || null,
      expiry_date || null,
      finalStatus,
      req.params.id
    ]);

    const visit = await dbGet(`
      SELECT v.*, p.name, p.mobile, p.age, p.address
      FROM visits v JOIN patients p ON v.patient_id = p.id
      WHERE v.id = $1
    `, [req.params.id]);

    if (!visit) return sendError(res, 'Visit not found', 404);
    sendSuccess(res, { visit });
  } catch (err) {
    console.error('Update visit error:', err);
    sendError(res, 'Failed to update visit', 500);
  }
});

// GET /api/patients
app.get('/api/patients', requireAuth, async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, parseInt(req.query.limit) || 25);
    const offset = (page - 1) * limit;

    const [patients, totalRow] = await Promise.all([
      dbAll(`
        SELECT p.*, COUNT(v.id) as visit_count, MAX(v.visit_date) as last_visit
        FROM patients p LEFT JOIN visits v ON p.id = v.patient_id
        GROUP BY p.id
        ORDER BY p.created_at DESC
        LIMIT $1 OFFSET $2
      `, [limit, offset]),
      dbGet('SELECT COUNT(*) as total FROM patients'),
    ]);

    sendSuccess(res, {
      patients,
      pagination: {
        total: totalRow?.total || 0,
        page,
        limit,
        pages: Math.ceil((totalRow?.total || 0) / limit)
      }
    });
  } catch (err) {
    console.error('Patients list error:', err);
    sendError(res, 'Failed to load patients', 500);
  }
});

// ─── GLOBAL ERROR HANDLER ────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  sendError(res, 'Internal server error', 500);
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, error: `Route not found: ${req.method} ${req.path}` });
});

// ─── START SERVER ────────────────────────────────────────────────────────────
initDB()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`\n🏥 MediQueue OPD Backend running`);
      console.log(`📡 Port: ${PORT}`);
      console.log(`🔗 Health: http://localhost:${PORT}/health`);
      console.log(`🌍 Mode: ${process.env.NODE_ENV || 'development'}\n`);
    });
  })
  .catch((err) => {
    console.error('❌ Failed to initialize database:', err);
    process.exit(1);
  });