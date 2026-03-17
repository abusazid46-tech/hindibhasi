// Main application JavaScript
document.addEventListener('DOMContentLoaded', function() {
    // Initialize language
    initializeLanguage();
    
    // Load dynamic content based on page
    loadPageContent();
    
    // Initialize event listeners
    initializeEventListeners();
    
    // Check if user is logged in (admin)
    checkAdminStatus();
});

// Language management
let currentLanguage = localStorage.getItem('language') || 'en';

const translations = {
    en: {
        // Navigation
        home: 'Home',
        about: 'About Us',
        members: 'Members',
        events: 'Events',
        news: 'News',
        gallery: 'Gallery',
        donate: 'Donate',
        contact: 'Contact',
        register: 'Register',
        documents: 'Documents',
        
        // Hero
        heroTitle: 'Serving Dharma & Humanity',
        heroDesc: 'A Non-Profit Organization for Cultural & Social Welfare',
        
        // Common
        readMore: 'Read More',
        viewAll: 'View All',
        joinNow: 'Join Now',
        donateNow: 'Donate Now',
        learnMore: 'Learn More',
        search: 'Search',
        filter: 'Filter',
        loading: 'Loading...',
        
        // Footer
        quickLinks: 'Quick Links',
        contactUs: 'Contact Us',
        followUs: 'Follow Us',
        copyright: '© 2026 Asom Hindi Bhasi Brahman Mahasabha. All rights reserved.'
    },
    hi: {
        home: 'मुख्य पृष्ठ',
        about: 'हमारे बारे में',
        members: 'सदस्य',
        events: 'कार्यक्रम',
        news: 'समाचार',
        gallery: 'गैलरी',
        donate: 'दान करें',
        contact: 'संपर्क',
        register: 'पंजीकरण',
        documents: 'दस्तावेज़',
        
        heroTitle: 'धर्म और मानवता की सेवा',
        heroDesc: 'सांस्कृतिक और सामाजिक कल्याण हेतु एक गैर-लाभकारी संगठन',
        
        readMore: 'और पढ़ें',
        viewAll: 'सभी देखें',
        joinNow: 'अभी जुड़ें',
        donateNow: 'अभी दान करें',
        learnMore: 'और जानें',
        search: 'खोजें',
        filter: 'फ़िल्टर',
        loading: 'लोड हो रहा है...',
        
        quickLinks: 'त्वरित लिंक',
        contactUs: 'संपर्क करें',
        followUs: 'हमें फॉलो करें',
        copyright: '© 2026 असम हिंदी भाषी ब्राह्मण महासभा। सर्वाधिकार सुरक्षित।'
    },
    as: {
        home: 'মুখ্য পৃষ্ঠা',
        about: 'আমাৰ বিষয়ে',
        members: 'সদস্য',
        events: 'কাৰ্যসূচী',
        news: 'বাতৰি',
        gallery: 'গেলেৰী',
        donate: 'দান কৰক',
        contact: 'যোগাযোগ',
        register: 'পঞ্জীয়ন',
        documents: 'নথিপত্ৰ',
        
        heroTitle: 'ধৰ্ম আৰু মানৱতাৰ সেৱা',
        heroDesc: 'সাংস্কৃতিক আৰু সামাজিক কল্যাণৰ বাবে এটা অ-লাভজনক সংস্থা',
        
        readMore: 'আৰু পঢ়ক',
        viewAll: 'আটাইবোৰ চাওক',
        joinNow: 'এতিয়া যোগদান কৰক',
        donateNow: 'এতিয়া দান কৰক',
        learnMore: 'আৰু জানক',
        search: 'সন্ধান কৰক',
        filter: 'ফিল্টাৰ',
        loading: 'লোড হৈ আছে...',
        
        quickLinks: 'দ্ৰুত সংযোগ',
        contactUs: 'যোগাযোগ কৰক',
        followUs: 'আমাক অনুসৰণ কৰক',
        copyright: '© ২০২৬ অসম হিন্দী ভাষী ব্ৰাহ্মণ মহাসভা। সকলো অধিকাৰ সংৰক্ষিত।'
    }
};

function initializeLanguage() {
    // Set language from localStorage or default
    setLanguage(currentLanguage);
    
    // Add language switcher event listeners
    document.querySelectorAll('.lang-option').forEach(btn => {
        btn.addEventListener('click', function() {
            const lang = this.classList.contains('en') ? 'en' : 
                        this.classList.contains('hi') ? 'hi' : 'as';
            setLanguage(lang);
        });
    });
}

function setLanguage(lang) {
    currentLanguage = lang;
    localStorage.setItem('language', lang);
    
    // Update active button
    document.querySelectorAll('.lang-option').forEach(btn => {
        btn.classList.remove('active');
        if (btn.classList.contains(lang)) {
            btn.classList.add('active');
        }
    });
    
    // Update text content for elements with data-i18n attribute
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
}

function loadPageContent() {
    // Determine current page
    const path = window.location.pathname;
    const page = path.split('/').pop() || 'index.html';
    
    // Load page-specific content
    switch(page) {
        case 'index.html':
        case '':
            loadHomePageContent();
            break;
        case 'members.html':
            loadMembersPage();
            break;
        case 'events.html':
            loadEventsPage();
            break;
        case 'news.html':
            loadNewsPage();
            break;
        case 'gallery.html':
            loadGalleryPage();
            break;
        case 'about.html':
            loadAboutPage();
            break;
    }
}

async function loadHomePageContent() {
    try {
        // Load latest news
        const news = await db.news.getLatest(3);
        displayLatestNews(news);
        
        // Load upcoming events
        const events = await db.events.getUpcoming(3);
        displayUpcomingEvents(events);
        
        // Load gallery preview
        const gallery = await db.gallery.getAll('image', 6, 1);
        displayGalleryPreview(gallery.data);
        
        // Load office bearers
        const bearers = await db.officeBearers.getAll(true);
        displayOfficeBearersPreview(bearers.slice(0, 3));
        
        // Load donation stats
        const totalDonations = await db.donations.getTotal();
        updateDonationStats(totalDonations);
        
    } catch (error) {
        console.error('Error loading home page content:', error);
        showNotification('Error loading content', 'error');
    }
}

function displayLatestNews(news) {
    const container = document.getElementById('latest-news');
    if (!container) return;
    
    container.innerHTML = '';
    news.forEach(item => {
        const newsCard = createNewsCard(item);
        container.appendChild(newsCard);
    });
}

function displayUpcomingEvents(events) {
    const container = document.getElementById('upcoming-events');
    if (!container) return;
    
    container.innerHTML = '';
    events.forEach(event => {
        const eventCard = createEventCard(event);
        container.appendChild(eventCard);
    });
}

function displayGalleryPreview(items) {
    const container = document.getElementById('gallery-preview');
    if (!container) return;
    
    container.innerHTML = '';
    items.forEach(item => {
        const galleryItem = createGalleryItem(item);
        container.appendChild(galleryItem);
    });
}

function displayOfficeBearersPreview(bearers) {
    const container = document.getElementById('office-bearers-preview');
    if (!container) return;
    
    container.innerHTML = '';
    bearers.forEach(bearer => {
        const bearerCard = createOfficeBearerCard(bearer);
        container.appendChild(bearerCard);
    });
}

function updateDonationStats(total) {
    const element = document.getElementById('total-donations');
    if (element) {
        element.textContent = `₹${total.toLocaleString('en-IN')}`;
    }
}

function createNewsCard(news) {
    const div = document.createElement('div');
    div.className = 'card';
    
    const date = new Date(news.date).toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
    
    div.innerHTML = `
        <h3>${news.title}</h3>
        <p class="date"><i class="far fa-calendar-alt"></i> ${date}</p>
        <p>${news.content.substring(0, 150)}${news.content.length > 150 ? '...' : ''}</p>
        <button class="btn btn-sm btn-outline" onclick="viewNews('${news.id}')">${translations[currentLanguage].readMore}</button>
    `;
    
    return div;
}

function createEventCard(event) {
    const div = document.createElement('div');
    div.className = 'card event-card';
    
    const eventDate = new Date(event.date).toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
    
    div.innerHTML = `
        <span class="event-date">${eventDate}</span>
        ${event.image_url ? `<img src="${event.image_url}" alt="${event.title}" class="event-image">` : ''}
        <h3>${event.title}</h3>
        <p>${event.description.substring(0, 120)}${event.description.length > 120 ? '...' : ''}</p>
        ${event.location ? `<p><i class="fas fa-map-marker-alt"></i> ${event.location}</p>` : ''}
        <button class="btn btn-sm btn-outline" onclick="viewEvent('${event.id}')">${translations[currentLanguage].readMore}</button>
    `;
    
    return div;
}

function createGalleryItem(item) {
    const div = document.createElement('div');
    div.className = 'media-item';
    
    if (item.type === 'image') {
        div.innerHTML = `
            <img src="${item.file_url}" alt="${item.title || 'Gallery image'}" loading="lazy">
            ${item.title ? `<p>${item.title}</p>` : ''}
        `;
    } else {
        div.innerHTML = `
            <video src="${item.file_url}" controls muted playsinline></video>
            ${item.title ? `<p>${item.title}</p>` : ''}
        `;
    }
    
    return div;
}

function createOfficeBearerCard(bearer) {
    const div = document.createElement('div');
    div.className = 'officer-card';
    
    div.innerHTML = `
        <img src="${bearer.photo_url || 'https://via.placeholder.com/150?text=🕉️'}" 
             alt="${bearer.name}" 
             class="officer-photo"
             onerror="this.src='https://via.placeholder.com/150?text=🕉️'">
        <h3 class="officer-name">${bearer.name}</h3>
        <p class="officer-designation">${bearer.designation}</p>
        ${bearer.district ? `<p class="officer-district"><i class="fas fa-map-marker-alt"></i> ${bearer.district}</p>` : ''}
    `;
    
    return div;
}

function initializeEventListeners() {
    // Mobile menu
    const hamburger = document.querySelector('.hamburger');
    if (hamburger) {
        hamburger.addEventListener('click', toggleMobileMenu);
    }
    
    // Close menu when clicking outside
    document.addEventListener('click', function(event) {
        const menu = document.querySelector('.dropdown-content');
        const hamburger = document.querySelector('.hamburger');
        
        if (menu && hamburger && !hamburger.contains(event.target) && !menu.contains(event.target)) {
            menu.style.display = 'none';
        }
    });
}

function toggleMobileMenu() {
    const menu = document.querySelector('.dropdown-content');
    if (menu) {
        if (menu.style.display === 'block') {
            menu.style.display = 'none';
        } else {
            menu.style.display = 'block';
        }
    }
}

function checkAdminStatus() {
    const admin = db.auth.getCurrentAdmin();
    if (admin) {
        // Show admin link in menu
        const menu = document.querySelector('.dropdown-content');
        if (menu) {
            const adminLink = document.createElement('a');
            adminLink.href = '/admin/index.html';
            adminLink.innerHTML = '<i class="fas fa-lock"></i> Admin Panel';
            menu.appendChild(adminLink);
        }
    }
}

function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `alert alert-${type}`;
    notification.innerHTML = `
        <i class="fas ${type === 'success' ? 'fa-check-circle' : 
                         type === 'error' ? 'fa-exclamation-circle' : 
                         'fa-info-circle'}"></i>
        <span>${message}</span>
    `;
    
    // Add to page
    notification.style.position = 'fixed';
    notification.style.top = '80px';
    notification.style.right = '20px';
    notification.style.zIndex = '9999';
    notification.style.maxWidth = '300px';
    notification.style.animation = 'slideIn 0.3s ease';
    
    document.body.appendChild(notification);
    
    // Remove after 3 seconds
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Utility functions
function formatDate(dateString) {
    return new Date(dateString).toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

function formatCurrency(amount) {
    return `₹${parseFloat(amount).toLocaleString('en-IN')}`;
}

function validatePhone(phone) {
    const re = /^[6-9]\d{9}$/;
    return re.test(phone);
}

function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

function showLoading(container) {
    container.innerHTML = '<div class="spinner"></div>';
}

function hideLoading(container) {
    const spinner = container.querySelector('.spinner');
    if (spinner) spinner.remove();
}

// Export functions to global scope
window.setLanguage = setLanguage;
window.showNotification = showNotification;
window.formatDate = formatDate;
window.formatCurrency = formatCurrency;
window.validatePhone = validatePhone;
window.validateEmail = validateEmail;
