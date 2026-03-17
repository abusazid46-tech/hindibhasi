// js/news.js - News Management Module

const NewsModule = (function() {
    // Supabase client (will be initialized from page)
    let supabaseClient = null;

    // Initialize with supabase client
    function init(client) {
        supabaseClient = client;
        console.log('✅ NewsModule initialized');
    }

    // Helper functions
    function escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    function formatDate(dateString) {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        });
    }

    function formatDateTime(dateString) {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    // Public API
    return {
        init,

        // PUBLIC FUNCTIONS - Get news for website
        async getLatestNews(limit = 10) {
            try {
                if (!supabaseClient) throw new Error('NewsModule not initialized');
                
                const { data, error } = await supabaseClient
                    .from('news')
                    .select('*')
                    .lte('publish_date', new Date().toISOString().split('T')[0])
                    .order('publish_date', { ascending: false })
                    .limit(limit);
                
                if (error) throw error;
                return { success: true, data };
                
            } catch (error) {
                console.error('Error fetching news:', error);
                return { success: false, error: error.message, data: [] };
            }
        },

        async getFeaturedNews(limit = 3) {
            try {
                if (!supabaseClient) throw new Error('NewsModule not initialized');
                
                const { data, error } = await supabaseClient
                    .from('news')
                    .select('*')
                    .eq('is_featured', true)
                    .lte('publish_date', new Date().toISOString().split('T')[0])
                    .order('publish_date', { ascending: false })
                    .limit(limit);
                
                if (error) throw error;
                return { success: true, data };
                
            } catch (error) {
                console.error('Error fetching featured news:', error);
                return { success: false, error: error.message, data: [] };
            }
        },

        async getImportantNews(limit = 5) {
            try {
                if (!supabaseClient) throw new Error('NewsModule not initialized');
                
                const { data, error } = await supabaseClient
                    .from('news')
                    .select('*')
                    .eq('is_important', true)
                    .lte('publish_date', new Date().toISOString().split('T')[0])
                    .order('publish_date', { ascending: false })
                    .limit(limit);
                
                if (error) throw error;
                return { success: true, data };
                
            } catch (error) {
                console.error('Error fetching important news:', error);
                return { success: false, error: error.message, data: [] };
            }
        },

        async getNewsById(newsId) {
            try {
                if (!supabaseClient) throw new Error('NewsModule not initialized');
                
                const { data, error } = await supabaseClient
                    .from('news')
                    .select('*')
                    .eq('id', newsId)
                    .single();
                
                if (error) throw error;
                
                // Increment view count
                await supabaseClient
                    .from('news')
                    .update({ views: (data.views || 0) + 1 })
                    .eq('id', newsId);
                
                return { success: true, data };
                
            } catch (error) {
                console.error('Error fetching news:', error);
                return { success: false, error: error.message };
            }
        },

        // ADMIN FUNCTIONS
        async getAllNewsForAdmin(filters = {}, page = 1, pageSize = 10) {
            try {
                if (!supabaseClient) throw new Error('NewsModule not initialized');
                
                let query = supabaseClient
                    .from('news')
                    .select('*', { count: 'exact' });
                
                // Apply filters
                if (filters.important !== undefined) {
                    query = query.eq('is_important', filters.important);
                }
                
                if (filters.featured !== undefined) {
                    query = query.eq('is_featured', filters.featured);
                }
                
                // Apply search filter
                if (filters.search) {
                    query = query.or(`title.ilike.%${filters.search}%,content.ilike.%${filters.search}%`);
                }
                
                // Apply sorting
                switch (filters.sort || 'newest') {
                    case 'newest':
                        query = query.order('publish_date', { ascending: false });
                        break;
                    case 'oldest':
                        query = query.order('publish_date', { ascending: true });
                        break;
                    case 'title':
                        query = query.order('title');
                        break;
                    case 'popular':
                        query = query.order('views', { ascending: false });
                        break;
                }
                
                // Get total count
                const { count, error: countError } = await query.select('*', { count: 'exact', head: true });
                if (countError) throw countError;
                
                // Apply pagination
                const from = (page - 1) * pageSize;
                const to = from + pageSize - 1;
                
                const { data, error } = await query.range(from, to);
                
                if (error) throw error;
                
                return { 
                    success: true, 
                    data, 
                    count, 
                    page, 
                    pageSize,
                    totalPages: Math.ceil(count / pageSize)
                };
                
            } catch (error) {
                console.error('Error fetching news for admin:', error);
                return { success: false, error: error.message, data: [], count: 0 };
            }
        },

        async createNews(newsData, imageFile = null) {
            try {
                if (!supabaseClient) throw new Error('NewsModule not initialized');
                
                let imageUrl = null;
                
                // Upload image if provided
                if (imageFile) {
                    const fileExt = imageFile.name.split('.').pop();
                    const fileName = `news-images/${Date.now()}.${fileExt}`;
                    
                    const { error: uploadError } = await supabaseClient.storage
                        .from('news-images')
                        .upload(fileName, imageFile);
                    
                    if (uploadError) throw uploadError;
                    
                    const { data: { publicUrl } } = supabaseClient.storage
                        .from('news-images')
                        .getPublicUrl(fileName);
                    
                    imageUrl = publicUrl;
                }
                
                // Insert news
                const { data, error } = await supabaseClient
                    .from('news')
                    .insert([{
                        title: newsData.title,
                        content: newsData.content,
                        summary: newsData.summary || newsData.content.substring(0, 150) + '...',
                        publish_date: newsData.publish_date || new Date().toISOString().split('T')[0],
                        expiry_date: newsData.expiry_date || null,
                        image_url: imageUrl,
                        is_featured: newsData.is_featured || false,
                        is_important: newsData.is_important || false,
                        views: 0
                    }])
                    .select()
                    .single();
                
                if (error) throw error;
                
                return { success: true, data };
                
            } catch (error) {
                console.error('Error creating news:', error);
                return { success: false, error: error.message };
            }
        },

        async updateNews(newsId, newsData, imageFile = null) {
            try {
                if (!supabaseClient) throw new Error('NewsModule not initialized');
                
                let updateData = { ...newsData };
                
                // Upload new image if provided
                if (imageFile) {
                    const fileExt = imageFile.name.split('.').pop();
                    const fileName = `news-images/${Date.now()}.${fileExt}`;
                    
                    const { error: uploadError } = await supabaseClient.storage
                        .from('news-images')
                        .upload(fileName, imageFile);
                    
                    if (uploadError) throw uploadError;
                    
                    const { data: { publicUrl } } = supabaseClient.storage
                        .from('news-images')
                        .getPublicUrl(fileName);
                    
                    updateData.image_url = publicUrl;
                }
                
                // Remove undefined fields
                Object.keys(updateData).forEach(key => 
                    updateData[key] === undefined && delete updateData[key]
                );
                
                const { data, error } = await supabaseClient
                    .from('news')
                    .update(updateData)
                    .eq('id', newsId)
                    .select()
                    .single();
                
                if (error) throw error;
                
                return { success: true, data };
                
            } catch (error) {
                console.error('Error updating news:', error);
                return { success: false, error: error.message };
            }
        },

        async deleteNews(newsId) {
            try {
                if (!supabaseClient) throw new Error('NewsModule not initialized');
                
                const { error } = await supabaseClient
                    .from('news')
                    .delete()
                    .eq('id', newsId);
                
                if (error) throw error;
                
                return { success: true };
                
            } catch (error) {
                console.error('Error deleting news:', error);
                return { success: false, error: error.message };
            }
        },

        async toggleFeatured(newsId, isFeatured) {
            try {
                if (!supabaseClient) throw new Error('NewsModule not initialized');
                
                const { data, error } = await supabaseClient
                    .from('news')
                    .update({ is_featured: isFeatured })
                    .eq('id', newsId)
                    .select()
                    .single();
                
                if (error) throw error;
                
                return { success: true, data };
                
            } catch (error) {
                console.error('Error toggling featured:', error);
                return { success: false, error: error.message };
            }
        },

        async toggleImportant(newsId, isImportant) {
            try {
                if (!supabaseClient) throw new Error('NewsModule not initialized');
                
                const { data, error } = await supabaseClient
                    .from('news')
                    .update({ is_important: isImportant })
                    .eq('id', newsId)
                    .select()
                    .single();
                
                if (error) throw error;
                
                return { success: true, data };
                
            } catch (error) {
                console.error('Error toggling important:', error);
                return { success: false, error: error.message };
            }
        },

        // Helpers
        helpers: {
            escapeHtml,
            formatDate,
            formatDateTime
        }
    };
})();

// Make module available globally
window.NewsModule = NewsModule;
