// Main application JavaScript
let currentLanguage = 'en';

// Language translations
const translations = {
    en: {
        home: 'Home',
        about: 'About Us',
        members: 'Members',
        events: 'Events',
        news: 'News',
        gallery: 'Gallery',
        donation: 'Donate',
        contact: 'Contact',
        join: 'Join Now',
        readMore: 'Read More',
        // Add more translations
    },
    hi: {
        home: 'होम',
        about: 'हमारे बारे में',
        members: 'सदस्य',
        events: 'कार्यक्रम',
        news: 'समाचार',
        gallery: 'गैलरी',
        donation: 'दान करें',
        contact: 'संपर्क',
        join: 'सदस्य बनें',
        readMore: 'और पढ़ें',
        // Add more translations
    },
    as: {
        home: 'হোম',
        about: 'আমাৰ বিষয়ে',
        members: 'সদস্য',
        events: 'কাৰ্যসূচী',
        news: 'বাতৰি',
        gallery: 'গেলাৰী',
        donation: 'দান কৰক',
        contact: 'যোগাযোগ',
        join: 'যোগদান কৰক',
        readMore: 'আৰু পঢ়ক',
        // Add more translations
    }
};

// Set language
function setLanguage(lang) {
    currentLanguage = lang;
    document.querySelectorAll('.lang-option').forEach(btn => {
        btn.classList.remove('active');
        if (btn.classList.contains(lang)) {
            btn.classList.add('active');
        }
    });
    
    // Update all translatable elements
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (translations[lang] && translations[lang][key]) {
            el.textContent = translations[lang][key];
        }
    });
}

// Load latest news on homepage
async function loadLatestNews() {
    try {
        const news = await NewsAPI.getLatestNews(3);
        const newsContainer = document.getElementById('latestNews');
        if (newsContainer) {
            newsContainer.innerHTML = news.map(item => `
                <div class="news-card">
                    ${item.image_url ? `<img src="${item.image_url}" alt="${item.title}" loading="lazy">` : ''}
                    <div class="news-content">
                        <h3>${item.title}</h3>
                        <p>${item.content.substring(0, 100)}...</p>
                        <small>${new Date(item.created_at).toLocaleDateString()}</small>
                    </div>
                </div>
            `).join('');
        }
    } catch (error) {
        console.error('Error loading news:', error);
    }
}

// Load upcoming events on homepage
async function loadUpcomingEvents() {
    try {
        const events = await EventsAPI.getUpcomingEvents(3);
        const eventsContainer = document.getElementById('upcomingEvents');
        if (eventsContainer) {
            eventsContainer.innerHTML = events.map(item => `
                <div class="event-card">
                    ${item.image_url ? `<img src="${item.image_url}" alt="${item.title}" loading="lazy">` : ''}
                    <div class="event-content">
                        <h3>${item.title}</h3>
                        <p><i class="fas fa-calendar"></i> ${new Date(item.event_date).toLocaleDateString()}</p>
                        <p>${item.description.substring(0, 100)}...</p>
                    </div>
                </div>
            `).join('');
        }
    } catch (error) {
        console.error('Error loading events:', error);
    }
}

// Load gallery preview
async function loadGalleryPreview() {
    try {
        const { data } = await GalleryAPI.getGallery('image', 1, 6);
        const galleryPreview = document.getElementById('galleryPreview');
        if (galleryPreview) {
            galleryPreview.innerHTML = data.map(item => `
                <div class="gallery-item">
                    <img src="${item.file_url}" alt="${item.title}" loading="lazy">
                </div>
            `).join('');
        }
    } catch (error) {
        console.error('Error loading gallery:', error);
    }
}

// Process membership registration
async function processJoin() {
    const name = document.getElementById('memberName').value;
    const email = document.getElementById('memberEmail').value;
    const phone = document.getElementById('memberPhone').value;
    const district = document.getElementById('memberDistrict')?.value || '';
    const village = document.getElementById('memberVillage')?.value || '';
    const photoFile = document.getElementById('memberPhoto')?.files[0];
    
    if (!name || !phone) {
        alert('Please fill required fields');
        return;
    }
    
    try {
        const member = await MembersAPI.register({
            name,
            email,
            phone,
            district,
            village
        }, photoFile);
        
        alert(`Registration successful! Your Membership ID: ${member.membership_id}`);
        showCertificate(name, member.membership_id);
    } catch (error) {
        alert('Error registering: ' + error.message);
    }
}

// Show membership certificate
function showCertificate(name, membershipId) {
    document.getElementById('certName').textContent = name;
    document.getElementById('certId').textContent = membershipId;
    document.getElementById('certDate').textContent = new Date().toLocaleDateString();
    document.getElementById('certificateBox').classList.add('show');
}

// Download certificate as PDF
async function downloadCertificate() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    const name = document.getElementById('certName').textContent;
    const id = document.getElementById('certId').textContent;
    const date = document.getElementById('certDate').textContent;
    
    doc.setFontSize(22);
    doc.text('Membership Certificate', 105, 30, { align: 'center' });
    
    doc.setFontSize(16);
    doc.text('This certifies that', 105, 60, { align: 'center' });
    
    doc.setFontSize(24);
    doc.text(name, 105, 80, { align: 'center' });
    
    doc.setFontSize(14);
    doc.text(`Membership ID: ${id}`, 105, 100, { align: 'center' });
    doc.text(`Issued on: ${date}`, 105, 110, { align: 'center' });
    
    doc.setFontSize(12);
    doc.text('is an active member of', 105, 130, { align: 'center' });
    doc.text('Asom Hindi Bhasi Brahman Mahasabha', 105, 140, { align: 'center' });
    
    doc.save('membership-certificate.pdf');
}

// Process donation
async function processDonation() {
    const name = document.getElementById('donorName').value;
    const phone = document.getElementById('donorPhone').value;
    const email = document.getElementById('donorEmail')?.value;
    const amount = document.getElementById('donationAmount').value;
    
    if (!name || !phone || !amount) {
        alert('Please fill all required fields');
        return;
    }
    
    try {
        // Initialize Razorpay payment
        const options = {
            key: 'YOUR_RAZORPAY_KEY',
            amount: amount * 100, // Amount in paise
            currency: 'INR',
            name: 'Asom Hindi Bhasi Brahman Mahasabha',
            description: 'Donation',
            handler: async function(response) {
                await DonationsAPI.create({
                    donor_name: name,
                    phone,
                    email,
                    amount,
                    payment_id: response.razorpay_payment_id,
                    payment_status: 'completed'
                });
                
                alert('Thank you for your donation!');
            },
            prefill: {
                name,
                email,
                contact: phone
            },
            theme: {
                color: '#b3412e'
            }
        };
        
        const rzp = new Razorpay(options);
        rzp.open();
    } catch (error) {
        alert('Error processing donation: ' + error.message);
    }
}

// Book puja
async function bookPuja() {
    const name = document.getElementById('pujaName').value;
    const type = document.getElementById('pujaType').value;
    const date = document.getElementById('pujaDate').value;
    const phone = document.getElementById('pujaPhone')?.value;
    
    if (!name || !type || !date) {
        alert('Please fill all fields');
        return;
    }
    
    try {
        // Store in database or send notification
        const message = `New Puja Booking:\nName: ${name}\nType: ${type}\nDate: ${date}`;
        
        // Send WhatsApp notification
        const whatsappUrl = `https://wa.me/919876543210?text=${encodeURIComponent(message)}`;
        window.open(whatsappUrl, '_blank');
        
        alert('Booking request sent! We will contact you shortly.');
    } catch (error) {
        alert('Error booking puja: ' + error.message);
    }
}

// Submit contact form
async function submitContact() {
    const name = document.getElementById('contactName').value;
    const phone = document.getElementById('contactPhone').value;
    const email = document.getElementById('contactEmail')?.value;
    const message = document.getElementById('contactMessage').value;
    
    if (!name || !message) {
        alert('Please fill required fields');
        return;
    }
    
    try {
        await ContactsAPI.submit({ name, phone, email, message });
        alert('Message sent successfully!');
        document.getElementById('contactForm').reset();
    } catch (error) {
        alert('Error sending message: ' + error.message);
    }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    // Load dynamic content based on current page
    if (document.getElementById('latestNews')) {
        loadLatestNews();
    }
    if (document.getElementById('upcomingEvents')) {
        loadUpcomingEvents();
    }
    if (document.getElementById('galleryPreview')) {
        loadGalleryPreview();
    }
    
    // Initialize language switcher
    document.querySelectorAll('.lang-option').forEach(btn => {
        btn.addEventListener('click', function() {
            const lang = this.classList[1];
            setLanguage(lang);
        });
    });
    
    // Mobile menu toggle
    const hamburger = document.querySelector('.hamburger');
    const dropdown = document.querySelector('.dropdown-content');
    
    if (hamburger) {
        hamburger.addEventListener('click', function(e) {
            e.stopPropagation();
            dropdown.style.display = dropdown.style.display === 'block' ? 'none' : 'block';
        });
    }
    
    // Close dropdown when clicking outside
    document.addEventListener('click', function() {
        if (dropdown) {
            dropdown.style.display = 'none';
        }
    });
});
