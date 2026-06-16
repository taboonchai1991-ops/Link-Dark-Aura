// ============================================================
// script1.js - ระบบ AI เสริม (ไม่ต้องแก้ไข script.js หลัก)
// ============================================================
(function() {
    // รอให้ script.js โหลดและตัวแปร global พร้อม
    function waitForScript() {
        if (typeof window.links !== 'undefined' && typeof window.renderLinks === 'function') {
            enhanceWithAI();
        } else {
            setTimeout(waitForScript, 50);
        }
    }

    function enhanceWithAI() {
        // ------------------- ระบบหมวดหมู่ AI -------------------
        const categoryKeywords = {
            "search_engine": ["google", "bing", "yahoo", "duckduckgo", "ค้นหา", "search"],
            "video_entertainment": ["youtube", "netflix", "disney", "hulu", "twitch", "vimeo", "ดูหนัง", "ฟังเพลง", "video", "movie", "tv"],
            "developer_tools": ["github", "gitlab", "stackoverflow", "codepen", "jsfiddle", "developer", "code", "programming"],
            "reference_education": ["wikipedia", "britannica", "coursera", "udemy", "khan", "learn", "education", "encyclopedia", "reference"],
            "social_community": ["reddit", "twitter", "facebook", "instagram", "tiktok", "social", "community", "forum"],
            "shopping": ["amazon", "ebay", "alibaba", "shopee", "lazada", "shop", "buy", "commerce", "shopping"],
            "ai_productivity": ["chatgpt", "openai", "copilot", "gemini", "claude", "ai", "productivity", "assistant"],
            "news": ["cnn", "bbc", "reuters", "nytimes", "theguardian", "news", "ข่าว"],
            "health_fitness": ["webmd", "healthline", "myfitnesspal", "fitness", "health", "exercise", "healthy"],
            "travel": ["booking", "expedia", "tripadvisor", "travel", "hotel", "flight", "journey"],
            "finance": ["paypal", "stripe", "coinbase", "bank", "finance", "money", "crypto", "invest"],
            "gaming": ["steam", "epicgames", "twitch", "gaming", "game", "play"]
        };

        function getAISuggestedCategory(name, url) {
            const combined = (name + " " + url).toLowerCase();
            let bestMatch = "general";
            let maxScore = 0;
            for (const [category, keywords] of Object.entries(categoryKeywords)) {
                let score = 0;
                for (const kw of keywords) {
                    if (combined.includes(kw)) score += 1;
                }
                if (score > maxScore) {
                    maxScore = score;
                    bestMatch = category;
                }
            }
            return bestMatch;
        }

        function getCategoryDisplayName(categoryCode) {
            const names = {
                "search_engine": "🔍 เสิร์ช",
                "video_entertainment": "🎬 บันเทิง",
                "developer_tools": "💻 นักพัฒนา",
                "reference_education": "📚 การศึกษา",
                "social_community": "👥 โซเชียล",
                "shopping": "🛍️ ช้อปปิ้ง",
                "ai_productivity": "🤖 AI & ผลผลิต",
                "news": "📰 ข่าวสาร",
                "health_fitness": "💪 สุขภาพ",
                "travel": "✈️ ท่องเที่ยว",
                "finance": "💰 การเงิน",
                "gaming": "🎮 เกม",
                "general": "🌐 ทั่วไป"
            };
            return names[categoryCode] || "📌 อื่นๆ";
        }

        // ------------------- เพิ่มหมวดหมู่ให้ลิงก์ที่มีอยู่แล้ว -------------------
        function addMissingCategories() {
            let updated = false;
            for (let link of window.links) {
                if (!link.category) {
                    link.category = getAISuggestedCategory(link.name, link.url);
                    updated = true;
                }
            }
            if (updated) {
                window.saveLinksToLocal();
                window.renderLinks();
            }
        }

        // ------------------- ค้นหาอัจฉริยะ -------------------
        function smartSearch(query) {
            const lowerQuery = query.toLowerCase().trim();
            if (!lowerQuery) return window.links;
            let targetCategory = null;
            for (const [category, keywords] of Object.entries(categoryKeywords)) {
                for (const kw of keywords) {
                    if (lowerQuery.includes(kw)) {
                        targetCategory = category;
                        break;
                    }
                }
                if (targetCategory) break;
            }
            if (targetCategory) {
                return window.links.filter(link => link.category === targetCategory);
            } else {
                return window.links.filter(link => 
                    link.name.toLowerCase().includes(lowerQuery) || 
                    link.url.toLowerCase().includes(lowerQuery)
                );
            }
        }

        // ------------------- แทนที่ filterLinks (ใช้ smartSearch) -------------------
        const originalFilterLinks = window.filterLinks;
        window.filterLinks = function() {
            if (!window.currentFilter || window.currentFilter.trim() === "") {
                return [...window.links];
            }
            return smartSearch(window.currentFilter);
        };

        // ------------------- แทนที่ addNewLink (เพิ่ม category อัตโนมัติ) -------------------
        const originalAddNewLink = window.addNewLink;
        window.addNewLink = function() {
            const name = document.getElementById('linkName').value.trim();
            const rawUrl = document.getElementById('linkUrl').value.trim();
            if (!name || !rawUrl) {
                return originalAddNewLink(); // ให้ alert เดิมทำงาน
            }
            const normalized = window.normalizeUrl ? window.normalizeUrl(rawUrl) : (() => {
                let url = rawUrl.trim();
                if (!url.startsWith('http://') && !url.startsWith('https://')) url = 'https://' + url;
                try { new URL(url); return url; } catch(e) { return null; }
            })();
            if (!normalized) {
                alert("URL ไม่ถูกต้อง");
                return;
            }
            const category = getAISuggestedCategory(name, normalized);
            const newLink = { id: window.generateId(), name, url: normalized, category };
            window.links.unshift(newLink);
            window.saveLinksToLocal();
            document.getElementById('linkName').value = "";
            document.getElementById('linkUrl').value = "";
            window.currentFilter = "";
            document.getElementById('searchInput').value = "";
            window.renderLinks();
            alert(`🤖 AI จัดหมวดหมู่ให้: ${getCategoryDisplayName(category)}`);
        };

        // ------------------- แทนที่ renderLinks (แสดง badge หมวดหมู่) -------------------
        const originalRenderLinks = window.renderLinks;
        window.renderLinks = function() {
            const filtered = window.filterLinks();
            const container = document.getElementById('linksContainer');
            if (!filtered.length) {
                container.innerHTML = `
                    <div class="empty-state">
                        <i class="fas fa-robot"></i>
                        <p>${window.currentFilter ? `🔍 ไม่พบลิงก์ "${window.currentFilter}"` : "ไม่มีลิงก์ เริ่มเพิ่มลิงก์แรกกัน!"}</p>
                        <small>✨ เพิ่มลิงก์ใหม่ หรือลองใช้ AI ค้นหาอัจฉริยะ</small>
                    </div>
                `;
                return;
            }
            let cardsHtml = "";
            for (let link of filtered) {
                const categoryDisplay = link.category ? getCategoryDisplayName(link.category) : "🏷️ ไม่มีหมวดหมู่";
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
                        <div class="card-footer" style="justify-content: space-between; align-items: center;">
                            <span class="ai-badge" style="background: rgba(0,0,0,0.5); border-radius: 20px; padding: 0.2rem 0.6rem; font-size: 0.7rem;">
                                <i class="fas fa-microchip"></i> ${categoryDisplay}
                            </span>
                            <span><i class="fas fa-eye"></i> คลิกเปิด</span>
                        </div>
                    </div>
                `;
            }
            container.innerHTML = cardsHtml;
            document.querySelectorAll('.delete-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const id = btn.getAttribute('data-id');
                    if (id && typeof window.deleteLinkById === 'function') window.deleteLinkById(id);
                });
            });
        };

        function escapeHtml(str) {
            return str.replace(/[&<>]/g, m => m === '&' ? '&amp;' : m === '<' ? '&lt;' : '&gt;');
        }
        function truncateUrl(url, maxLen) {
            return url.length <= maxLen ? url : url.slice(0, maxLen) + '…';
        }

        // ------------------- เพิ่มปุ่ม AI จัดหมวดหมู่ทั้งหมด -------------------
        function addAIButton() {
            const dangerZone = document.querySelector('.danger-zone');
            if (dangerZone && !document.getElementById('aiTagAllBtn')) {
                const btn = document.createElement('button');
                btn.id = 'aiTagAllBtn';
                btn.className = 'btn-outline-danger';
                btn.style.background = "rgba(50, 100, 150, 0.6)";
                btn.style.borderColor = "rgba(100, 150, 250, 0.8)";
                btn.innerHTML = '<i class="fas fa-robot"></i> AI จัดหมวดหมู่ทั้งหมด';
                btn.addEventListener('click', () => {
                    addMissingCategories();
                    alert("✨ AI จัดหมวดหมู่ให้ลิงก์ทั้งหมดเรียบร้อยแล้ว!");
                });
                dangerZone.appendChild(btn);
            }
        }

        // ------------------- เพิ่มคำแนะนำขณะพิมพ์ (dropdown) -------------------
        function addSearchSuggest() {
            const searchWrapper = document.querySelector('.search-wrapper');
            if (!searchWrapper || document.getElementById('aiSuggestDropdown')) return;
            const suggestBox = document.createElement('div');
            suggestBox.id = 'aiSuggestDropdown';
            suggestBox.style.position = 'absolute';
            suggestBox.style.top = '100%';
            suggestBox.style.left = '0';
            suggestBox.style.right = '0';
            suggestBox.style.background = 'rgba(0,0,0,0.8)';
            suggestBox.style.backdropFilter = 'blur(12px)';
            suggestBox.style.borderRadius = '1rem';
            suggestBox.style.marginTop = '0.5rem';
            suggestBox.style.zIndex = '100';
            suggestBox.style.display = 'none';
            suggestBox.style.maxHeight = '200px';
            suggestBox.style.overflowY = 'auto';
            searchWrapper.style.position = 'relative';
            searchWrapper.appendChild(suggestBox);

            const input = document.getElementById('searchInput');
            input.addEventListener('input', () => {
                const query = input.value.trim();
                if (query.length < 2) {
                    suggestBox.style.display = 'none';
                    return;
                }
                const results = smartSearch(query);
                if (results.length === 0) {
                    suggestBox.style.display = 'none';
                    return;
                }
                suggestBox.innerHTML = '';
                results.slice(0, 5).forEach(link => {
                    const item = document.createElement('div');
                    item.style.padding = '0.6rem 1rem';
                    item.style.cursor = 'pointer';
                    item.style.borderBottom = '1px solid rgba(255,255,255,0.2)';
                    item.innerHTML = `<i class="fas fa-link"></i> <strong>${escapeHtml(link.name)}</strong> <small style="color:#aaa">${getCategoryDisplayName(link.category)}</small>`;
                    item.addEventListener('click', () => {
                        input.value = link.name;
                        window.currentFilter = link.name;
                        window.renderLinks();
                        suggestBox.style.display = 'none';
                    });
                    suggestBox.appendChild(item);
                });
                suggestBox.style.display = 'block';
            });
            document.addEventListener('click', (e) => {
                if (!searchWrapper.contains(e.target)) suggestBox.style.display = 'none';
            });
        }

        // ------------------- เริ่มทำงาน -------------------
        addMissingCategories();   // เพิ่มหมวดหมู่ให้ลิงก์ที่มีอยู่
        addAIButton();           // เพิ่มปุ่ม AI ในหน้า
        addSearchSuggest();      // เพิ่ม dropdown แนะนำคำค้น
        // รีเฟรชการแสดงผล (renderLinks ถูกแทนที่แล้ว)
        window.renderLinks();
    }

    waitForScript();
})();