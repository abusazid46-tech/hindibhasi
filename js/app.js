// ===== GLOBAL VARIABLES =====
let currentLanguage = 'en';
let currentUser = null;

// ===== LANGUAGE TRANSLATIONS =====
const translations = {
    en: {
        // Navigation
        home: 'Home',
        about: 'About Us',
        members: 'Members',
        events: 'Events',
        news: 'News',
        gallery: 'Gallery',
        donation: 'Donate',
        contact: 'Contact',
        join: 'Join Now',
        
        // Common
        readMore: 'Read More',
        viewAll: 'View All',
        search: 'Search',
        filter: 'Filter',
        apply: 'Apply',
        reset: 'Reset',
        submit: 'Submit',
        cancel: 'Cancel',
        save: 'Save',
        delete: 'Delete',
        edit: 'Edit',
        
        // Messages
        loading: 'Loading...',
        noData: 'No data found',
        error: 'An error occurred',
        success: 'Success!',
        confirm: 'Are you sure?',
        
        // Hero
        heroTitle: 'Serving Dharma & Humanity',
        heroDesc: 'A Non-Profit Organization for Cultural & Social Welfare',
        
        // About
        aboutTitle: 'About Us',
        aboutText: 'We are a registered non-profit Brahman society working for religious, cultural and charity activities across Assam and India.',
        
        // Membership
        joinTitle: 'Become a Member',
        joinDesc: 'Join our community and be part of our cultural and social initiatives.',
        memberName: 'Full Name',
        memberEmail: 'Email',
        memberPhone: 'Phone',
        memberDistrict: 'District',
        memberVillage: 'Village',
        memberPhoto: 'Photo',
        
        // Donation
        donateTitle: 'Support Our Cause',
        donateDesc: 'Your donations help us serve the community better.',
        donateAmount: 'Donation Amount',
        
        // Contact
        contactTitle: 'Contact Us',
        contactName: 'Your Name',
        contactEmail: 'Your Email',
        contactPhone: 'Phone Number',
        contactMessage: 'Your Message',
        contactSubject: 'Subject',
        
        // Footer
        footer: 'All Rights Reserved',
        
        // Events
        upcomingEvents: 'Upcoming Events',
        pastEvents: 'Past Events',
        eventDate: 'Date',
        eventVenue: 'Venue',
        register: 'Register',
        
        // News
        latestNews: 'Latest News',
        importantNotices: 'Important Notices',
        newsArchive: 'News Archive',
        
        // Gallery
        photoGallery: 'Photo Gallery',
        videoGallery: 'Video Gallery',
        
        // Member Directory
        memberDirectory: 'Member Directory',
        searchByName: 'Search by name',
        searchByDistrict: 'Search by district',
        membershipId: 'Membership ID',
        
        // Documents
        documents: 'Documents',
        download: 'Download',
        preview: 'Preview',
        
        // Forms
        required: 'Required',
        optional: 'Optional',
        agreeTerms: 'I agree to the terms and conditions',
        
        // Buttons
        btnJoin: 'Join Now',
        btnDonate: 'Donate Now',
        btnSubscribe: 'Subscribe',
        btnSend: 'Send Message',
        btnBook: 'Book Now',
        btnLearnMore: 'Learn More'
    },
    hi: {
        // Navigation
        home: 'होम',
        about: 'हमारे बारे में',
        members: 'सदस्य',
        events: 'कार्यक्रम',
        news: 'समाचार',
        gallery: 'गैलरी',
        donation: 'दान करें',
        contact: 'संपर्क',
        join: 'सदस्य बनें',
        
        // Common
        readMore: 'और पढ़ें',
        viewAll: 'सभी देखें',
        search: 'खोजें',
        filter: 'फ़िल्टर',
        apply: 'लागू करें',
        reset: 'रीसेट',
        submit: 'जमा करें',
        cancel: 'रद्द करें',
        save: 'सहेजें',
        delete: 'हटाएं',
        edit: 'संपादित करें',
        
        // Hero
        heroTitle: 'धर्म और मानवता की सेवा',
        heroDesc: 'सांस्कृतिक और सामाजिक कल्याण हेतु एक गैर-लाभकारी संगठन',
        
        // About
        aboutTitle: 'हमारे बारे में',
        aboutText: 'हम असम और भारत में धार्मिक, सांस्कृतिक और चैरिटी गतिविधियों के लिए कार्यरत एक पंजीकृत ब्राह्मण समाज हैं।',
        
        // Contact
        contactTitle: 'संपर्क करें',
        contactName: 'आपका नाम',
        contactEmail: 'आपका ईमेल',
        contactPhone: 'फ़ोन नंबर',
        contactMessage: 'आपका संदेश'
    },
    as: {
        // Navigation
        home: 'হোম',
        about: 'আমাৰ বিষয়ে',
        members: 'সদস্য',
        events: 'কাৰ্যসূচী',
        news: 'বাতৰি',
        gallery: 'গেলাৰী',
        donation: 'দান কৰক',
        contact: 'যোগাযোগ',
        join: 'যোগদান কৰক',
        
        // Hero
        heroTitle: 'ধৰ্ম আৰু মানৱতাৰ সেৱা',
        heroDesc: 'সাংস্কৃতিক আৰু সামাজিক কল্যাণৰ বাবে এটা অ-লাভজনক সংস্থা',
        
        // About
        aboutTitle: 'আমাৰ বিষয়ে',
        aboutText: 'আমি অসম আৰু ভাৰতত ধাৰ্মিক, সাংস্কৃতিক আৰু দানশীল কামত নিয়োজিত এটা পঞ্জীভুক্ত ব্ৰাহ্মণ সমাজ।',
        
        // Contact
        contactTitle: 'যোগাযোগ',
        contactName: 'আপোনাৰ নাম',
        contactEmail: 'আপোনাৰ ইমেইল',
        contactPhone: 'ফোন নম্বৰ',
        contactMessage: 'আপোনাৰ বাৰ্তা'
    }
};

// ===== LANGUAGE FUNCTIONS =====
function setLanguage(lang) {
    currentLanguage = lang;
    
    // Update active button
    document.querySelectorAll('.lang-option').forEach(btn => {
        btn.classList.remove('active');
        if (btn.classList.contains(lang)) {
            btn.classList.add('active');
        }
    });
    
    // Update all elements with data-i18n attribute
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (translations[lang] && translations[lang][key]) {
            el.textContent = translations[lang][key];
        }
    });
    
    // Update placeholders
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
        const key = el.getAttribute('data-i18n-placeholder');
        if (translations[lang] && translations[lang][key]) {
            el.placeholder = translations[lang][key];
        }
    });
    
    // Save preference
    localStorage.setItem('preferredLanguage', lang);
}

// Load saved language preference
function loadLanguagePreference() {
    const savedLang = localStorage.getItem('preferredLanguage');
    if (savedLang && ['en', 'hi', 'as'].includes(savedLang)) {
        setLanguage(savedLang);
    }
}

// ===== UI HELPER FUNCTIONS =====
function showLoading(element) {
    if (element) {
        element.classList.add('loading');
        element.disabled = true;
    }
}

function hideLoading(element) {
    if (element) {
        element.classList.remove('loading');
        element.disabled = false;
    }
}

function showToast(message, type = 'info') {
    // Create toast container if not exists
    let toastContainer = document.querySelector('.toast-container');
    if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.className = 'toast-container';
        document.body.appendChild(toastContainer);
    }
    
    // Create toast
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
        <i class="fas ${type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle'}"></i>
        <span>${message}</span>
    `;
    
    toastContainer.appendChild(toast);
    
    // Remove after 3 seconds
    setTimeout(() => {
        toast.remove();
    }, 3000);
}

function formatDate(dateString) {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
}

function formatDateTime(dateString) {
    const options = { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    };
    return new Date(dateString).toLocaleDateString(undefined, options);
}

function truncateText(text, length = 100) {
    if (text.length <= length) return text;
    return text.substring(0, length) + '...';
}

// ===== MEMBERSHIP FUNCTIONS =====
async function processJoin() {
    const name = document.getElementById('memberName')?.value;
    const email = document.getElementById('memberEmail')?.value;
    const phone = document.getElementById('memberPhone')?.value;
    const district = document.getElementById('memberDistrict')?.value;
    const village = document.getElementById('memberVillage')?.value;
    const photoFile = document.getElementById('memberPhoto')?.files[0];
    const terms = document.getElementById('terms')?.checked;
    
    if (!name || !phone || !district || !village) {
        showToast('Please fill all required fields', 'error');
        return;
    }
    
    if (!terms) {
        showToast('Please accept the terms and conditions', 'error');
        return;
    }
    
    const joinBtn = document.querySelector('#joinForm button[type="submit"]');
    showLoading(joinBtn);
    
    try {
        const memberData = {
            name,
            email,
            phone,
            district,
            village
        };
        
        const member = await MembersAPI.register(memberData, photoFile);
        
        showToast(`Registration successful! Your Membership ID: ${member.membership_id}`, 'success');
        
        // Show certificate
        showCertificate(name, member.membership_id);
        
        // Reset form
        document.getElementById('joinForm')?.reset();
        
        // Send WhatsApp notification
        sendWhatsAppNotification(`New membership registration: ${name} (${phone})`);
        
    } catch (error) {
        showToast(error.message || 'Error registering', 'error');
    } finally {
        hideLoading(joinBtn);
    }
}

function showCertificate(name, membershipId) {
    const certBox = document.getElementById('certificateBox');
    if (certBox) {
        document.getElementById('certName').textContent = name;
        document.getElementById('certId').textContent = membershipId;
        document.getElementById('certDate').textContent = new Date().toLocaleDateString();
        certBox.classList.add('show');
        
        // Auto hide after 10 seconds
        setTimeout(() => {
            certBox.classList.remove('show');
        }, 10000);
    }
}

async function downloadCertificate() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    const name = document.getElementById('certName')?.textContent || 'Member';
    const id = document.getElementById('certId')?.textContent || 'N/A';
    const date = document.getElementById('certDate')?.textContent || new Date().toLocaleDateString();
    
    // Add decorative border
    doc.setDrawColor(179, 65, 46);
    doc.setLineWidth(2);
    doc.rect(10, 10, 190, 277);
    
    // Add double border
    doc.setLineWidth(0.5);
    doc.rect(15, 15, 180, 267);
    
    // Title
    doc.setFontSize(28);
    doc.setTextColor(179, 65, 46);
    doc.text('Membership Certificate', 105, 40, { align: 'center' });
    
    // Decorative line
    doc.setLineWidth(1);
    doc.line(40, 45, 170, 45);
    
    // Content
    doc.setFontSize(16);
    doc.setTextColor(0, 0, 0);
    doc.text('This certifies that', 105, 70, { align: 'center' });
    
    doc.setFontSize(24);
    doc.setTextColor(179, 65, 46);
    doc.text(name, 105, 90, { align: 'center' });
    
    doc.setFontSize(14);
    doc.setTextColor(0, 0, 0);
    doc.text(`Membership ID: ${id}`, 105, 110, { align: 'center' });
    doc.text(`Issued on: ${date}`, 105, 120, { align: 'center' });
    
    doc.setFontSize(12);
    doc.text('is an active member of', 105, 140, { align: 'center' });
    
    doc.setFontSize(16);
    doc.setTextColor(179, 65, 46);
    doc.text('Asom Hindi Bhasi Brahman Mahasabha', 105, 155, { align: 'center' });
    
    // Seal/Stamp
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text('धर्मो रक्षति रक्षितः', 105, 200, { align: 'center' });
    
    // Signature line
    doc.line(60, 230, 150, 230);
    doc.setFontSize(10);
    doc.text('Authorized Signature', 105, 240, { align: 'center' });
    
    doc.save(`membership-certificate-${id}.pdf`);
}

// ===== DONATION FUNCTIONS =====
async function processDonation() {
    const name = document.getElementById('donorName')?.value;
    const phone = document.getElementById('donorPhone')?.value;
    const email = document.getElementById('donorEmail')?.value;
    const amount = document.getElementById('donationAmount')?.value;
    const purpose = document.getElementById('donationPurpose')?.value;
    const taxBenefit = document.getElementById('taxBenefit')?.checked;
    const paymentMethod = document.querySelector('input[name="paymentMethod"]:checked')?.value;
    
    if (!name || !phone || !amount) {
        showToast('Please fill all required fields', 'error');
        return;
    }
    
    if (amount < 10) {
        showToast('Minimum donation amount is ₹10', 'error');
        return;
    }
    
    const donateBtn = document.querySelector('#donationForm button[type="submit"]');
    showLoading(donateBtn);
    
    try {
        // Save donation record
        const donation = await DonationsAPI.create({
            donor_name: name,
            phone,
            email,
            amount,
            purpose: purpose || 'General',
            tax_benefit: taxBenefit,
            payment_method: paymentMethod,
            payment_status: 'pending'
        });
        
        // Initialize Razorpay
        const options = {
            key: 'YOUR_RAZORPAY_KEY',
            amount: amount * 100,
            currency: 'INR',
            name: 'Asom Hindi Bhasi Brahman Mahasabha',
            description: purpose || 'Donation',
            image: '/assets/images/logo.png',
            handler: async function(response) {
                // Update donation status
                await supabase
                    .from('donations')
                    .update({ 
                        payment_id: response.razorpay_payment_id,
                        payment_status: 'completed' 
                    })
                    .eq('id', donation.id);
                
                showToast(`Thank you for your donation of ₹${amount}!`, 'success');
                
                // Redirect to success page
                setTimeout(() => {
                    window.location.href = `donation-success.html?amount=${amount}&payment_id=${response.razorpay_payment_id}`;
                }, 2000);
            },
            modal: {
                ondismiss: function() {
                    // Update donation as failed
                    supabase
                        .from('donations')
                        .update({ payment_status: 'failed' })
                        .eq('id', donation.id);
                    
                    showToast('Payment cancelled', 'info');
                }
            },
            prefill: {
                name: name,
                email: email,
                contact: phone
            },
            theme: {
                color: '#b3412e'
            }
        };
        
        const rzp = new Razorpay(options);
        rzp.open();
        
    } catch (error) {
        showToast(error.message || 'Error processing donation', 'error');
    } finally {
        hideLoading(donateBtn);
    }
}

function setAmount(amount) {
    const input = document.getElementById('donationAmount');
    if (input) {
        input.value = amount;
    }
}

// ===== PUJA BOOKING =====
async function bookPuja() {
    const name = document.getElementById('pujaName')?.value;
    const type = document.getElementById('pujaType')?.value;
    const date = document.getElementById('pujaDate')?.value;
    const time = document.getElementById('pujaTime')?.value;
    const phone = document.getElementById('pujaPhone')?.value;
    
    if (!name || !type || !date || !phone) {
        showToast('Please fill all required fields', 'error');
        return;
    }
    
    const bookBtn = document.querySelector('#pujaForm button[type="submit"]');
    showLoading(bookBtn);
    
    try {
        // Save booking to database
        const { data, error } = await supabase
            .from('puja_bookings')
            .insert([{
                name,
                puja_type: type,
                preferred_date: date,
                preferred_time: time,
                phone,
                status: 'pending',
                created_at: new Date().toISOString()
            }]);
        
        if (error) throw error;
        
        // Send WhatsApp notification
        const message = `New Puja Booking:\nName: ${name}\nType: ${type}\nDate: ${date}\nTime: ${time || 'Not specified'}\nPhone: ${phone}`;
        sendWhatsAppNotification(message);
        
        showToast('Booking request sent! We will contact you shortly.', 'success');
        document.getElementById('pujaForm')?.reset();
        
    } catch (error) {
        showToast(error.message || 'Error booking puja', 'error');
    } finally {
        hideLoading(bookBtn);
    }
}

// ===== CONTACT FORM =====
async function submitContact() {
    const name = document.getElementById('contactName')?.value;
    const email = document.getElementById('contactEmail')?.value;
    const phone = document.getElementById('contactPhone')?.value;
    const subject = document.getElementById('contactSubject')?.value;
    const message = document.getElementById('contactMessage')?.value;
    const sendCopy = document.getElementById('contactCopy')?.checked;
    
    if (!name || !message) {
        showToast('Please fill required fields', 'error');
        return;
    }
    
    const contactBtn = document.querySelector('#contactForm button[type="submit"]');
    showLoading(contactBtn);
    
    try {
        await ContactsAPI.submit({
            name,
            email,
            phone,
            subject,
            message
        });
        
        showToast('Message sent successfully! We will get back to you soon.', 'success');
        document.getElementById('contactForm')?.reset();
        
        // Send WhatsApp notification to admin
        const adminMessage = `New Contact Form Submission:\nName: ${name}\nEmail: ${email || 'N/A'}\nPhone: ${phone || 'N/A'}\nSubject: ${subject || 'N/A'}`;
        sendWhatsAppNotification(adminMessage);
        
    } catch (error) {
        showToast(error.message || 'Error sending message', 'error');
    } finally {
        hideLoading(contactBtn);
    }
}

// ===== WHATSAPP NOTIFICATION =====
function sendWhatsAppNotification(message) {
    const adminNumber = '919876543210'; // Replace with actual admin number
    const whatsappUrl = `https://wa.me/${adminNumber}?text=${encodeURIComponent(message)}`;
    
    // Open in new tab (optional - comment out if you don't want to open)
    // window.open(whatsappUrl, '_blank');
    
    // For silent notification, you can use WhatsApp Business API
    console.log('WhatsApp notification:', message);
}

// ===== NEWSLETTER SUBSCRIPTION =====
async function subscribeNewsletter() {
    const email = document.getElementById('newsletterEmail')?.value;
    
    if (!email || !email.includes('@')) {
        showToast('Please enter a valid email', 'error');
        return;
    }
    
    try {
        const { data, error } = await supabase
            .from('newsletter_subscribers')
            .insert([{
                email,
                subscribed_at: new Date().toISOString()
            }]);
        
        if (error) throw error;
        
        showToast('Successfully subscribed to newsletter!', 'success');
        document.getElementById('newsletterEmail').value = '';
        
    } catch (error) {
        if (error.message.includes('duplicate')) {
            showToast('This email is already subscribed', 'info');
        } else {
            showToast(error.message || 'Error subscribing', 'error');
        }
    }
}

// ===== SEARCH MEMBERS =====
let searchTimeout;
function searchMembers() {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(async () => {
        const searchInput = document.getElementById('searchMembers');
        const resultsContainer = document.getElementById('searchResults');
        
        if (!searchInput || !resultsContainer) return;
        
        const query = searchInput.value.trim();
        
        if (query.length < 2) {
            resultsContainer.innerHTML = '';
            return;
        }
        
        try {
            const { data } = await supabase
                .from('members')
                .select('name, membership_id, district, photo_url')
                .eq('status', 'approved')
                .ilike('name', `%${query}%`)
                .limit(5);
            
            if (data && data.length > 0) {
                resultsContainer.innerHTML = data.map(member => `
                    <div class="search-result-item" onclick="window.location.href='member-profile.html?id=${member.id}'">
                        <img src="${member.photo_url || 'assets/images/default-avatar.png'}" alt="${member.name}">
                        <div>
                            <h4>${member.name}</h4>
                            <p>${member.membership_id} • ${member.district}</p>
                        </div>
                    </div>
                `).join('');
            } else {
                resultsContainer.innerHTML = '<div class="search-result-item">No members found</div>';
            }
        } catch (error) {
            console.error('Error searching members:', error);
        }
    }, 300);
}

// ===== LOAD DATA =====
async function loadLatestNews() {
    const container = document.getElementById('latestNews');
    if (!container) return;
    
    try {
        const news = await NewsAPI.getLatestNews(3);
        
        container.innerHTML = news.map(item => `
            <div class="news-card">
                ${item.image_url ? 
                    `<img src="${item.image_url}" alt="${item.title}" loading="lazy">` : 
                    `<div class="news-image-placeholder"><i class="fas fa-newspaper"></i></div>`
                }
                <div class="news-content">
                    <h3>${item.title}</h3>
                    <p>${truncateText(item.content, 100)}</p>
                    <div class="news-meta">
                        <small>${formatDate(item.created_at)}</small>
                        <button class="read-more" onclick="window.location.href='news.html?id=${item.id}'">
                            ${translations[currentLanguage].readMore}
                        </button>
                    </div>
                </div>
            </div>
        `).join('');
        
    } catch (error) {
        console.error('Error loading news:', error);
        container.innerHTML = '<p class="error">Failed to load news</p>';
    }
}

async function loadUpcomingEvents() {
    const container = document.getElementById('upcomingEvents');
    if (!container) return;
    
    try {
        const events = await EventsAPI.getUpcomingEvents(3);
        
        container.innerHTML = events.map(event => `
            <div class="event-card">
                ${event.image_url ? 
                    `<img src="${event.image_url}" alt="${event.title}" loading="lazy">` : 
                    `<div class="event-image-placeholder"><i class="fas fa-calendar-alt"></i></div>`
                }
                <div class="event-content">
                    <h3>${event.title}</h3>
                    <p><i class="fas fa-calendar"></i> ${formatDate(event.event_date)}</p>
                    <p>${truncateText(event.description || 'No description', 80)}</p>
                    <button class="btn btn-small" onclick="window.location.href='event-details.html?id=${event.id}'">
                        ${translations[currentLanguage].viewAll}
                    </button>
                </div>
            </div>
        `).join('');
        
    } catch (error) {
        console.error('Error loading events:', error);
        container.innerHTML = '<p class="error">Failed to load events</p>';
    }
}

async function loadGalleryPreview() {
    const container = document.getElementById('galleryPreview');
    if (!container) return;
    
    try {
        const { data } = await GalleryAPI.getGallery('image', 1, 6);
        
        container.innerHTML = data.map(item => `
            <div class="gallery-item" onclick="window.location.href='photo-gallery.html'">
                <img src="${item.file_url}" alt="${item.title}" loading="lazy">
            </div>
        `).join('');
        
    } catch (error) {
        console.error('Error loading gallery:', error);
    }
}

async function loadImportantNotices() {
    const container = document.getElementById('importantNotices');
    if (!container) return;
    
    try {
        const notices = await NewsAPI.getImportantNews();
        
        container.innerHTML = notices.map(notice => `
            <div class="notice-item">
                <div class="notice-icon"><i class="fas fa-exclamation-circle"></i></div>
                <div class="notice-content">
                    <h4>${notice.title}</h4>
                    <p>${truncateText(notice.content, 120)}</p>
                    <small>${formatDate(notice.created_at)}</small>
                </div>
            </div>
        `).join('');
        
    } catch (error) {
        console.error('Error loading notices:', error);
    }
}

async function loadRecentDonors() {
    const container = document.getElementById('recentDonors');
    if (!container) return;
    
    try {
        const { data } = await supabase
            .from('donations')
            .select('donor_name, amount, created_at')
            .eq('payment_status', 'completed')
            .order('created_at', { ascending: false })
            .limit(10);
        
        container.innerHTML = data.map(donor => `
            <div class="donor-item">
                <i class="fas fa-user-circle"></i>
                <div>
                    <strong>${donor.donor_name}</strong>
                    <p>₹${donor.amount} • ${formatDate(donor.created_at)}</p>
                </div>
            </div>
        `).join('');
        
    } catch (error) {
        console.error('Error loading donors:', error);
    }
}

async function loadCommittee() {
    const container = document.getElementById('committeeGrid');
    if (!container) return;
    
    try {
        // You can fetch from database or use static data
        const committee = [
            {
                name: 'Dr. Ram Sharma',
                designation: 'President',
                district: 'Kamrup',
                photo: 'assets/images/committee/president.jpg'
            },
            {
                name: 'Shri Suresh Mishra',
                designation: 'Vice President',
                district: 'Nagaon',
                photo: 'assets/images/committee/vp.jpg'
            },
            {
                name: 'Shri Rajesh Tiwari',
                designation: 'General Secretary',
                district: 'Dibrugarh',
                photo: 'assets/images/committee/secretary.jpg'
            },
            {
                name: 'Shri Anil Dubey',
                designation: 'Treasurer',
                district: 'Jorhat',
                photo: 'assets/images/committee/treasurer.jpg'
            }
        ];
        
        container.innerHTML = committee.map(member => `
            <div class="committee-card">
                <img src="${member.photo}" alt="${member.name}" 
                     onerror="this.src='https://via.placeholder.com/200x200?text=🕉️'">
                <h3>${member.name}</h3>
                <p class="designation">${member.designation}</p>
                <p class="district"><i class="fas fa-map-marker-alt"></i> ${member.district}</p>
            </div>
        `).join('');
        
    } catch (error) {
        console.error('Error loading committee:', error);
    }
}

// ===== MOBILE MENU =====
function initMobileMenu() {
    const hamburger = document.querySelector('.hamburger');
    const dropdown = document.querySelector('.dropdown-content');
    
    if (hamburger && dropdown) {
        hamburger.addEventListener('click', (e) => {
            e.stopPropagation();
            dropdown.style.display = dropdown.style.display === 'block' ? 'none' : 'block';
        });
        
        // Close when clicking outside
        document.addEventListener('click', (e) => {
            if (!hamburger.contains(e.target) && !dropdown.contains(e.target)) {
                dropdown.style.display = 'none';
            }
        });
    }
}

// ===== FAQ ACCORDION =====
function initFaqAccordion() {
    document.querySelectorAll('.faq-question').forEach(button => {
        button.addEventListener('click', () => {
            const faqItem = button.parentElement;
            const isActive = faqItem.classList.contains('active');
            
            // Close all others
            document.querySelectorAll('.faq-item').forEach(item => {
                item.classList.remove('active');
            });
            
            // Toggle current
            if (!isActive) {
                faqItem.classList.add('active');
            }
        });
    });
}

// ===== IMAGE LIGHTBOX =====
function initLightbox() {
    if (typeof lightbox !== 'undefined') {
        lightbox.option({
            'resizeDuration': 200,
            'wrapAround': true,
            'albumLabel': 'Image %1 of %2',
            'fadeDuration': 300,
            'imageFadeDuration': 300
        });
    }
}

// ===== PAGE SPECIFIC INIT =====
function initPageSpecific() {
    const path = window.location.pathname;
    
    if (path.includes('about')) {
        loadCommittee();
    }
    
    if (path.includes('gallery')) {
        initLightbox();
    }
    
    if (path.includes('contact')) {
        initFaqAccordion();
    }
    
    if (path.includes('members')) {
        const searchInput = document.getElementById('searchMembers');
        if (searchInput) {
            searchInput.addEventListener('input', searchMembers);
        }
    }
}

// ===== SCROLL TO TOP =====
function scrollToTop() {
    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
}

// Show/hide scroll to top button
window.addEventListener('scroll', () => {
    const scrollBtn = document.querySelector('.scroll-to-top');
    if (scrollBtn) {
        if (window.scrollY > 300) {
            scrollBtn.classList.add('show');
        } else {
            scrollBtn.classList.remove('show');
        }
    }
});

// ===== INITIALIZATION =====
document.addEventListener('DOMContentLoaded', function() {
    // Load language preference
    loadLanguagePreference();
    
    // Initialize mobile menu
    initMobileMenu();
    
    // Load page specific data
    loadLatestNews();
    loadUpcomingEvents();
    loadGalleryPreview();
    loadImportantNotices();
    loadRecentDonors();
    
    // Initialize page specific
    initPageSpecific();
    
    // Add scroll to top button if not exists
    if (!document.querySelector('.scroll-to-top')) {
        const scrollBtn = document.createElement('button');
        scrollBtn.className = 'scroll-to-top';
        scrollBtn.innerHTML = '<i class="fas fa-arrow-up"></i>';
        scrollBtn.onclick = scrollToTop;
        document.body.appendChild(scrollBtn);
    }
    
    // Lazy load images
    const lazyImages = document.querySelectorAll('img[loading="lazy"]');
    if ('IntersectionObserver' in window) {
        const imageObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    img.src = img.dataset.src;
                    img.classList.add('loaded');
                    imageObserver.unobserve(img);
                }
            });
        });
        
        lazyImages.forEach(img => imageObserver.observe(img));
    }
});

// ===== EXPORT FUNCTIONS =====
window.setLanguage = setLanguage;
window.processJoin = processJoin;
window.downloadCertificate = downloadCertificate;
window.processDonation = processDonation;
window.setAmount = setAmount;
window.bookPuja = bookPuja;
window.submitContact = submitContact;
window.subscribeNewsletter = subscribeNewsletter;
window.searchMembers = searchMembers;
window.scrollToTop = scrollToTop;
