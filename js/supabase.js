// Supabase configuration
const SUPABASE_URL = 'https://rhslmpccqrfgsaqhwwnl.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJoc2xtcGNjcXJmZ3NhcWh3d25sIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM2NTU0ODEsImV4cCI6MjA4OTIzMTQ4MX0.D3CJvzcSkaFZivDJtIXdKgFO3jUPBOq8i80Vz98eYcw';

// Initialize Supabase client
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Database helper functions
const db = {
    // Members
    members: {
        async getAll(status = 'approved', page = 1, limit = 10) {
            const from = (page - 1) * limit;
            const to = from + limit - 1;
            
            let query = supabase
                .from('members')
                .select('*', { count: 'exact' });
            
            if (status !== 'all') {
                query = query.eq('status', status);
            }
            
            const { data, error, count } = await query
                .order('created_at', { ascending: false })
                .range(from, to);
            
            if (error) throw error;
            return { data, count, page, limit };
        },

        async search(searchTerm, district = '', page = 1, limit = 10) {
            const from = (page - 1) * limit;
            const to = from + limit - 1;
            
            let query = supabase
                .from('members')
                .select('*', { count: 'exact' })
                .eq('status', 'approved');
            
            if (searchTerm) {
                query = query.or(`name.ilike.%${searchTerm}%,membership_id.ilike.%${searchTerm}%`);
            }
            
            if (district) {
                query = query.eq('district', district);
            }
            
            const { data, error, count } = await query
                .order('name')
                .range(from, to);
            
            if (error) throw error;
            return { data, count, page, limit };
        },

        async getById(id) {
            const { data, error } = await supabase
                .from('members')
                .select('*')
                .eq('id', id)
                .single();
            
            if (error) throw error;
            return data;
        },

        async create(member) {
            // Generate membership ID
            const year = new Date().getFullYear();
            const { count } = await supabase
                .from('members')
                .select('*', { count: 'exact', head: true });
            
            const serial = (count + 1).toString().padStart(4, '0');
            member.membership_id = `AHBBM/${year}/${serial}`;
            
            const { data, error } = await supabase
                .from('members')
                .insert([member])
                .select()
                .single();
            
            if (error) throw error;
            return data;
        },

        async update(id, updates) {
            updates.updated_at = new Date();
            
            const { data, error } = await supabase
                .from('members')
                .update(updates)
                .eq('id', id)
                .select()
                .single();
            
            if (error) throw error;
            return data;
        },

        async approve(id) {
            return this.update(id, { 
                status: 'approved', 
                approved_at: new Date() 
            });
        },

        async reject(id) {
            return this.update(id, { status: 'rejected' });
        },

        async getDistricts() {
            const { data, error } = await supabase
                .from('members')
                .select('district')
                .eq('status', 'approved')
                .order('district');
            
            if (error) throw error;
            return [...new Set(data.map(item => item.district))].filter(Boolean);
        }
    },

    // Events
    events: {
        async getAll(limit = 10, page = 1) {
            const from = (page - 1) * limit;
            const to = from + limit - 1;
            
            const { data, error, count } = await supabase
                .from('events')
                .select('*', { count: 'exact' })
                .order('date', { ascending: false })
                .range(from, to);
            
            if (error) throw error;
            return { data, count, page, limit };
        },

        async getUpcoming(limit = 5) {
            const { data, error } = await supabase
                .from('events')
                .select('*')
                .gte('date', new Date().toISOString().split('T')[0])
                .order('date', { ascending: true })
                .limit(limit);
            
            if (error) throw error;
            return data;
        },

        async create(event) {
            const { data, error } = await supabase
                .from('events')
                .insert([event])
                .select()
                .single();
            
            if (error) throw error;
            return data;
        },

        async update(id, updates) {
            updates.updated_at = new Date();
            
            const { data, error } = await supabase
                .from('events')
                .update(updates)
                .eq('id', id)
                .select()
                .single();
            
            if (error) throw error;
            return data;
        },

        async delete(id) {
            const { error } = await supabase
                .from('events')
                .delete()
                .eq('id', id);
            
            if (error) throw error;
            return true;
        }
    },

    // News
    news: {
        async getAll(limit = 10, page = 1, publishedOnly = true) {
            const from = (page - 1) * limit;
            const to = from + limit - 1;
            
            let query = supabase
                .from('news')
                .select('*', { count: 'exact' });
            
            if (publishedOnly) {
                query = query.eq('is_published', true);
            }
            
            const { data, error, count } = await query
                .order('date', { ascending: false })
                .range(from, to);
            
            if (error) throw error;
            return { data, count, page, limit };
        },

        async getLatest(limit = 3) {
            const { data, error } = await supabase
                .from('news')
                .select('*')
                .eq('is_published', true)
                .order('date', { ascending: false })
                .limit(limit);
            
            if (error) throw error;
            return data;
        },

        async create(newsItem) {
            const { data, error } = await supabase
                .from('news')
                .insert([newsItem])
                .select()
                .single();
            
            if (error) throw error;
            return data;
        },

        async update(id, updates) {
            updates.updated_at = new Date();
            
            const { data, error } = await supabase
                .from('news')
                .update(updates)
                .eq('id', id)
                .select()
                .single();
            
            if (error) throw error;
            return data;
        },

        async delete(id) {
            const { error } = await supabase
                .from('news')
                .delete()
                .eq('id', id);
            
            if (error) throw error;
            return true;
        }
    },

    // Gallery
    gallery: {
        async getAll(type = 'all', limit = 20, page = 1) {
            const from = (page - 1) * limit;
            const to = from + limit - 1;
            
            let query = supabase
                .from('gallery')
                .select('*', { count: 'exact' });
            
            if (type !== 'all') {
                query = query.eq('type', type);
            }
            
            const { data, error, count } = await query
                .order('uploaded_at', { ascending: false })
                .range(from, to);
            
            if (error) throw error;
            return { data, count, page, limit };
        },

        async create(item) {
            const { data, error } = await supabase
                .from('gallery')
                .insert([item])
                .select()
                .single();
            
            if (error) throw error;
            return data;
        },

        async delete(id) {
            const { error } = await supabase
                .from('gallery')
                .delete()
                .eq('id', id);
            
            if (error) throw error;
            return true;
        }
    },

    // Donations
    donations: {
        async create(donation) {
            const { data, error } = await supabase
                .from('donations')
                .insert([donation])
                .select()
                .single();
            
            if (error) throw error;
            return data;
        },

        async getAll(limit = 50, page = 1) {
            const from = (page - 1) * limit;
            const to = from + limit - 1;
            
            const { data, error, count } = await supabase
                .from('donations')
                .select('*', { count: 'exact' })
                .order('created_at', { ascending: false })
                .range(from, to);
            
            if (error) throw error;
            return { data, count, page, limit };
        },

        async getTotal() {
            const { data, error } = await supabase
                .from('donations')
                .select('amount')
                .eq('payment_status', 'completed');
            
            if (error) throw error;
            return data.reduce((sum, d) => sum + parseFloat(d.amount), 0);
        }
    },

    // Documents
    documents: {
        async getAll(category = 'all', limit = 20, page = 1) {
            const from = (page - 1) * limit;
            const to = from + limit - 1;
            
            let query = supabase
                .from('documents')
                .select('*', { count: 'exact' });
            
            if (category !== 'all') {
                query = query.eq('category', category);
            }
            
            const { data, error, count } = await query
                .order('uploaded_at', { ascending: false })
                .range(from, to);
            
            if (error) throw error;
            return { data, count, page, limit };
        },

        async create(document) {
            const { data, error } = await supabase
                .from('documents')
                .insert([document])
                .select()
                .single();
            
            if (error) throw error;
            return data;
        },

        async delete(id) {
            const { error } = await supabase
                .from('documents')
                .delete()
                .eq('id', id);
            
            if (error) throw error;
            return true;
        }
    },

    // Contacts
    contacts: {
        async create(contact) {
            const { data, error } = await supabase
                .from('contacts')
                .insert([contact])
                .select()
                .single();
            
            if (error) throw error;
            return data;
        },

        async getAll(limit = 50, page = 1) {
            const from = (page - 1) * limit;
            const to = from + limit - 1;
            
            const { data, error, count } = await supabase
                .from('contacts')
                .select('*', { count: 'exact' })
                .order('created_at', { ascending: false })
                .range(from, to);
            
            if (error) throw error;
            return { data, count, page, limit };
        },

        async markAsRead(id) {
            const { error } = await supabase
                .from('contacts')
                .update({ is_read: true })
                .eq('id', id);
            
            if (error) throw error;
            return true;
        }
    },

    // Office Bearers
    officeBearers: {
        async getAll(activeOnly = true) {
            let query = supabase
                .from('office_bearers')
                .select('*');
            
            if (activeOnly) {
                query = query.eq('is_active', true);
            }
            
            const { data, error } = await query
                .order('display_order')
                .order('name');
            
            if (error) throw error;
            return data;
        },

        async create(bearer) {
            const { data, error } = await supabase
                .from('office_bearers')
                .insert([bearer])
                .select()
                .single();
            
            if (error) throw error;
            return data;
        },

        async update(id, updates) {
            updates.updated_at = new Date();
            
            const { data, error } = await supabase
                .from('office_bearers')
                .update(updates)
                .eq('id', id)
                .select()
                .single();
            
            if (error) throw error;
            return data;
        },

        async delete(id) {
            const { error } = await supabase
                .from('office_bearers')
                .delete()
                .eq('id', id);
            
            if (error) throw error;
            return true;
        }
    },

    // Storage
    storage: {
        async uploadFile(bucket, file, path = '') {
            const fileExt = file.name.split('.').pop();
            const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
            const filePath = path ? `${path}/${fileName}` : fileName;
            
            const { data, error } = await supabase.storage
                .from(bucket)
                .upload(filePath, file);
            
            if (error) throw error;
            
            const { data: urlData } = supabase.storage
                .from(bucket)
                .getPublicUrl(filePath);
            
            return urlData.publicUrl;
        },

        async deleteFile(bucket, path) {
            const { error } = await supabase.storage
                .from(bucket)
                .remove([path]);
            
            if (error) throw error;
            return true;
        }
    },
// Add to existing db object

// Admin specific functions
admin: {
    async getDashboardStats() {
        try {
            const [members, pendingMembers, donations, events, messages] = await Promise.all([
                supabase.from('members').select('*', { count: 'exact', head: true }).eq('status', 'approved'),
                supabase.from('members').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
                supabase.from('donations').select('amount').eq('payment_status', 'completed'),
                supabase.from('events').select('*', { count: 'exact', head: true }).gte('date', new Date().toISOString().split('T')[0]),
                supabase.from('contacts').select('*', { count: 'exact', head: true }).eq('is_read', false)
            ]);
            
            const totalDonations = donations.data.reduce((sum, d) => sum + (parseFloat(d.amount) || 0), 0);
            
            return {
                totalMembers: members.count || 0,
                pendingMembers: pendingMembers.count || 0,
                totalDonations: totalDonations,
                upcomingEvents: events.count || 0,
                unreadMessages: messages.count || 0
            };
        } catch (error) {
            console.error('Error getting dashboard stats:', error);
            throw error;
        }
    },
    
    async getRecentActivity(limit = 10) {
        try {
            const [recentMembers, recentDonations, recentMessages] = await Promise.all([
                supabase.from('members')
                    .select('id, name, phone, status, created_at')
                    .order('created_at', { ascending: false })
                    .limit(limit),
                supabase.from('donations')
                    .select('id, name, amount, created_at')
                    .order('created_at', { ascending: false })
                    .limit(limit),
                supabase.from('contacts')
                    .select('id, name, message, is_read, created_at')
                    .order('created_at', { ascending: false })
                    .limit(limit)
            ]);
            
            return {
                members: recentMembers.data || [],
                donations: recentDonations.data || [],
                messages: recentMessages.data || []
            };
        } catch (error) {
            console.error('Error getting recent activity:', error);
            throw error;
        }
    },
    
    async getDonationReport(startDate, endDate) {
        try {
            let query = supabase
                .from('donations')
                .select('*')
                .eq('payment_status', 'completed');
            
            if (startDate) {
                query = query.gte('created_at', startDate);
            }
            if (endDate) {
                query = query.lte('created_at', endDate);
            }
            
            const { data, error } = await query.order('created_at', { ascending: false });
            
            if (error) throw error;
            
            // Calculate statistics
            const total = data.reduce((sum, d) => sum + (parseFloat(d.amount) || 0), 0);
            const byMethod = {};
            const byPurpose = {};
            
            data.forEach(d => {
                byMethod[d.payment_method] = (byMethod[d.payment_method] || 0) + (parseFloat(d.amount) || 0);
                byPurpose[d.purpose || 'general'] = (byPurpose[d.purpose || 'general'] || 0) + (parseFloat(d.amount) || 0);
            });
            
            return {
                donations: data,
                total: total,
                count: data.length,
                average: data.length > 0 ? total / data.length : 0,
                byMethod: byMethod,
                byPurpose: byPurpose
            };
        } catch (error) {
            console.error('Error getting donation report:', error);
            throw error;
        }
    },
    
    async getMemberStats() {
        try {
            const { data, error } = await supabase
                .from('members')
                .select('district, status, created_at');
            
            if (error) throw error;
            
            const byDistrict = {};
            const byStatus = { approved: 0, pending: 0, rejected: 0 };
            const byMonth = {};
            
            data.forEach(m => {
                // By district
                if (m.district) {
                    byDistrict[m.district] = (byDistrict[m.district] || 0) + 1;
                }
                
                // By status
                byStatus[m.status] = (byStatus[m.status] || 0) + 1;
                
                // By month
                if (m.created_at) {
                    const month = new Date(m.created_at).toLocaleString('default', { month: 'short', year: 'numeric' });
                    byMonth[month] = (byMonth[month] || 0) + 1;
                }
            });
            
            return {
                total: data.length,
                byDistrict,
                byStatus,
                byMonth
            };
        } catch (error) {
            console.error('Error getting member stats:', error);
            throw error;
        }
    },
    
    async createBackup() {
        try {
            const tables = ['members', 'events', 'news', 'gallery', 'donations', 'documents', 'contacts', 'office_bearers'];
            const backup = {};
            
            for (const table of tables) {
                const { data, error } = await supabase.from(table).select('*');
                if (error) throw error;
                backup[table] = data;
            }
            
            // Add metadata
            backup.metadata = {
                created_at: new Date().toISOString(),
                version: '1.0',
                tables: tables
            };
            
            return backup;
        } catch (error) {
            console.error('Error creating backup:', error);
            throw error;
        }
    },
    
    async restoreFromBackup(backupData) {
        try {
            // Validate backup
            if (!backupData.metadata || !backupData.metadata.tables) {
                throw new Error('Invalid backup format');
            }
            
            // Restore each table
            for (const table of backupData.metadata.tables) {
                if (backupData[table] && backupData[table].length > 0) {
                    // Delete existing data (be careful!)
                    await supabase.from(table).delete().neq('id', '00000000-0000-0000-0000-000000000000');
                    
                    // Insert backup data
                    const { error } = await supabase.from(table).insert(backupData[table]);
                    if (error) throw error;
                }
            }
            
            return { success: true, message: 'Backup restored successfully' };
        } catch (error) {
            console.error('Error restoring backup:', error);
            throw error;
        }
    }
}
    // Auth (Admin)
    auth: {
        async login(username, password) {
            // Simple admin auth (in production, use proper auth)
            const { data, error } = await supabase
                .from('admins')
                .select('*')
                .eq('username', username)
                .single();
            
            if (error || !data) {
                throw new Error('Invalid credentials');
            }
            
            // In production, use proper password comparison
            if (password !== 'Admin@123') { // Demo only
                throw new Error('Invalid credentials');
            }
            
            // Store session
            sessionStorage.setItem('admin', JSON.stringify({
                id: data.id,
                username: data.username,
                role: data.role
            }));
            
            return data;
        },

        logout() {
            sessionStorage.removeItem('admin');
            window.location.href = '/admin/login.html';
        },

        getCurrentAdmin() {
            const admin = sessionStorage.getItem('admin');
            return admin ? JSON.parse(admin) : null;
        },

        isAuthenticated() {
            return !!this.getCurrentAdmin();
        },

        requireAuth() {
            if (!this.isAuthenticated()) {
                window.location.href = '/admin/login.html';
                return false;
            }
            return true;
        }
    }
};

// Export for use in other files
window.db = db;
