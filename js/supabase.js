// Supabase configuration
const SUPABASE_URL = 'https://rhslmpccqrfgsaqhwwnl.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJoc2xtcGNjcXJmZ3NhcWh3d25sIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM2NTU0ODEsImV4cCI6MjA4OTIzMTQ4MX0.D3CJvzcSkaFZivDJtIXdKgFO3jUPBOq8i80Vz98eYcw';
const supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Helper functions
async function uploadFile(file, bucket, folder) {
    const fileName = `${Date.now()}_${file.name}`;
    const { data, error } = await supabase.storage
        .from(bucket)
        .upload(`${folder}/${fileName}`, file);
    
    if (error) throw error;
    return supabase.storage.from(bucket).getPublicUrl(`${folder}/${fileName}`).data.publicUrl;
}

// Members API
const MembersAPI = {
    async register(memberData, photoFile) {
        try {
            let photoUrl = null;
            if (photoFile) {
                photoUrl = await uploadFile(photoFile, 'members', 'photos');
            }
            
            // Generate membership ID
            const year = new Date().getFullYear();
            const { count } = await supabase
                .from('members')
                .select('*', { count: 'exact', head: true });
            
            const membershipId = `AHBBM/${year}/${(count + 1).toString().padStart(4, '0')}`;
            
            const { data, error } = await supabase
                .from('members')
                .insert([{ ...memberData, membership_id: membershipId, photo_url: photoUrl }])
                .select();
            
            if (error) throw error;
            return data[0];
        } catch (error) {
            console.error('Error registering member:', error);
            throw error;
        }
    },
    
    async getMembers(page = 1, limit = 10, filters = {}) {
        try {
            let query = supabase
                .from('members')
                .select('*', { count: 'exact' })
                .eq('status', 'approved');
            
            if (filters.name) {
                query = query.ilike('name', `%${filters.name}%`);
            }
            if (filters.district) {
                query = query.eq('district', filters.district);
            }
            
            const from = (page - 1) * limit;
            const to = from + limit - 1;
            
            const { data, error, count } = await query
                .order('name')
                .range(from, to);
            
            if (error) throw error;
            return { data, count, pages: Math.ceil(count / limit) };
        } catch (error) {
            console.error('Error fetching members:', error);
            throw error;
        }
    },
    
    async getPendingMembers() {
        try {
            const { data, error } = await supabase
                .from('members')
                .select('*')
                .eq('status', 'pending')
                .order('created_at', { ascending: false });
            
            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error fetching pending members:', error);
            throw error;
        }
    },
    
    async updateMemberStatus(memberId, status, adminId) {
        try {
            const { data, error } = await supabase
                .from('members')
                .update({ 
                    status, 
                    approved_at: status === 'approved' ? new Date() : null,
                    approved_by: status === 'approved' ? adminId : null
                })
                .eq('id', memberId)
                .select();
            
            if (error) throw error;
            return data[0];
        } catch (error) {
            console.error('Error updating member status:', error);
            throw error;
        }
    }
};

// Events API
const EventsAPI = {
    async create(eventData, imageFile) {
        try {
            let imageUrl = null;
            if (imageFile) {
                imageUrl = await uploadFile(imageFile, 'events', 'images');
            }
            
            const { data, error } = await supabase
                .from('events')
                .insert([{ ...eventData, image_url: imageUrl }])
                .select();
            
            if (error) throw error;
            return data[0];
        } catch (error) {
            console.error('Error creating event:', error);
            throw error;
        }
    },
    
    async getEvents(page = 1, limit = 10) {
        try {
            const from = (page - 1) * limit;
            const to = from + limit - 1;
            
            const { data, error, count } = await supabase
                .from('events')
                .select('*', { count: 'exact' })
                .order('event_date', { ascending: true })
                .range(from, to);
            
            if (error) throw error;
            return { data, count, pages: Math.ceil(count / limit) };
        } catch (error) {
            console.error('Error fetching events:', error);
            throw error;
        }
    },
    
    async getUpcomingEvents(limit = 5) {
        try {
            const today = new Date().toISOString().split('T')[0];
            const { data, error } = await supabase
                .from('events')
                .select('*')
                .gte('event_date', today)
                .order('event_date', { ascending: true })
                .limit(limit);
            
            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error fetching upcoming events:', error);
            throw error;
        }
    }
};

// News API
const NewsAPI = {
    async create(newsData, imageFile) {
        try {
            let imageUrl = null;
            if (imageFile) {
                imageUrl = await uploadFile(imageFile, 'news', 'images');
            }
            
            const { data, error } = await supabase
                .from('news')
                .insert([{ ...newsData, image_url: imageUrl }])
                .select();
            
            if (error) throw error;
            return data[0];
        } catch (error) {
            console.error('Error creating news:', error);
            throw error;
        }
    },
    
    async getNews(page = 1, limit = 10) {
        try {
            const from = (page - 1) * limit;
            const to = from + limit - 1;
            
            const { data, error, count } = await supabase
                .from('news')
                .select('*', { count: 'exact' })
                .order('created_at', { ascending: false })
                .range(from, to);
            
            if (error) throw error;
            return { data, count, pages: Math.ceil(count / limit) };
        } catch (error) {
            console.error('Error fetching news:', error);
            throw error;
        }
    },
    
    async getLatestNews(limit = 5) {
        try {
            const { data, error } = await supabase
                .from('news')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(limit);
            
            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error fetching latest news:', error);
            throw error;
        }
    }
};

// Gallery API
const GalleryAPI = {
    async add(galleryData, file) {
        try {
            let fileUrl;
            let thumbnailUrl = null;
            
            if (galleryData.type === 'image') {
                fileUrl = await uploadFile(file, 'gallery', 'images');
                thumbnailUrl = fileUrl; // Use same for thumbnail
            } else {
                fileUrl = await uploadFile(file, 'gallery', 'videos');
                // You might want to generate video thumbnail here
            }
            
            const { data, error } = await supabase
                .from('gallery')
                .insert([{ ...galleryData, file_url: fileUrl, thumbnail_url: thumbnailUrl }])
                .select();
            
            if (error) throw error;
            return data[0];
        } catch (error) {
            console.error('Error adding to gallery:', error);
            throw error;
        }
    },
    
    async getGallery(type = null, page = 1, limit = 12) {
        try {
            let query = supabase
                .from('gallery')
                .select('*', { count: 'exact' })
                .order('created_at', { ascending: false });
            
            if (type) {
                query = query.eq('type', type);
            }
            
            const from = (page - 1) * limit;
            const to = from + limit - 1;
            
            const { data, error, count } = await query.range(from, to);
            
            if (error) throw error;
            return { data, count, pages: Math.ceil(count / limit) };
        } catch (error) {
            console.error('Error fetching gallery:', error);
            throw error;
        }
    }
};

// Donations API
const DonationsAPI = {
    async create(donationData) {
        try {
            const { data, error } = await supabase
                .from('donations')
                .insert([donationData])
                .select();
            
            if (error) throw error;
            return data[0];
        } catch (error) {
            console.error('Error creating donation:', error);
            throw error;
        }
    },
    
    async getDonations(page = 1, limit = 20) {
        try {
            const from = (page - 1) * limit;
            const to = from + limit - 1;
            
            const { data, error, count } = await supabase
                .from('donations')
                .select('*', { count: 'exact' })
                .order('created_at', { ascending: false })
                .range(from, to);
            
            if (error) throw error;
            return { data, count, pages: Math.ceil(count / limit) };
        } catch (error) {
            console.error('Error fetching donations:', error);
            throw error;
        }
    },
    
    async getTotalDonations() {
        try {
            const { data, error } = await supabase
                .from('donations')
                .select('amount')
                .eq('payment_status', 'completed');
            
            if (error) throw error;
            return data.reduce((sum, d) => sum + parseFloat(d.amount), 0);
        } catch (error) {
            console.error('Error calculating total donations:', error);
            throw error;
        }
    }
};

// Documents API
const DocumentsAPI = {
    async upload(documentData, file) {
        try {
            const fileUrl = await uploadFile(file, 'documents', 'files');
            
            const { data, error } = await supabase
                .from('documents')
                .insert([{ 
                    ...documentData, 
                    file_url: fileUrl,
                    file_type: file.type
                }])
                .select();
            
            if (error) throw error;
            return data[0];
        } catch (error) {
            console.error('Error uploading document:', error);
            throw error;
        }
    },
    
    async getDocuments(category = null, page = 1, limit = 10) {
        try {
            let query = supabase
                .from('documents')
                .select('*', { count: 'exact' })
                .order('created_at', { ascending: false });
            
            if (category) {
                query = query.eq('category', category);
            }
            
            const from = (page - 1) * limit;
            const to = from + limit - 1;
            
            const { data, error, count } = await query.range(from, to);
            
            if (error) throw error;
            return { data, count, pages: Math.ceil(count / limit) };
        } catch (error) {
            console.error('Error fetching documents:', error);
            throw error;
        }
    }
};

// Contacts API
const ContactsAPI = {
    async submit(contactData) {
        try {
            const { data, error } = await supabase
                .from('contacts')
                .insert([contactData])
                .select();
            
            if (error) throw error;
            return data[0];
        } catch (error) {
            console.error('Error submitting contact:', error);
            throw error;
        }
    },
    
    async getMessages(unreadOnly = false, page = 1, limit = 20) {
        try {
            let query = supabase
                .from('contacts')
                .select('*', { count: 'exact' })
                .order('created_at', { ascending: false });
            
            if (unreadOnly) {
                query = query.eq('is_read', false);
            }
            
            const from = (page - 1) * limit;
            const to = from + limit - 1;
            
            const { data, error, count } = await query.range(from, to);
            
            if (error) throw error;
            return { data, count, pages: Math.ceil(count / limit) };
        } catch (error) {
            console.error('Error fetching messages:', error);
            throw error;
        }
    },
    
    async markAsRead(messageId) {
        try {
            const { data, error } = await supabase
                .from('contacts')
                .update({ is_read: true })
                .eq('id', messageId)
                .select();
            
            if (error) throw error;
            return data[0];
        } catch (error) {
            console.error('Error marking message as read:', error);
            throw error;
        }
    }
};

// Volunteer API
const VolunteersAPI = {
    async register(volunteerData) {
        try {
            const { data, error } = await supabase
                .from('volunteers')
                .insert([volunteerData])
                .select();
            
            if (error) throw error;
            return data[0];
        } catch (error) {
            console.error('Error registering volunteer:', error);
            throw error;
        }
    },
    
    async getVolunteers(district = null) {
        try {
            let query = supabase
                .from('volunteers')
                .select('*')
                .eq('status', 'active');
            
            if (district) {
                query = query.eq('district', district);
            }
            
            const { data, error } = await query.order('name');
            
            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error fetching volunteers:', error);
            throw error;
        }
    }
};

// Event Registration API
const EventRegistrationAPI = {
    async register(registrationData) {
        try {
            const { data, error } = await supabase
                .from('event_registrations')
                .insert([registrationData])
                .select();
            
            if (error) throw error;
            return data[0];
        } catch (error) {
            console.error('Error registering for event:', error);
            throw error;
        }
    },
    
    async getRegistrations(eventId = null) {
        try {
            let query = supabase
                .from('event_registrations')
                .select('*, events(*)');
            
            if (eventId) {
                query = query.eq('event_id', eventId);
            }
            
            const { data, error } = await query.order('created_at', { ascending: false });
            
            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error fetching registrations:', error);
            throw error;
        }
    }
};

// Statistics API
const StatisticsAPI = {
    async getDashboardStats() {
        try {
            const [
                membersCount,
                pendingMembers,
                eventsCount,
                newsCount,
                donationsTotal,
                galleryCount
            ] = await Promise.all([
                supabase.from('members').select('*', { count: 'exact', head: true }).eq('status', 'approved'),
                supabase.from('members').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
                supabase.from('events').select('*', { count: 'exact', head: true }),
                supabase.from('news').select('*', { count: 'exact', head: true }),
                supabase.from('donations').select('amount').eq('payment_status', 'completed'),
                supabase.from('gallery').select('*', { count: 'exact', head: true })
            ]);
            
            const totalDonations = donationsTotal.data?.reduce((sum, d) => sum + parseFloat(d.amount), 0) || 0;
            
            return {
                totalMembers: membersCount.count || 0,
                pendingMembers: pendingMembers.count || 0,
                totalEvents: eventsCount.count || 0,
                totalNews: newsCount.count || 0,
                totalDonations,
                totalGallery: galleryCount.count || 0
            };
        } catch (error) {
            console.error('Error fetching dashboard stats:', error);
            throw error;
        }
    },
    
    async getDistrictWiseMembers() {
        try {
            const { data, error } = await supabase
                .from('members')
                .select('district')
                .eq('status', 'approved');
            
            if (error) throw error;
            
            const districtStats = {};
            data.forEach(m => {
                districtStats[m.district] = (districtStats[m.district] || 0) + 1;
            });
            
            return districtStats;
        } catch (error) {
            console.error('Error fetching district stats:', error);
            throw error;
        }
    }
};
