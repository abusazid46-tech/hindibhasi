// Admin panel JavaScript
let currentAdmin = null;

// Admin login
async function adminLogin() {
    const email = document.getElementById('adminEmail').value;
    const password = document.getElementById('adminPassword').value;
    
    try {
        // Authenticate with Supabase
        const { data, error } = await supabase
            .from('admins')
            .select('*')
            .eq('email', email)
            .single();
        
        if (error || !data) {
            throw new Error('Invalid credentials');
        }
        
        // Simple password check (in production, use proper hashing)
        if (data.password_hash !== btoa(password)) {
            throw new Error('Invalid credentials');
        }
        
        currentAdmin = data;
        sessionStorage.setItem('admin', JSON.stringify(data));
        window.location.href = 'dashboard.html';
    } catch (error) {
        alert('Login failed: ' + error.message);
    }
}

// Check admin authentication
function checkAdminAuth() {
    const admin = sessionStorage.getItem('admin');
    if (!admin) {
        window.location.href = 'login.html';
        return null;
    }
    return JSON.parse(admin);
}

// Admin logout
function adminLogout() {
    sessionStorage.removeItem('admin');
    window.location.href = 'login.html';
}

// Load dashboard stats
async function loadDashboardStats() {
    try {
        const stats = await StatisticsAPI.getDashboardStats();
        const districtStats = await StatisticsAPI.getDistrictWiseMembers();
        
        document.getElementById('totalMembers').textContent = stats.totalMembers;
        document.getElementById('pendingMembers').textContent = stats.pendingMembers;
        document.getElementById('totalEvents').textContent = stats.totalEvents;
        document.getElementById('totalNews').textContent = stats.totalNews;
        document.getElementById('totalDonations').textContent = '₹' + stats.totalDonations.toLocaleString();
        document.getElementById('totalGallery').textContent = stats.totalGallery;
        
        // Render district chart
        renderDistrictChart(districtStats);
    } catch (error) {
        console.error('Error loading stats:', error);
    }
}

// Render district-wise statistics chart
function renderDistrictChart(districtStats) {
    const ctx = document.getElementById('districtChart')?.getContext('2d');
    if (!ctx) return;
    
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: Object.keys(districtStats),
            datasets: [{
                label: 'Members',
                data: Object.values(districtStats),
                backgroundColor: '#b3412e',
                borderColor: '#8b2a1c',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true,
                    stepSize: 1
                }
            }
        }
    });
}

// Load pending members for approval
async function loadPendingMembers() {
    try {
        const members = await MembersAPI.getPendingMembers();
        const tbody = document.getElementById('pendingMembersTable');
        if (tbody) {
            tbody.innerHTML = members.map(member => `
                <tr>
                    <td>${member.name}</td>
                    <td>${member.district}</td>
                    <td>${member.village}</td>
                    <td>${member.phone}</td>
                    <td>${member.email || '-'}</td>
                    <td>${new Date(member.created_at).toLocaleDateString()}</td>
                    <td>
                        <button onclick="approveMember('${member.id}')" class="btn-small success">
                            <i class="fas fa-check"></i>
                        </button>
                        <button onclick="rejectMember('${member.id}')" class="btn-small danger">
                            <i class="fas fa-times"></i>
                        </button>
                        <button onclick="viewMemberDetails('${member.id}')" class="btn-small info">
                            <i class="fas fa-eye"></i>
                        </button>
                    </td>
                </tr>
            `).join('');
        }
    } catch (error) {
        console.error('Error loading pending members:', error);
    }
}

// Approve member
async function approveMember(memberId) {
    if (!confirm('Approve this member?')) return;
    
    try {
        const admin = checkAdminAuth();
        await MembersAPI.updateMemberStatus(memberId, 'approved', admin.id);
        alert('Member approved successfully!');
        loadPendingMembers();
        
        // Send WhatsApp notification
        const member = await supabase.from('members').select('*').eq('id', memberId).single();
        if (member.data) {
            const message = `Your membership has been approved!\nMembership ID: ${member.data.membership_id}`;
            const whatsappUrl = `https://wa.me/${member.data.phone}?text=${encodeURIComponent(message)}`;
            window.open(whatsappUrl, '_blank');
        }
    } catch (error) {
        alert('Error approving member: ' + error.message);
    }
}

// Reject member
async function rejectMember(memberId) {
    if (!confirm('Reject this member?')) return;
    
    try {
        const admin = checkAdminAuth();
        await MembersAPI.updateMemberStatus(memberId, 'rejected', admin.id);
        alert('Member rejected');
        loadPendingMembers();
    } catch (error) {
        alert('Error rejecting member: ' + error.message);
    }
}

// Load events for admin
async function loadEvents() {
    try {
        const { data } = await EventsAPI.getEvents(1, 50);
        const tbody = document.getElementById('eventsTable');
        if (tbody) {
            tbody.innerHTML = data.map(event => `
                <tr>
                    <td>${event.title}</td>
                    <td>${new Date(event.event_date).toLocaleDateString()}</td>
                    <td>${event.venue || '-'}</td>
                    <td>
                        <button onclick="editEvent('${event.id}')" class="btn-small">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button onclick="deleteEvent('${event.id}')" class="btn-small danger">
                            <i class="fas fa-trash"></i>
                        </button>
                        <button onclick="viewRegistrations('${event.id}')" class="btn-small info">
                            <i class="fas fa-users"></i>
                        </button>
                    </td>
                </tr>
            `).join('');
        }
    } catch (error) {
        console.error('Error loading events:', error);
    }
}

// Create new event
async function createEvent() {
    const title = document.getElementById('eventTitle').value;
    const description = document.getElementById('eventDesc').value;
    const date = document.getElementById('eventDate').value;
    const venue = document.getElementById('eventVenue').value;
    const imageFile = document.getElementById('eventImage').files[0];
    
    if (!title || !date) {
        alert('Please fill required fields');
        return;
    }
    
    try {
        const admin = checkAdminAuth();
        await EventsAPI.create({
            title,
            description,
            event_date: date,
            venue,
            created_by: admin.id
        }, imageFile);
        
        alert('Event created successfully!');
        closeModal();
        loadEvents();
    } catch (error) {
        alert('Error creating event: ' + error.message);
    }
}

// Delete event
async function deleteEvent(eventId) {
    if (!confirm('Delete this event?')) return;
    
    try {
        await supabase.from('events').delete().eq('id', eventId);
        alert('Event deleted');
        loadEvents();
    } catch (error) {
        alert('Error deleting event: ' + error.message);
    }
}

// Load news for admin
async function loadNews() {
    try {
        const { data } = await NewsAPI.getNews(1, 50);
        const tbody = document.getElementById('newsTable');
        if (tbody) {
            tbody.innerHTML = data.map(item => `
                <tr>
                    <td>${item.title}</td>
                    <td>${item.content.substring(0, 50)}...</td>
                    <td>${new Date(item.created_at).toLocaleDateString()}</td>
                    <td>
                        <button onclick="editNews('${item.id}')" class="btn-small">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button onclick="deleteNews('${item.id}')" class="btn-small danger">
                            <i class="fas fa-trash"></i>
                        </button>
                    </td>
                </tr>
            `).join('');
        }
    } catch (error) {
        console.error('Error loading news:', error);
    }
}

// Create news
async function createNews() {
    const title = document.getElementById('newsTitle').value;
    const content = document.getElementById('newsContent').value;
    const important = document.getElementById('newsImportant').checked;
    const imageFile = document.getElementById('newsImage').files[0];
    
    if (!title || !content) {
        alert('Please fill all fields');
        return;
    }
    
    try {
        const admin = checkAdminAuth();
        await NewsAPI.create({
            title,
            content,
            is_important: important,
            created_by: admin.id
        }, imageFile);
        
        alert('News published successfully!');
        closeModal();
        loadNews();
    } catch (error) {
        alert('Error creating news: ' + error.message);
    }
}

// Load donations
async function loadDonations() {
    try {
        const { data } = await DonationsAPI.getDonations(1, 50);
        const tbody = document.getElementById('donationsTable');
        if (tbody) {
            let total = 0;
            tbody.innerHTML = data.map(donation => {
                total += parseFloat(donation.amount);
                return `
                    <tr>
                        <td>${donation.donor_name}</td>
                        <td>${donation.phone}</td>
                        <td>₹${donation.amount}</td>
                        <td>${donation.payment_id || '-'}</td>
                        <td>
                            <span class="badge ${donation.payment_status}">
                                ${donation.payment_status}
                            </span>
                        </td>
                        <td>${new Date(donation.created_at).toLocaleDateString()}</td>
                    </tr>
                `;
            }).join('');
            
            document.getElementById('totalDonationsAmount').textContent = '₹' + total.toLocaleString();
        }
    } catch (error) {
        console.error('Error loading donations:', error);
    }
}

// Load gallery for admin
async function loadGallery() {
    try {
        const { data } = await GalleryAPI.getGallery(null, 1, 50);
        const container = document.getElementById('galleryGrid');
        if (container) {
            container.innerHTML = data.map(item => `
                <div class="gallery-admin-item">
                    ${item.type === 'image' 
                        ? `<img src="${item.file_url}" alt="${item.title}">`
                        : `<video src="${item.file_url}" controls></video>`
                    }
                    <div class="gallery-info">
                        <h4>${item.title}</h4>
                        <button onclick="deleteGalleryItem('${item.id}')" class="btn-small danger">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            `).join('');
        }
    } catch (error) {
        console.error('Error loading gallery:', error);
    }
}

// Upload to gallery
async function uploadToGallery() {
    const title = document.getElementById('galleryTitle').value;
    const type = document.querySelector('input[name="galleryType"]:checked').value;
    const file = document.getElementById('galleryFile').files[0];
    
    if (!title || !file) {
        alert('Please fill all fields');
        return;
    }
    
    try {
        const admin = checkAdminAuth();
        await GalleryAPI.add({
            title,
            type,
            created_by: admin.id
        }, file);
        
        alert('Uploaded successfully!');
        closeModal();
        loadGallery();
    } catch (error) {
        alert('Error uploading: ' + error.message);
    }
}

// Load documents
async function loadDocuments() {
    try {
        const { data } = await DocumentsAPI.getDocuments(null, 1, 50);
        const tbody = document.getElementById('documentsTable');
        if (tbody) {
            tbody.innerHTML = data.map(doc => `
                <tr>
                    <td>${doc.title}</td>
                    <td>${doc.category || 'General'}</td>
                    <td>${doc.file_type}</td>
                    <td>${new Date(doc.created_at).toLocaleDateString()}</td>
                    <td>
                        <a href="${doc.file_url}" target="_blank" class="btn-small">
                            <i class="fas fa-download"></i>
                        </a>
                        <button onclick="deleteDocument('${doc.id}')" class="btn-small danger">
                            <i class="fas fa-trash"></i>
                        </button>
                    </td>
                </tr>
            `).join('');
        }
    } catch (error) {
        console.error('Error loading documents:', error);
    }
}

// Upload document
async function uploadDocument() {
    const title = document.getElementById('docTitle').value;
    const description = document.getElementById('docDesc').value;
    const category = document.getElementById('docCategory').value;
    const file = document.getElementById('docFile').files[0];
    
    if (!title || !file) {
        alert('Please fill all fields');
        return;
    }
    
    try {
        const admin = checkAdminAuth();
        await DocumentsAPI.upload({
            title,
            description,
            category,
            created_by: admin.id
        }, file);
        
        alert('Document uploaded successfully!');
        closeModal();
        loadDocuments();
    } catch (error) {
        alert('Error uploading: ' + error.message);
    }
}

// Load contact messages
async function loadMessages() {
    try {
        const { data } = await ContactsAPI.getMessages(false, 1, 50);
        const tbody = document.getElementById('messagesTable');
        if (tbody) {
            tbody.innerHTML = data.map(msg => `
                <tr class="${!msg.is_read ? 'unread' : ''}">
                    <td>${msg.name}</td>
                    <td>${msg.phone || '-'}</td>
                    <td>${msg.email || '-'}</td>
                    <td>${msg.message.substring(0, 50)}...</td>
                    <td>${new Date(msg.created_at).toLocaleDateString()}</td>
                    <td>
                        <button onclick="viewMessage('${msg.id}')" class="btn-small info">
                            <i class="fas fa-eye"></i>
                        </button>
                        ${!msg.is_read ? 
                            `<button onclick="markAsRead('${msg.id}')" class="btn-small success">
                                <i class="fas fa-check"></i>
                            </button>` : ''
                        }
                    </td>
                </tr>
            `).join('');
        }
    } catch (error) {
        console.error('Error loading messages:', error);
    }
}

// Initialize admin panel
document.addEventListener('DOMContentLoaded', function() {
    // Check authentication on admin pages
    if (window.location.pathname.includes('/admin/') && 
        !window.location.pathname.includes('login.html')) {
        const admin = checkAdminAuth();
        if (admin) {
            currentAdmin = admin;
            document.getElementById('adminName').textContent = admin.full_name;
            
            // Load appropriate data based on page
            if (document.getElementById('dashboardStats')) {
                loadDashboardStats();
            }
            if (document.getElementById('pendingMembersTable')) {
                loadPendingMembers();
            }
            if (document.getElementById('eventsTable')) {
                loadEvents();
            }
            if (document.getElementById('newsTable')) {
                loadNews();
            }
            if (document.getElementById('donationsTable')) {
                loadDonations();
            }
            if (document.getElementById('galleryGrid')) {
                loadGallery();
            }
            if (document.getElementById('documentsTable')) {
                loadDocuments();
            }
            if (document.getElementById('messagesTable')) {
                loadMessages();
            }
        }
    }
});
