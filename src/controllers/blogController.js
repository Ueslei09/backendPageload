// src/controllers/blogController.js
const blogService = require('../services/blogService');

exports.getPosts = async (req, res) => {
  try {
    const data = await blogService.getAllPosts();
    return res.status(200).json({ success: true, data });
  } catch (err) {
    console.error('Erro ao buscar posts:', err.message);
    return res.status(500).json({ success: false, error: 'Erro ao buscar posts do blog.' });
  }
};

exports.createPost = async (req, res) => {
  try {
    if (!req.body.title) {
      return res.status(400).json({ success: false, error: 'O título do artigo é obrigatório.' });
    }
    const data = await blogService.createPost(req.body);
    return res.status(201).json({ success: true, message: 'Artigo criado com sucesso!', data });
  } catch (err) {
    console.error('Erro ao criar post:', err.message);
    return res.status(500).json({ success: false, error: 'Erro interno ao salvar artigo.' });
  }
};

exports.updatePost = async (req, res) => {
  try {
    const { id } = req.params;
    const data = await blogService.updatePost(id, req.body);
    return res.status(200).json({ success: true, message: 'Artigo atualizado com sucesso!', data });
  } catch (err) {
    console.error('Erro ao atualizar post:', err.message);
    return res.status(500).json({ success: false, error: 'Erro ao atualizar artigo.' });
  }
};

exports.deletePost = async (req, res) => {
  try {
    const { id } = req.params;
    await blogService.deletePost(id);
    return res.status(200).json({ success: true, message: 'Artigo removido com sucesso!' });
  } catch (err) {
    console.error('Erro ao remover post:', err.message);
    return res.status(500).json({ success: false, error: 'Erro ao remover artigo.' });
  }
};