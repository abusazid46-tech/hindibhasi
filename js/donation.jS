// js/donation.js - Donation Management Module

const DonationModule = (function() {
    // Supabase client (will be initialized from page)
    let supabaseClient = null;

    // Initialize with supabase client
    function init(client) {
        supabaseClient = client;
        console.log('✅ DonationModule initialized');
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

    function formatDateTime(dateString) {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    function formatCurrency(amount) {
        return '₹' + parseFloat(amount).toLocaleString('en-IN', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
    }

    // Public API
    return {
        init,

        // PUBLIC FUNCTIONS - Create donation
        async createDonation(donationData) {
            try {
                if (!supabaseClient) throw new Error('DonationModule not initialized');
                
                // Generate unique transaction ID
                const transactionId = 'DON_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
                
                // Insert donation record
                const { data, error } = await supabaseClient
                    .from('donations')
                    .insert([{
                        donor_name: donationData.name,
                        donor_phone: donationData.phone,
                        donor_email: donationData.email || null,
                        amount: donationData.amount,
                        payment_status: 'pending',
                        transaction_id: transactionId,
                        payment_method: donationData.payment_method || 'razorpay',
                        is_anonymous: donationData.is_anonymous || false,
                        message: donationData.message || null,
                        created_at: new Date().toISOString()
                    }])
                    .select()
                    .single();
                
                if (error) throw error;
                
                return { 
                    success: true, 
                    data,
                    transactionId 
                };
                
            } catch (error) {
                console.error('Error creating donation:', error);
                return { success: false, error: error.message };
            }
        },

        // Update payment status after successful payment
        async updatePaymentStatus(transactionId, paymentDetails) {
            try {
                if (!supabaseClient) throw new Error('DonationModule not initialized');
                
                const { data, error } = await supabaseClient
                    .from('donations')
                    .update({
                        payment_status: 'completed',
                        payment_details: paymentDetails,
                        receipt_generated: false
                    })
                    .eq('transaction_id', transactionId)
                    .select()
                    .single();
                
                if (error) throw error;
                
                return { success: true, data };
                
            } catch (error) {
                console.error('Error updating payment status:', error);
                return { success: false, error: error.message };
            }
        },

        // Get donation by ID
        async getDonationById(donationId) {
            try {
                if (!supabaseClient) throw new Error('DonationModule not initialized');
                
                const { data, error } = await supabaseClient
                    .from('donations')
                    .select('*')
                    .eq('id', donationId)
                    .single();
                
                if (error) throw error;
                return { success: true, data };
                
            } catch (error) {
                console.error('Error fetching donation:', error);
                return { success: false, error: error.message };
            }
        },

        // Get donation by transaction ID
        async getDonationByTransaction(transactionId) {
            try {
                if (!supabaseClient) throw new Error('DonationModule not initialized');
                
                const { data, error } = await supabaseClient
                    .from('donations')
                    .select('*')
                    .eq('transaction_id', transactionId)
                    .single();
                
                if (error) throw error;
                return { success: true, data };
                
            } catch (error) {
                console.error('Error fetching donation:', error);
                return { success: false, error: error.message };
            }
        },

        // ADMIN FUNCTIONS
        async getAllDonations(filters = {}, page = 1, pageSize = 20) {
            try {
                if (!supabaseClient) throw new Error('DonationModule not initialized');
                
                let query = supabaseClient
                    .from('donations')
                    .select('*', { count: 'exact' });
                
                // Apply status filter
                if (filters.status && filters.status !== 'all') {
                    query = query.eq('payment_status', filters.status);
                }
                
                // Apply search filter
                if (filters.search) {
                    query = query.or(`
                        donor_name.ilike.%${filters.search}%,
                        donor_email.ilike.%${filters.search}%,
                        donor_phone.ilike.%${filters.search}%,
                        transaction_id.ilike.%${filters.search}%
                    `);
                }
                
                // Apply date range filter
                if (filters.from_date) {
                    query = query.gte('created_at', filters.from_date);
                }
                if (filters.to_date) {
                    query = query.lte('created_at', filters.to_date);
                }
                
                // Apply amount range filter
                if (filters.min_amount) {
                    query = query.gte('amount', filters.min_amount);
                }
                if (filters.max_amount) {
                    query = query.lte('amount', filters.max_amount);
                }
                
                // Apply sorting
                switch (filters.sort || 'newest') {
                    case 'newest':
                        query = query.order('created_at', { ascending: false });
                        break;
                    case 'oldest':
                        query = query.order('created_at', { ascending: true });
                        break;
                    case 'highest':
                        query = query.order('amount', { ascending: false });
                        break;
                    case 'lowest':
                        query = query.order('amount', { ascending: true });
                        break;
                }
                
                const { count, error: countError } = await query.select('*', { count: 'exact', head: true });
                if (countError) throw countError;
                
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
                console.error('Error fetching donations:', error);
                return { success: false, error: error.message, data: [], count: 0 };
            }
        },

        // Get donation statistics
        async getDonationStats(period = 'month') {
            try {
                if (!supabaseClient) throw new Error('DonationModule not initialized');
                
                let startDate;
                const now = new Date();
                
                switch(period) {
                    case 'today':
                        startDate = new Date(now.setHours(0,0,0,0)).toISOString();
                        break;
                    case 'week':
                        startDate = new Date(now.setDate(now.getDate() - 7)).toISOString();
                        break;
                    case 'month':
                        startDate = new Date(now.setMonth(now.getMonth() - 1)).toISOString();
                        break;
                    case 'year':
                        startDate = new Date(now.setFullYear(now.getFullYear() - 1)).toISOString();
                        break;
                    default:
                        startDate = new Date(now.setMonth(now.getMonth() - 1)).toISOString();
                }
                
                // Get completed donations in period
                const { data, error } = await supabaseClient
                    .from('donations')
                    .select('*')
                    .eq('payment_status', 'completed')
                    .gte('created_at', startDate);
                
                if (error) throw error;
                
                const total = data.reduce((sum, d) => sum + d.amount, 0);
                const count = data.length;
                const avg = count > 0 ? total / count : 0;
                const max = Math.max(...data.map(d => d.amount), 0);
                const min = Math.min(...data.map(d => d.amount), 0);
                
                // Group by date for chart
                const byDate = {};
                data.forEach(d => {
                    const date = d.created_at.split('T')[0];
                    if (!byDate[date]) {
                        byDate[date] = { count: 0, total: 0 };
                    }
                    byDate[date].count++;
                    byDate[date].total += d.amount;
                });
                
                const chartData = Object.entries(byDate).map(([date, stats]) => ({
                    date,
                    count: stats.count,
                    total: stats.total
                })).sort((a, b) => a.date.localeCompare(b.date));
                
                return {
                    success: true,
                    data: {
                        total,
                        count,
                        avg,
                        max,
                        min,
                        chartData
                    }
                };
                
            } catch (error) {
                console.error('Error getting donation stats:', error);
                return { success: false, error: error.message };
            }
        },

        // Generate receipt HTML
        generateReceiptHTML(donation) {
            const receiptId = 'RCT_' + donation.transaction_id.split('_')[1];
            const date = new Date(donation.created_at).toLocaleDateString('en-IN', {
                day: 'numeric',
                month: 'long',
                year: 'numeric'
            });
            
            return `
                <div style="font-family: 'Poppins', sans-serif; max-width: 700px; margin: 0 auto; background: white; padding: 40px; border: 2px solid #b3412e; border-radius: 20px;">
                    <div style="text-align: center; margin-bottom: 30px; border-bottom: 2px dashed #f3b28a; padding-bottom: 20px;">
                        <img src="https://i.ibb.co/XrStw9KC/1772529038848.png" style="width: 80px; height: 80px; border-radius: 50%; border: 3px solid gold; margin-bottom: 10px;">
                        <h1 style="color: #b3412e; margin: 10px 0;">Asom Hindi Bhasi Brahman Mahasabha</h1>
                        <p style="color: #666;">Tax Exemption under 80G</p>
                    </div>
                    
                    <h2 style="text-align: center; color: #2d1f00; margin-bottom: 30px;">DONATION RECEIPT</h2>
                    
                    <div style="display: flex; justify-content: space-between; margin-bottom: 30px;">
                        <div>
                            <p><strong>Receipt No:</strong> ${receiptId}</p>
                            <p><strong>Date:</strong> ${date}</p>
                        </div>
                        <div>
                            <p><strong>Transaction ID:</strong> ${donation.transaction_id}</p>
                            <p><strong>Payment Mode:</strong> ${donation.payment_method || 'Online'}</p>
                        </div>
                    </div>
                    
                    <div style="background: #fef8f0; padding: 20px; border-radius: 15px; margin-bottom: 30px;">
                        <h3 style="color: #b3412e; margin-bottom: 15px;">Received with thanks from</h3>
                        <p><strong>Name:</strong> ${donation.is_anonymous ? 'Anonymous' : donation.donor_name}</p>
                        ${!donation.is_anonymous && donation.donor_phone ? `<p><strong>Phone:</strong> ${donation.donor_phone}</p>` : ''}
                        ${!donation.is_anonymous && donation.donor_email ? `<p><strong>Email:</strong> ${donation.donor_email}</p>` : ''}
                    </div>
                    
                    <div style="background: #f0f9f0; padding: 20px; border-radius: 15px; margin-bottom: 30px; text-align: center;">
                        <p style="font-size: 18px; color: #666;">Amount Donated</p>
                        <p style="font-size: 48px; font-weight: 700; color: #27ae60;">${this.helpers.formatCurrency(donation.amount)}</p>
                        <p style="color: #666;">(Rupees ${this.numberToWords(donation.amount)} only)</p>
                    </div>
                    
                    ${donation.message ? `
                        <div style="margin-bottom: 30px;">
                            <p><strong>Message:</strong> ${donation.message}</p>
                        </div>
                    ` : ''}
                    
                    <div style="border-top: 2px solid #f3b28a; padding-top: 30px; display: flex; justify-content: space-between;">
                        <div>
                            <p style="font-weight: 600;">For Asom Hindi Bhasi Brahman Mahasabha</p>
                            <br><br>
                            <p>Authorized Signatory</p>
                        </div>
                        <div style="text-align: right;">
                            <p style="font-style: italic;">* This is a computer generated receipt</p>
                            <p style="font-size: 12px; color: #999;">PAN: AAAAA0000A</p>
                            <p style="font-size: 12px; color: #999;">80G: NO. AAA/80G/2026</p>
                        </div>
                    </div>
                </div>
            `;
        },

        // Download receipt as PDF
        downloadReceipt(donation) {
            const receiptHTML = this.generateReceiptHTML(donation);
            
            const win = window.open('', '_blank');
            win.document.write(`
                <html>
                    <head>
                        <title>Donation Receipt - ${donation.transaction_id}</title>
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
                        ${receiptHTML}
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

        // Mark receipt as generated
        async markReceiptGenerated(donationId) {
            try {
                if (!supabaseClient) throw new Error('DonationModule not initialized');
                
                const { error } = await supabaseClient
                    .from('donations')
                    .update({ receipt_generated: true })
                    .eq('id', donationId);
                
                if (error) throw error;
                return { success: true };
                
            } catch (error) {
                console.error('Error marking receipt:', error);
                return { success: false, error: error.message };
            }
        },

        // Helper: Convert number to words (for receipts)
        numberToWords(num) {
            const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
                'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
            const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
            
            if (num === 0) return 'Zero';
            
            const numToWords = (n) => {
                if (n < 20) return ones[n];
                if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 ? ' ' + ones[n % 10] : '');
                if (n < 1000) return ones[Math.floor(n / 100)] + ' Hundred' + (n % 100 ? ' ' + numToWords(n % 100) : '');
                if (n < 100000) return numToWords(Math.floor(n / 1000)) + ' Thousand' + (n % 1000 ? ' ' + numToWords(n % 1000) : '');
                if (n < 10000000) return numToWords(Math.floor(n / 100000)) + ' Lakh' + (n % 100000 ? ' ' + numToWords(n % 100000) : '');
                return numToWords(Math.floor(n / 10000000)) + ' Crore' + (n % 10000000 ? ' ' + numToWords(n % 10000000) : '');
            };
            
            const rupees = Math.floor(num);
            const paise = Math.round((num - rupees) * 100);
            
            let result = numToWords(rupees) + ' Rupees';
            if (paise > 0) {
                result += ' and ' + numToWords(paise) + ' Paise';
            }
            
            return result;
        },

        // Export donations to CSV
        exportToCSV(donations) {
            const headers = ['Transaction ID', 'Date', 'Donor Name', 'Phone', 'Email', 'Amount', 'Status', 'Payment Method', 'Anonymous', 'Message'];
            
            const rows = donations.map(d => [
                d.transaction_id,
                new Date(d.created_at).toLocaleString(),
                d.is_anonymous ? 'Anonymous' : d.donor_name,
                d.donor_phone || '',
                d.donor_email || '',
                d.amount,
                d.payment_status,
                d.payment_method || '',
                d.is_anonymous ? 'Yes' : 'No',
                d.message || ''
            ]);
            
            const csvContent = [
                headers.join(','),
                ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
            ].join('\n');
            
            const blob = new Blob([csvContent], { type: 'text/csv' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `donations_${new Date().toISOString().split('T')[0]}.csv`;
            a.click();
            window.URL.revokeObjectURL(url);
        },

        // Helpers
        helpers: {
            escapeHtml,
            formatDate,
            formatDateTime,
            formatCurrency
        }
    };
})();

// Make module available globally
window.DonationModule = DonationModule;
