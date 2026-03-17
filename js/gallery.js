// js/gallery.js - Gallery Management Module

const GalleryModule = (function() {
    // Supabase client (will be initialized from page)
    let supabaseClient = null;

    // Initialize with supabase client
    function init(client) {
        supabaseClient = client;
        console.log('✅ GalleryModule initialized');
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

    // Public API
    return {
        init,

        // PUBLIC FUNCTIONS - Get gallery items for website
        async getGalleryItems(type = 'all', page = 1, pageSize = 12) {
            try {
                if (!supabaseClient) throw new Error('GalleryModule not initialized');
                
                let query = supabaseClient
                    .from('gallery')
                    .select('*', { count: 'exact' })
                    .order('created_at', { ascending: false });
                
                if (type !== 'all') {
                    query = query.eq('type', type);
                }
                
                const from = (page - 1) * pageSize;
                const to = from + pageSize - 1;
                
                const { data, count, error } = await query.range(from, to);
                
                if (error) throw error;
                return { success: true, data, count, page, pageSize };
                
            } catch (error) {
                console.error('Error fetching gallery:', error);
                return { success: false, error: error.message, data: [] };
            }
        },

        async getFeaturedItems(limit = 6) {
            try {
                if (!supabaseClient) throw new Error('GalleryModule not initialized');
                
                const { data, error } = await supabaseClient
                    .from('gallery')
                    .select('*')
                    .eq('is_featured', true)
                    .order('created_at', { ascending: false })
                    .limit(limit);
                
                if (error) throw error;
                return { success: true, data };
                
            } catch (error) {
                console.error('Error fetching featured gallery:', error);
                return { success: false, error: error.message, data: [] };
            }
        },

        async getGalleryItemById(itemId) {
            try {
                if (!supabaseClient) throw new Error('GalleryModule not initialized');
                
                const { data, error } = await supabaseClient
                    .from('gallery')
                    .select('*')
                    .eq('id', itemId)
                    .single();
                
                if (error) throw error;
                return { success: true, data };
                
            } catch (error) {
                console.error('Error fetching gallery item:', error);
                return { success: false, error: error.message };
            }
        },

        // ADMIN FUNCTIONS
        async getAllItemsForAdmin(filters = {}, page = 1, pageSize = 15) {
            try {
                if (!supabaseClient) throw new Error('GalleryModule not initialized');
                
                let query = supabaseClient
                    .from('gallery')
                    .select('*', { count: 'exact' });
                
                // Apply type filter
                if (filters.type && filters.type !== 'all') {
                    query = query.eq('type', filters.type);
                }
                
                // Apply search filter
                if (filters.search) {
                    query = query.ilike('title', `%${filters.search}%`);
                }
                
                // Apply sorting
                switch (filters.sort || 'newest') {
                    case 'newest':
                        query = query.order('created_at', { ascending: false });
                        break;
                    case 'oldest':
                        query = query.order('created_at', { ascending: true });
                        break;
                    case 'title':
                        query = query.order('title');
                        break;
                }
                
                const { count, error: countError } = await query.select('*', { count: 'exact', head: true });
                if (countError) throw countError;
                
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
                console.error('Error fetching gallery for admin:', error);
                return { success: false, error: error.message, data: [], count: 0 };
            }
        },

        async uploadImage(file, title, description = '', isFeatured = false) {
            try {
                if (!supabaseClient) throw new Error('GalleryModule not initialized');
                
                // Upload file to storage
                const fileExt = file.name.split('.').pop();
                const fileName = `gallery-images/${Date.now()}.${fileExt}`;
                
                const { error: uploadError } = await supabaseClient.storage
                    .from('gallery-images')
                    .upload(fileName, file);
                
                if (uploadError) throw uploadError;
                
                const { data: { publicUrl } } = supabaseClient.storage
                    .from('gallery-images')
                    .getPublicUrl(fileName);
                
                // Create thumbnail URL (using the same image for now)
                const thumbnailUrl = publicUrl;
                
                // Insert gallery record
                const { data, error } = await supabaseClient
                    .from('gallery')
                    .insert([{
                        type: 'image',
                        title: title,
                        description: description,
                        file_url: publicUrl,
                        thumbnail_url: thumbnailUrl,
                        is_featured: isFeatured
                    }])
                    .select()
                    .single();
                
                if (error) throw error;
                
                return { success: true, data };
                
            } catch (error) {
                console.error('Error uploading image:', error);
                return { success: false, error: error.message };
            }
        },

        async uploadVideo(file, title, description = '', isFeatured = false) {
            try {
                if (!supabaseClient) throw new Error('GalleryModule not initialized');
                
                // Upload file to storage
                const fileExt = file.name.split('.').pop();
                const fileName = `gallery-videos/${Date.now()}.${fileExt}`;
                
                const { error: uploadError } = await supabaseClient.storage
                    .from('gallery-videos')
                    .upload(fileName, file);
                
                if (uploadError) throw uploadError;
                
                const { data: { publicUrl } } = supabaseClient.storage
                    .from('gallery-videos')
                    .getPublicUrl(fileName);
                
                // Insert gallery record
                const { data, error } = await supabaseClient
                    .from('gallery')
                    .insert([{
                        type: 'video',
                        title: title,
                        description: description,
                        file_url: publicUrl,
                        thumbnail_url: publicUrl, // Videos will show video player
                        is_featured: isFeatured
                    }])
                    .select()
                    .single();
                
                if (error) throw error;
                
                return { success: true, data };
                
            } catch (error) {
                console.error('Error uploading video:', error);
                return { success: false, error: error.message };
            }
        },

        async updateGalleryItem(itemId, updates, newFile = null) {
            try {
                if (!supabaseClient) throw new Error('GalleryModule not initialized');
                
                let updateData = { ...updates };
                
                // Upload new file if provided
                if (newFile) {
                    const item = await this.getGalleryItemById(itemId);
                    if (item.success) {
                        const bucket = item.data.type === 'image' ? 'gallery-images' : 'gallery-videos';
                        const fileExt = newFile.name.split('.').pop();
                        const fileName = `${bucket}/${Date.now()}.${fileExt}`;
                        
                        const { error: uploadError } = await supabaseClient.storage
                            .from(bucket)
                            .upload(fileName, newFile);
                        
                        if (uploadError) throw uploadError;
                        
                        const { data: { publicUrl } } = supabaseClient.storage
                            .from(bucket)
                            .getPublicUrl(fileName);
                        
                        updateData.file_url = publicUrl;
                        updateData.thumbnail_url = publicUrl;
                    }
                }
                
                const { data, error } = await supabaseClient
                    .from('gallery')
                    .update(updateData)
                    .eq('id', itemId)
                    .select()
                    .single();
                
                if (error) throw error;
                
                return { success: true, data };
                
            } catch (error) {
                console.error('Error updating gallery item:', error);
                return { success: false, error: error.message };
            }
        },

        async deleteGalleryItem(itemId) {
            try {
                if (!supabaseClient) throw new Error('GalleryModule not initialized');
                
                // Get item to delete file from storage
                const item = await this.getGalleryItemById(itemId);
                
                if (item.success && item.data.file_url) {
                    // Extract filename from URL
                    const urlParts = item.data.file_url.split('/');
                    const fileName = urlParts[urlParts.length - 1];
                    const bucket = item.data.type === 'image' ? 'gallery-images' : 'gallery-videos';
                    
                    // Delete from storage
                    await supabaseClient.storage
                        .from(bucket)
                        .remove([fileName]);
                }
                
                // Delete from database
                const { error } = await supabaseClient
                    .from('gallery')
                    .delete()
                    .eq('id', itemId);
                
                if (error) throw error;
                
                return { success: true };
                
            } catch (error) {
                console.error('Error deleting gallery item:', error);
                return { success: false, error: error.message };
            }
        },

        async toggleFeatured(itemId, isFeatured) {
            try {
                if (!supabaseClient) throw new Error('GalleryModule not initialized');
                
                const { data, error } = await supabaseClient
                    .from('gallery')
                    .update({ is_featured: isFeatured })
                    .eq('id', itemId)
                    .select()
                    .single();
                
                if (error) throw error;
                
                return { success: true, data };
                
            } catch (error) {
                console.error('Error toggling featured:', error);
                return { success: false, error: error.message };
            }
        },

        // Helpers
        helpers: {
            escapeHtml,
            formatDate
        }
    };
})();

// Make module available globally
window.GalleryModule = GalleryModule;
