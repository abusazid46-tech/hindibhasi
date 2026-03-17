// js/contact.js - Contact Management Module

const ContactModule = (function() {
    // Supabase client (will be initialized from page)
    let supabaseClient = null;

    // Initialize with supabase client
    function init(client) {
        supabaseClient = client;
        console.log('✅ ContactModule initialized');
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
        return new Date(dateString).toLocaleString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    function formatDateOnly(dateString) {
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

        // PUBLIC FUNCTIONS - Submit contact form
        async submitContact(formData) {
            try {
                if (!supabaseClient) throw new Error('ContactModule not initialized');
                
                // Insert contact message
                const { data, error } = await supabaseClient
                    .from('contacts')
                    .insert([{
                        name: formData.name,
                        phone: formData.phone,
                        email: formData.email || null,
                        subject: formData.subject,
                        message: formData.message,
                        status: 'new',
                        is_urgent: formData.is_urgent || false,
                        created_at: new Date().toISOString()
                    }])
                    .select()
                    .single();
                
                if (error) throw error;
                
                // Send notification email (you can integrate with email service later)
                console.log('New contact form submission:', data);
                
                return { success: true, data };
                
            } catch (error) {
                console.error('Error submitting contact form:', error);
                return { success: false, error: error.message };
            }
        },

        // ADMIN FUNCTIONS
        async getAllMessages(filters = {}, page = 1, pageSize = 20) {
            try {
                if (!supabaseClient) throw new Error('ContactModule not initialized');
                
                let query = supabaseClient
                    .from('contacts')
                    .select('*', { count: 'exact' });
                
                // Apply status filter
                if (filters.status && filters.status !== 'all') {
                    query = query.eq('status', filters.status);
                }
                
                // Apply urgent filter
                if (filters.urgent !== undefined) {
                    query = query.eq('is_urgent', filters.urgent);
                }
                
                // Apply search filter
                if (filters.search) {
                    query = query.or(`
                        name.ilike.%${filters.search}%,
                        email.ilike.%${filters.search}%,
                        phone.ilike.%${filters.search}%,
                        subject.ilike.%${filters.search}%,
                        message.ilike.%${filters.search}%
                    `);
                }
                
                // Apply date range filter
                if (filters.from_date) {
                    query = query.gte('created_at', filters.from_date);
                }
                if (filters.to_date) {
                    query = query.lte('created_at', filters.to_date);
                }
                
                // Apply sorting
                switch (filters.sort || 'newest') {
                    case 'newest':
                        query = query.order('created_at', { ascending: false });
                        break;
                    case 'oldest':
                        query = query.order('created_at', { ascending: true });
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
                console.error('Error fetching messages:', error);
                return { success: false, error: error.message, data: [], count: 0 };
            }
        },

        async getMessageById(messageId) {
            try {
                if (!supabaseClient) throw new Error('ContactModule not initialized');
                
                const { data, error } = await supabaseClient
                    .from('contacts')
                    .select('*')
                    .eq('id', messageId)
                    .single();
                
                if (error) throw error;
                return { success: true, data };
                
            } catch (error) {
                console.error('Error fetching message:', error);
                return { success: false, error: error.message };
            }
        },

        async updateMessageStatus(messageId, status, response = null) {
            try {
                if (!supabaseClient) throw new Error('ContactModule not initialized');
                
                const updateData = {
                    status: status,
                    ...(response && { 
                        response: response,
                        responded_at: new Date().toISOString()
                    })
                };
                
                const { data, error } = await supabaseClient
                    .from('contacts')
                    .update(updateData)
                    .eq('id', messageId)
                    .select()
                    .single();
                
                if (error) throw error;
                return { success: true, data };
                
            } catch (error) {
                console.error('Error updating message status:', error);
                return { success: false, error: error.message };
            }
        },

        async markAsRead(messageId) {
            return this.updateMessageStatus(messageId, 'read');
        },

        async markAsReplied(messageId, response) {
            return this.updateMessageStatus(messageId, 'replied', response);
        },

        async deleteMessage(messageId) {
            try {
                if (!supabaseClient) throw new Error('ContactModule not initialized');
                
                const { error } = await supabaseClient
                    .from('contacts')
                    .delete()
                    .eq('id', messageId);
                
                if (error) throw error;
                return { success: true };
                
            } catch (error) {
                console.error('Error deleting message:', error);
                return { success: false, error: error.message };
            }
        },

        async getStats() {
            try {
                if (!supabaseClient) throw new Error('ContactModule not initialized');
                
                // Get counts for different statuses
                const [newCount, readCount, repliedCount, urgentCount] = await Promise.all([
                    supabaseClient.from('contacts').select('*', { count: 'exact', head: true }).eq('status', 'new'),
                    supabaseClient.from('contacts').select('*', { count: 'exact', head: true }).eq('status', 'read'),
                    supabaseClient.from('contacts').select('*', { count: 'exact', head: true }).eq('status', 'replied'),
                    supabaseClient.from('contacts').select('*', { count: 'exact', head: true }).eq('is_urgent', true)
                ]);
                
                return {
                    success: true,
                    data: {
                        new: newCount.count || 0,
                        read: readCount.count || 0,
                        replied: repliedCount.count || 0,
                        urgent: urgentCount.count || 0,
                        total: (newCount.count || 0) + (readCount.count || 0) + (repliedCount.count || 0)
                    }
                };
                
            } catch (error) {
                console.error('Error getting stats:', error);
                return { success: false, error: error.message };
            }
        },

        // Send email reply (you'll need to integrate with an email service)
        async sendEmailReply(to, subject, message) {
            // This would integrate with an email service like SendGrid, Resend, etc.
            console.log('Sending email to:', to, 'Subject:', subject, 'Message:', message);
            
            // For now, just return success (you'll implement actual email sending)
            return { success: true };
        },

        // Helpers
        helpers: {
            escapeHtml,
            formatDate,
            formatDateOnly
        },

        // Status labels for display
        statusLabels: {
            'new': '🆕 New',
            'read': '📖 Read',
            'replied': '✅ Replied'
        },

        statusColors: {
            'new': '#f39c12',
            'read': '#3498db',
            'replied': '#27ae60'
        }
    };
})();

// Make module available globally
window.ContactModule = ContactModule;
