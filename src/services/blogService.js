// src/services/blogService.js
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

const blogBackendService = {
  async getAllPosts() {
    const { data, error } = await supabase
      .from('blog')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  async createPost(postData) {
    const { title, author, date, media_url, media_alt, breadcrumbs, paragraphs, button_data } = postData;
    
    const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');

    const { data, error } = await supabase
      .from('blog')
      .insert([{
        slug,
        title,
        author: author || 'Mover SaaS',
        date: date || new Date().toLocaleDateString(),
        media_type: 'image',
        media_url,
        media_alt,
        breadcrumbs,
        paragraphs,
        button_data
      }]);

    if (error) throw error;
    return data;
  },

  async updatePost(id, updateData) {
    const { data, error } = await supabase
      .from('blog')
      .update(updateData)
      .eq('id', id);

    if (error) throw error;
    return data;
  },

  async deletePost(id) {
    const { error } = await supabase
      .from('blog')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return true;
  }
};

module.exports = blogBackendService;