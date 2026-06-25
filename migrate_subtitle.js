import { neon } from '@neondatabase/serverless';
import fs from 'fs';
import path from 'path';

// Parse .env.development.local manually
const envPath = path.resolve(process.cwd(), '.env.development.local');
let databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl && fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  const match = envContent.match(/^DATABASE_URL=["']?([^"'\r\n]+)["']?/m);
  if (match) {
    databaseUrl = match[1];
  }
}

if (!databaseUrl) {
  console.error("Error: No se encontró DATABASE_URL");
  process.exit(1);
}

const sql = neon(databaseUrl);

async function migrate() {
  try {
    console.log("Agregando columna 'subtitle' a la tabla 'products'...");
    await sql(`ALTER TABLE products ADD COLUMN IF NOT EXISTS subtitle TEXT DEFAULT ''`);
    console.log("✅ Columna 'subtitle' agregada exitosamente.");
  } catch (error) {
    if (error.message && error.message.includes('already exists')) {
      console.log("ℹ️  La columna 'subtitle' ya existe. No se necesita migración.");
    } else {
      console.error("❌ Error:", error.message);
      process.exit(1);
    }
  }
}

migrate();
