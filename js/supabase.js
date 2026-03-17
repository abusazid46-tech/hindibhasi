// Supabase client initialization
const SUPABASE_URL = 'https://rhslmpccqrfgsaqhwwnl.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJoc2xtcGNjcXJmZ3NhcWh3d25sIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM2NTU0ODEsImV4cCI6MjA4OTIzMTQ4MX0.D3CJvzcSkaFZivDJtIXdKgFO3jUPBOq8i80Vz98eYcw';

// Initialize Supabase client
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Database helper functions
const db = {
    // News functions
    async getLatestNews(limit = 3) {
        const { data, error } = await supabase
            .from('news')
            .select('*')
            .order('publish_date', { ascending: false })
            .limit(limit);
        if (error) throw error;
        return data;
    },

    // Events functions
    async getUpcomingEvents(limit = 3) {
        const { data, error } = await supabase
            .from('events')
            .select('*')
            .gte('event_date', new Date().toISOString().split('T')[0])
            .order('event_date', { ascending: true })
            .limit(limit);
        if (error) throw error;
        return data;
    },

    // Gallery functions
    async getGalleryPreview(limit = 4) {
        const { data, error } = await supabase
            .from('gallery')
            .select('*')
            .eq('type', 'image')
            .order('created_at', { ascending: false })
            .limit(limit);
        if (error) throw error;
        return data;
    },

    // Office Bearers for About section
    async getOfficeBearers(limit = 3) {
        const { data, error } = await supabase
            .from('office_bearers')
            .select('*')
            .order('display_order', { ascending: true })
            .limit(limit);
        if (error) throw error;
        return data;
    },

    // Donations total for stats
    async getTotalDonations() {
        const { data, error } = await supabase
            .from('donations')
            .select('amount')
            .eq('payment_status', 'completed');
        if (error) throw error;
        return data.reduce((sum, donation) => sum + donation.amount, 0);
    },

    // Members count
    async getApprovedMembersCount() {
        const { count, error } = await supabase
            .from('members')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'approved');
        if (error) throw error;
        return count;
    }
};
