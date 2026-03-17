// js/documents.js - Documents Management Module

const DocumentsModule = (function() {
    // Supabase client (will be initialized from page)
    let supabaseClient = null;

    // Initialize with supabase client
    function init(client) {
        supabaseClient = client;
        console.log('✅ DocumentsModule initialized');
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

    function formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    // Public API
    return {
        init,

        // PUBLIC FUNCTIONS - Get documents for website
        async getDocumentsByCategory(category = 'all') {
            try {
                if (!supabaseClient) throw new Error('DocumentsModule not initialized');
                
                let query = supabaseClient
                    .from('documents')
                    .select('*')
                    .eq('is_public', true)
                    .order('created_at', { ascending: false });
                
                if (category !== 'all') {
                    query = query.eq('category', category);
                }
                
                const { data, error } = await query;
                
                if (error) throw error;
                return { success: true, data };
                
            } catch (error) {
                console.error('Error fetching documents:', error);
                return { success: false, error: error.message, data: [] };
            }
        },

        async getDocumentById(docId) {
            try {
                if (!supabaseClient) throw new Error('DocumentsModule not initialized');
                
                const { data, error } = await supabaseClient
                    .from('documents')
                    .select('*')
                    .eq('id', docId)
                    .single();
                
                if (error) throw error;
                
                // Increment download count
                await supabaseClient
                    .from('documents')
                    .update({ download_count: (data.download_count || 0) + 1 })
                    .eq('id', docId);
                
                return { success: true, data };
                
            } catch (error) {
                console.error('Error fetching document:', error);
                return { success: false, error: error.message };
            }
        },

        // ADMIN FUNCTIONS
        async getAllDocumentsForAdmin(filters = {}, page = 1, pageSize = 15) {
            try {
                if (!supabaseClient) throw new Error('DocumentsModule not initialized');
                
                let query = supabaseClient
                    .from('documents')
                    .select('*', { count: 'exact' });
                
                // Apply category filter
                if (filters.category && filters.category !== 'all') {
                    query = query.eq('category', filters.category);
                }
                
                // Apply public/private filter
                if (filters.is_public !== undefined) {
                    query = query.eq('is_public', filters.is_public);
                }
                
                // Apply search filter
                if (filters.search) {
                    query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
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
                    case 'downloads':
                        query = query.order('download_count', { ascending: false });
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
                console.error('Error fetching documents for admin:', error);
                return { success: false, error: error.message, data: [], count: 0 };
            }
        },

        async uploadDocument(file, documentData) {
            try {
                if (!supabaseClient) throw new Error('DocumentsModule not initialized');
                
                // Upload file to storage
                const fileExt = file.name.split('.').pop();
                const fileName = `documents/${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.]/g, '_')}`;
                
                const { error: uploadError } = await supabaseClient.storage
                    .from('documents')
                    .upload(fileName, file);
                
                if (uploadError) throw uploadError;
                
                const { data: { publicUrl } } = supabaseClient.storage
                    .from('documents')
                    .getPublicUrl(fileName);
                
                // Insert document record
                const { data, error } = await supabaseClient
                    .from('documents')
                    .insert([{
                        title: documentData.title,
                        description: documentData.description,
                        file_url: publicUrl,
                        file_size: file.size,
                        file_type: file.type,
                        category: documentData.category,
                        version: documentData.version || '1.0',
                        is_public: documentData.is_public !== false,
                        effective_date: documentData.effective_date || null,
                        expiry_date: documentData.expiry_date || null,
                        download_count: 0
                    }])
                    .select()
                    .single();
                
                if (error) throw error;
                
                return { success: true, data };
                
            } catch (error) {
                console.error('Error uploading document:', error);
                return { success: false, error: error.message };
            }
        },

        async updateDocument(docId, updates, newFile = null) {
            try {
                if (!supabaseClient) throw new Error('DocumentsModule not initialized');
                
                let updateData = { ...updates };
                
                // Upload new file if provided
                if (newFile) {
                    // Get old document to delete old file
                    const oldDoc = await this.getDocumentById(docId);
                    
                    if (oldDoc.success && oldDoc.data.file_url) {
                        // Extract filename from URL
                        const urlParts = oldDoc.data.file_url.split('/');
                        const fileName = urlParts[urlParts.length - 1];
                        
                        // Delete old file
                        await supabaseClient.storage
                            .from('documents')
                            .remove([fileName]);
                    }
                    
                    // Upload new file
                    const fileExt = newFile.name.split('.').pop();
                    const fileName = `documents/${Date.now()}_${newFile.name.replace(/[^a-zA-Z0-9.]/g, '_')}`;
                    
                    const { error: uploadError } = await supabaseClient.storage
                        .from('documents')
                        .upload(fileName, newFile);
                    
                    if (uploadError) throw uploadError;
                    
                    const { data: { publicUrl } } = supabaseClient.storage
                        .from('documents')
                        .getPublicUrl(fileName);
                    
                    updateData.file_url = publicUrl;
                    updateData.file_size = newFile.size;
                    updateData.file_type = newFile.type;
                }
                
                const { data, error } = await supabaseClient
                    .from('documents')
                    .update(updateData)
                    .eq('id', docId)
                    .select()
                    .single();
                
                if (error) throw error;
                
                return { success: true, data };
                
            } catch (error) {
                console.error('Error updating document:', error);
                return { success: false, error: error.message };
            }
        },

        async deleteDocument(docId) {
            try {
                if (!supabaseClient) throw new Error('DocumentsModule not initialized');
                
                // Get document to delete file from storage
                const doc = await this.getDocumentById(docId);
                
                if (doc.success && doc.data.file_url) {
                    // Extract filename from URL
                    const urlParts = doc.data.file_url.split('/');
                    const fileName = urlParts[urlParts.length - 1];
                    
                    // Delete from storage
                    await supabaseClient.storage
                        .from('documents')
                        .remove([fileName]);
                }
                
                // Delete from database
                const { error } = await supabaseClient
                    .from('documents')
                    .delete()
                    .eq('id', docId);
                
                if (error) throw error;
                
                return { success: true };
                
            } catch (error) {
                console.error('Error deleting document:', error);
                return { success: false, error: error.message };
            }
        },

        async togglePublic(docId, isPublic) {
            try {
                if (!supabaseClient) throw new Error('DocumentsModule not initialized');
                
                const { data, error } = await supabaseClient
                    .from('documents')
                    .update({ is_public: isPublic })
                    .eq('id', docId)
                    .select()
                    .single();
                
                if (error) throw error;
                
                return { success: true, data };
                
            } catch (error) {
                console.error('Error toggling public status:', error);
                return { success: false, error: error.message };
            }
        },

        // Get categories with counts
        async getCategories() {
            try {
                if (!supabaseClient) throw new Error('DocumentsModule not initialized');
                
                const { data, error } = await supabaseClient
                    .from('documents')
                    .select('category', { count: 'exact' });
                
                if (error) throw error;
                
                const categories = {};
                data.forEach(item => {
                    categories[item.category] = (categories[item.category] || 0) + 1;
                });
                
                return { success: true, categories };
                
            } catch (error) {
                console.error('Error getting categories:', error);
                return { success: false, error: error.message };
            }
        },

        // Download document (triggers browser download)
        downloadDocument(url, filename) {
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
        },

        // Helpers
        helpers: {
            escapeHtml,
            formatDate,
            formatFileSize
        },

        // Category labels for display
        categoryLabels: {
            'constitution': '📜 Constitution',
            'form': '📝 Membership Form',
            'minutes': '📋 Meeting Minutes',
            'report': '📊 Annual Report',
            'other': '📁 Other Documents'
        }
    };
})();

// Make module available globally
window.DocumentsModule = DocumentsModule;
