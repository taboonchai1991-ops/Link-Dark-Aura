// ------------------- UTILS -------------------
function generateId() {
    return crypto.randomUUID(); // unique 100%
}

function normalizeUrl(rawUrl) {
    let url = rawUrl.trim();
    if (!url) return null;
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
        url = 'https://' + url;
    }
    try {
        new URL(url);
        return url;
    } catch (e) {
        return null;
    }
}

function getDefaultLinks() {
    return [
        { id: generateId(), name: "🧽ลบพื้นหลัง", url: "https://grassjellyj-cpu288.github.io/Smart-Sharpen-Pro/" },
        { id: generateId(), name: "ULTIMATETROJANMAGNIFIER", url: "https://grassjellyj-cpu288.github.io/ULTIMATETROJANMAGNIFIER-/" },
        { id: generateId(), name: "GitHub", url: "https://github.com" },
        { id: generateId(), name: "รวมรููป", url: "https://beautiful-rugelach-5f0408.netlify.app/" },
        { id: generateId(), name: "พระลึกลับแดนสยาม", url: "https://taboonchai1991-ops.github.io/-Tro-library-BP-/" },
        { id: generateId(), name: "notepadpro", url: "https://grassjellyj-cpu288.github.io/notepad-pro/" },
        { id: generateId(), name: "Netflix", url: "https://www.netflix.com" },
        { id: generateId(), name: "Chat", url: "https://taboonchai1991-ops.github.io/Tromp4/" },
        { id: generateId(), name: "Tromp4", url: "https://taboonchai1991-ops.github.io/Tromp4/" },
        { id: generateId(), name: "Remove-background", url: "https://taboonchai1991-ops.github.io/Remove-background-BP/" }
    ];
}

// ------------------- STATE -------------------
let links = [];
let currentFilter = "";
let searchTimeout = null;

// ------------------- DOM REFS -------------------
const linksContainer = document.getElementById('linksContainer');
const searchInput = document.getElementById('searchInput');
const themeToggleBtn = document.getElementById('themeToggleBtn');
const resetDefaultBtn = document.getElementById('resetDefaultBtn');
const clearAllBtn = document.getElementById('clearAllBtn');
const submitLinkBtn = document.getElementById('submitLinkBtn');
const linkNameInput = document.getElementById('linkName');
const linkUrlInput = document.getElementById('linkUrl');
const addLinkForm = document.getElementById('addLinkForm');

// ------------------- TOAST SYSTEM -------------------
function showToast(message, type = 'info', duration = 3000) {
    const existing = document.querySelector('.toast-container');
    if (!existing) {
        const container = document.createElement('div');
        container.className = 'toast-container';
        container.style.cssText = `
            position: fixed; bottom: 20px; right: 20px; z-index: 9999;
            display: flex; flex-direction: column; gap: 10px;
            max-width: 350px; width: 100%;
        `;
        document.body.appendChild(container);
    }
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.style.cssText = `
        background: ${type === 'success' ? '#2e7d32' : type === 'error' ? '#c62828' : '#1e3a5f'};
        color: #fff; padding: 12px 20px; border-radius: 12px;
        box-shadow: 0 8px 24px rgba(0,0,0,0.3);
        font-size: 0.95rem; backdrop-filter: blur(8px);
        border: 1px solid rgba(255,255,255,0.15);
        animation: slideIn 0.3s ease;
        display: flex; align-items: center; gap: 10px;
    `;
    toast.innerHTML = `
        <span>${message}</span>
        <button style="background:none;border:none;color:inherit;font-size:1.2rem;cursor:pointer;margin-left:auto;">&times;</button>
    `;
    toast.querySelector('button').addEventListener('click', () => toast.remove());
    document.querySelector('.toast-container').appendChild(toast);
    setTimeout(() => {
        if (toast.parentNode) toast.remove();
    }, duration);
}

// เพิ่ม keyframe animation สำหรับ toast
const styleSheet = document.createElement("style");
styleSheet.textContent = `
    @keyframes slideIn {
        from { opacity: 0; transform: translateX(40px); }
        to { opacity: 1; transform: translateX(0); }
    }
`;
document.head.appendChild(styleSheet);

// ------------------- STORAGE -------------------
function saveLinksToLocal() {
    try {
        localStorage.setItem('linkhub_links', JSON.stringify(links));
    } catch (e) {
        console.warn('ไม่สามารถบันทึกข้อมูล:', e);
        showToast('ไม่สามารถบันทึกข้อมูลลง Local Storage', 'error');
    }
}

function loadLinksFromLocal() {
    try {
        const stored = localStorage.getItem('linkhub_links');
        if (stored) {
            const parsed = JSON.parse(stored);
            if (Array.isArray(parsed)) {
                links = parsed;
                return;
            }
        }
    } catch(e) {}
    links = getDefaultLinks();
    saveLinksToLocal();
}

// ------------------- CRUD OPERATIONS -------------------
function resetToDefault() {
    if (confirm("⚠️ รีเซ็ตจะคืนลิงก์เริ่มต้น และลบลิงก์เพิ่มเองทั้งหมด ยืนยัน?")) {
        links = getDefaultLinks();
        saveLinksToLocal();
        currentFilter = "";
        searchInput.value = "";
        renderLinks();
        showToast('รีเซ็ตเป็นลิงก์เริ่มต้นเรียบร้อย', 'success');
    }
}

function clearAllLinks() {
    if (links.length === 0) {
        showToast('ไม่มีลิงก์ให้ลบ', 'info');
        return;
    }
    if (confirm("🗑️ ลบลิงก์ทั้งหมด (ไม่สามารถกู้คืน) ยืนยัน?")) {
        links = [];
        saveLinksToLocal();
        currentFilter = "";
        searchInput.value = "";
        renderLinks();
        showToast('ลบลิงก์ทั้งหมดเรียบร้อย', 'success');
    }
}

function addNewLink(e) {
    e.preventDefault(); // ป้องกัน form submit ปกติ
    let name = linkNameInput.value.trim();
    let rawUrl = linkUrlInput.value.trim();
    if (!name) {
        showToast('กรุณากรอกชื่อเว็บไซต์', 'error');
        linkNameInput.focus();
        return;
    }
    if (!rawUrl) {
        showToast('กรุณากรอก URL', 'error');
        linkUrlInput.focus();
        return;
    }
    const normalized = normalizeUrl(rawUrl);
    if (!normalized) {
        showToast('URL ไม่ถูกต้อง (ตัวอย่าง: https://example.com)', 'error');
        linkUrlInput.focus();
        return;
    }
    // ตรวจสอบซ้ำ (ไม่บังคับ แต่แนะนำ)
    const duplicate = links.some(link => link.url === normalized);
    if (duplicate) {
        showToast('มีลิงก์นี้อยู่ในรายการแล้ว', 'error');
        return;
    }
    const newLink = { id: generateId(), name: name, url: normalized };
    links.unshift(newLink);
    saveLinksToLocal();
    linkNameInput.value = "";
    linkUrlInput.value = "";
    currentFilter = "";
    searchInput.value = "";
    renderLinks();
    linkNameInput.focus();
    showToast(`เพิ่ม "${name}" สำเร็จ`, 'success');
}

function deleteLinkById(id) {
    const linkToDelete = links.find(link => link.id === id);
    if (!linkToDelete) return;
    if (!confirm(`คุณแน่ใจว่าต้องการลบ "${linkToDelete.name}"?`)) return;
    const newLinks = links.filter(link => link.id !== id);
    if (newLinks.length === links.length) return;
    links = newLinks;
    saveLinksToLocal();
    renderLinks();
    showToast(`ลบ "${linkToDelete.name}" แล้ว`, 'info');
}

// ------------------- FILTER & RENDER -------------------
function filterLinks() {
    if (!currentFilter.trim()) return [...links];
    const lowerFilter = currentFilter.toLowerCase();
    return links.filter(link => 
        link.name.toLowerCase().includes(lowerFilter) || 
        link.url.toLowerCase().includes(lowerFilter)
    );
}

function renderLinks() {
    const filtered = filterLinks();
    if (!filtered.length) {
        linksContainer.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-glass-whiskey"></i>
                <p>${currentFilter ? `ไม่พบลิงก์ "${currentFilter}"` : "ไม่มีลิงก์ เริ่มเพิ่มลิงก์แรกในแบบกระจกใสกัน!"}</p>
                <small>✨ เพิ่มลิงก์ใหม่จากฟอร์มด้านล่าง</small>
            </div>
        `;
        return;
    }
    let cardsHtml = "";
    for (let link of filtered) {
        cardsHtml += `
            <div class="link-card" data-id="${link.id}">
                <div class="card-header">
                    <div class="link-name">
                        <a href="${link.url}" target="_blank" rel="noopener noreferrer">
                            ${escapeHtml(link.name)}
                        </a>
                    </div>
                    <button class="delete-btn" data-id="${link.id}" title="ลบลิงก์" aria-label="ลบลิงก์">
                        <i class="fas fa-trash-can"></i>
                    </button>
                </div>
                <div class="link-url">
                    <a href="${link.url}" target="_blank" rel="noopener noreferrer">
                        ${truncateUrl(link.url, 55)}
                    </a>
                </div>
                <div class="card-footer">
                    <i class="fas fa-eye"></i> พื้นหลังพรีเมียม · คลิกเปิด
                </div>
            </div>
        `;
    }
    linksContainer.innerHTML = cardsHtml;
    // ผูก event ลบ
    document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const id = btn.getAttribute('data-id');
            if (id) deleteLinkById(id);
        });
    });
}

function escapeHtml(str) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return str.replace(/[&<>"']/g, function(m) { return map[m]; });
}

function truncateUrl(url, maxLen) {
    if (url.length <= maxLen) return url;
    return url.slice(0, maxLen) + '…';
}

// ------------------- SEARCH (with debounce) -------------------
function onSearchInput() {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
        currentFilter = searchInput.value;
        renderLinks();
        // แสดง/ซ่อนปุ่ม clear
        clearSearchBtn.style.display = currentFilter ? 'block' : 'none';
    }, 300);
}

// ------------------- CLEAR SEARCH BUTTON -------------------
const clearSearchBtn = document.createElement('button');
clearSearchBtn.type = 'button';
clearSearchBtn.innerHTML = '&times;';
clearSearchBtn.style.cssText = `
    position: absolute; right: 12px; top: 50%; transform: translateY(-50%);
    background: none; border: none; font-size: 1.4rem; color: #888;
    cursor: pointer; display: none; padding: 0 4px;
`;
clearSearchBtn.setAttribute('aria-label', 'ล้างคำค้นหา');
clearSearchBtn.addEventListener('click', () => {
    searchInput.value = '';
    currentFilter = '';
    clearSearchBtn.style.display = 'none';
    renderLinks();
    searchInput.focus();
});
// ใส่ปุ่มใน container ของ search (ต้องมี wrapper)
const searchWrapper = searchInput.parentNode;
if (searchWrapper) {
    searchWrapper.style.position = 'relative';
    searchWrapper.appendChild(clearSearchBtn);
}

// ------------------- THEME -------------------
function initTheme() {
    const savedTheme = localStorage.getItem('linkhub_theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const isDark = savedTheme === 'dark' || (savedTheme === null && prefersDark);
    if (isDark) {
        document.body.classList.add('dark');
        updateThemeButtonUI(true);
    } else {
        document.body.classList.remove('dark');
        updateThemeButtonUI(false);
    }
}

function updateThemeButtonUI(isDark) {
    const btn = themeToggleBtn;
    if (isDark) btn.innerHTML = '<i class="fas fa-sun"></i> <span>สว่าง</span>';
    else btn.innerHTML = '<i class="fas fa-moon"></i> <span>ธีมมืด</span>';
}

function toggleTheme() {
    const isDark = document.body.classList.toggle('dark');
    localStorage.setItem('linkhub_theme', isDark ? 'dark' : 'light');
    updateThemeButtonUI(isDark);
}

// ------------------- INITIALIZATION -------------------
function init() {
    loadLinksFromLocal();
    initTheme();
    renderLinks();

    // Event listeners
    searchInput.addEventListener('input', onSearchInput);
    resetDefaultBtn.addEventListener('click', resetToDefault);
    clearAllBtn.addEventListener('click', clearAllLinks);
    themeToggleBtn.addEventListener('click', toggleTheme);

    // ใช้ form submit แทน click เพื่อให้ Enter ทำงาน
    addLinkForm.addEventListener('submit', addNewLink);
    // ป้องกันการ submit ซ้ำถ้ากดปุ่ม
    submitLinkBtn.addEventListener('click', (e) => {
        // จะถูกเรียกผ่าน form submit อยู่แล้ว แต่กัน event ซ้อน
    });
    // แต่อย่างไรก็ตาม ถ้าผู้ใช้กดปุ่มเอง form จะถูก submit
    // เราจึงไม่ต้องมี event click ซ้ำ

    // โหลดเสร็จให้ focus ที่ช่องค้นหา
    searchInput.focus();
}

document.addEventListener('DOMContentLoaded', init);
