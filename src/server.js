const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');
const leadRoutes = require('./routes/lead.routes');
const blogRoutes = require('./routes/blog.routes');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(helmet());
app.use(cors({ 
  origin: [
    'http://localhost:5173', 
    'http://localhost:5000',
    'https://mover-load-page.vercel.app',
    /\.vercel\.app$/ // <--- Isto permite automaticamente qualquer link de preview do Vercel
  ], 
  methods: ['GET', 'POST', 'PUT', 'DELETE'] 
}));

// Aumente o limite de payload para aceitar imagens em Base64 vindas do painel admin
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Mapeamento limpo por domínio (Escalável)
app.use('/api/auth', authRoutes);
app.use('/api/usuarios', userRoutes);
app.use('/api/leads', leadRoutes);
app.use('/api/blog', blogRoutes);

app.get('/api/ping', (req, res) => {
  res.status(200).json({ status: 'online', message: 'Servidor Mover SaaS a todo o vapor!' });
});

app.listen(PORT, () => {
  console.log(`Mover SaaS Backend modular rodando na porta ${PORT}`);
});