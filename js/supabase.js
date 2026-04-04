// js/supabase.js - ONLY Supabase client, NO duplicates

// Supabase configuration
const SUPABASE_URL = 'https://rhslmpccqrfgsaqhwwnl.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJoc2xtcGNjcXJmZ3NhcWh3d25sIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM2NTU0ODEsImV4cCI6MjA4OTIzMTQ4MX0.D3CJvzcSkaFZivDJtIXdKgFO3jUPBOq8i80Vz98eYcw';

// Initialize Supabase client - ONLY ONCE
window.supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Database helper functions
window.db = {
    async getLatestNews(limit = 3) {
        try {
            const { data, error } = await window.supabaseClient
                .from('news')
                .select('*')
                .order('publish_date', { ascending: false })
                .limit(limit);
            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error('Error loading news:', error);
            return [];
        }
    },

    async getUpcomingEvents(limit = 3) {
        try {
            const { data, error } = await window.supabaseClient
                .from('events')
                .select('*')
                .gte('event_date', new Date().toISOString().split('T')[0])
                .order('event_date', { ascending: true })
                .limit(limit);
            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error('Error loading events:', error);
            return [];
        }
    },

    async getGalleryPreview(limit = 4) {
        try {
            const { data, error } = await window.supabaseClient
                .from('gallery')
                .select('*')
                .eq('type', 'image')
                .order('created_at', { ascending: false })
                .limit(limit);
            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error('Error loading gallery:', error);
            return [];
        }
    },

    async getOfficeBearers(limit = 3) {
        try {
            const { data, error } = await window.supabaseClient
                .from('office_bearers')
                .select('*')
                .eq('is_active', true)
                .order('display_order', { ascending: true })
                .limit(limit);
            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error('Error loading office bearers:', error);
            return [];
        }
    },

    async getTotalDonations() {
    try {
        const { data, error } = await window.supabaseClient
            .from('donations')
            .select('amount')
            .eq('payment_status', 'approved');  // Change 'completed' to 'approved'
        if (error) throw error;
        return data.reduce((sum, d) => sum + (parseFloat(d.amount) || 0), 0);
    } catch (error) {
        console.error('Error loading donations:', error);
        return 0;
    }
},

    async getApprovedMembersCount() {
        try {
            const { count, error } = await window.supabaseClient
                .from('members')
                .select('*', { count: 'exact', head: true })
                .eq('status', 'approved');
            if (error) throw error;
            return count || 0;
        } catch (error) {
            console.error('Error loading members count:', error);
            return 0;
        }
    }
};
async getMembershipFee() {
    try {
        const { data, error } = await window.supabaseClient
            .from('settings')
            .select('value')
            .eq('key', 'membership_fee')
            .single();
        
        if (error) throw error;
        return parseInt(data?.value) || 49;
    } catch (error) {
        console.error('Error loading membership fee:', error);
        return 49;
    }
},
console.log('✅ supabase.js loaded, db available');
