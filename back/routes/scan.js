const express = require('express');
const multer = require('multer');
const path = require('path');
const sharp = require('sharp');
const router = express.Router();
const WardrobeItem = require('../models/WardrobeItem.model');
const { scanClothingItems } = require('../utils/geminiScanner');

const uploadsDir = path.join(__dirname, '../uploads');

// Memory storage — we process buffers before writing to disk
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 15 * 1024 * 1024, files: 20 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Only image files are allowed'));
  },
});

// POST /api/scan
// Body: multipart, field name "images" (up to 20 files)
// Returns: { items: [{ name, category, color, tags, imageUrl, boundingBox, imageIndex }] }
router.post('/', upload.array('images', 20), async (req, res) => {
  if (!req.files?.length) {
    return res.status(400).json({ message: 'No images provided' });
  }

  try {
    // Resize images before sending to Gemini to stay within inline-data limits
    const resizedBuffers = await Promise.all(
      req.files.map(f =>
        sharp(f.buffer)
          .resize({ width: 1024, height: 1024, fit: 'inside', withoutEnlargement: true })
          .jpeg({ quality: 82 })
          .toBuffer()
      )
    );
    const mimeTypes = req.files.map(() => 'image/jpeg');

    const detected = await scanClothingItems(resizedBuffers, mimeTypes);

    if (detected.length === 0) {
      return res.json({ items: [] });
    }

    // Crop each detected item from its source image
    const items = await Promise.all(
      detected.map(async (item, idx) => {
        const srcIdx = Math.min(item.imageIndex, resizedBuffers.length - 1);
        const srcBuf = resizedBuffers[srcIdx];

        try {
          const meta = await sharp(srcBuf).metadata();
          const { x, y, w, h } = item.boundingBox;

          // Convert percentages → pixels, add 8% padding
          const pad = Math.round(Math.min(meta.width, meta.height) * 0.08);
          const left = Math.max(0, Math.round((x / 100) * meta.width) - pad);
          const top  = Math.max(0, Math.round((y / 100) * meta.height) - pad);
          const width  = Math.min(meta.width  - left, Math.round((w / 100) * meta.width)  + pad * 2);
          const height = Math.min(meta.height - top,  Math.round((h / 100) * meta.height) + pad * 2);

          const filename = `scan-${Date.now()}-${idx}.jpg`;
          await sharp(srcBuf)
            .extract({ left, top, width, height })
            .jpeg({ quality: 88 })
            .toFile(path.join(uploadsDir, filename));

          return { ...item, imageUrl: `/uploads/${filename}` };
        } catch {
          // Fallback: save the full resized source image
          const filename = `scan-${Date.now()}-${idx}-full.jpg`;
          await sharp(srcBuf).jpeg({ quality: 88 }).toFile(path.join(uploadsDir, filename));
          return { ...item, imageUrl: `/uploads/${filename}` };
        }
      })
    );

    res.json({ items });
  } catch (err) {
    console.error('[scan] Error:', err.message);
    res.status(500).json({ message: err.message });
  }
});

// POST /api/scan/confirm
// Body: { items: [{ name, category, color, tags, imageUrl }] }
// Bulk-creates WardrobeItem rows for all reviewed items
router.post('/confirm', async (req, res) => {
  const { items } = req.body;
  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ message: 'No items provided' });
  }

  try {
    const created = await WardrobeItem.bulkCreate(
      items.map(item => ({
        name: String(item.name || '').trim() || 'Unknown item',
        category: item.category || 'tops',
        color: String(item.color || '').trim(),
        tags: Array.isArray(item.tags) ? item.tags : [],
        imageUrl: item.imageUrl || null,
      }))
    );
    res.status(201).json(created);
  } catch (err) {
    console.error('[scan/confirm] Error:', err.message);
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
