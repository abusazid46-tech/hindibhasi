// js/pooja.js - Pooja Booking Module

const PoojaModule = (function() {
    let supabaseClient = null;

    function init(client) {
        supabaseClient = client;
        console.log('✅ PoojaModule initialized');
    }

    // Helper functions
    function escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    function formatDate(dateString) {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });
    }

    function formatDateTime(dateTimeString) {
        if (!dateTimeString) return '';
        return new Date(dateTimeString).toLocaleString('en-IN');
    }

    // Generate unique booking ID
    function generateBookingId() {
        const prefix = 'POOJA';
        const timestamp = Date.now().toString().slice(-8);
        const random = Math.random().toString(36).substr(2, 4).toUpperCase();
        return `${prefix}${timestamp}${random}`;
    }

    // Public API
    return {
        init,

        // Get all active pooja types
        async getPoojaTypes() {
            try {
                const { data, error } = await supabaseClient
                    .from('pooja_types')
                    .select('*')
                    .eq('is_active', true)
                    .order('display_order');
                
                if (error) throw error;
                return { success: true, data };
            } catch (error) {
                console.error('Error fetching pooja types:', error);
                return { success: false, error: error.message, data: [] };
            }
        },

        // Get pooja type by ID
        async getPoojaTypeById(id) {
            try {
                const { data, error } = await supabaseClient
                    .from('pooja_types')
                    .select('*')
                    .eq('id', id)
                    .single();
                
                if (error) throw error;
                return { success: true, data };
            } catch (error) {
                console.error('Error fetching pooja type:', error);
                return { success: false, error: error.message };
            }
        },

        // Get available time slots
        async getTimeSlots() {
            try {
                const { data, error } = await supabaseClient
                    .from('time_slots')
                    .select('*')
                    .eq('is_active', true)
                    .order('display_order');
                
                if (error) throw error;
                return { success: true, data };
            } catch (error) {
                console.error('Error fetching time slots:', error);
                return { success: false, error: error.message, data: [] };
            }
        },

        // Get available priests
        async getPriests() {
            try {
                const { data, error } = await supabaseClient
                    .from('priests')
                    .select('*')
                    .eq('is_available', true)
                    .order('display_order');
                
                if (error) throw error;
                return { success: true, data };
            } catch (error) {
                console.error('Error fetching priests:', error);
                return { success: false, error: error.message, data: [] };
            }
        },

        // Check available slots for a date
        async getAvailableSlots(date) {
            try {
                // Get all time slots
                const { data: slots } = await this.getTimeSlots();
                
                // Get booked slots for this date
                const { data: bookings } = await supabaseClient
                    .from('pooja_bookings')
                    .select('time_slot_time')
                    .eq('booking_date', date)
                    .in('booking_status', ['pending', 'confirmed']);
                
                const bookedTimes = new Set(bookings?.map(b => b.time_slot_time) || []);
                
                const availableSlots = slots.filter(slot => !bookedTimes.has(slot.slot_time));
                
                return { success: true, data: availableSlots };
            } catch (error) {
                console.error('Error checking available slots:', error);
                return { success: false, error: error.message, data: [] };
            }
        },

        // Create booking
        async createBooking(bookingData) {
            try {
                const bookingId = generateBookingId();
                
                // Get pooja type details for price
                const poojaType = await this.getPoojaTypeById(bookingData.pooja_type_id);
                
                let totalAmount = poojaType.data.base_price;
                if (bookingData.samagri_by_organization) {
                    totalAmount += poojaType.data.samagri_price;
                }
                
                const { data, error } = await supabaseClient
                    .from('pooja_bookings')
                    .insert([{
                        booking_id: bookingId,
                        user_name: bookingData.name,
                        user_name_hi: bookingData.name_hi || null,
                        gotra: bookingData.gotra || null,
                        gotra_hi: bookingData.gotra_hi || null,
                        rashi: bookingData.rashi || null,
                        rashi_hi: bookingData.rashi_hi || null,
                        phone: bookingData.phone,
                        email: bookingData.email || null,
                        address: bookingData.address,
                        pooja_type_id: bookingData.pooja_type_id,
                        pooja_type_name: poojaType.data.name,
                        venue: bookingData.venue,
                        booking_date: bookingData.date,
                        time_slot_id: bookingData.time_slot_id,
                        time_slot_time: bookingData.time_slot_time,
                        samagri_by_organization: bookingData.samagri_by_organization || false,
                        samagri_amount: bookingData.samagri_by_organization ? poojaType.data.samagri_price : 0,
                        total_amount: totalAmount,
                        payment_status: 'pending',
                        booking_status: 'pending'
                    }])
                    .select()
                    .single();
                
                if (error) throw error;
                
                return { success: true, data, totalAmount };
                
            } catch (error) {
                console.error('Error creating booking:', error);
                return { success: false, error: error.message };
            }
        },

        // Update payment status
        async updatePaymentStatus(bookingId, paymentDetails) {
            try {
                const { data, error } = await supabaseClient
                    .from('pooja_bookings')
                    .update({
                        payment_status: 'completed',
                        payment_method: paymentDetails.method,
                        transaction_id: paymentDetails.transaction_id,
                        utr_number: paymentDetails.utr_number,
                        updated_at: new Date().toISOString()
                    })
                    .eq('booking_id', bookingId)
                    .select()
                    .single();
                
                if (error) throw error;
                return { success: true, data };
                
            } catch (error) {
                console.error('Error updating payment:', error);
                return { success: false, error: error.message };
            }
        },

        // Get booking by ID
        async getBookingById(bookingId) {
            try {
                const { data, error } = await supabaseClient
                    .from('pooja_bookings')
                    .select('*, pooja_types(*)')
                    .eq('booking_id', bookingId)
                    .single();
                
                if (error) throw error;
                return { success: true, data };
                
            } catch (error) {
                console.error('Error fetching booking:', error);
                return { success: false, error: error.message };
            }
        },

        // Get bookings by phone (for user to check status)
        async getBookingsByPhone(phone) {
            try {
                const { data, error } = await supabaseClient
                    .from('pooja_bookings')
                    .select('*')
                    .eq('phone', phone)
                    .order('created_at', { ascending: false });
                
                if (error) throw error;
                return { success: true, data };
                
            } catch (error) {
                console.error('Error fetching bookings:', error);
                return { success: false, error: error.message, data: [] };
            }
        },

        // ADMIN FUNCTIONS
        async getAllBookings(filters = {}, page = 1, pageSize = 20) {
            try {
                let query = supabaseClient
                    .from('pooja_bookings')
                    .select('*', { count: 'exact' })
                    .order('created_at', { ascending: false });
                
                if (filters.status && filters.status !== 'all') {
                    query = query.eq('booking_status', filters.status);
                }
                
                if (filters.payment_status && filters.payment_status !== 'all') {
                    query = query.eq('payment_status', filters.payment_status);
                }
                
                if (filters.search) {
                    query = query.or(`user_name.ilike.%${filters.search}%,phone.ilike.%${filters.search}%,booking_id.ilike.%${filters.search}%`);
                }
                
                const from = (page - 1) * pageSize;
                const to = from + pageSize - 1;
                
                const { data, count, error } = await query.range(from, to);
                
                if (error) throw error;
                
                return { success: true, data, count, page, pageSize, totalPages: Math.ceil(count / pageSize) };
                
            } catch (error) {
                console.error('Error fetching bookings:', error);
                return { success: false, error: error.message, data: [], count: 0 };
            }
        },

        async updateBookingStatus(bookingId, status, assignedPriestId = null) {
            try {
                const updateData = { booking_status: status, updated_at: new Date().toISOString() };
                if (assignedPriestId) updateData.assigned_priest_id = assignedPriestId;
                
                const { data, error } = await supabaseClient
                    .from('pooja_bookings')
                    .update(updateData)
                    .eq('booking_id', bookingId)
                    .select()
                    .single();
                
                if (error) throw error;
                return { success: true, data };
                
            } catch (error) {
                console.error('Error updating booking status:', error);
                return { success: false, error: error.message };
            }
        },

        // Generate receipt HTML
        generateReceiptHTML(booking, poojaType) {
            const receiptId = 'RCT_' + booking.booking_id;
            
            return `
                <div style="font-family: 'Poppins', sans-serif; max-width: 700px; margin: 0 auto; background: white; padding: 40px; border: 2px solid #b3412e; border-radius: 20px;">
                    <div style="text-align: center; margin-bottom: 30px; border-bottom: 2px dashed #f3b28a; padding-bottom: 20px;">
                        <img src="https://i.ibb.co/XrStw9KC/1772529038848.png" style="width: 80px; height: 80px; border-radius: 50%; border: 3px solid gold; margin-bottom: 10px;">
                        <h1 style="color: #b3412e; margin: 10px 0;">Asom Hindi Bhasi Brahman Mahasabha</h1>
                        <h2 style="color: #2d1f00;">पूजा बुकिंग रसीद</h2>
                    </div>
                    
                    <div style="display: flex; justify-content: space-between; margin-bottom: 30px;">
                        <div>
                            <p><strong>Booking ID:</strong> ${booking.booking_id}</p>
                            <p><strong>Receipt No:</strong> ${receiptId}</p>
                            <p><strong>Date:</strong> ${new Date(booking.created_at).toLocaleDateString()}</p>
                        </div>
                        <div>
                            <p><strong>Pooja Date:</strong> ${formatDate(booking.booking_date)}</p>
                            <p><strong>Time:</strong> ${booking.time_slot_time}</p>
                        </div>
                    </div>
                    
                    <div style="background: #fef8f0; padding: 20px; border-radius: 15px; margin-bottom: 30px;">
                        <h3 style="color: #b3412e; margin-bottom: 15px;">Devotee Details</h3>
                        <p><strong>Name:</strong> ${escapeHtml(booking.user_name)}</p>
                        ${booking.gotra ? `<p><strong>Gotra:</strong> ${escapeHtml(booking.gotra)}</p>` : ''}
                        ${booking.rashi ? `<p><strong>Rashi:</strong> ${escapeHtml(booking.rashi)}</p>` : ''}
                        <p><strong>Phone:</strong> ${booking.phone}</p>
                        <p><strong>Address:</strong> ${escapeHtml(booking.address)}</p>
                    </div>
                    
                    <div style="background: #f0f9f0; padding: 20px; border-radius: 15px; margin-bottom: 30px;">
                        <h3 style="color: #27ae60; margin-bottom: 15px;">Pooja Details</h3>
                        <p><strong>Pooja Type:</strong> ${escapeHtml(booking.pooja_type_name)}</p>
                        <p><strong>Venue:</strong> ${booking.venue === 'home' ? '🏠 At Home' : '🛕 At Temple Center'}</p>
                        ${booking.samagri_by_organization ? '<p><strong>Samagri:</strong> Provided by Organization</p>' : '<p><strong>Samagri:</strong> To be arranged by devotee</p>'}
                    </div>
                    
                    <div style="background: #e8f0fe; padding: 20px; border-radius: 15px; margin-bottom: 30px; text-align: center;">
                        <p style="font-size: 18px; color: #666;">Total Amount</p>
                        <p style="font-size: 48px; font-weight: 700; color: #27ae60;">₹${booking.total_amount}</p>
                        <p><strong>Transaction ID:</strong> ${booking.transaction_id || 'N/A'}</p>
                        <p><strong>UTR Number:</strong> ${booking.utr_number || 'N/A'}</p>
                    </div>
                    
                    <div style="border-top: 2px solid #f3b28a; padding-top: 30px; text-align: center;">
                        <p style="font-style: italic;">धर्मो रक्षति रक्षितः</p>
                        <p style="font-size: 12px; color: #999;">* This is a computer generated receipt</p>
                    </div>
                </div>
            `;
        },

        downloadReceipt(booking) {
            const receiptHTML = this.generateReceiptHTML(booking);
            const win = window.open('', '_blank');
            win.document.write(`
                <html>
                    <head>
                        <title>Pooja Receipt - ${booking.booking_id}</title>
                        <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;600;700&display=swap" rel="stylesheet">
                    </head>
                    <body style="background: #f5f5f5; display: flex; justify-content: center; align-items: center; min-height: 100vh; margin: 0; padding: 20px;">
                        ${receiptHTML}
                        <script>
                            window.onload = function() {
                                setTimeout(() => window.print(), 500);
                            }
                        <\/script>
                    </body>
                </html>
            `);
            win.document.close();
        },

        // Download Samagri List PDF
        downloadSamagriList(poojaTypeId) {
            // In production, this would download from storage
            alert('Samagri list PDF will be available soon.');
        },

        helpers: {
            escapeHtml,
            formatDate,
            formatDateTime
        }
    };
})();

window.PoojaModule = PoojaModule;
