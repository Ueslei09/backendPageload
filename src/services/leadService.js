const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

class LeadService {
  async getLeads() {
    const { data, error } = await supabase
      .from('leads')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  }

  async createLead(leadData) {
    const { nome, email, telefone, origem } = leadData;
    if (!nome || !email) {
      throw new Error('Nome e e-mail são obrigatórios.');
    }

    const { data, error } = await supabase
      .from('leads')
      .insert([{
        nome,
        email,
        telefone,
        origem: origem || 'site',
        status_crm: 'ainda_nao_liguei',
        lido: false
      }]);

    if (error) throw error;
    return { message: 'Lead registado com sucesso!' };
  }

  async updateLead(id, updateData) {
    const { data, error } = await supabase
      .from('leads')
      .update(updateData)
      .eq('id', id);

    if (error) throw error;
    return { message: 'Lead atualizado com sucesso!' };
  }
}

module.exports = new LeadService();