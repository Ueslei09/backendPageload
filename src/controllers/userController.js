// src/controllers/userController.js
const userService = require('../services/userService');

exports.createUser = async (req, res) => {
  try {
    const result = await userService.createUser(req.body);
    return res.status(201).json({ success: true, ...result });
  } catch (err) {
    return res.status(400).json({ success: false, error: err.message });
  }
};

exports.getUsers = async (req, res) => {
  try {
    const data = await userService.getUsers();
    return res.status(200).json({ success: true, data });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
};

exports.loginUser = async (req, res) => {
  try {
    const result = await userService.loginUser(req.body);
    return res.status(200).json({ success: true, ...result });
  } catch (err) {
    const statusCode = err.message.includes('obrigatórios') ? 400 : 401;
    return res.status(statusCode).json({ success: false, error: err.message });
  }
};

// --- NOVOS MÉTODOS DE RECUPERAÇÃO DE SENHA NO CONTROLLER ---

exports.requestPasswordReset = async (req, res) => {
  try {
    const result = await userService.requestPasswordReset(req.body.email);
    return res.status(200).json(result);
  } catch (err) {
    return res.status(400).json({ success: false, error: err.message });
  }
};

exports.verifyResetCode = async (req, res) => {
  try {
    const result = await userService.verifyResetCode(req.body);
    return res.status(200).json(result);
  } catch (err) {
    return res.status(400).json({ success: false, error: err.message });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const result = await userService.resetPassword(req.body);
    return res.status(200).json(result);
  } catch (err) {
    return res.status(400).json({ success: false, error: err.message });
  }
};