import { put } from '@vercel/blob';
import formidable from 'formidable';
import fs from 'fs';
import crypto from 'crypto';

const adminPassword = process.env.ADMIN_PASSWORD || 'Surfwax';

export const config = {
  api: {
    bodyParser: false, // Disable Vercel's default parser to handle multipart binary data
  },
};

export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  // Validate Token
  const authHeader = req.headers.authorization || '';
  const token = authHeader.replace('Bearer ', '');
  const expectedToken = crypto.createHmac('sha256', adminPassword).update('Admin').digest('hex');

  if (!token || token !== expectedToken) {
    return res.status(401).json({ error: 'No autorizado' });
  }

  // Check if Vercel Blob Token is set
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return res.status(503).json({
      error: 'Vercel Blob storage not configured. Please define the BLOB_READ_WRITE_TOKEN environment variable.'
    });
  }

  const form = formidable({});
  
  return new Promise((resolve) => {
    form.parse(req, async (err, fields, files) => {
      if (err) {
        res.status(500).json({ error: 'Error al procesar el archivo multipart' });
        return resolve();
      }

      const file = Array.isArray(files.image) ? files.image[0] : files.image;
      if (!file) {
        res.status(400).json({ error: 'No se envió ninguna imagen bajo la clave "image"' });
        return resolve();
      }

      // Validate MIME type
      const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
      if (!allowedMimeTypes.includes(file.mimetype)) {
        res.status(400).json({ error: 'Formato no permitido. Usa JPG, PNG, WEBP o GIF.' });
        return resolve();
      }

      try {
        const fileBuffer = fs.readFileSync(file.filepath);
        
        // Generate unique secure filename
        const ext = file.originalFilename ? file.originalFilename.split('.').pop() : 'png';
        const filename = `${crypto.randomBytes(16).toString('hex')}.${ext}`;
        
        // Upload to Vercel Blob Storage
        const blob = await put(filename, fileBuffer, {
          access: 'public',
        });

        res.status(200).json({ url: blob.url });
        resolve();
      } catch (uploadError) {
        console.error(uploadError);
        res.status(500).json({ error: `Error interno en la subida a Vercel Blob: ${uploadError.message}` });
        resolve();
      }
    });
  });
}
