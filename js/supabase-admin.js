// Admin-specific Supabase functions
const adminDb = {
    // Member management
    async getPendingMembers() {
        const { data, error } = await supabase
            .from('members')
            .select('*')
            .eq('status', 'pending')
            .order('created_at', { ascending: false });
        if (error) throw error;
        return data;
    },

    async approveMember(memberId, adminId) {
        const { data, error } = await supabase
            .from('members')
            .update({ 
                status: 'approved', 
                approved_at: new Date().toISOString(),
                approved_by: adminId
            })
            .eq('id', memberId)
            .select()
            .single();
        if (error) throw error;
        return data;
    },

    async rejectMember(memberId, reason) {
        const { data, error } = await supabase
            .from('members')
            .update({ 
                status: 'rejected',
                notes: reason
            })
            .eq('id', memberId)
            .select()
            .single();
        if (error) throw error;
        return data;
    },

    // Dashboard stats
    async getDashboardStats() {
        const { data, error } = await supabase
            .from('dashboard_stats')
            .select('*')
            .single();
        if (error) throw error;
        return data;
    },

    // Member directory with filters
    async getMemberDirectory(filters = {}, page = 1, pageSize = 20) {
        let query = supabase
            .from('member_directory')
            .select('*', { count: 'exact' });
        
        if (filters.district) {
            query = query.eq('district', filters.district);
        }
        if (filters.search) {
            query = query.or(`name.ilike.%${filters.search}%,phone.ilike.%${filters.search}%,membership_id.ilike.%${filters.search}%`);
        }
        
        const from = (page - 1) * pageSize;
        const to = from + pageSize - 1;
        
        const { data, count, error } = await query
            .range(from, to)
            .order('name');
        
        if (error) throw error;
        return { data, count, page, pageSize };
    },

    // Upload file to storage
    async uploadFile(bucket, file, path) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${path}/${Date.now()}.${fileExt}`;
        
        const { data, error } = await supabase.storage
            .from(bucket)
            .upload(fileName, file);
        
        if (error) throw error;
        
        const { data: { publicUrl } } = supabase.storage
            .from(bucket)
            .getPublicUrl(fileName);
        
        return publicUrl;
    },

    // Delete file from storage
    async deleteFile(bucket, fileUrl) {
        const fileName = fileUrl.split('/').pop();
        const { error } = await supabase.storage
            .from(bucket)
            .remove([fileName]);
        
        if (error) throw error;
        return true;
    },

    // Get districts list for filters
    async getDistricts() {
        const { data, error } = await supabase
            .from('members')
            .select('district')
            .eq('status', 'approved')
            .order('district');
        
        if (error) throw error;
        
        // Get unique districts
        const districts = [...new Set(data.map(item => item.district))];
        return districts;
    }
};
