// js/donation.js - Enhanced with UPI and NetBanking

const DonationModule = (function() {
    let supabaseClient = null;

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

    // UPI Payment Processing
    async function processUPIPayment(donationData, upiId) {
        try {
            // Create donation record first
            const result = await this.createDonation({
                ...donationData,
                payment_method: 'upi'
            });
            
            if (!result.success) throw new Error(result.error);
            
            // Generate UPI payment link
            const upiLink = generateUPILink(upiId, donationData.amount, result.transactionId, donationData.name);
            
            return {
                success: true,
                data: result.data,
                transactionId: result.transactionId,
                paymentLink: upiLink,
                upiId: upiId
            };
            
        } catch (error) {
            console.error('UPI payment error:', error);
            return { success: false, error: error.message };
        }
    }

    // Generate UPI payment link
    function generateUPILink(upiId, amount, transactionId, name) {
        const payeeName = encodeURIComponent('AHBBM Donation');
        const note = encodeURIComponent(`Donation - ${transactionId}`);
        const currency = 'INR';
        
        // Format: upi://pay?pa=upiId&pn=PayeeName&am=amount&tn=Note&cu=INR
        const upiLink = `upi://pay?pa=${upiId}&pn=${payeeName}&am=${amount}&tn=${note}&cu=${currency}`;
        
        return upiLink;
    }

    // Generate QR Code for UPI (using UPI URL)
    function generateUPIQRCode(upiId, amount, transactionId) {
        const upiUrl = generateUPILink(upiId, amount, transactionId, 'Donor');
        // Return URL for QR code generation (you can use a QR code API)
        return `https://chart.googleapis.com/chart?chs=250x250&cht=qr&chl=${encodeURIComponent(upiUrl)}&choe=UTF-8`;
    }

    // NetBanking Payment (Mock - will integrate with bank API)
    async function processNetBankingPayment(donationData, bankCode) {
        try {
            // Create donation record
            const result = await this.createDonation({
                ...donationData,
                payment_method: 'netbanking',
                bank_code: bankCode
            });
            
            if (!result.success) throw new Error(result.error);
            
            // In real implementation, redirect to bank payment gateway
            // For now, return success with payment link
            return {
                success: true,
                data: result.data,
                transactionId: result.transactionId,
                bankCode: bankCode,
                paymentUrl: `https://payment-gateway.example.com/pay?txn=${result.transactionId}&bank=${bankCode}`
            };
            
        } catch (error) {
            console.error('NetBanking payment error:', error);
            return { success: false, error: error.message };
        }
    }

    // Get list of supported banks for NetBanking
    function getSupportedBanks() {
        return [
            { code: 'SBI', name: 'State Bank of India', icon: '🏦' },
            { code: 'HDFC', name: 'HDFC Bank', icon: '🏦' },
            { code: 'ICICI', name: 'ICICI Bank', icon: '🏦' },
            { code: 'AXIS', name: 'Axis Bank', icon: '🏦' },
            { code: 'PNB', name: 'Punjab National Bank', icon: '🏦' },
            { code: 'BOB', name: 'Bank of Baroda', icon: '🏦' },
            { code: 'CANARA', name: 'Canara Bank', icon: '🏦' },
            { code: 'KOTAK', name: 'Kotak Mahindra Bank', icon: '🏦' },
            { code: 'YES', name: 'Yes Bank', icon: '🏦' },
            { code: 'FEDERAL', name: 'Federal Bank', icon: '🏦' }
        ];
    }

    // Get UPI apps list
    function getUPIApps() {
        return [
            { id: 'googlepay', name: 'Google Pay', icon: 'fab fa-google-pay', scheme: 'googlepay://' },
            { id: 'phonepe', name: 'PhonePe', icon: 'fas fa-mobile-alt', scheme: 'phonepe://' },
            { id: 'paytm', name: 'Paytm', icon: 'fab fa-paytm', scheme: 'paytmmp://' },
            { id: 'amazonpay', name: 'Amazon Pay', icon: 'fab fa-amazon', scheme: 'amazonpay://' },
            { id: 'whatsapp', name: 'WhatsApp Pay', icon: 'fab fa-whatsapp', scheme: 'whatsapp://' }
        ];
    }

    // Create donation record
    async function createDonation(donationData) {
        try {
            if (!supabaseClient) throw new Error('DonationModule not initialized');
            
            const transactionId = 'DON_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6).toUpperCase();
            
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
            
            return { success: true, data, transactionId };
            
        } catch (error) {
            console.error('Error creating donation:', error);
            return { success: false, error: error.message };
        }
    }

    // Update payment status
    async function updatePaymentStatus(transactionId, paymentDetails) {
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
    }

    // Get donation by ID
    async function getDonationById(donationId) {
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
    }

    // Generate receipt HTML
    function generateReceiptHTML(donation) {
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
                        <p><strong>Payment Mode:</strong> ${getPaymentMethodLabel(donation.payment_method)}</p>
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
                    <p style="font-size: 48px; font-weight: 700; color: #27ae60;">${formatCurrency(donation.amount)}</p>
                    <p style="color: #666;">(Rupees ${numberToWords(donation.amount)} only)</p>
                </div>
                
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
    }

    function getPaymentMethodLabel(method) {
        const labels = {
            'upi': 'UPI',
            'netbanking': 'NetBanking',
            'razorpay': 'Credit/Debit Card / UPI'
        };
        return labels[method] || method;
    }

    function numberToWords(num) {
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
    }

    function downloadReceipt(donation) {
        const receiptHTML = generateReceiptHTML(donation);
        
        const win = window.open('', '_blank');
        win.document.write(`
            <html>
                <head>
                    <title>Donation Receipt - ${donation.transaction_id}</title>
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
    }

    return {
        init,
        processUPIPayment,
        processNetBankingPayment,
        createDonation,
        updatePaymentStatus,
        getDonationById,
        getSupportedBanks,
        getUPIApps,
        generateUPIQRCode,
        generateUPILink,
        downloadReceipt,
        helpers: {
            escapeHtml,
            formatDate,
            formatDateTime,
            formatCurrency
        }
    };
})();

window.DonationModule = DonationModule;
