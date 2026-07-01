// ------------------- UTILS -------------------
function generateId() {
    return Date.now() + '-' + Math.random().toString(36).substring(2, 8);
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
        { id: generateId(), name: "ChatGPT", url: "https://chat.openai.com" }
                                        
    ];
}

let links = [];
let currentFilter = "";

const linksContainer = document.getElementById('linksContainer');
const searchInput = document.getElementById('searchInput');
const themeToggleBtn = document.getElementById('themeToggleBtn');
const resetDefaultBtn = document.getElementById('resetDefaultBtn');
const clearAllBtn = document.getElementById('clearAllBtn');
const submitLinkBtn = document.getElementById('submitLinkBtn');
const linkNameInput = document.getElementById('linkName');
const linkUrlInput = document.getElementById('linkUrl');

function saveLinksToLocal() {
    localStorage.setItem('linkhub_links', JSON.stringify(links));
}

function loadLinksFromLocal() {
    const stored = localStorage.getItem('linkhub_links');
    if (stored) {
        try {
            const parsed = JSON.parse(stored);
            if (Array.isArray(parsed)) {
                links = parsed;
                return;
            }
        } catch(e) {}
    }
    links = getDefaultLinks();
    saveLinksToLocal();
}

function resetToDefault() {
    if (confirm("⚠️ รีเซ็ตจะคืนลิงก์เริ่มต้น และลบลิงก์เพิ่มเองทั้งหมด ยืนยัน?")) {
        links = getDefaultLinks();
        saveLinksToLocal();
        currentFilter = "";
        searchInput.value = "";
        renderLinks();
    }
}

function clearAllLinks() {
    if (links.length === 0) return alert("ไม่มีลิงก์ให้ลบ");
    if (confirm("🗑️ ลบลิงก์ทั้งหมด (ไม่สามารถกู้คืน) ยืนยัน?")) {
        links = [];
        saveLinksToLocal();
        currentFilter = "";
        searchInput.value = "";
        renderLinks();
    }
}

function addNewLink() {
    let name = linkNameInput.value.trim();
    let rawUrl = linkUrlInput.value.trim();
    if (!name) return alert("กรุณากรอกชื่อเว็บไซต์");
    if (!rawUrl) return alert("กรุณากรอก URL");
    const normalized = normalizeUrl(rawUrl);
    if (!normalized) return alert("URL ไม่ถูกต้อง (ตัวอย่าง: https://example.com หรือ example.com)");
    const newLink = { id: generateId(), name: name, url: normalized };
    links.unshift(newLink);
    saveLinksToLocal();
    linkNameInput.value = "";
    linkUrlInput.value = "";
    currentFilter = "";
    searchInput.value = "";
    renderLinks();
    linkNameInput.focus();
}

function deleteLinkById(id) {
    const newLinks = links.filter(link => link.id !== id);
    if (newLinks.length === links.length) return;
    links = newLinks;
    saveLinksToLocal();
    renderLinks();
}

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
                    <button class="delete-btn" data-id="${link.id}" title="ลบลิงก์">
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
    document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const id = btn.getAttribute('data-id');
            if (id) deleteLinkById(id);
        });
    });
}

function escapeHtml(str) {
    return str.replace(/[&<>]/g, function(m) {
        if (m === '&') return '&amp;';
        if (m === '<') return '&lt;';
        if (m === '>') return '&gt;';
        return m;
    });
}

function truncateUrl(url, maxLen) {
    if (url.length <= maxLen) return url;
    return url.slice(0, maxLen) + '…';
}

function onSearchInput() {
    currentFilter = searchInput.value;
    renderLinks();
}

// ฟังก์ชันธีม
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

function init() {
    loadLinksFromLocal();
    initTheme();
    renderLinks();
    searchInput.addEventListener('input', onSearchInput);
    resetDefaultBtn.addEventListener('click', resetToDefault);
    clearAllBtn.addEventListener('click', clearAllLinks);
    submitLinkBtn.addEventListener('click', addNewLink);
    document.getElementById('addLinkForm').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') e.preventDefault(), addNewLink();
    });
    themeToggleBtn.addEventListener('click', toggleTheme);
}

document.addEventListener('DOMContentLoaded', init);
