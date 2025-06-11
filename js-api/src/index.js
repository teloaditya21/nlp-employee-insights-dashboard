import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { sign, verify } from 'hono/jwt';

const app = new Hono();

// Session timeout in milliseconds (1 minute)
const SESSION_TIMEOUT = 60 * 1000;

// Enable CORS for all routes
app.use('*', cors({
  origin: '*',
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
}));

// Root endpoint - API info
app.get('/', (c) => {
  return c.json({
    success: true,
    message: 'Employee Insights API v1.0 - Powered by Hono.js & Cloudflare Workers',
    version: '1.0.0',
    endpoints: {
      'GET /api/insights/summary': 'Get all insights summary',
      'GET /api/insights/dashboard': 'Get dashboard statistics',
      'GET /api/insights/top-positive': 'Get top positive insights',
      'GET /api/insights/top-negative': 'Get top negative insights',
      'GET /api/insights/top-10': 'Get top 10 insights by total_count for sidebar',
      'GET /api/insights/search/:word': 'Search insights by word',
      'GET /api/insights/details/:word': 'Get detailed insights by word from employee_insights table',
      'GET /api/insights/paginated': 'Get insights with pagination',
      'GET /api/employee-insights/paginated': 'Get paginated employee insights for Top Insights page',
      'GET /api/employee-insights/stats': 'Get employee insights statistics for Smart Analytics',
      'GET /api/employee-insights/monthly-trends': 'Get monthly sentiment trends for Smart Analytics',
      'GET /api/bookmarks': 'Get all bookmarked insights',
      'POST /api/bookmarks': 'Add insight to bookmarks',
      'DELETE /api/bookmarks/:id': 'Remove insight from bookmarks',
      'POST /api/export/database-to-r2': 'Export all database tables to R2 as CSV files',
      'GET /api/export/list': 'List all export files in R2 bucket',
      'GET /api/export/download/:date/:filename': 'Download specific export file',
      'DELETE /api/export/delete/:date/:filename?': 'Delete export file or entire date folder',
      'POST /api/chat/ai-search': 'AI-powered chat using Cloudflare RAG system',
      'GET /api/page-context/:sessionId/:page': 'Get current page context summary',
      'POST /api/page-context/update': 'Update page context and generate AI conclusion',
      'POST /api/ai-conclusion/generate': 'Generate AI instant conclusion for current context',
      'POST /api/auth/login': 'User login with session management',
      'POST /api/auth/logout': 'User logout and session cleanup',
      'GET /api/auth/validate': 'Validate current session',
      'POST /api/data/import': 'Import new data from JSON (Admin only)',
      'GET /health': 'Health check'
    }
  });
});

// Helper function to generate session token
function generateSessionToken() {
  return crypto.randomUUID() + '-' + Date.now();
}

// Helper function to clean expired sessions
async function cleanExpiredSessions(db) {
  try {
    const now = new Date().toISOString();
    await db.prepare(`
      DELETE FROM user_sessions
      WHERE expires_at < ?1 OR
            (last_activity < ?2 AND expires_at < ?3)
    `).bind(now, new Date(Date.now() - SESSION_TIMEOUT).toISOString(), now).run();
  } catch (error) {
    console.error('Error cleaning expired sessions:', error);
  }
}

// Helper function to update session activity
async function updateSessionActivity(db, sessionToken) {
  try {
    const now = new Date().toISOString();
    const expiresAt = new Date(Date.now() + SESSION_TIMEOUT).toISOString();

    await db.prepare(`
      UPDATE user_sessions
      SET last_activity = ?1, expires_at = ?2
      WHERE session_token = ?3
    `).bind(now, expiresAt, sessionToken).run();
  } catch (error) {
    console.error('Error updating session activity:', error);
  }
}

// Authentication middleware
async function authMiddleware(c, next) {
  const authHeader = c.req.header('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({ success: false, error: 'No valid authorization header' }, 401);
  }

  const sessionToken = authHeader.substring(7);
  const db = c.env.DB;

  try {
    // Clean expired sessions first
    await cleanExpiredSessions(db);

    // Check if session exists and is valid
    const session = await db.prepare(`
      SELECT s.*, u.username, u.role
      FROM user_sessions s
      JOIN users u ON s.user_id = u.id
      WHERE s.session_token = ?1 AND s.expires_at > ?2
    `).bind(sessionToken, new Date().toISOString()).first();

    if (!session) {
      return c.json({ success: false, error: 'Invalid or expired session' }, 401);
    }

    // Update session activity
    await updateSessionActivity(db, sessionToken);

    // Add user info to context
    c.set('user', {
      id: session.user_id,
      username: session.username,
      role: session.role
    });

    await next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    return c.json({ success: false, error: 'Authentication failed' }, 500);
  }
}

// Login endpoint
app.post('/api/auth/login', async (c) => {
  try {
    const { username, password } = await c.req.json();
    const db = c.env.DB;

    // Clean expired sessions
    await cleanExpiredSessions(db);

    // Find user
    const user = await db.prepare(`
      SELECT id, username, password, role
      FROM users
      WHERE username = ?1
    `).bind(username).first();

    if (!user || user.password !== password) {
      return c.json({
        success: false,
        error: 'Invalid credentials'
      }, 401);
    }

    // Create new session
    const sessionToken = generateSessionToken();
    const expiresAt = new Date(Date.now() + SESSION_TIMEOUT).toISOString();
    const now = new Date().toISOString();

    // Remove any existing sessions for this user
    await db.prepare(`
      DELETE FROM user_sessions WHERE user_id = ?1
    `).bind(user.id).run();

    // Insert new session
    await db.prepare(`
      INSERT INTO user_sessions (user_id, session_token, expires_at, last_activity)
      VALUES (?1, ?2, ?3, ?4)
    `).bind(user.id, sessionToken, expiresAt, now).run();

    return c.json({
      success: true,
      data: {
        user: {
          id: user.id,
          username: user.username,
          role: user.role
        },
        session_token: sessionToken,
        expires_at: expiresAt
      },
      message: 'Login successful'
    });
  } catch (error) {
    console.error('Login error:', error);
    return c.json({
      success: false,
      error: 'Login failed',
      message: error.message
    }, 500);
  }
});

// Logout endpoint
app.post('/api/auth/logout', async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return c.json({ success: false, error: 'No authorization header' }, 400);
    }

    const sessionToken = authHeader.substring(7);
    const db = c.env.DB;

    // Remove session
    await db.prepare(`
      DELETE FROM user_sessions WHERE session_token = ?1
    `).bind(sessionToken).run();

    return c.json({
      success: true,
      message: 'Logout successful'
    });
  } catch (error) {
    console.error('Logout error:', error);
    return c.json({
      success: false,
      error: 'Logout failed',
      message: error.message
    }, 500);
  }
});

// Validate session endpoint
app.get('/api/auth/validate', async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return c.json({ success: false, error: 'No authorization header' }, 401);
    }

    const sessionToken = authHeader.substring(7);
    const db = c.env.DB;

    // Clean expired sessions
    await cleanExpiredSessions(db);

    // Check session
    const session = await db.prepare(`
      SELECT s.*, u.username, u.role
      FROM user_sessions s
      JOIN users u ON s.user_id = u.id
      WHERE s.session_token = ?1 AND s.expires_at > ?2
    `).bind(sessionToken, new Date().toISOString()).first();

    if (!session) {
      return c.json({ success: false, error: 'Invalid or expired session' }, 401);
    }

    // Update session activity
    await updateSessionActivity(db, sessionToken);

    return c.json({
      success: true,
      data: {
        user: {
          id: session.user_id,
          username: session.username,
          role: session.role
        },
        expires_at: session.expires_at
      },
      message: 'Session valid'
    });
  } catch (error) {
    console.error('Session validation error:', error);
    return c.json({
      success: false,
      error: 'Session validation failed',
      message: error.message
    }, 500);
  }
});

// Get all insights summary
app.get('/api/insights/summary', async (c) => {
  try {
    const db = c.env.DB;
    const { results } = await db.prepare(`
      SELECT
        id,
        wordInsight as word_insight,
        total_count,
        positif_count,
        negatif_count,
        netral_count,
        positif_percentage,
        negatif_percentage,
        netral_percentage,
        created_at
      FROM insight_summary
      ORDER BY total_count DESC
    `).all();

    return c.json({
      success: true,
      data: results,
      total: results.length,
      message: 'Successfully retrieved all insights summary'
    });
  } catch (error) {
    console.error('Error fetching insights summary:', error);
    return c.json({
      success: false,
      error: 'Failed to fetch insights summary',
      message: error.message
    }, 500);
  }
});

// Get dashboard statistics
app.get('/api/insights/dashboard', async (c) => {
  try {
    const db = c.env.DB;

    // Get total insights count
    const totalInsightsQuery = await db.prepare('SELECT COUNT(*) as count FROM insight_summary').first();
    const totalInsights = totalInsightsQuery.count;

    // Get total feedback count
    const totalFeedbackQuery = await db.prepare('SELECT SUM(total_count) as total FROM insight_summary').first();
    const totalFeedback = totalFeedbackQuery.total;

    // Get sentiment ratios
    const sentimentQuery = await db.prepare(`
      SELECT
        SUM(positif_count) as total_positive,
        SUM(negatif_count) as total_negative,
        SUM(netral_count) as total_neutral
      FROM insight_summary
    `).first();

    const totalAll = sentimentQuery.total_positive + sentimentQuery.total_negative + sentimentQuery.total_neutral;
    const positiveRatio = Math.round((sentimentQuery.total_positive / totalAll) * 10000) / 100;
    const negativeRatio = Math.round((sentimentQuery.total_negative / totalAll) * 10000) / 100;
    const neutralRatio = Math.round((sentimentQuery.total_neutral / totalAll) * 10000) / 100;

    // Get top positive insights
    const { results: topPositive } = await db.prepare(`
      SELECT
        id, wordInsight as word_insight, total_count, positif_count,
        negatif_count, netral_count, positif_percentage, negatif_percentage,
        netral_percentage, created_at
      FROM insight_summary
      WHERE positif_percentage > 70
      ORDER BY positif_percentage DESC, total_count DESC
      LIMIT 5
    `).all();

    // Get top negative insights
    const { results: topNegative } = await db.prepare(`
      SELECT
        id, wordInsight as word_insight, total_count, positif_count,
        negatif_count, netral_count, positif_percentage, negatif_percentage,
        netral_percentage, created_at
      FROM insight_summary
      WHERE negatif_percentage > 70
      ORDER BY negatif_percentage DESC, total_count DESC
      LIMIT 5
    `).all();

    // Get all insights for charts
    const { results: allInsights } = await db.prepare(`
      SELECT
        id, wordInsight as word_insight, total_count, positif_count,
        negatif_count, netral_count, positif_percentage, negatif_percentage,
        netral_percentage, created_at
      FROM insight_summary
      ORDER BY total_count DESC
    `).all();

    const dashboardData = {
      total_insights: totalInsights,
      total_feedback: totalFeedback,
      positive_ratio: positiveRatio,
      negative_ratio: negativeRatio,
      neutral_ratio: neutralRatio,
      sentiment_distribution: {
        positive: sentimentQuery.total_positive,
        negative: sentimentQuery.total_negative,
        neutral: sentimentQuery.total_neutral
      },
      top_positive_insights: topPositive,
      top_negative_insights: topNegative,
      all_insights: allInsights
    };

    return c.json({
      success: true,
      data: dashboardData,
      message: 'Successfully retrieved dashboard statistics'
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    return c.json({
      success: false,
      error: 'Failed to fetch dashboard statistics',
      message: error.message
    }, 500);
  }
});

// Get top positive insights
app.get('/api/insights/top-positive', async (c) => {
  try {
    const db = c.env.DB;
    const { results } = await db.prepare(`
      SELECT
        id, wordInsight as word_insight, total_count, positif_count,
        negatif_count, netral_count, positif_percentage, negatif_percentage,
        netral_percentage, created_at
      FROM insight_summary
      WHERE positif_percentage > 70
      ORDER BY positif_percentage DESC, total_count DESC
      LIMIT 10
    `).all();

    return c.json({
      success: true,
      data: results,
      total: results.length,
      message: 'Successfully retrieved top positive insights'
    });
  } catch (error) {
    console.error('Error fetching top positive insights:', error);
    return c.json({
      success: false,
      error: 'Failed to fetch top positive insights',
      message: error.message
    }, 500);
  }
});

// Get top negative insights
app.get('/api/insights/top-negative', async (c) => {
  try {
    const db = c.env.DB;
    const { results } = await db.prepare(`
      SELECT
        id, wordInsight as word_insight, total_count, positif_count,
        negatif_count, netral_count, positif_percentage, negatif_percentage,
        netral_percentage, created_at
      FROM insight_summary
      WHERE negatif_percentage > 70
      ORDER BY negatif_percentage DESC, total_count DESC
      LIMIT 10
    `).all();

    return c.json({
      success: true,
      data: results,
      total: results.length,
      message: 'Successfully retrieved top negative insights'
    });
  } catch (error) {
    console.error('Error fetching top negative insights:', error);
    return c.json({
      success: false,
      error: 'Failed to fetch top negative insights',
      message: error.message
    }, 500);
  }
});

// Search insights by word
app.get('/api/insights/search/:word', async (c) => {
  try {
    const word = c.req.param('word');
    const db = c.env.DB;

    const { results } = await db.prepare(`
      SELECT
        id, wordInsight as word_insight, total_count, positif_count,
        negatif_count, netral_count, positif_percentage, negatif_percentage,
        netral_percentage, created_at
      FROM insight_summary
      WHERE wordInsight LIKE ?1
      ORDER BY total_count DESC
    `).bind(`%${word}%`).all();

    return c.json({
      success: true,
      data: results,
      total: results.length,
      search_term: word,
      message: `Successfully found ${results.length} insights for '${word}'`
    });
  } catch (error) {
    console.error('Error searching insights:', error);
    return c.json({
      success: false,
      error: 'Failed to search insights',
      message: error.message
    }, 500);
  }
});

// Get detailed insights by word_insight from employee_insights table
app.get('/api/insights/details/:word', async (c) => {
  try {
    const word = c.req.param('word');
    const limit = parseInt(c.req.query('limit') || '50');
    const dateFrom = c.req.query('dateFrom') || '';
    const dateTo = c.req.query('dateTo') || '';
    const db = c.env.DB;

    // Build WHERE clause for date filtering
    let whereConditions = ['wordInsight = ?1'];
    let bindParams = [word];
    let paramIndex = 2;

    if (dateFrom) {
      whereConditions.push(`date >= ?${paramIndex}`);
      bindParams.push(dateFrom);
      paramIndex++;
    }

    if (dateTo) {
      whereConditions.push(`date <= ?${paramIndex}`);
      bindParams.push(dateTo);
      paramIndex++;
    }

    const whereClause = `WHERE ${whereConditions.join(' AND ')}`;

    const { results } = await db.prepare(`
      SELECT
        id,
        wordInsight,
        sentenceInsight,
        originalInsight,
        employeeName,
        sourceData,
        witel,
        kota,
        sentimen,
        date
      FROM employee_insights
      ${whereClause}
      ORDER BY date DESC
      LIMIT ?${paramIndex}
    `).bind(...bindParams, limit).all();

    // Transform data untuk frontend
    const transformedResults = results.map(item => ({
      id: item.id,
      wordInsight: item.wordInsight,
      sentenceInsight: item.sentenceInsight || 'No sentence insight available',
      originalInsight: item.originalInsight || 'No original insight available',
      employeeName: item.employeeName || 'Anonymous',
      sourceData: item.sourceData || 'N/A',
      witel: item.witel || 'Unknown',
      kota: item.kota || 'Unknown',
      sentimen: item.sentimen || 'netral',
      date: item.date,
      createdAt: item.date
    }));

    return c.json({
      success: true,
      data: transformedResults,
      total: transformedResults.length,
      word_insight: word,
      message: `Successfully retrieved ${transformedResults.length} detailed insights for '${word}'`
    });
  } catch (error) {
    console.error('Error fetching detailed insights:', error);
    return c.json({
      success: false,
      error: 'Failed to fetch detailed insights',
      message: error.message
    }, 500);
  }
});

// Debug endpoint to see table structure
app.get('/api/debug/table-info', async (c) => {
  try {
    const db = c.env.DB;

    // Get table schema
    const { results: tableInfo } = await db.prepare(`
      PRAGMA table_info(employee_insights)
    `).all();

    // Get sample data
    const { results: sampleData } = await db.prepare(`
      SELECT * FROM employee_insights LIMIT 1
    `).all();

    return c.json({
      success: true,
      table_schema: tableInfo,
      sample_data: sampleData[0] || null,
      columns: tableInfo.map(col => col.name)
    });
  } catch (error) {
    console.error('Error getting table info:', error);
    return c.json({
      success: false,
      error: 'Failed to get table info',
      message: error.message
    }, 500);
  }
});

// Get filtered insights summary based on employee_insights data
app.get('/api/insights/filtered', async (c) => {
  try {
    const db = c.env.DB;

    // Filter parameters
    const search = c.req.query('search') || '';
    const sentiment = c.req.query('sentiment') || '';
    const dateFrom = c.req.query('dateFrom') || '';
    const dateTo = c.req.query('dateTo') || '';

    // Build WHERE clause based on filters
    let whereConditions = [];
    let bindParams = [];
    let paramIndex = 1;

    if (search) {
      whereConditions.push(`(sentenceInsight LIKE ?${paramIndex} OR originalInsight LIKE ?${paramIndex} OR wordInsight LIKE ?${paramIndex})`);
      bindParams.push(`%${search}%`);
      paramIndex++;
    }

    if (sentiment && sentiment !== 'all') {
      // Map frontend sentiment values to database values
      const sentimentMap = {
        'positive': 'positif',
        'negative': 'negatif',
        'neutral': 'netral'
      };
      const dbSentiment = sentimentMap[sentiment] || sentiment;
      whereConditions.push(`sentimen = ?${paramIndex}`);
      bindParams.push(dbSentiment);
      paramIndex++;
    }

    if (dateFrom) {
      whereConditions.push(`date >= ?${paramIndex}`);
      bindParams.push(dateFrom);
      paramIndex++;
    }

    if (dateTo) {
      whereConditions.push(`date <= ?${paramIndex}`);
      bindParams.push(dateTo);
      paramIndex++;
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    // Query to get word insights with counts from filtered employee_insights data
    const query = `
      SELECT
        ROW_NUMBER() OVER (ORDER BY COUNT(*) DESC) as id,
        wordInsight as word_insight,
        COUNT(*) as total_count,
        SUM(CASE WHEN sentimen = 'positif' THEN 1 ELSE 0 END) as positif_count,
        SUM(CASE WHEN sentimen = 'negatif' THEN 1 ELSE 0 END) as negatif_count,
        SUM(CASE WHEN sentimen = 'netral' THEN 1 ELSE 0 END) as netral_count,
        ROUND(
          (SUM(CASE WHEN sentimen = 'positif' THEN 1 ELSE 0 END) * 100.0) / COUNT(*),
          2
        ) as positif_percentage,
        ROUND(
          (SUM(CASE WHEN sentimen = 'negatif' THEN 1 ELSE 0 END) * 100.0) / COUNT(*),
          2
        ) as negatif_percentage,
        ROUND(
          (SUM(CASE WHEN sentimen = 'netral' THEN 1 ELSE 0 END) * 100.0) / COUNT(*),
          2
        ) as netral_percentage,
        MAX(date) as created_at
      FROM employee_insights
      ${whereClause}
      GROUP BY wordInsight
      HAVING COUNT(*) > 0
      ORDER BY total_count DESC
    `;

    const { results } = await db.prepare(query).bind(...bindParams).all();

    return c.json({
      success: true,
      data: results,
      total: results.length,
      filters: {
        search,
        sentiment,
        dateFrom,
        dateTo
      },
      message: `Successfully retrieved ${results.length} filtered insights`
    });
  } catch (error) {
    console.error('Error fetching filtered insights:', error);
    return c.json({
      success: false,
      error: 'Failed to fetch filtered insights',
      message: error.message
    }, 500);
  }
});

// Get insights with pagination
app.get('/api/insights/paginated', async (c) => {
  try {
    const page = parseInt(c.req.query('page') || '1');
    const limit = parseInt(c.req.query('limit') || '10');
    const offset = (page - 1) * limit;

    const db = c.env.DB;

    // Get total count
    const totalQuery = await db.prepare('SELECT COUNT(*) as count FROM insight_summary').first();
    const total = totalQuery.count;

    // Get paginated results
    const { results } = await db.prepare(`
      SELECT
        id, wordInsight as word_insight, total_count, positif_count,
        negatif_count, netral_count, positif_percentage, negatif_percentage,
        netral_percentage, created_at
      FROM insight_summary
      ORDER BY total_count DESC
      LIMIT ?1 OFFSET ?2
    `).bind(limit, offset).all();

    const totalPages = Math.ceil(total / limit);

    return c.json({
      success: true,
      data: results,
      pagination: {
        current_page: page,
        per_page: limit,
        total_items: total,
        total_pages: totalPages,
        has_next: page < totalPages,
        has_prev: page > 1
      },
      message: 'Successfully retrieved paginated insights'
    });
  } catch (error) {
    console.error('Error fetching paginated insights:', error);
    return c.json({
      success: false,
      error: 'Failed to fetch paginated insights',
      message: error.message
    }, 500);
  }
});

// Get paginated employee insights for Top Insights page
app.get('/api/employee-insights/paginated', async (c) => {
  try {
    const page = parseInt(c.req.query('page') || '1');
    const limit = parseInt(c.req.query('limit') || '10');
    const offset = (page - 1) * limit;

    // Filter parameters
    const search = c.req.query('search') || '';
    const kota = c.req.query('kota') || '';
    const source = c.req.query('source') || '';
    const dateFrom = c.req.query('dateFrom') || '';
    const dateTo = c.req.query('dateTo') || '';

    const db = c.env.DB;

    // Build WHERE clause based on filters
    let whereConditions = [];
    let bindParams = [];
    let paramIndex = 1;

    if (search) {
      whereConditions.push(`(sentenceInsight LIKE ?${paramIndex} OR originalInsight LIKE ?${paramIndex} OR wordInsight LIKE ?${paramIndex})`);
      bindParams.push(`%${search}%`);
      paramIndex++;
    }

    if (kota) {
      whereConditions.push(`kota = ?${paramIndex}`);
      bindParams.push(kota);
      paramIndex++;
    }

    if (source) {
      whereConditions.push(`sourceData = ?${paramIndex}`);
      bindParams.push(source);
      paramIndex++;
    }

    if (dateFrom) {
      whereConditions.push(`date >= ?${paramIndex}`);
      bindParams.push(dateFrom);
      paramIndex++;
    }

    if (dateTo) {
      whereConditions.push(`date <= ?${paramIndex}`);
      bindParams.push(dateTo);
      paramIndex++;
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    // Get total count with filters
    const countQuery = `SELECT COUNT(*) as count FROM employee_insights ${whereClause}`;
    const totalQuery = await db.prepare(countQuery).bind(...bindParams).first();
    const total = totalQuery.count;

    // Get paginated data with filters
    const dataQuery = `
      SELECT
        id,
        sourceData,
        employeeName,
        date,
        witel,
        kota,
        originalInsight,
        sentenceInsight,
        wordInsight,
        sentimen
      FROM employee_insights
      ${whereClause}
      ORDER BY date DESC
      LIMIT ?${paramIndex} OFFSET ?${paramIndex + 1}
    `;

    const { results } = await db.prepare(dataQuery).bind(...bindParams, limit, offset).all();

    return c.json({
      success: true,
      data: results,
      total: total,
      page: page,
      limit: limit,
      total_pages: Math.ceil(total / limit),
      filters: {
        search,
        kota,
        source,
        dateFrom,
        dateTo
      },
      message: `Successfully retrieved ${results.length} employee insights`
    });
  } catch (error) {
    console.error('Error fetching paginated employee insights:', error);
    return c.json({
      success: false,
      error: 'Failed to fetch employee insights',
      message: error.message
    }, 500);
  }
});

// Get employee insights statistics for Smart Analytics dashboard
app.get('/api/employee-insights/stats', async (c) => {
  try {
    const db = c.env.DB;

    // Get total unique employees count
    const totalEmployeesQuery = await db.prepare(`
      SELECT COUNT(DISTINCT employeeName) as count
      FROM employee_insights
      WHERE employeeName IS NOT NULL AND employeeName != ''
    `).first();
    const totalEmployees = totalEmployeesQuery.count;

    // Get total insights count
    const totalInsightsQuery = await db.prepare('SELECT COUNT(*) as count FROM employee_insights').first();
    const totalInsights = totalInsightsQuery.count;

    // Get sentiment counts
    const sentimentQuery = await db.prepare(`
      SELECT
        SUM(CASE WHEN sentimen = 'positif' THEN 1 ELSE 0 END) as positive_count,
        SUM(CASE WHEN sentimen = 'negatif' THEN 1 ELSE 0 END) as negative_count,
        SUM(CASE WHEN sentimen = 'netral' THEN 1 ELSE 0 END) as neutral_count
      FROM employee_insights
    `).first();

    return c.json({
      success: true,
      data: {
        totalEmployees: totalEmployees,
        totalInsights: totalInsights,
        positiveCount: sentimentQuery.positive_count,
        negativeCount: sentimentQuery.negative_count,
        neutralCount: sentimentQuery.neutral_count
      },
      message: 'Successfully retrieved employee insights statistics'
    });
  } catch (error) {
    console.error('Error fetching employee insights stats:', error);
    return c.json({
      success: false,
      error: 'Failed to fetch employee insights statistics',
      message: error.message
    }, 500);
  }
});

// Get monthly sentiment trends for Smart Analytics
app.get('/api/employee-insights/monthly-trends', async (c) => {
  try {
    const db = c.env.DB;

    // Get monthly sentiment data from employee_insights table
    const { results } = await db.prepare(`
      SELECT
        strftime('%Y-%m', date) as month,
        strftime('%m', date) as month_num,
        CASE strftime('%m', date)
          WHEN '01' THEN 'Jan'
          WHEN '02' THEN 'Feb'
          WHEN '03' THEN 'Mar'
          WHEN '04' THEN 'Apr'
          WHEN '05' THEN 'May'
          WHEN '06' THEN 'Jun'
          WHEN '07' THEN 'Jul'
          WHEN '08' THEN 'Aug'
          WHEN '09' THEN 'Sep'
          WHEN '10' THEN 'Oct'
          WHEN '11' THEN 'Nov'
          WHEN '12' THEN 'Dec'
        END as name,
        SUM(CASE WHEN sentimen = 'positif' THEN 1 ELSE 0 END) as positive,
        SUM(CASE WHEN sentimen = 'negatif' THEN 1 ELSE 0 END) as negative,
        SUM(CASE WHEN sentimen = 'netral' THEN 1 ELSE 0 END) as neutral,
        COUNT(*) as total
      FROM employee_insights
      WHERE date IS NOT NULL
      GROUP BY strftime('%Y-%m', date)
      ORDER BY month DESC
      LIMIT 12
    `).all();

    // Reverse to get chronological order
    const monthlyData = results.reverse();

    return c.json({
      success: true,
      data: monthlyData,
      total: monthlyData.length,
      message: 'Successfully retrieved monthly sentiment trends'
    });
  } catch (error) {
    console.error('Error fetching monthly trends:', error);
    return c.json({
      success: false,
      error: 'Failed to fetch monthly trends',
      message: error.message
    }, 500);
  }
});

// Get kota summary data
app.get('/api/kota-summary', async (c) => {
  try {
    const db = c.env.DB;
    const { results } = await db.prepare(`
      SELECT
        id,
        kota,
        total_count,
        positif_count,
        negatif_count,
        netral_count,
        positif_percentage,
        negatif_percentage,
        netral_percentage,
        created_at,
        updated_at
      FROM kota_summary
      ORDER BY total_count DESC
    `).all();

    return c.json({
      success: true,
      data: results,
      total: results.length,
      message: 'Successfully retrieved kota summary data'
    });
  } catch (error) {
    console.error('Error fetching kota summary:', error);
    return c.json({
      success: false,
      error: 'Failed to fetch kota summary',
      message: error.message
    }, 500);
  }
});

// Get specific kota summary by kota name
app.get('/api/kota-summary/:kota', async (c) => {
  try {
    const kotaName = decodeURIComponent(c.req.param('kota'));
    const db = c.env.DB;

    const result = await db.prepare(`
      SELECT
        id,
        kota,
        total_count,
        positif_count,
        negatif_count,
        netral_count,
        positif_percentage,
        negatif_percentage,
        netral_percentage,
        created_at,
        updated_at
      FROM kota_summary
      WHERE kota = ?1
    `).bind(kotaName).first();

    if (!result) {
      return c.json({
        success: false,
        error: 'Kota not found',
        message: `No summary data found for kota: ${kotaName}`
      }, 404);
    }

    return c.json({
      success: true,
      data: result,
      message: `Successfully retrieved summary for ${kotaName}`
    });
  } catch (error) {
    console.error('Error fetching kota summary:', error);
    return c.json({
      success: false,
      error: 'Failed to fetch kota summary',
      message: error.message
    }, 500);
  }
});

// Refresh kota summary data (recalculate from employee_insights)
app.post('/api/kota-summary/refresh', async (c) => {
  try {
    const db = c.env.DB;

    // Clear existing data
    await db.prepare('DELETE FROM kota_summary').run();

    // Recalculate and insert fresh data
    await db.prepare(`
      INSERT INTO kota_summary (
        kota,
        total_count,
        positif_count,
        negatif_count,
        netral_count,
        positif_percentage,
        negatif_percentage,
        netral_percentage
      )
      SELECT
        kota,
        COUNT(*) as total_count,
        SUM(CASE WHEN sentimen = 'positif' THEN 1 ELSE 0 END) as positif_count,
        SUM(CASE WHEN sentimen = 'negatif' THEN 1 ELSE 0 END) as negatif_count,
        SUM(CASE WHEN sentimen = 'netral' THEN 1 ELSE 0 END) as netral_count,
        ROUND(
          (SUM(CASE WHEN sentimen = 'positif' THEN 1 ELSE 0 END) * 100.0) / COUNT(*),
          2
        ) as positif_percentage,
        ROUND(
          (SUM(CASE WHEN sentimen = 'negatif' THEN 1 ELSE 0 END) * 100.0) / COUNT(*),
          2
        ) as negatif_percentage,
        ROUND(
          (SUM(CASE WHEN sentimen = 'netral' THEN 1 ELSE 0 END) * 100.0) / COUNT(*),
          2
        ) as netral_percentage
      FROM employee_insights
      WHERE kota IS NOT NULL AND kota != ''
      GROUP BY kota
      HAVING COUNT(*) > 0
    `).run();

    // Get the refreshed data count
    const countResult = await db.prepare('SELECT COUNT(*) as count FROM kota_summary').first();

    return c.json({
      success: true,
      message: `Successfully refreshed kota summary data. ${countResult.count} cities processed.`,
      count: countResult.count
    });
  } catch (error) {
    console.error('Error refreshing kota summary:', error);
    return c.json({
      success: false,
      error: 'Failed to refresh kota summary',
      message: error.message
    }, 500);
  }
});

// Get top 10 insights by total_count for sidebar with sentiment
app.get('/api/insights/top-10', async (c) => {
  try {
    const db = c.env.DB;
    const { results } = await db.prepare(`
      SELECT
        id,
        wordInsight as word_insight,
        total_count,
        positif_percentage,
        negatif_percentage,
        netral_percentage,
        CASE
          WHEN positif_percentage > negatif_percentage AND positif_percentage > netral_percentage THEN 'positive'
          WHEN negatif_percentage > positif_percentage AND negatif_percentage > netral_percentage THEN 'negative'
          ELSE 'neutral'
        END as dominant_sentiment
      FROM insight_summary
      ORDER BY total_count DESC
      LIMIT 10
    `).all();

    return c.json({
      success: true,
      data: results,
      total: results.length,
      message: 'Successfully retrieved top 10 insights with sentiment'
    });
  } catch (error) {
    console.error('Error fetching top 10 insights:', error);
    return c.json({
      success: false,
      error: 'Failed to fetch top 10 insights',
      message: error.message
    }, 500);
  }
});

// Get all bookmarked insights
app.get('/api/bookmarks', async (c) => {
  try {
    const db = c.env.DB;
    const { results } = await db.prepare(`
      SELECT
        b.id as bookmark_id,
        b.insight_id,
        b.insight_title,
        b.created_at as bookmarked_at,
        s.wordInsight as word_insight,
        s.total_count,
        s.positif_count,
        s.negatif_count,
        s.netral_count,
        s.positif_percentage,
        s.negatif_percentage,
        s.netral_percentage
      FROM bookmarked_insights b
      LEFT JOIN insight_summary s ON b.insight_title = s.wordInsight
      ORDER BY b.created_at DESC
    `).all();

    return c.json({
      success: true,
      data: results,
      total: results.length,
      message: 'Successfully retrieved bookmarked insights'
    });
  } catch (error) {
    console.error('Error fetching bookmarked insights:', error);
    return c.json({
      success: false,
      error: 'Failed to fetch bookmarked insights',
      message: error.message
    }, 500);
  }
});

// Add insight to bookmarks
app.post('/api/bookmarks', async (c) => {
  try {
    const body = await c.req.json();
    const { insight_id, insight_title } = body;

    if (!insight_id || !insight_title) {
      return c.json({
        success: false,
        error: 'Missing required fields',
        message: 'insight_id and insight_title are required'
      }, 400);
    }

    const db = c.env.DB;

    // Check if already bookmarked
    const existing = await db.prepare(`
      SELECT id FROM bookmarked_insights
      WHERE insight_id = ?1 AND insight_title = ?2
    `).bind(insight_id, insight_title).first();

    if (existing) {
      return c.json({
        success: false,
        error: 'Already bookmarked',
        message: 'This insight is already in your bookmarks'
      }, 409);
    }

    // Add to bookmarks
    const result = await db.prepare(`
      INSERT INTO bookmarked_insights (insight_id, insight_title, created_at)
      VALUES (?1, ?2, datetime('now'))
    `).bind(insight_id, insight_title).run();

    return c.json({
      success: true,
      data: {
        bookmark_id: result.meta.last_row_id,
        insight_id,
        insight_title
      },
      message: 'Successfully added insight to bookmarks'
    });
  } catch (error) {
    console.error('Error adding bookmark:', error);
    return c.json({
      success: false,
      error: 'Failed to add bookmark',
      message: error.message
    }, 500);
  }
});

// Remove insight from bookmarks
app.delete('/api/bookmarks/:id', async (c) => {
  try {
    const bookmarkId = c.req.param('id');
    const db = c.env.DB;

    // Check if bookmark exists
    const existing = await db.prepare(`
      SELECT id FROM bookmarked_insights WHERE id = ?1
    `).bind(bookmarkId).first();

    if (!existing) {
      return c.json({
        success: false,
        error: 'Bookmark not found',
        message: 'The specified bookmark does not exist'
      }, 404);
    }

    // Remove bookmark
    await db.prepare(`
      DELETE FROM bookmarked_insights WHERE id = ?1
    `).bind(bookmarkId).run();

    return c.json({
      success: true,
      message: 'Successfully removed bookmark'
    });
  } catch (error) {
    console.error('Error removing bookmark:', error);
    return c.json({
      success: false,
      error: 'Failed to remove bookmark',
      message: error.message
    }, 500);
  }
});

// Remove bookmark by insight details
app.delete('/api/bookmarks/insight/:insight_id/:insight_title', async (c) => {
  try {
    const insightId = c.req.param('insight_id');
    const insightTitle = decodeURIComponent(c.req.param('insight_title'));
    const db = c.env.DB;

    // Remove bookmark
    const result = await db.prepare(`
      DELETE FROM bookmarked_insights
      WHERE insight_id = ?1 AND insight_title = ?2
    `).bind(insightId, insightTitle).run();

    if (result.meta.changes === 0) {
      return c.json({
        success: false,
        error: 'Bookmark not found',
        message: 'The specified bookmark does not exist'
      }, 404);
    }

    return c.json({
      success: true,
      message: 'Successfully removed bookmark'
    });
  } catch (error) {
    console.error('Error removing bookmark:', error);
    return c.json({
      success: false,
      error: 'Failed to remove bookmark',
      message: error.message
    }, 500);
  }
});

// AI Chat endpoint using Cloudflare AI Search API
app.post('/api/chat/ai-search', async (c) => {
  try {
    const { query } = await c.req.json();

    if (!query || typeof query !== 'string') {
      return c.json({
        success: false,
        error: 'Query is required and must be a string'
      }, 400);
    }

    // Call Cloudflare AI Search API
    const aiResponse = await fetch('https://api.cloudflare.com/client/v4/accounts/bb7aabf4c132ea1f4756e680905b7e85/autorag/rags/chatnlp/ai-search', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer duacGLziNNJVRmd27xIxGWRDL9o5Ui8L239vVWXF',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ query })
    });

    if (!aiResponse.ok) {
      throw new Error(`AI API responded with status: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();

    // Extract the response text more carefully
    let responseText = '';
    if (typeof aiData === 'string') {
      responseText = aiData;
    } else if (aiData && typeof aiData === 'object') {
      // Check if it's the nested structure from Cloudflare AI API
      if (aiData.result && aiData.result.response) {
        responseText = aiData.result.response;
      } else {
        // Try other possible response fields
        responseText = aiData.response || aiData.result || aiData.answer || aiData.text || '';
      }

      // If still no response, check if it's the full AutoRagAiSearchResponse object
      if (!responseText && (aiData.data || (aiData.result && aiData.result.data))) {
        responseText = 'Maaf, saya tidak dapat memproses pertanyaan Anda saat ini.';
      }
    }

    // Ensure we always return a string
    if (!responseText || typeof responseText !== 'string') {
      responseText = 'Maaf, saya tidak dapat memproses pertanyaan Anda saat ini.';
    }

    return c.json({
      success: true,
      response: responseText,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('AI Search error:', error);

    // Fallback response for errors
    const fallbackResponses = [
      "Maaf, terjadi gangguan pada sistem AI. Silakan coba lagi dalam beberapa saat.",
      "Sistem sedang mengalami kendala teknis. Tim kami sedang memperbaikinya.",
      "Koneksi ke AI assistant terputus. Mohon coba kembali nanti."
    ];

    const fallbackResponse = fallbackResponses[Math.floor(Math.random() * fallbackResponses.length)];

    return c.json({
      success: false,
      response: fallbackResponse,
      error: error.message,
      timestamp: new Date().toISOString()
    }, 500);
  }
});

// Get current page context summary
app.get('/api/page-context/:sessionId/:page', async (c) => {
  try {
    const sessionId = c.req.param('sessionId') || 'default_session';
    const page = c.req.param('page');
    const db = c.env.DB;

    // Validate page parameter
    const validPages = ['survey-dashboard', 'top-insights', 'smart-analytics'];
    if (!validPages.includes(page)) {
      return c.json({
        success: false,
        error: 'Invalid page',
        message: `Page must be one of: ${validPages.join(', ')}`
      }, 400);
    }

    // Get page context from database
    const result = await db.prepare(`
      SELECT
        id,
        user_session_id,
        current_page,
        active_filters,
        displayed_data,
        total_insights,
        positive_count,
        negative_count,
        neutral_count,
        top_keywords,
        date_range,
        location_filter,
        source_filter,
        ai_conclusion,
        ai_conclusion_generated_at,
        created_at,
        updated_at
      FROM page_context_summary
      WHERE user_session_id = ?1 AND current_page = ?2
    `).bind(sessionId, page).first();

    if (!result) {
      // Return default context if not found
      return c.json({
        success: true,
        data: {
          user_session_id: sessionId,
          current_page: page,
          active_filters: '{}',
          displayed_data: '{}',
          total_insights: 0,
          positive_count: 0,
          negative_count: 0,
          neutral_count: 0,
          top_keywords: '[]',
          date_range: 'All Time',
          location_filter: 'All Cities',
          source_filter: 'All Sources',
          ai_conclusion: null,
          ai_conclusion_generated_at: null
        },
        message: 'No context found, returning default values'
      });
    }

    // Parse JSON fields
    try {
      result.active_filters = JSON.parse(result.active_filters || '{}');
      result.displayed_data = JSON.parse(result.displayed_data || '{}');
      result.top_keywords = JSON.parse(result.top_keywords || '[]');
    } catch (parseError) {
      console.error('Error parsing JSON fields:', parseError);
    }

    return c.json({
      success: true,
      data: result,
      message: 'Successfully retrieved page context'
    });
  } catch (error) {
    console.error('Error fetching page context:', error);
    return c.json({
      success: false,
      error: 'Failed to fetch page context',
      message: error.message
    }, 500);
  }
});

// Update page context and optionally generate AI conclusion
app.post('/api/page-context/update', async (c) => {
  try {
    const body = await c.req.json();
    const {
      user_session_id = 'default_session',
      current_page,
      active_filters = {},
      displayed_data = {},
      total_insights = 0,
      positive_count = 0,
      negative_count = 0,
      neutral_count = 0,
      top_keywords = [],
      date_range = 'All Time',
      location_filter = 'All Cities',
      source_filter = 'All Sources',
      generate_ai_conclusion = false
    } = body;

    const db = c.env.DB;

    // Validate required fields
    if (!current_page) {
      return c.json({
        success: false,
        error: 'Missing required field',
        message: 'current_page is required'
      }, 400);
    }

    // Validate page parameter
    const validPages = ['survey-dashboard', 'top-insights', 'smart-analytics'];
    if (!validPages.includes(current_page)) {
      return c.json({
        success: false,
        error: 'Invalid page',
        message: `Page must be one of: ${validPages.join(', ')}`
      }, 400);
    }

    // Prepare JSON strings
    const activeFiltersJson = JSON.stringify(active_filters);
    const displayedDataJson = JSON.stringify(displayed_data);
    const topKeywordsJson = JSON.stringify(top_keywords);

    // Insert or update page context
    const result = await db.prepare(`
      INSERT OR REPLACE INTO page_context_summary (
        user_session_id,
        current_page,
        active_filters,
        displayed_data,
        total_insights,
        positive_count,
        negative_count,
        neutral_count,
        top_keywords,
        date_range,
        location_filter,
        source_filter,
        updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
    `).bind(
      user_session_id,
      current_page,
      activeFiltersJson,
      displayedDataJson,
      total_insights,
      positive_count,
      negative_count,
      neutral_count,
      topKeywordsJson,
      date_range,
      location_filter,
      source_filter
    ).run();

    let aiConclusion = null;
    let aiConclusionGeneratedAt = null;

    // Generate AI conclusion if requested
    if (generate_ai_conclusion) {
      try {
        const contextSummary = {
          page: current_page,
          total_insights,
          positive_count,
          negative_count,
          neutral_count,
          top_keywords,
          filters: {
            date_range,
            location_filter,
            source_filter,
            active_filters
          }
        };

        aiConclusion = await generateAIConclusion(c.env, contextSummary);
        aiConclusionGeneratedAt = new Date().toISOString();

        // Update the record with AI conclusion
        await db.prepare(`
          UPDATE page_context_summary
          SET ai_conclusion = ?, ai_conclusion_generated_at = ?
          WHERE user_session_id = ? AND current_page = ?
        `).bind(aiConclusion, aiConclusionGeneratedAt, user_session_id, current_page).run();

      } catch (aiError) {
        console.error('Error generating AI conclusion:', aiError);
        // Continue without AI conclusion
      }
    }

    return c.json({
      success: true,
      data: {
        id: result.meta.last_row_id,
        user_session_id,
        current_page,
        active_filters,
        displayed_data,
        total_insights,
        positive_count,
        negative_count,
        neutral_count,
        top_keywords,
        date_range,
        location_filter,
        source_filter,
        ai_conclusion: aiConclusion,
        ai_conclusion_generated_at: aiConclusionGeneratedAt
      },
      message: 'Successfully updated page context' + (aiConclusion ? ' with AI conclusion' : '')
    });
  } catch (error) {
    console.error('Error updating page context:', error);
    return c.json({
      success: false,
      error: 'Failed to update page context',
      message: error.message
    }, 500);
  }
});


// Generate AI instant conclusion for current context
app.post('/api/ai-conclusion/generate', async (c) => {
  try {
    const body = await c.req.json();
    const {
      user_session_id = 'default_session',
      current_page,
      context_summary
    } = body;

    if (!current_page || !context_summary) {
      return c.json({
        success: false,
        error: 'Missing required fields',
        message: 'current_page and context_summary are required'
      }, 400);
    }

    const db = c.env.DB;

    // Generate AI conclusion
    const aiConclusion = await generateAIConclusion(c.env, context_summary);
    const aiConclusionGeneratedAt = new Date().toISOString();

    // Update the page context with AI conclusion
    await db.prepare(`
      UPDATE page_context_summary
      SET ai_conclusion = ?, ai_conclusion_generated_at = ?
      WHERE user_session_id = ? AND current_page = ?
    `).bind(aiConclusion, aiConclusionGeneratedAt, user_session_id, current_page).run();

    return c.json({
      success: true,
      data: {
        ai_conclusion: aiConclusion,
        ai_conclusion_generated_at: aiConclusionGeneratedAt,
        user_session_id,
        current_page
      },
      message: 'Successfully generated AI conclusion'
    });
  } catch (error) {
    console.error('Error generating AI conclusion:', error);
    return c.json({
      success: false,
      error: 'Failed to generate AI conclusion',
      message: error.message
    }, 500);
  }
});

// Helper function to generate AI conclusion using Cloudflare AI Worker
async function generateAIConclusion(env, contextSummary) {
  try {
    const {
      page,
      total_insights,
      positive_count,
      negative_count,
      neutral_count,
      top_keywords,
      filters
    } = contextSummary;

    // Calculate percentages
    const positivePercentage = total_insights > 0 ? Math.round((positive_count / total_insights) * 100) : 0;
    const negativePercentage = total_insights > 0 ? Math.round((negative_count / total_insights) * 100) : 0;
    const neutralPercentage = total_insights > 0 ? Math.round((neutral_count / total_insights) * 100) : 0;

    // Create context-aware prompt based on page
    let prompt = '';

    if (page === 'survey-dashboard') {
      // Extract active filter descriptions for more contextual analysis
      const activeFilters = filters.active_filters?.activeFilterDescriptions || [];
      const filterContext = activeFilters.length > 0 ? `Filter aktif: ${activeFilters.join(', ')}` : 'Menampilkan semua data';

      prompt = `Sebagai AI analyst senior, berikan analisis komprehensif dan mendalam berdasarkan data survey dashboard yang sedang ditampilkan:

Data Summary:
- Total Insights: ${total_insights}
- Sentimen Positif: ${positive_count} (${positivePercentage}%)
- Sentimen Negatif: ${negative_count} (${negativePercentage}%)
- Sentimen Netral: ${neutral_count} (${neutralPercentage}%)
- Top Keywords: ${top_keywords.slice(0, 5).join(', ')}
- ${filterContext}
- Periode: ${filters.date_range}

${activeFilters.length > 0 ?
  `Analisis ini berdasarkan data yang telah difilter. Berikan insight mendalam tentang hasil filter ini.` :
  `Analisis ini berdasarkan keseluruhan data survey dashboard.`}

Berikan analisis PANJANG dalam 3 bagian:

**SUMMARY EKSEKUTIF:**
Ringkasan kondisi sentimen karyawan, distribusi feedback, dan tren utama. Jelaskan persentase sentimen dan dampaknya pada organisasi. Minimal 4-5 kalimat.

**ANALISIS MENDALAM:**
Pola sentimen, korelasi keywords, dan insight strategis. Identifikasi area yang perlu perhatian dan yang sudah baik. Root cause sentimen negatif dan faktor positif. Minimal 5-6 kalimat.

**UPAYA PENGEMBANGAN:**
Rekomendasi actionable, langkah konkret, timeline, dan KPI. Prioritas tindakan dan strategi jangka panjang. Framework monitoring. Minimal 5-6 kalimat.

PENTING: Tulis minimal 15 kalimat total. Gunakan bahasa Indonesia yang jelas dan profesional.`;
    } else if (page === 'top-insights') {
      // Extract active filter descriptions for more contextual analysis
      const activeFilters = filters.active_filters?.activeFilterDescriptions || [];
      const filterContext = activeFilters.length > 0 ? `Filter aktif: ${activeFilters.join(', ')}` : 'Menampilkan semua data';

      prompt = `Sebagai AI analyst senior, berikan analisis komprehensif untuk halaman Top Insights berdasarkan data yang sedang ditampilkan:

Data Summary:
- Total Insights: ${total_insights}
- Sentimen Positif: ${positive_count} (${positivePercentage}%)
- Sentimen Negatif: ${negative_count} (${negativePercentage}%)
- Sentimen Netral: ${neutral_count} (${neutralPercentage}%)
- Top Keywords: ${top_keywords.slice(0, 5).join(', ')}
- ${filterContext}
- Periode: ${filters.date_range}

${activeFilters.length > 0 ?
  `Analisis ini berdasarkan data yang telah difilter. Berikan insight mendalam dari hasil filter.` :
  `Analisis ini berdasarkan keseluruhan data top insights.`}

WAJIB berikan analisis dalam format paragraf PANJANG dan KOMPREHENSIF yang mencakup:

**SUMMARY EKSEKUTIF:**
Berikan ringkasan komprehensif tentang insights terpenting yang teridentifikasi, distribusi geografis feedback, dan tren sentimen utama dari data yang ditampilkan. Jelaskan secara detail karakteristik data yang sedang dianalisis, signifikansi dari distribusi geografis, dan implikasi dari pola sentimen yang teridentifikasi. Sertakan analisis tentang representativitas data dan tingkat confidence dari temuan yang dihasilkan. Minimal 4-5 kalimat yang menjelaskan landscape insights secara menyeluruh.

**ANALISIS MENDALAM:**
Jelaskan secara detail dan mendalam keyword dan insight yang paling menonjol, pola sentimen berdasarkan lokasi dan sumber data, serta korelasi antar variabel. Identifikasi area kritis yang memerlukan perhatian segera dan area yang menunjukkan performa positif. Analisis harus mencakup deep dive ke dalam faktor-faktor yang mempengaruhi variasi sentimen antar lokasi, kredibilitas sumber data, dan trend analysis dari perspektif temporal. Berikan interpretasi tentang underlying factors yang menyebabkan perbedaan performa antar region dan implikasinya untuk strategic decision making. Minimal 5-6 kalimat yang memberikan insight mendalam dan actionable.

**UPAYA PENGEMBANGAN:**
Berikan rekomendasi strategis yang actionable untuk setiap area yang teridentifikasi, langkah-langkah konkret untuk mengatasi isu negatif, dan inisiatif untuk mempertahankan atau meningkatkan aspek positif. Sertakan prioritas implementasi berdasarkan urgency dan impact, resource allocation strategy, dan framework untuk measuring success. Jelaskan best practices yang dapat diadopsi dari area dengan performa terbaik, risk mitigation strategy, dan sustainable improvement roadmap. Berikan juga recommendation untuk data collection enhancement dan feedback loop optimization. Minimal 5-6 kalimat yang memberikan comprehensive action plan.

PENTING: Tulis dalam paragraf yang mengalir natural, informatif, dan profesional. Gunakan bahasa Indonesia yang formal namun mudah dipahami. PASTIKAN output minimal 15-20 kalimat total dengan detail yang komprehensif.`;
    } else if (page === 'smart-analytics') {
      // Extract active filter descriptions for more contextual analysis
      const activeFilters = filters.active_filters?.activeFilterDescriptions || [];
      const filterContext = activeFilters.length > 0 ? `Filter aktif: ${activeFilters.join(', ')}` : 'Menampilkan semua data';

      prompt = `Sebagai AI analyst senior, berikan analisis komprehensif dan strategis untuk Smart Analytics berdasarkan data yang sedang ditampilkan:

Data Summary:
- Total Insights: ${total_insights}
- Sentimen Positif: ${positive_count} (${positivePercentage}%)
- Sentimen Negatif: ${negative_count} (${negativePercentage}%)
- Sentimen Netral: ${neutral_count} (${neutralPercentage}%)
- Top Keywords: ${top_keywords.slice(0, 5).join(', ')}
- ${filterContext}
- Periode: ${filters.date_range}

${activeFilters.length > 0 ?
  `Analisis ini berdasarkan data yang telah difilter. Berikan insight analitik mendalam dari hasil filter.` :
  `Analisis ini berdasarkan keseluruhan data smart analytics.`}

WAJIB berikan analisis dalam format paragraf PANJANG dan KOMPREHENSIF yang mencakup:

**SUMMARY EKSEKUTIF:**
Berikan ringkasan komprehensif tentang kondisi analitik organisasi saat ini, tren sentimen karyawan, dan pola distribusi feedback berdasarkan witel dan sumber data yang ditampilkan. Jelaskan secara detail karakteristik data analytics yang sedang dianalisis, signifikansi dari distribusi antar witel, dan implikasi strategis dari pola yang teridentifikasi. Sertakan analisis tentang maturity level analytics capability organisasi dan tingkat data-driven decision making yang sudah tercapai. Berikan juga assessment tentang quality dan completeness dari data yang tersedia. Minimal 4-5 kalimat yang menjelaskan current state analytics landscape secara menyeluruh.

**ANALISIS MENDALAM:**
Jelaskan secara detail dan mendalam tren dan pola utama yang teridentifikasi, korelasi antar variabel (witel, sumber, waktu), insight strategis dari data, dan analisis prediktif untuk periode mendatang. Identifikasi area dengan performa terbaik dan area yang memerlukan intervensi segera. Analisis harus mencakup deep dive ke dalam performance variance antar witel, effectiveness dari berbagai sumber data, dan temporal patterns yang mengindikasikan seasonal atau cyclical trends. Berikan interpretasi tentang underlying business drivers yang mempengaruhi variasi performa, competitive positioning antar witel, dan strategic implications untuk resource allocation. Sertakan juga predictive insights tentang potential risks dan opportunities berdasarkan current trajectory. Minimal 6-7 kalimat yang memberikan comprehensive analytical insights.

**UPAYA PENGEMBANGAN:**
Berikan rekomendasi strategis yang actionable dan terukur, roadmap pengembangan jangka pendek dan menengah, inisiatif inovasi untuk meningkatkan engagement karyawan, dan strategi mitigasi risiko berdasarkan temuan analitik. Sertakan detailed implementation plan dengan timeline, budget considerations, dan success metrics. Jelaskan capability building requirements, technology infrastructure needs, dan change management strategy. Berikan juga framework untuk continuous improvement, data governance enhancement, dan analytics maturity progression. Sertakan recommendation untuk cross-witel knowledge sharing, best practice standardization, dan innovation incubation programs. Minimal 6-7 kalimat yang memberikan comprehensive development roadmap.

PENTING: Tulis dalam paragraf yang mengalir natural, informatif, dan profesional dengan pendekatan analitik yang mendalam. Gunakan bahasa Indonesia yang formal namun mudah dipahami. PASTIKAN output minimal 17-22 kalimat total dengan detail yang sangat komprehensif.`;
    }

    console.log('=== AI CONCLUSION DEBUG ===');
    console.log('Prompt being sent to AI:', prompt.substring(0, 500) + '...');
    console.log('Max tokens:', 2000);
    console.log('Temperature:', 0.8);

    // Call Cloudflare AI Worker with Llama model
    const aiResponse = await env.AI.run('@cf/meta/llama-3.1-8b-instruct', {
      messages: [
        {
          role: 'system',
          content: 'Anda adalah AI analyst yang ahli menganalisis data sentimen. Berikan analisis yang PANJANG dan DETAIL dalam bahasa Indonesia. WAJIB tulis minimal 10-15 kalimat dengan 3 bagian: Summary Eksekutif, Analisis Mendalam, dan Upaya Pengembangan. Jangan berikan jawaban singkat.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: 2000,
      temperature: 0.8
    });

    console.log('Raw AI Response:', JSON.stringify(aiResponse, null, 2));

    // Extract response text
    let conclusion = '';
    if (aiResponse && aiResponse.response) {
      conclusion = aiResponse.response.trim();
      console.log('Extracted conclusion from aiResponse.response:', conclusion.length, 'characters');
    } else if (typeof aiResponse === 'string') {
      conclusion = aiResponse.trim();
      console.log('Extracted conclusion from string response:', conclusion.length, 'characters');
    } else if (aiResponse && aiResponse.result && aiResponse.result.response) {
      conclusion = aiResponse.result.response.trim();
      console.log('Extracted conclusion from aiResponse.result.response:', conclusion.length, 'characters');
    } else {
      console.error('Unexpected AI response format:', aiResponse);
      console.log('AI Response type:', typeof aiResponse);
      console.log('AI Response keys:', aiResponse ? Object.keys(aiResponse) : 'null');
      throw new Error('Invalid AI response format');
    }

    // Ensure conclusion has reasonable length and is not truncated
    console.log('Final conclusion length before fallback check:', conclusion.length);
    console.log('Conclusion preview:', conclusion.substring(0, 200) + '...');

    if (!conclusion || conclusion.length < 200) {
      console.warn('AI response too short, using comprehensive fallback. Length:', conclusion.length);
      console.warn('Short conclusion content:', conclusion);

      // Create comprehensive fallback conclusion
      const dominantSentiment = positivePercentage > negativePercentage && positivePercentage > neutralPercentage ? 'positif' :
                               negativePercentage > positivePercentage && negativePercentage > neutralPercentage ? 'negatif' : 'netral';

      const sentimentAnalysis = dominantSentiment === 'positif' ?
        'kondisi yang cukup baik dalam organisasi dengan momentum positif yang perlu dipertahankan dan ditingkatkan' :
        dominantSentiment === 'negatif' ?
        'adanya area kritis yang memerlukan perhatian segera dan intervensi sistematis untuk mencegah deteriorasi lebih lanjut' :
        'kondisi yang stabil namun memerlukan stimulasi strategis untuk peningkatan engagement dan transformasi menuju excellence';

      const keywordInsight = top_keywords && top_keywords.length > 0 ?
        `Keyword utama yang muncul meliputi ${top_keywords.slice(0, 5).join(', ')}, yang mengindikasikan fokus utama perhatian karyawan dan area-area yang memerlukan prioritas dalam pengembangan strategi organisasi.` :
        'Analisis keyword menunjukkan distribusi topik yang beragam dengan pola yang memerlukan investigasi lebih mendalam untuk mengidentifikasi tema-tema strategis.';

      const urgencyLevel = negativePercentage > 40 ? 'tinggi' : negativePercentage > 25 ? 'sedang' : 'rendah';
      const actionPriority = negativePercentage > 40 ?
        'immediate action dengan fokus pada crisis management dan damage control' :
        negativePercentage > 25 ?
        'structured improvement program dengan timeline yang jelas' :
        'continuous enhancement dengan fokus pada optimization dan innovation';

      conclusion = `**SUMMARY EKSEKUTIF:** Berdasarkan analisis komprehensif terhadap ${total_insights} insights yang tersedia, distribusi sentimen menunjukkan ${positivePercentage}% feedback positif, ${negativePercentage}% negatif, dan ${neutralPercentage}% netral. Sentimen ${dominantSentiment} menjadi dominan dalam periode analisis ini, mengindikasikan ${sentimentAnalysis}. Data ini memberikan gambaran yang jelas tentang current state organisasi dan menjadi foundation untuk strategic decision making. Tingkat urgency untuk tindakan perbaikan dikategorikan sebagai ${urgencyLevel} berdasarkan distribusi sentimen yang teridentifikasi. Analisis ini juga mengungkapkan pola-pola penting yang dapat menjadi early warning indicators untuk trend masa depan.

**ANALISIS MENDALAM:** Pola sentimen yang teridentifikasi menunjukkan ${negativePercentage > 30 ? 'tingkat ketidakpuasan yang signifikan yang perlu ditangani secara sistematis dengan pendekatan multi-dimensional' : 'tingkat kepuasan yang relatif stabil namun dengan potensi improvement yang dapat dioptimalkan'}. ${keywordInsight} Distribusi sentimen ini mengindikasikan adanya gap antara expectation dan reality dalam beberapa aspek organisasi yang memerlukan root cause analysis mendalam. Area yang memerlukan perhatian khusus adalah ${negativePercentage > positivePercentage ? 'identifikasi dan mitigasi faktor-faktor yang menyebabkan feedback negatif, termasuk systemic issues dan cultural barriers' : 'mempertahankan dan scaling up momentum positif yang sudah terbangun sambil addressing remaining pain points'}. Analisis temporal menunjukkan ${negativePercentage > 35 ? 'trend yang concerning dan memerlukan immediate intervention' : 'stabilitas yang dapat dijadikan foundation untuk growth initiatives'}. Korelasi antar variabel mengungkapkan interdependencies yang kompleks antara berbagai faktor organisasi.

**UPAYA PENGEMBANGAN:** Rekomendasi strategis yang dapat diimplementasikan meliputi ${negativePercentage > 30 ? 'comprehensive transformation program dengan fokus pada systematic issue resolution, cultural change management, dan implementation feedback loop yang robust untuk memastikan sustainable improvement' : 'strategic enhancement program dengan fokus pada employee engagement optimization, innovation incubation, dan best practice standardization untuk mencapai organizational excellence'}. Langkah konkret yang dapat diambil adalah melakukan deep dive analysis pada area dengan sentimen negatif tinggi, mengembangkan action plan yang terukur dengan clear KPIs dan milestones, dan membangun sistem monitoring real-time untuk memastikan efektivitas intervensi yang dilakukan. Priority matrix harus dikembangkan berdasarkan ${actionPriority} dengan resource allocation yang optimal. Framework untuk continuous improvement harus diestablish dengan regular review cycles dan adaptive strategy adjustment. Implementation roadmap harus mencakup quick wins untuk immediate impact dan long-term initiatives untuk sustainable transformation. Change management strategy harus comprehensive dengan stakeholder engagement yang proactive dan communication plan yang transparent untuk memastikan buy-in dari seluruh level organisasi.`;
    }

    // Clean up any incomplete sentences at the end if text appears truncated
    if (conclusion.length > 30) {
      // Check if text ends properly
      if (!conclusion.match(/[.!?]$/)) {
        // Find the last complete sentence
        const lastPunctuation = Math.max(
          conclusion.lastIndexOf('.'),
          conclusion.lastIndexOf('!'),
          conclusion.lastIndexOf('?')
        );

        if (lastPunctuation > conclusion.length * 0.6) {
          // If we found punctuation in the last 40% of text, truncate there
          conclusion = conclusion.substring(0, lastPunctuation + 1);
        } else {
          // Otherwise add a period to make it complete
          conclusion = conclusion.trim() + '.';
        }
      }

      // Remove any incomplete words at the end
      const words = conclusion.split(' ');
      const lastWord = words[words.length - 1];

      // If last word doesn't end with punctuation and seems incomplete (very short or has special chars)
      if (lastWord && lastWord.length < 3 && !lastWord.match(/[.!?]$/)) {
        words.pop(); // Remove the incomplete word
        conclusion = words.join(' ');
        if (!conclusion.match(/[.!?]$/)) {
          conclusion += '.';
        }
      }
    }

    console.log('=== FINAL AI CONCLUSION ===');
    console.log('Final conclusion length:', conclusion.length);
    console.log('Final conclusion preview:', conclusion.substring(0, 300) + '...');
    console.log('=== END DEBUG ===');

    return conclusion;
  } catch (error) {
    console.error('Error in generateAIConclusion:', error);

    // Comprehensive fallback conclusion for error cases
    const { total_insights, positive_count, negative_count, neutral_count, top_keywords } = contextSummary;
    const positivePercentage = total_insights > 0 ? Math.round((positive_count / total_insights) * 100) : 0;
    const negativePercentage = total_insights > 0 ? Math.round((negative_count / total_insights) * 100) : 0;
    const neutralPercentage = total_insights > 0 ? Math.round((neutral_count / total_insights) * 100) : 0;

    const dominantSentiment = positivePercentage > negativePercentage && positivePercentage > neutralPercentage ? 'positif' :
                             negativePercentage > positivePercentage && negativePercentage > neutralPercentage ? 'negatif' : 'netral';

    const sentimentAnalysis = dominantSentiment === 'positif' ?
      'kondisi yang cukup baik dalam organisasi dengan momentum positif yang perlu dipertahankan dan ditingkatkan' :
      dominantSentiment === 'negatif' ?
      'adanya area kritis yang memerlukan perhatian segera dan intervensi sistematis untuk mencegah deteriorasi lebih lanjut' :
      'kondisi yang stabil namun memerlukan stimulasi strategis untuk peningkatan engagement dan transformasi menuju excellence';

    const keywordInsight = top_keywords && top_keywords.length > 0 ?
      `Keyword utama yang muncul meliputi ${top_keywords.slice(0, 5).join(', ')}, yang mengindikasikan fokus utama perhatian karyawan dan area-area yang memerlukan prioritas dalam pengembangan strategi organisasi.` :
      'Analisis keyword menunjukkan distribusi topik yang beragam dengan pola yang memerlukan investigasi lebih mendalam untuk mengidentifikasi tema-tema strategis.';

    const urgencyLevel = negativePercentage > 40 ? 'tinggi' : negativePercentage > 25 ? 'sedang' : 'rendah';
    const actionPriority = negativePercentage > 40 ?
      'immediate action dengan fokus pada crisis management dan damage control' :
      negativePercentage > 25 ?
      'structured improvement program dengan timeline yang jelas' :
      'continuous enhancement dengan fokus pada optimization dan innovation';

    return `**SUMMARY EKSEKUTIF:** Berdasarkan analisis komprehensif terhadap ${total_insights} insights yang tersedia, distribusi sentimen menunjukkan ${positivePercentage}% feedback positif, ${negativePercentage}% negatif, dan ${neutralPercentage}% netral. Sentimen ${dominantSentiment} menjadi dominan dalam periode analisis ini, mengindikasikan ${sentimentAnalysis}. Data ini memberikan gambaran yang jelas tentang current state organisasi dan menjadi foundation untuk strategic decision making. Tingkat urgency untuk tindakan perbaikan dikategorikan sebagai ${urgencyLevel} berdasarkan distribusi sentimen yang teridentifikasi. Analisis ini juga mengungkapkan pola-pola penting yang dapat menjadi early warning indicators untuk trend masa depan.

**ANALISIS MENDALAM:** Pola sentimen yang teridentifikasi menunjukkan ${negativePercentage > 30 ? 'tingkat ketidakpuasan yang signifikan yang perlu ditangani secara sistematis dengan pendekatan multi-dimensional' : 'tingkat kepuasan yang relatif stabil namun dengan potensi improvement yang dapat dioptimalkan'}. ${keywordInsight} Distribusi sentimen ini mengindikasikan adanya gap antara expectation dan reality dalam beberapa aspek organisasi yang memerlukan root cause analysis mendalam. Area yang memerlukan perhatian khusus adalah ${negativePercentage > positivePercentage ? 'identifikasi dan mitigasi faktor-faktor yang menyebabkan feedback negatif, termasuk systemic issues dan cultural barriers' : 'mempertahankan dan scaling up momentum positif yang sudah terbangun sambil addressing remaining pain points'}. Analisis temporal menunjukkan ${negativePercentage > 35 ? 'trend yang concerning dan memerlukan immediate intervention' : 'stabilitas yang dapat dijadikan foundation untuk growth initiatives'}. Korelasi antar variabel mengungkapkan interdependencies yang kompleks antara berbagai faktor organisasi.

**UPAYA PENGEMBANGAN:** Rekomendasi strategis yang dapat diimplementasikan meliputi ${negativePercentage > 30 ? 'comprehensive transformation program dengan fokus pada systematic issue resolution, cultural change management, dan implementation feedback loop yang robust untuk memastikan sustainable improvement' : 'strategic enhancement program dengan fokus pada employee engagement optimization, innovation incubation, dan best practice standardization untuk mencapai organizational excellence'}. Langkah konkret yang dapat diambil adalah melakukan deep dive analysis pada area dengan sentimen negatif tinggi, mengembangkan action plan yang terukur dengan clear KPIs dan milestones, dan membangun sistem monitoring real-time untuk memastikan efektivitas intervensi yang dilakukan. Priority matrix harus dikembangkan berdasarkan ${actionPriority} dengan resource allocation yang optimal. Framework untuk continuous improvement harus diestablish dengan regular review cycles dan adaptive strategy adjustment. Implementation roadmap harus mencakup quick wins untuk immediate impact dan long-term initiatives untuk sustainable transformation. Change management strategy harus comprehensive dengan stakeholder engagement yang proactive dan communication plan yang transparent untuk memastikan buy-in dari seluruh level organisasi.`;
  }
}

// Helper function to escape CSV values
function escapeCSVValue(value) {
  if (value === null || value === undefined) {
    return '';
  }

  const stringValue = String(value);

  // If the value contains comma, newline, or double quote, wrap it in quotes
  if (stringValue.includes(',') || stringValue.includes('\n') || stringValue.includes('\r') || stringValue.includes('"')) {
    // Escape any existing double quotes by doubling them
    const escapedValue = stringValue.replace(/"/g, '""');
    return `"${escapedValue}"`;
  }

  return stringValue;
}

// Helper function to convert array of objects to CSV
function arrayToCSV(data, headers) {
  if (!data || data.length === 0) {
    return headers.join(',') + '\n';
  }

  // Create header row
  const csvRows = [headers.join(',')];

  // Create data rows
  for (const row of data) {
    const values = headers.map(header => escapeCSVValue(row[header]));
    csvRows.push(values.join(','));
  }

  return csvRows.join('\n');
}

// Helper function to get current timestamp for filename
function getTimestamp() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');

  return `${year}-${month}-${day}_${hours}-${minutes}-${seconds}`;
}

// Export all database tables to R2 as CSV files
app.post('/api/export/database-to-r2', async (c) => {
  try {
    const db = c.env.DB;
    const r2 = c.env.R2_BUCKET;

    if (!r2) {
      return c.json({
        success: false,
        error: 'R2 bucket not configured',
        message: 'R2_BUCKET binding is not available'
      }, 500);
    }

    const timestamp = getTimestamp();
    const exportDate = timestamp.split('_')[0]; // YYYY-MM-DD
    const folderPath = `exports/${exportDate}`;

    const exportResults = [];
    const errors = [];

    // Define tables to export with their configurations
    const tablesToExport = [
      {
        name: 'insight_summary',
        query: `
          SELECT
            id, wordInsight, total_count, positif_count, negatif_count, netral_count,
            positif_percentage, negatif_percentage, netral_percentage, created_at
          FROM insight_summary
          ORDER BY id
        `,
        headers: ['id', 'wordInsight', 'total_count', 'positif_count', 'negatif_count', 'netral_count', 'positif_percentage', 'negatif_percentage', 'netral_percentage', 'created_at']
      },
      {
        name: 'employee_insights',
        query: `
          SELECT
            id, wordInsight, sentenceInsight, originalInsight, employeeName,
            sourceData, witel, kota, sentimen, date
          FROM employee_insights
          ORDER BY id
        `,
        headers: ['id', 'wordInsight', 'sentenceInsight', 'originalInsight', 'employeeName', 'sourceData', 'witel', 'kota', 'sentimen', 'date']
      },
      {
        name: 'kota_summary',
        query: `
          SELECT
            id, kota, total_count, positif_count, negatif_count, netral_count,
            positif_percentage, negatif_percentage, netral_percentage, created_at, updated_at
          FROM kota_summary
          ORDER BY id
        `,
        headers: ['id', 'kota', 'total_count', 'positif_count', 'negatif_count', 'netral_count', 'positif_percentage', 'negatif_percentage', 'netral_percentage', 'created_at', 'updated_at']
      },
      {
        name: 'bookmarked_insights',
        query: `
          SELECT
            id, insight_title, insight_id, created_at
          FROM bookmarked_insights
          ORDER BY id
        `,
        headers: ['id', 'insight_title', 'insight_id', 'created_at']
      }
    ];

    // Process each table
    for (const table of tablesToExport) {
      try {
        console.log(`Exporting table: ${table.name}`);

        // Fetch data from database
        const { results } = await db.prepare(table.query).all();

        console.log(`Found ${results.length} records in ${table.name}`);

        // Convert to CSV
        const csvContent = arrayToCSV(results, table.headers);

        // Create filename with timestamp
        const filename = `${table.name}_${timestamp}.csv`;
        const fullPath = `${folderPath}/${filename}`;

        // Upload to R2
        const uploadResult = await r2.put(fullPath, csvContent, {
          httpMetadata: {
            contentType: 'text/csv',
            contentDisposition: `attachment; filename="${filename}"`
          },
          customMetadata: {
            exportDate: exportDate,
            exportTimestamp: timestamp,
            tableName: table.name,
            recordCount: String(results.length),
            exportedBy: 'database-export-system'
          }
        });

        if (uploadResult) {
          exportResults.push({
            table: table.name,
            filename: filename,
            path: fullPath,
            recordCount: results.length,
            size: csvContent.length,
            status: 'success'
          });
          console.log(`Successfully exported ${table.name} to ${fullPath}`);
        } else {
          throw new Error('Upload failed - no result returned');
        }

      } catch (error) {
        console.error(`Error exporting table ${table.name}:`, error);
        errors.push({
          table: table.name,
          error: error.message,
          status: 'failed'
        });
      }
    }

    // Create summary report
    const summary = {
      exportTimestamp: timestamp,
      exportDate: exportDate,
      folderPath: folderPath,
      totalTables: tablesToExport.length,
      successfulExports: exportResults.length,
      failedExports: errors.length,
      totalRecords: exportResults.reduce((sum, result) => sum + result.recordCount, 0),
      totalSize: exportResults.reduce((sum, result) => sum + result.size, 0)
    };

    // Upload summary report
    try {
      const summaryContent = JSON.stringify({
        summary,
        exportResults,
        errors
      }, null, 2);

      const summaryFilename = `export_summary_${timestamp}.json`;
      const summaryPath = `${folderPath}/${summaryFilename}`;

      await r2.put(summaryPath, summaryContent, {
        httpMetadata: {
          contentType: 'application/json'
        },
        customMetadata: {
          exportDate: exportDate,
          exportTimestamp: timestamp,
          fileType: 'summary-report',
          exportedBy: 'database-export-system'
        }
      });

      summary.summaryReportPath = summaryPath;
    } catch (summaryError) {
      console.error('Error creating summary report:', summaryError);
    }

    // Determine response status
    const hasErrors = errors.length > 0;
    const allFailed = exportResults.length === 0;

    return c.json({
      success: !allFailed,
      message: allFailed
        ? 'All exports failed'
        : hasErrors
          ? 'Export completed with some errors'
          : 'All tables exported successfully',
      summary,
      exportResults,
      errors: errors.length > 0 ? errors : undefined,
      downloadUrls: exportResults.map(result => ({
        table: result.table,
        filename: result.filename,
        path: result.path,
        url: `https://chatnlp.adityalasika.workers.dev/${result.path}` // Adjust domain as needed
      }))
    }, allFailed ? 500 : hasErrors ? 207 : 200); // 207 = Multi-Status for partial success

  } catch (error) {
    console.error('Error in database export:', error);
    return c.json({
      success: false,
      error: 'Export failed',
      message: error.message,
      timestamp: getTimestamp()
    }, 500);
  }
});

// List all exports in R2 bucket
app.get('/api/export/list', async (c) => {
  try {
    const r2 = c.env.R2_BUCKET;

    if (!r2) {
      return c.json({
        success: false,
        error: 'R2 bucket not configured',
        message: 'R2_BUCKET binding is not available'
      }, 500);
    }

    // List objects with exports prefix
    const listResult = await r2.list({
      prefix: 'exports/',
      include: ['customMetadata', 'httpMetadata']
    });

    const exports = [];
    const exportsByDate = {};

    // Process the objects
    for (const object of listResult.objects) {
      const pathParts = object.key.split('/');
      const exportDate = pathParts[1]; // exports/YYYY-MM-DD/filename
      const filename = pathParts[2];

      if (!exportDate || !filename) continue;

      const exportInfo = {
        key: object.key,
        filename: filename,
        exportDate: exportDate,
        size: object.size,
        lastModified: object.uploaded,
        contentType: object.httpMetadata?.contentType,
        metadata: object.customMetadata || {}
      };

      exports.push(exportInfo);

      // Group by date
      if (!exportsByDate[exportDate]) {
        exportsByDate[exportDate] = [];
      }
      exportsByDate[exportDate].push(exportInfo);
    }

    // Sort exports by date (newest first)
    exports.sort((a, b) => new Date(b.lastModified) - new Date(a.lastModified));

    return c.json({
      success: true,
      message: `Found ${exports.length} export files`,
      totalFiles: exports.length,
      exports: exports,
      exportsByDate: exportsByDate,
      availableDates: Object.keys(exportsByDate).sort().reverse()
    });

  } catch (error) {
    console.error('Error listing exports:', error);
    return c.json({
      success: false,
      error: 'Failed to list exports',
      message: error.message
    }, 500);
  }
});

// Download specific export file
app.get('/api/export/download/:date/:filename', async (c) => {
  try {
    const date = c.req.param('date');
    const filename = c.req.param('filename');
    const r2 = c.env.R2_BUCKET;

    if (!r2) {
      return c.json({
        success: false,
        error: 'R2 bucket not configured',
        message: 'R2_BUCKET binding is not available'
      }, 500);
    }

    const objectKey = `exports/${date}/${filename}`;

    // Get the object from R2
    const object = await r2.get(objectKey);

    if (!object) {
      return c.json({
        success: false,
        error: 'File not found',
        message: `Export file not found: ${objectKey}`
      }, 404);
    }

    // Return the file content with appropriate headers
    const headers = new Headers();
    headers.set('Content-Type', object.httpMetadata?.contentType || 'application/octet-stream');
    headers.set('Content-Disposition', `attachment; filename="${filename}"`);
    headers.set('Content-Length', object.size.toString());

    return new Response(object.body, {
      headers: headers
    });

  } catch (error) {
    console.error('Error downloading export:', error);
    return c.json({
      success: false,
      error: 'Failed to download export',
      message: error.message
    }, 500);
  }
});

// Delete specific export file or entire export date folder
app.delete('/api/export/delete/:date/:filename?', async (c) => {
  try {
    const date = c.req.param('date');
    const filename = c.req.param('filename');
    const r2 = c.env.R2_BUCKET;

    if (!r2) {
      return c.json({
        success: false,
        error: 'R2 bucket not configured',
        message: 'R2_BUCKET binding is not available'
      }, 500);
    }

    const deletedFiles = [];
    const errors = [];

    if (filename) {
      // Delete specific file
      const objectKey = `exports/${date}/${filename}`;

      try {
        await r2.delete(objectKey);
        deletedFiles.push(objectKey);
      } catch (error) {
        errors.push({
          file: objectKey,
          error: error.message
        });
      }
    } else {
      // Delete entire date folder
      const listResult = await r2.list({
        prefix: `exports/${date}/`
      });

      for (const object of listResult.objects) {
        try {
          await r2.delete(object.key);
          deletedFiles.push(object.key);
        } catch (error) {
          errors.push({
            file: object.key,
            error: error.message
          });
        }
      }
    }

    return c.json({
      success: errors.length === 0,
      message: errors.length === 0
        ? `Successfully deleted ${deletedFiles.length} file(s)`
        : `Deleted ${deletedFiles.length} file(s) with ${errors.length} error(s)`,
      deletedFiles: deletedFiles,
      errors: errors.length > 0 ? errors : undefined
    });

  } catch (error) {
    console.error('Error deleting export:', error);
    return c.json({
      success: false,
      error: 'Failed to delete export',
      message: error.message
    }, 500);
  }
});

// Incremental data import endpoint (Admin only) - Adds new data without replacing existing
app.post('/api/data/import-incremental', authMiddleware, async (c) => {
  try {
    const user = c.get('user');

    // Check if user is admin
    if (user.role !== 'admin') {
      return c.json({
        success: false,
        error: 'Unauthorized. Admin access required.',
      }, 403);
    }

    const body = await c.req.json();
    const data = body.data;

    if (!Array.isArray(data)) {
      return c.json({
        success: false,
        error: 'Invalid data format. Expected an array of insights.',
      }, 400);
    }

    const db = c.env.DB;

    console.log(`Starting incremental data import with ${data.length} new records`);

    // Get current record count
    const currentCount = await db.prepare('SELECT COUNT(*) as count FROM employee_insights').first();
    console.log(`Current database has ${currentCount.count} records`);

    // Prepare insert statement for employee_insights
    const insertStmt = db.prepare(`
      INSERT INTO employee_insights (
        sourceData, employeeName, date, witel, kota,
        originalInsight, sentenceInsight, wordInsight, sentimen
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    // Insert new data in batches for better performance
    const batchSize = 100;
    let insertedCount = 0;
    let errorCount = 0;

    for (let i = 0; i < data.length; i += batchSize) {
      const batch = data.slice(i, i + batchSize);

      // Prepare batch statements with data validation
      const batchStatements = [];

      for (const record of batch) {
        try {
          // Validate and clean data
          const cleanRecord = {
            sourceData: record.sourceData || 'Unknown',
            employeeName: record.employeeName || 'Unknown',
            date: record.date || new Date().toISOString().split('T')[0],
            witel: record.witel || 'Unknown',
            kota: record.kota || 'Unknown',
            originalInsight: record.originalInsight || '',
            sentenceInsight: record.sentenceInsight || '',
            wordInsight: record.wordInsight || 'Unknown',
            sentimen: record.sentimen || 'netral'
          };

          // Validate sentiment values
          if (!['positif', 'negatif', 'netral'].includes(cleanRecord.sentimen)) {
            cleanRecord.sentimen = 'netral';
          }

          batchStatements.push(
            insertStmt.bind(
              cleanRecord.sourceData,
              cleanRecord.employeeName,
              cleanRecord.date,
              cleanRecord.witel,
              cleanRecord.kota,
              cleanRecord.originalInsight,
              cleanRecord.sentenceInsight,
              cleanRecord.wordInsight,
              cleanRecord.sentimen
            )
          );
        } catch (error) {
          errorCount++;
          console.error(`Error preparing record ${i + batchStatements.length + 1}:`, error);
        }
      }

      // Execute batch
      if (batchStatements.length > 0) {
        await db.batch(batchStatements);
        insertedCount += batchStatements.length;
      }

      console.log(`Processed batch ${Math.floor(i / batchSize) + 1}: inserted ${insertedCount}, errors ${errorCount}`);
    }

    console.log(`Incremental import completed. Added ${insertedCount} new records with ${errorCount} errors.`);

    // Regenerate insight_summary table with combined data
    console.log('Regenerating insight_summary table with combined data...');
    await db.prepare('DELETE FROM insight_summary').run();
    await db.prepare(`
      INSERT INTO insight_summary (
        wordInsight,
        total_count,
        positif_count,
        negatif_count,
        netral_count,
        positif_percentage,
        negatif_percentage,
        netral_percentage
      )
      SELECT
        wordInsight,
        COUNT(*) as total_count,
        SUM(CASE WHEN sentimen = 'positif' THEN 1 ELSE 0 END) as positif_count,
        SUM(CASE WHEN sentimen = 'negatif' THEN 1 ELSE 0 END) as negatif_count,
        SUM(CASE WHEN sentimen = 'netral' THEN 1 ELSE 0 END) as netral_count,
        ROUND(
          (SUM(CASE WHEN sentimen = 'positif' THEN 1 ELSE 0 END) * 100.0) / COUNT(*),
          2
        ) as positif_percentage,
        ROUND(
          (SUM(CASE WHEN sentimen = 'negatif' THEN 1 ELSE 0 END) * 100.0) / COUNT(*),
          2
        ) as negatif_percentage,
        ROUND(
          (SUM(CASE WHEN sentimen = 'netral' THEN 1 ELSE 0 END) * 100.0) / COUNT(*),
          2
        ) as netral_percentage
      FROM employee_insights
      WHERE wordInsight IS NOT NULL AND wordInsight != ''
      GROUP BY wordInsight
      HAVING COUNT(*) > 0
    `).run();

    // Regenerate kota_summary table with combined data
    console.log('Regenerating kota_summary table with combined data...');
    await db.prepare('DELETE FROM kota_summary').run();
    await db.prepare(`
      INSERT INTO kota_summary (
        kota,
        total_count,
        positif_count,
        negatif_count,
        netral_count,
        positif_percentage,
        negatif_percentage,
        netral_percentage
      )
      SELECT
        kota,
        COUNT(*) as total_count,
        SUM(CASE WHEN sentimen = 'positif' THEN 1 ELSE 0 END) as positif_count,
        SUM(CASE WHEN sentimen = 'negatif' THEN 1 ELSE 0 END) as negatif_count,
        SUM(CASE WHEN sentimen = 'netral' THEN 1 ELSE 0 END) as netral_count,
        ROUND(
          (SUM(CASE WHEN sentimen = 'positif' THEN 1 ELSE 0 END) * 100.0) / COUNT(*),
          2
        ) as positif_percentage,
        ROUND(
          (SUM(CASE WHEN sentimen = 'negatif' THEN 1 ELSE 0 END) * 100.0) / COUNT(*),
          2
        ) as negatif_percentage,
        ROUND(
          (SUM(CASE WHEN sentimen = 'netral' THEN 1 ELSE 0 END) * 100.0) / COUNT(*),
          2
        ) as netral_percentage
      FROM employee_insights
      WHERE kota IS NOT NULL AND kota != ''
      GROUP BY kota
      HAVING COUNT(*) > 0
    `).run();

    console.log('Summary tables regenerated successfully with combined data.');

    // Get final counts for verification
    const finalCounts = await db.prepare(`
      SELECT
        (SELECT COUNT(*) FROM employee_insights) as employee_insights_count,
        (SELECT COUNT(*) FROM insight_summary) as insight_summary_count,
        (SELECT COUNT(*) FROM kota_summary) as kota_summary_count
    `).first();

    return c.json({
      success: true,
      data: {
        previous_count: currentCount.count,
        new_records_added: insertedCount,
        errors: errorCount,
        total_new_records: data.length,
        final_total: finalCounts.employee_insights_count,
        final_counts: finalCounts
      },
      message: `Successfully added ${insertedCount} new records (${errorCount} errors). Total records: ${finalCounts.employee_insights_count}`
    });

  } catch (error) {
    console.error('Error in incremental import:', error);
    return c.json({
      success: false,
      error: 'Failed to import data incrementally',
      message: error.message
    }, 500);
  }
});

// Data import endpoint (Admin only)
app.post('/api/data/import', authMiddleware, async (c) => {
  try {
    const user = c.get('user');

    // Check if user is admin
    if (user.role !== 'admin') {
      return c.json({
        success: false,
        error: 'Unauthorized',
        message: 'Only admin users can import data'
      }, 403);
    }

    const { data } = await c.req.json();

    if (!data || !Array.isArray(data)) {
      return c.json({
        success: false,
        error: 'Invalid data format',
        message: 'Data must be an array of insight objects'
      }, 400);
    }

    const db = c.env.DB;

    console.log(`Starting data import with ${data.length} records`);

    // Clear existing data
    console.log('Clearing existing data...');
    await db.prepare('DELETE FROM employee_insights').run();
    await db.prepare('DELETE FROM insight_summary').run();
    await db.prepare('DELETE FROM kota_summary').run();
    await db.prepare("DELETE FROM sqlite_sequence WHERE name IN ('employee_insights', 'insight_summary', 'kota_summary')").run();

    // Prepare insert statement
    const insertStmt = db.prepare(`
      INSERT INTO employee_insights (
        sourceData, employeeName, date, witel, kota,
        originalInsight, sentenceInsight, wordInsight, sentimen
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    // Import data in batches using D1 batch operations with validation
    const batchSize = 100;
    let imported = 0;
    let errorCount = 0;

    for (let i = 0; i < data.length; i += batchSize) {
      const batch = data.slice(i, i + batchSize);

      // Prepare batch statements with data validation
      const batchStatements = [];

      for (const record of batch) {
        try {
          // Validate and clean data
          const cleanRecord = {
            sourceData: record.sourceData || 'Unknown',
            employeeName: record.employeeName || 'Unknown',
            date: record.date || new Date().toISOString().split('T')[0],
            witel: record.witel || 'Unknown',
            kota: record.kota || 'Unknown',
            originalInsight: record.originalInsight || '',
            sentenceInsight: record.sentenceInsight || '',
            wordInsight: record.wordInsight || 'Unknown',
            sentimen: record.sentimen || 'netral'
          };

          // Validate sentiment values
          if (!['positif', 'negatif', 'netral'].includes(cleanRecord.sentimen)) {
            cleanRecord.sentimen = 'netral';
          }

          batchStatements.push(
            insertStmt.bind(
              cleanRecord.sourceData,
              cleanRecord.employeeName,
              cleanRecord.date,
              cleanRecord.witel,
              cleanRecord.kota,
              cleanRecord.originalInsight,
              cleanRecord.sentenceInsight,
              cleanRecord.wordInsight,
              cleanRecord.sentimen
            )
          );
        } catch (error) {
          errorCount++;
          console.error(`Error preparing record ${i + batchStatements.length + 1}:`, error);
        }
      }

      // Execute batch
      if (batchStatements.length > 0) {
        await db.batch(batchStatements);
        imported += batchStatements.length;
      }

      console.log(`Processed batch ${Math.floor(i / batchSize) + 1}: imported ${imported}, errors ${errorCount}`);
    }

    console.log('Data import completed, regenerating summary tables...');

    // Regenerate insight_summary
    await db.prepare(`
      INSERT INTO insight_summary (
        wordInsight, total_count, positif_count, negatif_count, netral_count,
        positif_percentage, negatif_percentage, netral_percentage
      )
      SELECT
        wordInsight,
        COUNT(*) as total_count,
        SUM(CASE WHEN sentimen = 'positif' THEN 1 ELSE 0 END) as positif_count,
        SUM(CASE WHEN sentimen = 'negatif' THEN 1 ELSE 0 END) as negatif_count,
        SUM(CASE WHEN sentimen = 'netral' THEN 1 ELSE 0 END) as netral_count,
        ROUND(
          (SUM(CASE WHEN sentimen = 'positif' THEN 1 ELSE 0 END) * 100.0) / COUNT(*),
          2
        ) as positif_percentage,
        ROUND(
          (SUM(CASE WHEN sentimen = 'negatif' THEN 1 ELSE 0 END) * 100.0) / COUNT(*),
          2
        ) as negatif_percentage,
        ROUND(
          (SUM(CASE WHEN sentimen = 'netral' THEN 1 ELSE 0 END) * 100.0) / COUNT(*),
          2
        ) as netral_percentage
      FROM employee_insights
      WHERE wordInsight IS NOT NULL AND wordInsight != ''
      GROUP BY wordInsight
      HAVING COUNT(*) > 0
    `).run();

    // Regenerate kota_summary
    await db.prepare(`
      INSERT INTO kota_summary (
        kota, total_count, positif_count, negatif_count, netral_count,
        positif_percentage, negatif_percentage, netral_percentage
      )
      SELECT
        kota,
        COUNT(*) as total_count,
        SUM(CASE WHEN sentimen = 'positif' THEN 1 ELSE 0 END) as positif_count,
        SUM(CASE WHEN sentimen = 'negatif' THEN 1 ELSE 0 END) as negatif_count,
        SUM(CASE WHEN sentimen = 'netral' THEN 1 ELSE 0 END) as netral_count,
        ROUND(
          (SUM(CASE WHEN sentimen = 'positif' THEN 1 ELSE 0 END) * 100.0) / COUNT(*),
          2
        ) as positif_percentage,
        ROUND(
          (SUM(CASE WHEN sentimen = 'negatif' THEN 1 ELSE 0 END) * 100.0) / COUNT(*),
          2
        ) as negatif_percentage,
        ROUND(
          (SUM(CASE WHEN sentimen = 'netral' THEN 1 ELSE 0 END) * 100.0) / COUNT(*),
          2
        ) as netral_percentage
      FROM employee_insights
      WHERE kota IS NOT NULL AND kota != ''
      GROUP BY kota
      HAVING COUNT(*) > 0
    `).run();

    console.log('Summary tables regenerated successfully!');

    // Get final counts for verification
    const finalCounts = await db.prepare(`
      SELECT
        (SELECT COUNT(*) FROM employee_insights) as employee_insights_count,
        (SELECT COUNT(*) FROM insight_summary) as insight_summary_count,
        (SELECT COUNT(*) FROM kota_summary) as kota_summary_count
    `).first();

    return c.json({
      success: true,
      data: {
        imported: imported,
        errors: errorCount,
        total: data.length,
        final_counts: finalCounts
      },
      message: `Successfully imported ${imported} records (${errorCount} errors) and regenerated summary tables`
    });

  } catch (error) {
    console.error('Error importing data:', error);
    return c.json({
      success: false,
      error: 'Data import failed',
      message: error.message
    }, 500);
  }
});

// Health check endpoint
app.get('/health', (c) => {
  return c.json({
    success: true,
    status: 'healthy',
    timestamp: new Date().toISOString(),
    message: 'API is running smoothly'
  });
});


// 404 handler
app.notFound((c) => {
  return c.json({
    success: false,
    error: 'Endpoint not found',
    message: 'The requested API endpoint does not exist'
  }, 404);
});

// Error handler
app.onError((err, c) => {
  console.error('API Error:', err);
  return c.json({
    success: false,
    error: 'Internal server error',
    message: err.message
  }, 500);
});

export default app;