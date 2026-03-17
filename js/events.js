// js/events.js - Events Management Module

const EventsModule = (function() {
    // Supabase client (will be initialized from page)
    let supabaseClient = null;

    // Initialize with supabase client
    function init(client) {
        supabaseClient = client;
        console.log('✅ EventsModule initialized');
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

    function formatTime(timeString) {
        if (!timeString) return 'N/A';
        return timeString;
    }

    // Public API
    return {
        init,

        // PUBLIC FUNCTIONS - Get upcoming events for website
        async getUpcomingEvents(limit = 10) {
            try {
                if (!supabaseClient) throw new Error('EventsModule not initialized');
                
                const { data, error } = await supabaseClient
                    .from('events')
                    .select('*')
                    .gte('event_date', new Date().toISOString().split('T')[0])
                    .eq('status', 'upcoming')
                    .order('event_date', { ascending: true })
                    .limit(limit);
                
                if (error) throw error;
                return { success: true, data };
                
            } catch (error) {
                console.error('Error fetching upcoming events:', error);
                return { success: false, error: error.message, data: [] };
            }
        },

        async getPastEvents(limit = 10) {
            try {
                if (!supabaseClient) throw new Error('EventsModule not initialized');
                
                const { data, error } = await supabaseClient
                    .from('events')
                    .select('*')
                    .lt('event_date', new Date().toISOString().split('T')[0])
                    .order('event_date', { ascending: false })
                    .limit(limit);
                
                if (error) throw error;
                return { success: true, data };
                
            } catch (error) {
                console.error('Error fetching past events:', error);
                return { success: false, error: error.message, data: [] };
            }
        },

        async getEventById(eventId) {
            try {
                if (!supabaseClient) throw new Error('EventsModule not initialized');
                
                const { data, error } = await supabaseClient
                    .from('events')
                    .select('*')
                    .eq('id', eventId)
                    .single();
                
                if (error) throw error;
                return { success: true, data };
                
            } catch (error) {
                console.error('Error fetching event:', error);
                return { success: false, error: error.message };
            }
        },

        // ADMIN FUNCTIONS
        async getAllEventsForAdmin(filters = {}, page = 1, pageSize = 10) {
            try {
                if (!supabaseClient) throw new Error('EventsModule not initialized');
                
                let query = supabaseClient
                    .from('events')
                    .select('*', { count: 'exact' });
                
                // Apply status filter
                if (filters.status && filters.status !== 'all') {
                    query = query.eq('status', filters.status);
                }
                
                // Apply search filter
                if (filters.search) {
                    query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%,venue.ilike.%${filters.search}%`);
                }
                
                // Apply sorting
                switch (filters.sort || 'upcoming') {
                    case 'upcoming':
                        query = query.order('event_date', { ascending: true });
                        break;
                    case 'past':
                        query = query.order('event_date', { ascending: false });
                        break;
                    case 'title':
                        query = query.order('title');
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
                console.error('Error fetching events for admin:', error);
                return { success: false, error: error.message, data: [], count: 0 };
            }
        },

        async createEvent(eventData, imageFile = null) {
            try {
                if (!supabaseClient) throw new Error('EventsModule not initialized');
                
                let imageUrl = null;
                
                // Upload image if provided
                if (imageFile) {
                    const fileExt = imageFile.name.split('.').pop();
                    const fileName = `event-images/${Date.now()}.${fileExt}`;
                    
                    const { error: uploadError } = await supabaseClient.storage
                        .from('event-images')
                        .upload(fileName, imageFile);
                    
                    if (uploadError) throw uploadError;
                    
                    const { data: { publicUrl } } = supabaseClient.storage
                        .from('event-images')
                        .getPublicUrl(fileName);
                    
                    imageUrl = publicUrl;
                }
                
                // Insert event
                const { data, error } = await supabaseClient
                    .from('events')
                    .insert([{
                        title: eventData.title,
                        description: eventData.description,
                        event_date: eventData.event_date,
                        event_time: eventData.event_time || null,
                        venue: eventData.venue,
                        image_url: imageUrl,
                        registration_required: eventData.registration_required || false,
                        registration_deadline: eventData.registration_deadline || null,
                        max_participants: eventData.max_participants || null,
                        is_featured: eventData.is_featured || false,
                        status: eventData.status || 'upcoming'
                    }])
                    .select()
                    .single();
                
                if (error) throw error;
                
                return { success: true, data };
                
            } catch (error) {
                console.error('Error creating event:', error);
                return { success: false, error: error.message };
            }
        },

        async updateEvent(eventId, eventData, imageFile = null) {
            try {
                if (!supabaseClient) throw new Error('EventsModule not initialized');
                
                let updateData = { ...eventData };
                
                // Upload new image if provided
                if (imageFile) {
                    const fileExt = imageFile.name.split('.').pop();
                    const fileName = `event-images/${Date.now()}.${fileExt}`;
                    
                    const { error: uploadError } = await supabaseClient.storage
                        .from('event-images')
                        .upload(fileName, imageFile);
                    
                    if (uploadError) throw uploadError;
                    
                    const { data: { publicUrl } } = supabaseClient.storage
                        .from('event-images')
                        .getPublicUrl(fileName);
                    
                    updateData.image_url = publicUrl;
                }
                
                // Remove undefined fields
                Object.keys(updateData).forEach(key => 
                    updateData[key] === undefined && delete updateData[key]
                );
                
                const { data, error } = await supabaseClient
                    .from('events')
                    .update(updateData)
                    .eq('id', eventId)
                    .select()
                    .single();
                
                if (error) throw error;
                
                return { success: true, data };
                
            } catch (error) {
                console.error('Error updating event:', error);
                return { success: false, error: error.message };
            }
        },

        async deleteEvent(eventId) {
            try {
                if (!supabaseClient) throw new Error('EventsModule not initialized');
                
                const { error } = await supabaseClient
                    .from('events')
                    .delete()
                    .eq('id', eventId);
                
                if (error) throw error;
                
                return { success: true };
                
            } catch (error) {
                console.error('Error deleting event:', error);
                return { success: false, error: error.message };
            }
        },

        async toggleFeatured(eventId, isFeatured) {
            try {
                if (!supabaseClient) throw new Error('EventsModule not initialized');
                
                const { data, error } = await supabaseClient
                    .from('events')
                    .update({ is_featured: isFeatured })
                    .eq('id', eventId)
                    .select()
                    .single();
                
                if (error) throw error;
                
                return { success: true, data };
                
            } catch (error) {
                console.error('Error toggling featured:', error);
                return { success: false, error: error.message };
            }
        },

        async getUpcomingEventsCount() {
            try {
                if (!supabaseClient) throw new Error('EventsModule not initialized');
                
                const { count, error } = await supabaseClient
                    .from('events')
                    .select('*', { count: 'exact', head: true })
                    .gte('event_date', new Date().toISOString().split('T')[0])
                    .eq('status', 'upcoming');
                
                if (error) throw error;
                
                return { success: true, count: count || 0 };
                
            } catch (error) {
                console.error('Error getting upcoming count:', error);
                return { success: false, error: error.message, count: 0 };
            }
        },

        // Helpers
        helpers: {
            escapeHtml,
            formatDate,
            formatTime
        }
    };
})();

// Make module available globally
window.EventsModule = EventsModule;
