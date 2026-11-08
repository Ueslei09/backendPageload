const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');

router.post('/', userController.createUser);
router.get('/', userController.getUsers);

// Rotas de recuperação de senha
router.post('/recuperar-senha', userController.requestPasswordReset);
router.post('/verificar-codigo', userController.verifyResetCode);
router.post('/alterar-senha', userController.resetPassword);

module.exports = router;