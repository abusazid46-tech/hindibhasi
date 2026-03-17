// js/members.js - Core Member Functions Module

const MembersModule = (function() {
    // Supabase client (will be initialized from page)
    let supabaseClient = null;

    // Initialize with supabase client
    function init(client) {
        supabaseClient = client;
        console.log('✅ MembersModule initialized');
    }

    // Private helper functions
    async function getCurrentUser() {
        if (!supabaseClient) throw new Error('MembersModule not initialized');
        const { data: { user } } = await supabaseClient.auth.getUser();
        return user;
    }

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
        // Initialize module
        init,

        // Get current user
        getCurrentUser,

        // PUBLIC FACING FUNCTIONS
        async getApprovedMembers(page = 1, pageSize = 12, filters = {}) {
            try {
                if (!supabaseClient) throw new Error('MembersModule not initialized');
                
                let query = supabaseClient
                    .from('members')
                    .select('*', { count: 'exact' })
                    .eq('status', 'approved')
                    .order('name');
                
                // Apply search filter
                if (filters.search) {
                    query = query.or(`name.ilike.%${filters.search}%,village.ilike.%${filters.search}%`);
                }
                
                // Apply district filter
                if (filters.district && filters.district !== 'all') {
                    query = query.eq('district', filters.district);
                }
                
                // Pagination
                const from = (page - 1) * pageSize;
                const to = from + pageSize - 1;
                
                const { data, count, error } = await query.range(from, to);
                
                if (error) throw error;
                return { success: true, data, count, page, pageSize };
                
            } catch (error) {
                console.error('Error fetching members:', error);
                return { success: false, error: error.message, data: [], count: 0 };
            }
        },

        // Get all districts for filter dropdown
        async getDistricts() {
            try {
                if (!supabaseClient) throw new Error('MembersModule not initialized');
                
                const { data, error } = await supabaseClient
                    .from('members')
                    .select('district')
                    .eq('status', 'approved')
                    .order('district');
                
                if (error) throw error;
                
                // Get unique districts
                const districts = [...new Set(data.map(item => item.district))];
                return { success: true, districts };
                
            } catch (error) {
                console.error('Error fetching districts:', error);
                return { success: false, error: error.message, districts: [] };
            }
        },

        // Get single member by ID
        async getMemberById(memberId) {
            try {
                if (!supabaseClient) throw new Error('MembersModule not initialized');
                
                const { data, error } = await supabaseClient
                    .from('members')
                    .select('*')
                    .eq('id', memberId)
                    .single();
                
                if (error) throw error;
                return { success: true, data };
                
            } catch (error) {
                console.error('Error fetching member:', error);
                return { success: false, error: error.message };
            }
        },

        // REGISTRATION FUNCTIONS
        async registerMember(formData, photoFile) {
            try {
                if (!supabaseClient) throw new Error('MembersModule not initialized');
                
                // Upload photo if provided
                let photoUrl = null;
                if (photoFile) {
                    const fileExt = photoFile.name.split('.').pop();
                    const fileName = `member-photos/${Date.now()}.${fileExt}`;
                    
                    const { error: uploadError } = await supabaseClient.storage
                        .from('member-photos')
                        .upload(fileName, photoFile);
                    
                    if (uploadError) throw uploadError;
                    
                    const { data: { publicUrl } } = supabaseClient.storage
                        .from('member-photos')
                        .getPublicUrl(fileName);
                    
                    photoUrl = publicUrl;
                }
                
                // Insert member record
                const { data, error } = await supabaseClient
                    .from('members')
                    .insert([{
                        name: formData.name,
                        district: formData.district,
                        village: formData.village,
                        phone: formData.phone,
                        email: formData.email || null,
                        photo_url: photoUrl,
                        registration_fee_paid: false,
                        status: 'pending',
                        address: formData.address,
                        occupation: formData.occupation,
                        date_of_birth: formData.dob || null,
                        blood_group: formData.blood_group || null,
                        emergency_contact: formData.emergency_phone || null
                    }])
                    .select()
                    .single();
                
                if (error) throw error;
                
                return { success: true, data };
                
            } catch (error) {
                console.error('Registration error:', error);
                return { success: false, error: error.message };
            }
        },

        // Update payment status after successful payment
        async updatePaymentStatus(memberId, transactionId) {
            try {
                if (!supabaseClient) throw new Error('MembersModule not initialized');
                
                const { data, error } = await supabaseClient
                    .from('members')
                    .update({
                        registration_fee_paid: true,
                        payment_transaction_id: transactionId
                    })
                    .eq('id', memberId)
                    .select()
                    .single();
                
                if (error) throw error;
                return { success: true, data };
                
            } catch (error) {
                console.error('Error updating payment:', error);
                return { success: false, error: error.message };
            }
        },

        // ADMIN FUNCTIONS
        async getMembersForAdmin(filters = {}, page = 1, pageSize = 10) {
            try {
                if (!supabaseClient) throw new Error('MembersModule not initialized');
                
                let query = supabaseClient
                    .from('members')
                    .select('*', { count: 'exact' });
                
                // Apply status filter
                if (filters.status && filters.status !== 'all') {
                    query = query.eq('status', filters.status);
                }
                
                // Apply search filter
                if (filters.search) {
                    query = query.or(`
                        name.ilike.%${filters.search}%,
                        phone.ilike.%${filters.search}%,
                        email.ilike.%${filters.search}%,
                        membership_id.ilike.%${filters.search}%
                    `);
                }
                
                // Apply district filter
                if (filters.district && filters.district !== 'all') {
                    query = query.eq('district', filters.district);
                }
                
                // Apply sorting
                switch (filters.sort || 'newest') {
                    case 'newest':
                        query = query.order('created_at', { ascending: false });
                        break;
                    case 'oldest':
                        query = query.order('created_at', { ascending: true });
                        break;
                    case 'name':
                        query = query.order('name');
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
                console.error('Error fetching members for admin:', error);
                return { success: false, error: error.message, data: [], count: 0 };
            }
        },

        async approveMember(memberId, adminId) {
            try {
                if (!supabaseClient) throw new Error('MembersModule not initialized');
                
                // First, generate membership ID
                const year = new Date().getFullYear();
                const { count, error: countError } = await supabaseClient
                    .from('members')
                    .select('*', { count: 'exact', head: true })
                    .eq('status', 'approved')
                    .gte('approved_at', `${year}-01-01`);
                
                if (countError) throw countError;
                
                const sequentialNumber = (count || 0) + 1;
                const membershipId = `AHBBM/${year}/${sequentialNumber.toString().padStart(5, '0')}`;
                
                // Update member
                const { data, error } = await supabaseClient
                    .from('members')
                    .update({ 
                        status: 'approved',
                        approved_at: new Date().toISOString(),
                        approved_by: adminId,
                        membership_id: membershipId
                    })
                    .eq('id', memberId)
                    .select()
                    .single();
                
                if (error) throw error;
                
                return { success: true, data, membershipId };
                
            } catch (error) {
                console.error('Error approving member:', error);
                return { success: false, error: error.message };
            }
        },

        async rejectMember(memberId, reason) {
            try {
                if (!supabaseClient) throw new Error('MembersModule not initialized');
                
                const { data, error } = await supabaseClient
                    .from('members')
                    .update({ 
                        status: 'rejected',
                        notes: reason
                    })
                    .eq('id', memberId)
                    .select()
                    .single();
                
                if (error) throw error;
                
                return { success: true, data };
                
            } catch (error) {
                console.error('Error rejecting member:', error);
                return { success: false, error: error.message };
            }
        },

        async deleteMember(memberId) {
            try {
                if (!supabaseClient) throw new Error('MembersModule not initialized');
                
                const { error } = await supabaseClient
                    .from('members')
                    .delete()
                    .eq('id', memberId);
                
                if (error) throw error;
                
                return { success: true };
                
            } catch (error) {
                console.error('Error deleting member:', error);
                return { success: false, error: error.message };
            }
        },

        async getPendingCount() {
            try {
                if (!supabaseClient) throw new Error('MembersModule not initialized');
                
                const { count, error } = await supabaseClient
                    .from('members')
                    .select('*', { count: 'exact', head: true })
                    .eq('status', 'pending');
                
                if (error) throw error;
                
                return { success: true, count: count || 0 };
                
            } catch (error) {
                console.error('Error getting pending count:', error);
                return { success: false, error: error.message, count: 0 };
            }
        },

        // MEMBERSHIP CARD FUNCTIONS
        generateMembershipCardHTML(member) {
            const cardHTML = `
                <div style="font-family: 'Poppins', sans-serif; max-width: 400px; margin: 0 auto; background: linear-gradient(135deg, #fef8f0, #fce3d5); border-radius: 20px; padding: 20px; border: 3px solid gold; text-align: center;">
                    <div style="margin-bottom: 15px;">
                        <img src="${member.photo_url || 'https://via.placeholder.com/100'}" style="width: 100px; height: 100px; border-radius: 50%; border: 3px solid #b3412e;" onerror="this.src='https://via.placeholder.com/100?text=🕉️'">
                    </div>
                    <h2 style="color: #b3412e; margin-bottom: 5px;">${escapeHtml(member.name)}</h2>
                    <p style="color: #666; margin-bottom: 15px;">Member ID: ${member.membership_id || 'Pending'}</p>
                    
                    <div style="background: white; border-radius: 15px; padding: 15px; margin-bottom: 15px;">
                        <p><strong>District:</strong> ${escapeHtml(member.district)}</p>
                        <p><strong>Village:</strong> ${escapeHtml(member.village || 'N/A')}</p>
                        <p><strong>Phone:</strong> ${escapeHtml(member.phone)}</p>
                        <p><strong>Valid Until:</strong> Lifetime</p>
                    </div>
                    
                    <div style="border-top: 2px dashed #b3412e; padding-top: 15px;">
                        <p style="font-size: 12px; color: #666;">Asom Hindi Bhasi Brahman Mahasabha</p>
                        <p style="font-size: 10px; color: #999;">धर्मो रक्षति रक्षितः</p>
                    </div>
                </div>
            `;
            
            return cardHTML;
        },

        downloadMembershipCard(member) {
            const cardHTML = this.generateMembershipCardHTML(member);
            
            const win = window.open('', '_blank');
            win.document.write(`
                <html>
                    <head>
                        <title>Membership Card - ${escapeHtml(member.name)}</title>
                        <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;600;700&display=swap" rel="stylesheet">
                        <style>
                            body { 
                                background: #f5f5f5; 
                                display: flex; 
                                justify-content: center; 
                                align-items: center; 
                                min-height: 100vh; 
                                margin: 0; 
                                padding: 20px;
                                font-family: 'Poppins', sans-serif;
                            }
                            @media print {
                                body { background: white; }
                            }
                        </style>
                    </head>
                    <body>
                        ${cardHTML}
                        <script>
                            window.onload = function() {
                                setTimeout(() => {
                                    window.print();
                                }, 500);
                            }
                        <\/script>
                    </body>
                </html>
            `);
            win.document.close();
        },

        // Helper utilities (expose for pages)
        helpers: {
            escapeHtml,
            formatDate
        }
    };
})();

// Make module available globally
window.MembersModule = MembersModule;
