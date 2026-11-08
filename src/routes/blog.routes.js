// src/routes/blog.routes.js
const express = require('express');
const router = express.Router();
const blogController = require('../controllers/blogController');

// Mapeamento dos endpoints REST do blog
router.get('/', blogController.getPosts);
router.post('/', blogController.createPost);
router.put('/:id', blogController.updatePost);
router.delete('/:id', blogController.deletePost);

module.exports = router;