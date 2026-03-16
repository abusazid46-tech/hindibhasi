// Supabase configuration
const SUPABASE_URL = 'https://rhslmpccqrfgsaqhwwnl.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJoc2xtcGNjcXJmZ3NhcWh3d25sIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM2NTU0ODEsImV4cCI6MjA4OTIzMTQ4MX0.D3CJvzcSkaFZivDJtIXdKgFO3jUPBOq8i80Vz98eYcw';
const supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);


// ===== STORAGE BUCKET CONFIGURATION =====
const STORAGE_BUCKETS = {
    MEMBERS: 'members',
    EVENTS: 'events',
    NEWS: 'news',
    GALLERY: 'gallery',
    DOCUMENTS: 'documents'
};

// ===== FILE UPLOAD HELPER =====
async function uploadFile(file, bucket, folder) {
    try {
        // Generate unique filename
        const timestamp = Date.now();
        const randomString = Math.random().toString(36).substring(2, 15);
        const extension = file.name.split('.').pop();
        const fileName = `${timestamp}_${randomString}.${extension}`;
        const filePath = `${folder}/${fileName}`;

        // Upload file
        const { data, error } = await supabase.storage
            .from(bucket)
            .upload(filePath, file, {
                cacheControl: '3600',
                upsert: false
            });

        if (error) throw error;

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
            .from(bucket)
            .getPublicUrl(filePath);

        return publicUrl;
    } catch (error) {
        console.error('Error uploading file:', error);
        throw error;
    }
}

// ===== MULTIPLE FILES UPLOAD =====
async function uploadMultipleFiles(files, bucket, folder, onProgress) {
    const urls = [];
    let completed = 0;

    for (const file of files) {
        try {
            const url = await uploadFile(file, bucket, folder);
            urls.push(url);
            completed++;
            
            if (onProgress) {
                onProgress(completed, files.length);
            }
        } catch (error) {
            console.error('Error uploading file:', error);
        }
    }

    return urls;
}

// ===== DELETE FILE =====
async function deleteFile(fileUrl, bucket) {
    try {
        // Extract file path from URL
        const urlParts = fileUrl.split('/');
        const filePath = urlParts.slice(urlParts.indexOf(bucket) + 1).join('/');
        
        const { error } = await supabase.storage
            .from(bucket)
            .remove([filePath]);

        if (error) throw error;
        return true;
    } catch (error) {
        console.error('Error deleting file:', error);
        throw error;
    }
}

// ===== MEMBERS API =====
const MembersAPI = {
    // Register new member
    async register(memberData, photoFile) {
        try {
            let photoUrl = null;
            if (photoFile) {
                photoUrl = await uploadFile(photoFile, STORAGE_BUCKETS.MEMBERS, 'photos');
            }
            
            // Generate membership ID
            const year = new Date().getFullYear();
            const { count } = await supabase
                .from('members')
                .select('*', { count: 'exact', head: true });
            
            const membershipId = `AHBBM/${year}/${(count + 1).toString().padStart(4, '0')}`;
            
            const { data, error } = await supabase
                .from('members')
                .insert([{ 
                    ...memberData, 
                    membership_id: membershipId, 
                    photo_url: photoUrl,
                    status: 'pending',
                    created_at: new Date().toISOString()
                }])
                .select();
            
            if (error) throw error;
            return data[0];
        } catch (error) {
            console.error('Error registering member:', error);
            throw error;
        }
    },

    // Get all approved members with pagination
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

    // Get pending members (for admin)
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

    // Update member status (approve/reject)
    async updateMemberStatus(memberId, status, adminId) {
        try {
            const updates = {
                status,
                updated_at: new Date().toISOString()
            };
            
            if (status === 'approved') {
                updates.approved_at = new Date().toISOString();
                updates.approved_by = adminId;
            }

            const { data, error } = await supabase
                .from('members')
                .update(updates)
                .eq('id', memberId)
                .select();
            
            if (error) throw error;
            return data[0];
        } catch (error) {
            console.error('Error updating member status:', error);
            throw error;
        }
    },

    // Get member by ID
    async getMemberById(memberId) {
        try {
            const { data, error } = await supabase
                .from('members')
                .select('*')
                .eq('id', memberId)
                .single();
            
            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error fetching member:', error);
            throw error;
        }
    },

    // Update member details
    async updateMember(memberId, updates, photoFile) {
        try {
            if (photoFile) {
                updates.photo_url = await uploadFile(photoFile, STORAGE_BUCKETS.MEMBERS, 'photos');
            }

            updates.updated_at = new Date().toISOString();

            const { data, error } = await supabase
                .from('members')
                .update(updates)
                .eq('id', memberId)
                .select();
            
            if (error) throw error;
            return data[0];
        } catch (error) {
            console.error('Error updating member:', error);
            throw error;
        }
    },

    // Delete member
    async deleteMember(memberId) {
        try {
            // First get member to delete photo
            const member = await this.getMemberById(memberId);
            
            if (member.photo_url) {
                await deleteFile(member.photo_url, STORAGE_BUCKETS.MEMBERS);
            }

            const { error } = await supabase
                .from('members')
                .delete()
                .eq('id', memberId);
            
            if (error) throw error;
            return true;
        } catch (error) {
            console.error('Error deleting member:', error);
            throw error;
        }
    },

    // Get district-wise statistics
    async getDistrictStats() {
        try {
            const { data, error } = await supabase
                .from('members')
                .select('district')
                .eq('status', 'approved');
            
            if (error) throw error;
            
            const stats = {};
            data.forEach(m => {
                stats[m.district] = (stats[m.district] || 0) + 1;
            });
            
            return stats;
        } catch (error) {
            console.error('Error getting district stats:', error);
            throw error;
        }
    }
};

// ===== EVENTS API =====
const EventsAPI = {
    // Create new event
    async create(eventData, imageFile) {
        try {
            let imageUrl = null;
            if (imageFile) {
                imageUrl = await uploadFile(imageFile, STORAGE_BUCKETS.EVENTS, 'images');
            }
            
            const { data, error } = await supabase
                .from('events')
                .insert([{ 
                    ...eventData, 
                    image_url: imageUrl,
                    created_at: new Date().toISOString()
                }])
                .select();
            
            if (error) throw error;
            return data[0];
        } catch (error) {
            console.error('Error creating event:', error);
            throw error;
        }
    },

    // Get all events with pagination
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

    // Get upcoming events
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
    },

    // Get past events
    async getPastEvents(limit = 10) {
        try {
            const today = new Date().toISOString().split('T')[0];
            const { data, error } = await supabase
                .from('events')
                .select('*')
                .lt('event_date', today)
                .order('event_date', { ascending: false })
                .limit(limit);
            
            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error fetching past events:', error);
            throw error;
        }
    },

    // Get event by ID
    async getEventById(eventId) {
        try {
            const { data, error } = await supabase
                .from('events')
                .select('*')
                .eq('id', eventId)
                .single();
            
            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error fetching event:', error);
            throw error;
        }
    },

    // Update event
    async updateEvent(eventId, updates, imageFile) {
        try {
            if (imageFile) {
                updates.image_url = await uploadFile(imageFile, STORAGE_BUCKETS.EVENTS, 'images');
            }

            updates.updated_at = new Date().toISOString();

            const { data, error } = await supabase
                .from('events')
                .update(updates)
                .eq('id', eventId)
                .select();
            
            if (error) throw error;
            return data[0];
        } catch (error) {
            console.error('Error updating event:', error);
            throw error;
        }
    },

    // Delete event
    async deleteEvent(eventId) {
        try {
            // Get event to delete image
            const event = await this.getEventById(eventId);
            
            if (event.image_url) {
                await deleteFile(event.image_url, STORAGE_BUCKETS.EVENTS);
            }

            const { error } = await supabase
                .from('events')
                .delete()
                .eq('id', eventId);
            
            if (error) throw error;
            return true;
        } catch (error) {
            console.error('Error deleting event:', error);
            throw error;
        }
    }
};

// ===== NEWS API =====
const NewsAPI = {
    // Create news
    async create(newsData, imageFile) {
        try {
            let imageUrl = null;
            if (imageFile) {
                imageUrl = await uploadFile(imageFile, STORAGE_BUCKETS.NEWS, 'images');
            }
            
            const { data, error } = await supabase
                .from('news')
                .insert([{ 
                    ...newsData, 
                    image_url: imageUrl,
                    created_at: new Date().toISOString(),
                    views: 0
                }])
                .select();
            
            if (error) throw error;
            return data[0];
        } catch (error) {
            console.error('Error creating news:', error);
            throw error;
        }
    },

    // Get all news
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

    // Get latest news
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
    },

    // Get important news
    async getImportantNews() {
        try {
            const { data, error } = await supabase
                .from('news')
                .select('*')
                .eq('is_important', true)
                .order('created_at', { ascending: false });
            
            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error fetching important news:', error);
            throw error;
        }
    },

    // Increment view count
    async incrementViews(newsId) {
        try {
            const { data, error } = await supabase.rpc('increment_news_views', {
                news_id: newsId
            });
            
            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error incrementing views:', error);
        }
    }
};

// ===== GALLERY API =====
const GalleryAPI = {
    // Add to gallery
    async add(galleryData, file) {
        try {
            let fileUrl;
            
            if (galleryData.type === 'image') {
                fileUrl = await uploadFile(file, STORAGE_BUCKETS.GALLERY, 'images');
            } else {
                fileUrl = await uploadFile(file, STORAGE_BUCKETS.GALLERY, 'videos');
            }
            
            const { data, error } = await supabase
                .from('gallery')
                .insert([{ 
                    ...galleryData, 
                    file_url: fileUrl,
                    created_at: new Date().toISOString()
                }])
                .select();
            
            if (error) throw error;
            return data[0];
        } catch (error) {
            console.error('Error adding to gallery:', error);
            throw error;
        }
    },

    // Get gallery items
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
    },

    // Delete gallery item
    async deleteGalleryItem(itemId) {
        try {
            const { data, error } = await supabase
                .from('gallery')
                .delete()
                .eq('id', itemId);
            
            if (error) throw error;
            return true;
        } catch (error) {
            console.error('Error deleting gallery item:', error);
            throw error;
        }
    }
};

// ===== DONATIONS API =====
const DonationsAPI = {
    // Create donation
    async create(donationData) {
        try {
            const { data, error } = await supabase
                .from('donations')
                .insert([{ 
                    ...donationData,
                    created_at: new Date().toISOString()
                }])
                .select();
            
            if (error) throw error;
            return data[0];
        } catch (error) {
            console.error('Error creating donation:', error);
            throw error;
        }
    },

    // Get all donations (admin)
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

    // Get donation statistics
    async getStats() {
        try {
            const { data, error } = await supabase
                .from('donations')
                .select('amount, payment_status')
                .eq('payment_status', 'completed');
            
            if (error) throw error;
            
            const total = data.reduce((sum, d) => sum + parseFloat(d.amount), 0);
            const count = data.length;
            const average = count > 0 ? total / count : 0;
            
            return { total, count, average };
        } catch (error) {
            console.error('Error getting donation stats:', error);
            throw error;
        }
    },

    // Get monthly donations for chart
    async getMonthlyDonations(months = 6) {
        try {
            const endDate = new Date();
            const startDate = new Date();
            startDate.setMonth(startDate.getMonth() - months);

            const { data, error } = await supabase
                .from('donations')
                .select('amount, created_at')
                .eq('payment_status', 'completed')
                .gte('created_at', startDate.toISOString())
                .lte('created_at', endDate.toISOString())
                .order('created_at');

            if (error) throw error;

            // Group by month
            const monthlyData = {};
            data.forEach(d => {
                const month = new Date(d.created_at).toLocaleString('default', { month: 'short', year: 'numeric' });
                monthlyData[month] = (monthlyData[month] || 0) + parseFloat(d.amount);
            });

            return monthlyData;
        } catch (error) {
            console.error('Error getting monthly donations:', error);
            throw error;
        }
    }
};

// ===== DOCUMENTS API =====
const DocumentsAPI = {
    // Upload document
    async upload(documentData, file) {
        try {
            const fileUrl = await uploadFile(file, STORAGE_BUCKETS.DOCUMENTS, 'files');
            
            const { data, error } = await supabase
                .from('documents')
                .insert([{ 
                    ...documentData, 
                    file_url: fileUrl,
                    file_type: file.type,
                    file_size: file.size,
                    downloads: 0,
                    created_at: new Date().toISOString()
                }])
                .select();
            
            if (error) throw error;
            return data[0];
        } catch (error) {
            console.error('Error uploading document:', error);
            throw error;
        }
    },

    // Get all documents
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
    },

    // Increment download count
    async incrementDownload(docId) {
        try {
            const { data, error } = await supabase.rpc('increment_downloads', {
                doc_id: docId
            });
            
            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error incrementing downloads:', error);
        }
    }
};

// ===== CONTACTS API =====
const ContactsAPI = {
    // Submit contact form
    async submit(contactData) {
        try {
            const { data, error } = await supabase
                .from('contacts')
                .insert([{ 
                    ...contactData,
                    is_read: false,
                    created_at: new Date().toISOString()
                }])
                .select();
            
            if (error) throw error;
            return data[0];
        } catch (error) {
            console.error('Error submitting contact:', error);
            throw error;
        }
    },

    // Get messages (admin)
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

    // Mark as read
    async markAsRead(messageId) {
        try {
            const { data, error } = await supabase
                .from('contacts')
                .update({ 
                    is_read: true,
                    read_at: new Date().toISOString()
                })
                .eq('id', messageId)
                .select();
            
            if (error) throw error;
            return data[0];
        } catch (error) {
            console.error('Error marking message as read:', error);
            throw error;
        }
    },

    // Delete message
    async deleteMessage(messageId) {
        try {
            const { error } = await supabase
                .from('contacts')
                .delete()
                .eq('id', messageId);
            
            if (error) throw error;
            return true;
        } catch (error) {
            console.error('Error deleting message:', error);
            throw error;
        }
    },

    // Get unread count
    async getUnreadCount() {
        try {
            const { count, error } = await supabase
                .from('contacts')
                .select('*', { count: 'exact', head: true })
                .eq('is_read', false);
            
            if (error) throw error;
            return count;
        } catch (error) {
            console.error('Error getting unread count:', error);
            throw error;
        }
    }
};

// ===== VOLUNTEERS API =====
const VolunteersAPI = {
    // Register volunteer
    async register(volunteerData) {
        try {
            const { data, error } = await supabase
                .from('volunteers')
                .insert([{ 
                    ...volunteerData,
                    status: 'active',
                    created_at: new Date().toISOString()
                }])
                .select();
            
            if (error) throw error;
            return data[0];
        } catch (error) {
            console.error('Error registering volunteer:', error);
            throw error;
        }
    },

    // Get volunteers
    async getVolunteers(district = null) {
        try {
            let query = supabase
                .from('volunteers')
                .select('*')
                .eq('status', 'active')
                .order('name');
            
            if (district) {
                query = query.eq('district', district);
            }
            
            const { data, error } = await query;
            
            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error fetching volunteers:', error);
            throw error;
        }
    }
};

// ===== EVENT REGISTRATIONS API =====
const EventRegistrationAPI = {
    // Register for event
    async register(registrationData) {
        try {
            const { data, error } = await supabase
                .from('event_registrations')
                .insert([{ 
                    ...registrationData,
                    created_at: new Date().toISOString()
                }])
                .select();
            
            if (error) throw error;
            return data[0];
        } catch (error) {
            console.error('Error registering for event:', error);
            throw error;
        }
    },

    // Get registrations for event
    async getEventRegistrations(eventId) {
        try {
            const { data, error } = await supabase
                .from('event_registrations')
                .select('*')
                .eq('event_id', eventId)
                .order('created_at', { ascending: false });
            
            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error fetching registrations:', error);
            throw error;
        }
    }
};

// ===== STATISTICS API =====
const StatisticsAPI = {
    // Get dashboard statistics
    async getDashboardStats() {
        try {
            const [
                membersCount,
                pendingMembers,
                eventsCount,
                newsCount,
                donationsTotal,
                galleryCount,
                unreadMessages
            ] = await Promise.all([
                supabase.from('members').select('*', { count: 'exact', head: true }).eq('status', 'approved'),
                supabase.from('members').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
                supabase.from('events').select('*', { count: 'exact', head: true }),
                supabase.from('news').select('*', { count: 'exact', head: true }),
                supabase.from('donations').select('amount').eq('payment_status', 'completed'),
                supabase.from('gallery').select('*', { count: 'exact', head: true }),
                supabase.from('contacts').select('*', { count: 'exact', head: true }).eq('is_read', false)
            ]);
            
            const totalDonations = donationsTotal.data?.reduce((sum, d) => sum + parseFloat(d.amount), 0) || 0;
            
            return {
                totalMembers: membersCount.count || 0,
                pendingMembers: pendingMembers.count || 0,
                totalEvents: eventsCount.count || 0,
                totalNews: newsCount.count || 0,
                totalDonations,
                totalGallery: galleryCount.count || 0,
                unreadMessages: unreadMessages.count || 0
            };
        } catch (error) {
            console.error('Error fetching dashboard stats:', error);
            throw error;
        }
    },

    // Get district-wise member statistics
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
    },

    // Get monthly trends
    async getMonthlyTrends(months = 6) {
        try {
            const endDate = new Date();
            const startDate = new Date();
            startDate.setMonth(startDate.getMonth() - months);

            const [members, donations, events] = await Promise.all([
                supabase
                    .from('members')
                    .select('created_at')
                    .gte('created_at', startDate.toISOString())
                    .lte('created_at', endDate.toISOString()),
                supabase
                    .from('donations')
                    .select('amount, created_at')
                    .eq('payment_status', 'completed')
                    .gte('created_at', startDate.toISOString())
                    .lte('created_at', endDate.toISOString()),
                supabase
                    .from('events')
                    .select('created_at')
                    .gte('created_at', startDate.toISOString())
                    .lte('created_at', endDate.toISOString())
            ]);

            // Process data for charts
            const trends = {};
            for (let i = 0; i < months; i++) {
                const date = new Date();
                date.setMonth(date.getMonth() - i);
                const monthKey = date.toLocaleString('default', { month: 'short', year: 'numeric' });
                trends[monthKey] = { members: 0, donations: 0, events: 0 };
            }

            members.data?.forEach(m => {
                const month = new Date(m.created_at).toLocaleString('default', { month: 'short', year: 'numeric' });
                if (trends[month]) trends[month].members++;
            });

            donations.data?.forEach(d => {
                const month = new Date(d.created_at).toLocaleString('default', { month: 'short', year: 'numeric' });
                if (trends[month]) trends[month].donations += parseFloat(d.amount);
            });

            events.data?.forEach(e => {
                const month = new Date(e.created_at).toLocaleString('default', { month: 'short', year: 'numeric' });
                if (trends[month]) trends[month].events++;
            });

            return trends;
        } catch (error) {
            console.error('Error fetching monthly trends:', error);
            throw error;
        }
    }
};

// ===== AUTHENTICATION API =====
const AuthAPI = {
    // Login
    async login(email, password) {
        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password
            });

            if (error) throw error;

            // Get admin details
            const { data: admin, error: adminError } = await supabase
                .from('admins')
                .select('*')
                .eq('email', email)
                .single();

            if (adminError) throw adminError;

            return { user: data.user, admin };
        } catch (error) {
            console.error('Error logging in:', error);
            throw error;
        }
    },

    // Logout
    async logout() {
        try {
            const { error } = await supabase.auth.signOut();
            if (error) throw error;
            return true;
        } catch (error) {
            console.error('Error logging out:', error);
            throw error;
        }
    },

    // Get current session
    async getSession() {
        try {
            const { data: { session }, error } = await supabase.auth.getSession();
            if (error) throw error;
            return session;
        } catch (error) {
            console.error('Error getting session:', error);
            throw error;
        }
    },

    // Check if admin
    async isAdmin() {
        try {
            const session = await this.getSession();
            if (!session) return false;

            const { data, error } = await supabase
                .from('admins')
                .select('role')
                .eq('email', session.user.email)
                .single();

            if (error) return false;
            return !!data;
        } catch (error) {
            console.error('Error checking admin:', error);
            return false;
        }
    }
};

// ===== REAL-TIME SUBSCRIPTIONS =====
const RealtimeAPI = {
    // Subscribe to members updates
    subscribeToMembers(callback) {
        return supabase
            .channel('members-channel')
            .on('postgres_changes', 
                { event: '*', schema: 'public', table: 'members' },
                callback
            )
            .subscribe();
    },

    // Subscribe to news updates
    subscribeToNews(callback) {
        return supabase
            .channel('news-channel')
            .on('postgres_changes',
                { event: '*', schema: 'public', table: 'news' },
                callback
            )
            .subscribe();
    },

    // Subscribe to events updates
    subscribeToEvents(callback) {
        return supabase
            .channel('events-channel')
            .on('postgres_changes',
                { event: '*', schema: 'public', table: 'events' },
                callback
            )
            .subscribe();
    },

    // Subscribe to donations updates
    subscribeToDonations(callback) {
        return supabase
            .channel('donations-channel')
            .on('postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'donations' },
                callback
            )
            .subscribe();
    },

    // Unsubscribe
    unsubscribe(channel) {
        supabase.removeChannel(channel);
    }
};

// ===== EXPORT ALL APIS =====
window.MembersAPI = MembersAPI;
window.EventsAPI = EventsAPI;
window.NewsAPI = NewsAPI;
window.GalleryAPI = GalleryAPI;
window.DonationsAPI = DonationsAPI;
window.DocumentsAPI = DocumentsAPI;
window.ContactsAPI = ContactsAPI;
window.VolunteersAPI = VolunteersAPI;
window.EventRegistrationAPI = EventRegistrationAPI;
window.StatisticsAPI = StatisticsAPI;
window.AuthAPI = AuthAPI;
window.RealtimeAPI = RealtimeAPI;
window.uploadFile = uploadFile;
window.uploadMultipleFiles = uploadMultipleFiles;
window.deleteFile = deleteFile;
