const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer'); // <-- Importado para o envio real

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);
const SALT_ROUNDS = 10;
const JWT_SECRET = process.env.JWT_SECRET || 'sua_chave_secreta_super_segura';

// Configuração do Nodemailer com as suas variáveis do .env
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// Armazenamento temporário de códigos OTP
const recoveryCodes = new Map();

class UserService {
  async createUser({ nome, email, senha, cargo_permissao }) {
    if (!nome || !email || !senha) {
      throw new Error('Nome, e-mail e senha são obrigatórios.');
    }

    const { data: existingUser } = await supabase
      .from('usuarios_sistema')
      .select('id')
      .eq('email', email)
      .single();

    if (existingUser) {
      throw new Error('Este e-mail já está registado no sistema.');
    }

    const senhaHash = await bcrypt.hash(senha, SALT_ROUNDS);

    const { data, error } = await supabase
      .from('usuarios_sistema')
      .insert([{ 
        nome, 
        email, 
        senha_hash: senhaHash, 
        cargo_permissao: cargo_permissao || 'Operador',
        status: 'Ativo'
      }]);

    if (error) throw error;
    return { message: 'Utilizador criado com sucesso!' };
  }

  async getUsers() {
    const { data, error } = await supabase
      .from('usuarios_sistema')
      .select('id, nome, email, cargo_permissao, status, created_at');

    if (error) throw error;
    return data;
  }

  async loginUser({ email, senha }) {
    if (!email || !senha) {
      throw new Error('E-mail e senha são obrigatórios.');
    }

    const { data: user, error } = await supabase
      .from('usuarios_sistema')
      .select('*')
      .eq('email', email)
      .single();

    if (error || !user) {
      throw new Error('Credenciais inválidas (E-mail não encontrado).');
    }

    if (user.status !== 'Ativo') {
      throw new Error('Acesso desativado para este utilizador.');
    }

    const senhaCorreta = await bcrypt.compare(senha, user.senha_hash);
    if (!senhaCorreta) {
      throw new Error('Credenciais inválidas (Senha incorreta).');
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, cargo: user.cargo_permissao },
      JWT_SECRET,
      { expiresIn: '8h' }
    );

    return {
      success: true,
      message: 'Login efetuado com sucesso!',
      token,
      user: {
        id: user.id,
        nome: user.nome,
        email: user.email,
        cargo_permissao: user.cargo_permissao
      }
    };
  }

  // --- RECUPERAÇÃO DE SENHA (OTP + NODEMAILER INTEGRADO) ---

  async requestPasswordReset(email) {
    if (!email) throw new Error('O e-mail é obrigatório.');

    // 1. Verifica se o utilizador realmente existe no Supabase
    const { data: user, error } = await supabase
      .from('usuarios_sistema')
      .select('id, email, nome')
      .eq('email', email)
      .single();

    if (error || !user) {
      throw new Error('E-mail não encontrado no sistema.');
    }

    // 2. Gera código aleatório de 6 dígitos
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    
    // 3. Guarda o código com validade de 15 minutos
    recoveryCodes.set(email, {
      code,
      expires: Date.now() + 15 * 60 * 1000
    });

    console.log(`[SECURITY OTP] Código para ${email}: ${code}`);

    // 4. Envio do E-mail real via Nodemailer
    const mailOptions = {
      from: '"Mover Sistemas - Painel Admin" <' + process.env.EMAIL_USER + '>',
      to: email,
      subject: 'Código de Recuperação de Senha - Mover Sistemas',
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; background-color: #f4f6f8; border-radius: 8px;">
          <div style="max-width: 500px; margin: auto; background: #ffffff; padding: 30px; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
            <h2 style="color: #0b2545; text-align: center;">Mover Sistemas</h2>
            <p>Olá, <strong>${user.nome || 'Utilizador'}</strong>,</p>
            <p>Recebemos um pedido para redefinir a senha de acesso ao seu Painel Administrativo.</p>
            <p>O seu código de verificação de 6 dígitos é:</p>
            <div style="text-align: center; margin: 30px 0;">
              <span style="font-size: 32px; font-weight: bold; color: #8bc34a; letter-spacing: 5px; background: #f0fdf4; padding: 10px 20px; border-radius: 6px; border: 1px dashed #8bc34a;">
                ${code}
              </span>
            </div>
            <p style="font-size: 13px; color: #64748b;">Este código é válido por 15 minutos. Se não solicitou esta alteração, ignore este e-mail.</p>
            <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
            <p style="font-size: 11px; color: #94a3b8; text-align: center;">Mover Sistemas - Todos os direitos reservados.</p>
          </div>
        </div>
      `
    };

    try {
      await transporter.sendMail(mailOptions);
    } catch (err) {
      console.error('Erro ao enviar e-mail:', err);
      throw new Error('Erro ao enviar o e-mail de recuperação. Tente novamente mais tarde.');
    }

    return { success: true, message: 'Código de verificação enviado para o e-mail.' };
  }

  async verifyResetCode({ email, code }) {
    const record = recoveryCodes.get(email);
    if (!record || record.code !== code || Date.now() > record.expires) {
      throw new Error('Código de verificação inválido ou expirado.');
    }
    return { success: true, message: 'Código validado com sucesso!' };
  }

  async resetPassword({ email, code, novaSenha }) {
    const record = recoveryCodes.get(email);
    if (!record || record.code !== code || Date.now() > record.expires) {
      throw new Error('Sessão de recuperação expirada. Solicite novo código.');
    }

    if (!novaSenha || novaSenha.length < 6) {
      throw new Error('A nova senha deve ter pelo menos 6 caracteres.');
    }

    const senhaHash = await bcrypt.hash(novaSenha, SALT_ROUNDS);

    const { error } = await supabase
      .from('usuarios_sistema')
      .update({ senha_hash: senhaHash })
      .eq('email', email);

    if (error) throw error;

    recoveryCodes.delete(email);

    return { success: true, message: 'Senha alterada com sucesso!' };
  }
}

module.exports = new UserService();