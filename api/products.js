import { neon } from '@neondatabase/serverless';

const databaseUrl = process.env.DATABASE_URL;
const adminPassword = process.env.ADMIN_PASSWORD || 'Surfwax';

const sql = databaseUrl ? neon(databaseUrl) : null;

export default async function handler(req, res) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { action } = req.query;

  // --- LOGIN ROUTE ---
  if (action === 'login' && req.method === 'POST') {
    const { username, password } = req.body;
    if (username === 'Admin' && password === adminPassword) {
      const crypto = await import('crypto');
      const token = crypto.createHmac('sha256', adminPassword).update('Admin').digest('hex');
      return res.status(200).json({ success: true, token });
    }
    return res.status(401).json({ error: 'Credenciales inválidas' });
  }

  // Fallback check if Neon Postgres is not configured yet
  if (!sql) {
    return res.status(503).json({
      error: 'Neon Postgres credentials not configured. Please define the DATABASE_URL environment variable.'
    });
  }

  // --- READ GET ROUTES ---
  if (req.method === 'GET') {
    try {
      if (action === 'categories') {
        const rows = await sql('SELECT name FROM categories ORDER BY name ASC');
        return res.status(200).json(rows.map(c => c.name));
      } else {
        const rows = await sql('SELECT * FROM products ORDER BY id ASC');

        // Map database fields to standard JSON structure
        const formatted = rows.map(p => ({
          id: Number(p.id),
          name: p.name,
          category: p.category,
          price: Number(p.price),
          compareAtPrice: p.compare_at_price ? Number(p.compare_at_price) : null,
          description: p.description,
          images: p.images || [],
          tags: p.tags || [],
          stock: p.stock || 0,
          brand: p.brand || 'MEGALODON',
          variants: p.variants || []
        }));
        return res.status(200).json(formatted);
      }
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: err.message });
    }
  }

  // --- PROTECTED WRITE POST ROUTES ---
  if (req.method === 'POST') {
    try {
      // Validate authorization token
      const authHeader = req.headers.authorization || '';
      const token = authHeader.replace('Bearer ', '');
      const crypto = await import('crypto');
      const expectedToken = crypto.createHmac('sha256', adminPassword).update('Admin').digest('hex');

      if (!token || token !== expectedToken) {
        return res.status(401).json({ error: 'No autorizado' });
      }

      if (action === 'save_categories') {
        const categoriesArray = req.body; // Expects array of strings e.g. ["Ceras", "Apparel", "Accesorios"]
        if (!Array.isArray(categoriesArray)) {
          return res.status(400).json({ error: 'Se esperaba un array de categorías' });
        }

        // 1. Delete categories not in the new payload
        if (categoriesArray.length > 0) {
          await sql('DELETE FROM categories WHERE NOT (name = ANY($1))', [categoriesArray]);
          
          // 2. Insert new categories
          for (const name of categoriesArray) {
            await sql('INSERT INTO categories (name) VALUES ($1) ON CONFLICT (name) DO NOTHING', [name]);
          }
        } else {
          await sql('DELETE FROM categories');
        }

        return res.status(200).json({ success: true });
      } else {
        const productsArray = req.body; // Expects array of product objects
        if (!Array.isArray(productsArray)) {
          return res.status(400).json({ error: 'Se esperaba un array de productos' });
        }

        // 1. Get current active IDs from the payload
        const activeIds = productsArray.map(p => p.id).filter(id => id && typeof id === 'number');

        // 2. Delete products that were removed in the admin panel
        if (activeIds.length > 0) {
          await sql('DELETE FROM products WHERE NOT (id = ANY($1))', [activeIds]);
        } else {
          await sql('DELETE FROM products');
        }

        // 3. Upsert products
        for (const p of productsArray) {
          await sql(`
            INSERT INTO products (id, name, category, price, compare_at_price, description, images, tags, stock, brand, variants)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
            ON CONFLICT (id) DO UPDATE SET
              name = EXCLUDED.name,
              category = EXCLUDED.category,
              price = EXCLUDED.price,
              compare_at_price = EXCLUDED.compare_at_price,
              description = EXCLUDED.description,
              images = EXCLUDED.images,
              tags = EXCLUDED.tags,
              stock = EXCLUDED.stock,
              brand = EXCLUDED.brand,
              variants = EXCLUDED.variants
          `, [
            p.id,
            p.name,
            p.category,
            Number(p.price),
            p.compareAtPrice ? Number(p.compareAtPrice) : null,
            p.description,
            p.images || [],
            p.tags || [],
            p.stock || 0,
            p.brand || 'MEGALODON',
            p.variants || []
          ]);
        }

        return res.status(200).json({ success: true });
      }
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: err.message });
    }
  }

  return res.status(405).json({ error: 'Método no permitido' });
}
