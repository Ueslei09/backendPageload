const { createClient } = require('@supabase/supabase-js');
const nodemailer = require('nodemailer');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// 1. Listar todos os leads (para aparecer no painel CRM)
exports.getLeads = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('leads')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    return res.status(200).json({ success: true, data });
  } catch (err) {
    console.error('Erro ao buscar leads:', err.message);
    return res.status(500).json({ success: false, error: 'Erro ao buscar leads.' });
  }
};

// 2. Criar um novo lead (O seu código original melhorado com origem)
exports.createLead = async (req, res) => {
  try {
    const { name, email, phone, message, origem } = req.body;

    if (!name || !email) {
      return res.status(400).json({ 
        success: false, 
        error: 'Nome e E-mail são obrigatórios.' 
      });
    }

    const { data, error } = await supabase
      .from('leads')
      .insert([{ 
        name, 
        email, 
        phone, 
        message, 
        origem: origem || 'site',
        lido: false,
        status_crm: 'ainda_nao_liguei'
      }]);

    if (error) throw error;

    // Disparar e-mail de notificação (mantido do seu código)
    try {
      await transporter.sendMail({
        from: `"Mover Sistemas - Leads" <${process.env.EMAIL_USER}>`,
        to: process.env.OWNER_EMAIL,
        subject: `🚀 Novo Lead Recebido: ${name}`,
        html: `
          <h2>Novo contacto efetuado no site!</h2>
          <p><strong>Nome:</strong> ${name}</p>
          <p><strong>E-mail:</strong> ${email}</p>
          <p><strong>Telefone:</strong> ${phone || 'Não informado'}</p>
          <p><strong>Mensagem:</strong> ${message}</p>
          <hr/>
          <p style="color: #666; font-size: 12px;">Registado automaticamente no Supabase.</p>
        `
      });
    } catch (emailError) {
      console.error('Erro ao enviar e-mail:', emailError.message);
    }

    return res.status(201).json({ 
      success: true, 
      message: 'Lead registado com sucesso!',
      data 
    });

  } catch (err) {
    console.error('Erro ao processar lead:', err.message);
    return res.status(500).json({ 
      success: false, 
      error: 'Erro interno ao salvar o lead.' 
    });
  }
};

// 3. NOVO: Atualizar o status do CRM, se foi lido, ou motivo de não fechar
exports.updateLead = async (req, res) => {
  try {
    const { id } = req.params;
    const { lido, status_crm, motivo_nao_fechou } = req.body;

    const { data, error } = await supabase
      .from('leads')
      .update({ 
        ...(lido !== undefined && { lido }),
        ...(status_crm !== undefined && { status_crm }),
        ...(motivo_nao_fechou !== undefined && { motivo_nao_fechou })
      })
      .eq('id', id);

    if (error) throw error;

    return res.status(200).json({ 
      success: true, 
      message: 'Lead atualizado com sucesso no CRM!',
      data 
    });

  } catch (err) {
    console.error('Erro ao atualizar lead:', err.message);
    return res.status(500).json({ 
      success: false, 
      error: 'Erro ao atualizar lead.' 
    });
  }
};