// js/committee.js - Committee Management Module

const CommitteeModule = (function() {
    // Supabase client (will be initialized from page)
    let supabaseClient = null;

    // Initialize with supabase client
    function init(client) {
        supabaseClient = client;
        console.log('✅ CommitteeModule initialized');
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

        // PUBLIC FUNCTIONS - Get active committee members
        async getActiveCommittee() {
            try {
                if (!supabaseClient) throw new Error('CommitteeModule not initialized');
                
                const { data, error } = await supabaseClient
                    .from('office_bearers')
                    .select('*')
                    .eq('is_active', true)
                    .order('display_order', { ascending: true });
                
                if (error) throw error;
                return { success: true, data };
                
            } catch (error) {
                console.error('Error fetching committee:', error);
                return { success: false, error: error.message, data: [] };
            }
        },

        async getMemberById(memberId) {
            try {
                if (!supabaseClient) throw new Error('CommitteeModule not initialized');
                
                const { data, error } = await supabaseClient
                    .from('office_bearers')
                    .select('*')
                    .eq('id', memberId)
                    .single();
                
                if (error) throw error;
                return { success: true, data };
                
            } catch (error) {
                console.error('Error fetching committee member:', error);
                return { success: false, error: error.message };
            }
        },

        // ADMIN FUNCTIONS
        async getAllMembers(filters = {}, page = 1, pageSize = 20) {
            try {
                if (!supabaseClient) throw new Error('CommitteeModule not initialized');
                
                let query = supabaseClient
                    .from('office_bearers')
                    .select('*', { count: 'exact' });
                
                // Apply active filter
                if (filters.is_active !== undefined) {
                    query = query.eq('is_active', filters.is_active);
                }
                
                // Apply search filter
                if (filters.search) {
                    query = query.or(`
                        name.ilike.%${filters.search}%,
                        designation.ilike.%${filters.search}%,
                        district.ilike.%${filters.search}%
                    `);
                }
                
                // Apply sorting
                switch (filters.sort || 'order') {
                    case 'order':
                        query = query.order('display_order', { ascending: true });
                        break;
                    case 'name':
                        query = query.order('name');
                        break;
                    case 'designation':
                        query = query.order('designation');
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
                console.error('Error fetching committee members:', error);
                return { success: false, error: error.message, data: [], count: 0 };
            }
        },

        async createMember(memberData, photoFile = null) {
            try {
                if (!supabaseClient) throw new Error('CommitteeModule not initialized');
                
                let photoUrl = null;
                
                // Upload photo if provided
                if (photoFile) {
                    const fileExt = photoFile.name.split('.').pop();
                    const fileName = `committee/${Date.now()}.${fileExt}`;
                    
                    const { error: uploadError } = await supabaseClient.storage
                        .from('committee')
                        .upload(fileName, photoFile);
                    
                    if (uploadError) throw uploadError;
                    
                    const { data: { publicUrl } } = supabaseClient.storage
                        .from('committee')
                        .getPublicUrl(fileName);
                    
                    photoUrl = publicUrl;
                }
                
                // Get max display order
                const { data: maxOrderData } = await supabaseClient
                    .from('office_bearers')
                    .select('display_order')
                    .order('display_order', { ascending: false })
                    .limit(1);
                
                const maxOrder = maxOrderData && maxOrderData.length > 0 ? maxOrderData[0].display_order : 0;
                
                // Insert member
                const { data, error } = await supabaseClient
                    .from('office_bearers')
                    .insert([{
                        name: memberData.name,
                        photo_url: photoUrl,
                        designation: memberData.designation,
                        district: memberData.district,
                        phone: memberData.phone || null,
                        email: memberData.email || null,
                        bio: memberData.bio || null,
                        display_order: memberData.display_order || maxOrder + 1,
                        is_active: memberData.is_active !== false,
                        term_start: memberData.term_start || null,
                        term_end: memberData.term_end || null,
                        social_media: memberData.social_media || null
                    }])
                    .select()
                    .single();
                
                if (error) throw error;
                
                return { success: true, data };
                
            } catch (error) {
                console.error('Error creating committee member:', error);
                return { success: false, error: error.message };
            }
        },

        async updateMember(memberId, memberData, photoFile = null) {
            try {
                if (!supabaseClient) throw new Error('CommitteeModule not initialized');
                
                let updateData = { ...memberData };
                
                // Upload new photo if provided
                if (photoFile) {
                    // Get old member to delete old photo
                    const oldMember = await this.getMemberById(memberId);
                    
                    if (oldMember.success && oldMember.data.photo_url) {
                        // Extract filename from URL
                        const urlParts = oldMember.data.photo_url.split('/');
                        const fileName = urlParts[urlParts.length - 1];
                        
                        // Delete old photo
                        await supabaseClient.storage
                            .from('committee')
                            .remove([fileName]);
                    }
                    
                    // Upload new photo
                    const fileExt = photoFile.name.split('.').pop();
                    const fileName = `committee/${Date.now()}.${fileExt}`;
                    
                    const { error: uploadError } = await supabaseClient.storage
                        .from('committee')
                        .upload(fileName, photoFile);
                    
                    if (uploadError) throw uploadError;
                    
                    const { data: { publicUrl } } = supabaseClient.storage
                        .from('committee')
                        .getPublicUrl(fileName);
                    
                    updateData.photo_url = publicUrl;
                }
                
                const { data, error } = await supabaseClient
                    .from('office_bearers')
                    .update(updateData)
                    .eq('id', memberId)
                    .select()
                    .single();
                
                if (error) throw error;
                
                return { success: true, data };
                
            } catch (error) {
                console.error('Error updating committee member:', error);
                return { success: false, error: error.message };
            }
        },

        async deleteMember(memberId) {
            try {
                if (!supabaseClient) throw new Error('CommitteeModule not initialized');
                
                // Get member to delete photo
                const member = await this.getMemberById(memberId);
                
                if (member.success && member.data.photo_url) {
                    // Extract filename from URL
                    const urlParts = member.data.photo_url.split('/');
                    const fileName = urlParts[urlParts.length - 1];
                    
                    // Delete photo
                    await supabaseClient.storage
                        .from('committee')
                        .remove([fileName]);
                }
                
                // Delete from database
                const { error } = await supabaseClient
                    .from('office_bearers')
                    .delete()
                    .eq('id', memberId);
                
                if (error) throw error;
                
                return { success: true };
                
            } catch (error) {
                console.error('Error deleting committee member:', error);
                return { success: false, error: error.message };
            }
        },

        async toggleActive(memberId, isActive) {
            try {
                if (!supabaseClient) throw new Error('CommitteeModule not initialized');
                
                const { data, error } = await supabaseClient
                    .from('office_bearers')
                    .update({ is_active: isActive })
                    .eq('id', memberId)
                    .select()
                    .single();
                
                if (error) throw error;
                return { success: true, data };
                
            } catch (error) {
                console.error('Error toggling active status:', error);
                return { success: false, error: error.message };
            }
        },

        async reorderMembers(orders) {
            try {
                if (!supabaseClient) throw new Error('CommitteeModule not initialized');
                
                // orders should be array of {id, display_order}
                for (const item of orders) {
                    await supabaseClient
                        .from('office_bearers')
                        .update({ display_order: item.display_order })
                        .eq('id', item.id);
                }
                
                return { success: true };
                
            } catch (error) {
                console.error('Error reordering members:', error);
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
window.CommitteeModule = CommitteeModule;
