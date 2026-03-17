// Members Module - Handles all member-related operations

const MembersModule = (function() {
    // Private functions
    async function getCurrentUser() {
        const { data: { user } } = await supabase.auth.getUser();
        return user;
    }

    // Public API
    return {
        // Get approved members for public directory
        async getApprovedMembers(page = 1, pageSize = 12, filters = {}) {
            try {
                let query = supabase
                    .from('members')
                    .select('*', { count: 'exact' })
                    .eq('status', 'approved')
                    .order('name');
                
                // Apply filters
                if (filters.search) {
                    query = query.or(`name.ilike.%${filters.search}%,village.ilike.%${filters.search}%`);
                }
                
                if (filters.district && filters.district !== 'all') {
                    query = query.eq('district', filters.district);
                }
                
                // Pagination
                const from = (page - 1) * pageSize;
                const to = from + pageSize - 1;
                
                const { data, count, error } = await query.range(from, to);
                
                if (error) throw error;
                return { data, count, page, pageSize };
                
            } catch (error) {
                console.error('Error fetching members:', error);
                return { data: [], count: 0, page, pageSize };
            }
        },

        // Register new member
        async registerMember(formData, photoFile) {
            try {
                // Upload photo if provided
                let photoUrl = null;
                if (photoFile) {
                    const fileExt = photoFile.name.split('.').pop();
                    const fileName = `member-photos/${Date.now()}.${fileExt}`;
                    
                    const { error: uploadError } = await supabase.storage
                        .from('member-photos')
                        .upload(fileName, photoFile);
                    
                    if (uploadError) throw uploadError;
                    
                    const { data: { publicUrl } } = supabase.storage
                        .from('member-photos')
                        .getPublicUrl(fileName);
                    
                    photoUrl = publicUrl;
                }
                
                // Insert member record
                const { data, error } = await supabase
                    .from('members')
                    .insert([{
                        name: formData.name,
                        district: formData.district,
                        village: formData.village,
                        phone: formData.phone,
                        email: formData.email || null,
                        photo_url: photoUrl,
                        registration_fee_paid: false, // Will be updated after payment
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

        // Process membership payment (₹49)
        async processPayment(memberId, amount = 49) {
            // This will integrate with Razorpay
            // For now, return mock success
            return new Promise((resolve) => {
                setTimeout(() => {
                    resolve({ success: true, transaction_id: 'TXN' + Date.now() });
                }, 1000);
            });
        },

        // Update payment status after successful payment
        async updatePaymentStatus(memberId, transactionId) {
            try {
                const { data, error } = await supabase
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

        // Get all districts for filter dropdown
        async getDistricts() {
            try {
                const { data, error } = await supabase
                    .from('members')
                    .select('district')
                    .eq('status', 'approved')
                    .order('district');
                
                if (error) throw error;
                
                // Get unique districts
                const districts = [...new Set(data.map(item => item.district))];
                return districts;
                
            } catch (error) {
                console.error('Error fetching districts:', error);
                return [];
            }
        },

        // Generate digital membership card
        generateMembershipCard(member) {
            const cardHTML = `
                <div style="font-family: 'Poppins', sans-serif; max-width: 400px; margin: 0 auto; background: linear-gradient(135deg, #fef8f0, #fce3d5); border-radius: 20px; padding: 20px; border: 3px solid gold; text-align: center;">
                    <div style="margin-bottom: 15px;">
                        <img src="${member.photo_url || 'https://via.placeholder.com/100'}" style="width: 100px; height: 100px; border-radius: 50%; border: 3px solid #b3412e;" onerror="this.src='https://via.placeholder.com/100?text=🕉️'">
                    </div>
                    <h2 style="color: #b3412e; margin-bottom: 5px;">${member.name}</h2>
                    <p style="color: #666; margin-bottom: 15px;">Member ID: ${member.membership_id || 'Pending'}</p>
                    
                    <div style="background: white; border-radius: 15px; padding: 15px; margin-bottom: 15px;">
                        <p><strong>District:</strong> ${member.district}</p>
                        <p><strong>Village:</strong> ${member.village || 'N/A'}</p>
                        <p><strong>Phone:</strong> ${member.phone}</p>
                    </div>
                    
                    <div style="border-top: 2px dashed #b3412e; padding-top: 15px;">
                        <p style="font-size: 12px; color: #666;">Asom Hindi Bhasi Brahman Mahasabha</p>
                        <p style="font-size: 10px; color: #999;">धर्मो रक्षति रक्षितः</p>
                    </div>
                </div>
            `;
            
            return cardHTML;
        },

        // Download membership card as PDF
        downloadCard(member) {
            const cardHTML = this.generateMembershipCard(member);
            
            const win = window.open('', '_blank');
            win.document.write(`
                <html>
                    <head>
                        <title>Membership Card - ${member.name}</title>
                        <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;600;700&display=swap" rel="stylesheet">
                    </head>
                    <body style="background: #f5f5f5; display: flex; justify-content: center; align-items: center; min-height: 100vh; margin: 0; padding: 20px;">
                        ${cardHTML}
                        <script>
                            window.onload = function() {
                                window.print();
                            }
                        <\/script>
                    </body>
                </html>
            `);
            win.document.close();
        }
    };
})();
