// js/app.js - Main application logic
// This uses window.db from supabase.js

// Wait for DOM to load
document.addEventListener('DOMContentLoaded', async () => {
    console.log('DOM loaded, initializing...');
    console.log('db available?', typeof window.db !== 'undefined');
    
    // Load all dynamic content
    await Promise.all([
        loadLatestNews(),
        loadUpcomingEvents(),
        loadGalleryPreview(),
        loadOfficeBearers(),
        loadHeroStats()
    ]);
    
    // Load saved language preference
    const savedLang = localStorage.getItem('preferredLanguage') || 'en';
    setLanguage(savedLang);
    
    console.log('All content loaded');
});

// Load latest news
async function loadLatestNews() {
    const container = document.getElementById('newsContainer');
    if (!container) {
        console.warn('newsContainer not found');
        return;
    }
    
    try {
        if (typeof window.db === 'undefined') {
            throw new Error('db not loaded');
        }
        
        const news = await window.db.getLatestNews(3);
        console.log('News loaded:', news);
        
        if (!news || news.length === 0) {
            container.innerHTML = '<p class="no-data">No news available</p>';
            return;
        }
        
        container.innerHTML = news.map(item => `
            <div class="news-item">
                <div class="news-date">
                    <i class="far fa-calendar-alt"></i> ${formatDate(item.publish_date)}
                </div>
                <h3 class="news-title">${escapeHtml(item.title)}</h3>
                <p class="news-excerpt">${escapeHtml(truncateText(item.content, 100))}</p>
                <a href="news.html?id=${item.id}" class="read-more">
                    Read More <i class="fas fa-arrow-right"></i>
                </a>
            </div>
        `).join('');
        
    } catch (error) {
        console.error('Error loading news:', error);
        container.innerHTML = '<div class="error-message">Failed to load news</div>';
    }
}

// Load upcoming events
async function loadUpcomingEvents() {
    const container = document.getElementById('eventsContainer');
    if (!container) return;
    
    try {
        const events = await window.db.getUpcomingEvents(3);
        console.log('Events loaded:', events);
        
        if (!events || events.length === 0) {
            container.innerHTML = '<p class="no-data">No upcoming events</p>';
            return;
        }
        
        container.innerHTML = events.map(item => `
            <div class="event-item">
                <div class="event-date">
                    <i class="far fa-calendar-alt"></i> ${formatDate(item.event_date)}
                </div>
                <h3 class="event-title">${escapeHtml(item.title)}</h3>
                <p class="event-description">${escapeHtml(truncateText(item.description, 80))}</p>
                <a href="events.html?id=${item.id}" class="read-more">
                    View Details <i class="fas fa-arrow-right"></i>
                </a>
            </div>
        `).join('');
        
    } catch (error) {
        console.error('Error loading events:', error);
        container.innerHTML = '<div class="error-message">Failed to load events</div>';
    }
}

// Load gallery preview
async function loadGalleryPreview() {
    const container = document.getElementById('galleryPreview');
    if (!container) return;
    
    try {
        const images = await window.db.getGalleryPreview(4);
        console.log('Gallery loaded:', images);
        
        if (!images || images.length === 0) {
            container.innerHTML = '<p class="no-data">No images available</p>';
            return;
        }
        
        container.innerHTML = images.map(item => `
            <div class="media-item">
                <img src="${item.file_url || 'https://placehold.co/300x200/3498db/white?text=Image'}" 
                     alt="${escapeHtml(item.title)}" 
                     loading="lazy"
                     onerror="this.src='https://placehold.co/300x200/3498db/white?text=No+Image'">
                <p>${escapeHtml(truncateText(item.title, 30))}</p>
            </div>
        `).join('');
        
    } catch (error) {
        console.error('Error loading gallery:', error);
        container.innerHTML = '<div class="error-message">Failed to load gallery</div>';
    }
}

// Load office bearers preview
async function loadOfficeBearers() {
    const container = document.getElementById('bearersContainer');
    if (!container) return;
    
    try {
        const bearers = await window.db.getOfficeBearers(3);
        console.log('Office bearers loaded:', bearers);
        
        if (!bearers || bearers.length === 0) {
            container.innerHTML = '<p class="no-data">Committee members coming soon</p>';
            return;
        }
        
        container.innerHTML = bearers.map(item => `
            <div class="bearer-card">
                <img src="${item.photo_url || 'https://placehold.co/100x100/b3412e/white?text=🕉️'}" 
                     alt="${escapeHtml(item.name)}"
                     onerror="this.src='https://placehold.co/100x100/b3412e/white?text=🕉️'">
                <h4>${escapeHtml(item.name)}</h4>
                <div class="designation">${escapeHtml(item.designation)}</div>
                <div class="district">${escapeHtml(item.district || 'Assam')}</div>
            </div>
        `).join('');
        
    } catch (error) {
        console.error('Error loading office bearers:', error);
        container.innerHTML = '<div class="error-message">Failed to load committee</div>';
    }
}

// Load hero stats
async function loadHeroStats() {
    try {
        const [memberCount, donationTotal] = await Promise.all([
            window.db.getApprovedMembersCount(),
            window.db.getTotalDonations()
        ]);
        
        const memberElement = document.getElementById('memberCount');
        const donationElement = document.getElementById('donationTotal');
        
        if (memberElement) {
            memberElement.textContent = memberCount || 0;
        }
        
        if (donationElement) {
            donationElement.textContent = `₹${(donationTotal || 0).toLocaleString('en-IN')}`;
        }
        
    } catch (error) {
        console.error('Error loading stats:', error);
    }
}

// Helper: Format date
function formatDate(dateString) {
    if (!dateString) return '';
    try {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        });
    } catch (e) {
        return dateString;
    }
}

// Helper: Truncate text
function truncateText(text, maxLength) {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
}

// Helper: Escape HTML
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
// Load membership fee from database
async function loadMembershipFee() {
    try {
        // Use the existing supabase client from window.supabaseClient
        const { data, error } = await window.supabaseClient
            .from('settings')
            .select('value')
            .eq('key', 'membership_fee')
            .single();
        
        if (error) throw error;
        
        const fee = parseInt(data?.value) || 49;
        
        // Update the register button in CTA section
        const registerBtn = document.getElementById('membershipRegisterBtn');
        if (registerBtn) {
            registerBtn.innerHTML = `Register Now (₹${fee})`;
        }
        
        // Also update the button in the hero section if exists
        const heroRegisterBtn = document.querySelector('.hero .btn');
        if (heroRegisterBtn && heroRegisterBtn.textContent.includes('Register')) {
            heroRegisterBtn.innerHTML = `Register Now (₹${fee})`;
        }
        
        console.log('Membership fee loaded:', fee);
        
    } catch (error) {
        console.error('Error loading membership fee:', error);
        // Keep default ₹49 - the HTML already has it
    }
}
// Language switching
function setLanguage(lang) {
    // Update active button
    document.querySelectorAll('.lang-option').forEach(btn => btn.classList.remove('active'));
    document.querySelector(`.lang-option.${lang}`)?.classList.add('active');
    
    // Language translations
    const translations = {
        en: {
            heroTitle: "Serving Dharma & Humanity",
            heroDesc: "A Non-Profit Organization for Cultural & Social Welfare",
            aboutTitle: "About Us",
            aboutText: "We are a registered non-profit Brahman society working for religious, cultural and charity activities across Assam and India.",
            newsTitle: "Latest News",
            eventsTitle: "Upcoming Events"
        },
        hi: {
            heroTitle: "धर्म और मानवता की सेवा",
            heroDesc: "सांस्कृतिक और सामाजिक कल्याण हेतु एक गैर-लाभकारी संगठन",
            aboutTitle: "हमारे बारे में",
            aboutText: "हम असम और भारत में धार्मिक, सांस्कृतिक और चैरिटी गतिविधियों के लिए कार्यरत एक पंजीकृत ब्राह्मण समाज हैं।",
            newsTitle: "ताज़ा समाचार",
            eventsTitle: "आगामी कार्यक्रम"
        },
        as: {
            heroTitle: "ধৰ্ম আৰু মানৱতাৰ সেৱা",
            heroDesc: "সাংস্কৃতিক আৰু সামাজিক কল্যাণৰ বাবে এটা অ-লাভজনক সংস্থা",
            aboutTitle: "আমাৰ বিষয়ে",
            aboutText: "আমি অসম আৰু ভাৰতত ধাৰ্মিক, সাংস্কৃতিক আৰু দানশীল কামত নিয়োজিত এটা পঞ্জীভুক্ত ব্ৰাহ্মণ সমাজ।",
            newsTitle: "শেহতীয়া বাতৰি",
            eventsTitle: "অহা কাৰ্যসূচী"
        },
        bho: {
            heroTitle: "धर्म आ मानवता के सेवा",
            heroDesc: "सांस्कृतिक आ सामाजिक कल्याण खातिर एगो गैर-लाभकारी संगठन",
            aboutTitle: "हमार बारे में",
            aboutText: "हम असम आ भारत में धार्मिक, सांस्कृतिक आ चैरिटी गतिविधियन खातिर काम करे वाला एगो पंजीकृत ब्राह्मण समाज हईं।",
            newsTitle: "ताजा खबर",
            eventsTitle: "आगामी कार्यक्रम"
        }
    };
    
    const t = translations[lang] || translations.en;
    
    // Update text content
    const heroTitle = document.getElementById('heroTitle');
    const heroDesc = document.getElementById('heroDesc');
    const aboutTitle = document.getElementById('aboutTitle');
    const aboutText = document.getElementById('aboutText');
    const newsTitle = document.getElementById('newsTitle');
    const eventsTitle = document.getElementById('eventsTitle');
    
    if (heroTitle) heroTitle.textContent = t.heroTitle;
    if (heroDesc) heroDesc.textContent = t.heroDesc;
    if (aboutTitle) aboutTitle.textContent = t.aboutTitle;
    if (aboutText) aboutText.textContent = t.aboutText;
    if (newsTitle) newsTitle.textContent = t.newsTitle;
    if (eventsTitle) eventsTitle.textContent = t.eventsTitle;
    
    // Store language preference
    localStorage.setItem('preferredLanguage', lang);
}

// Load saved language preference
const savedLang = localStorage.getItem('preferredLanguage') || 'en';
setLanguage(savedLang);

// Close dropdown when clicking outside
document.addEventListener('click', (e) => {
    if (!e.target.closest('.menu-dropdown')) {
        const dropdown = document.querySelector('.dropdown-content');
        if (dropdown) dropdown.style.display = 'none';
    }
});

// Re-open dropdown on hover (for desktop)
const dropdownMenu = document.querySelector('.menu-dropdown');
if (dropdownMenu) {
    dropdownMenu.addEventListener('mouseenter', () => {
        const content = document.querySelector('.dropdown-content');
        if (content) content.style.display = 'block';
    });
    dropdownMenu.addEventListener('mouseleave', () => {
        const content = document.querySelector('.dropdown-content');
        if (content) content.style.display = 'none';
    });
}
