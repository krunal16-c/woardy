const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const router = express.Router();
const WardrobeItem = require('../models/WardrobeItem.model');

const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

const storage = multer.diskStorage({
  destination: uploadsDir,
  filename: (req, file, cb) => {
    const unique = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    cb(null, unique + path.extname(file.originalname).toLowerCase());
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Only image files are allowed'));
  },
});

router.get('/', async (req, res) => {
  try {
    const items = await WardrobeItem.findAll({ order: [['createdAt', 'DESC']] });
    res.json(items);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/', upload.single('image'), async (req, res) => {
  try {
    const { name, category, color, tags } = req.body;
    const imageUrl = req.file ? `/uploads/${req.file.filename}` : null;
    let tagsArr = [];
    if (tags) {
      try { tagsArr = JSON.parse(tags); } catch { tagsArr = tags.split(',').map(t => t.trim()).filter(Boolean); }
    }
    const item = await WardrobeItem.create({ name, category, color: color || '', tags: tagsArr, imageUrl });
    res.status(201).json(item);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const item = await WardrobeItem.findByPk(req.params.id);
    if (!item) return res.status(404).json({ message: 'Item not found' });

    if (item.imageUrl) {
      const filePath = path.join(__dirname, '..', item.imageUrl);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }

    await item.destroy();
    res.json({ message: 'Deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
