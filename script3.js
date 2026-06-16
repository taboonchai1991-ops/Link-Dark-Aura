// ============================================================
// script3.js - ระบบเสียง AI แบบ Non-invasive
// ไม่ override ฟังก์ชันใด ๆ ของ window, ไม่รบกวน script หลัก
// ใช้ DOM event simulation เพื่อสั่งงาน
// ============================================================
(function() {
    // รอให้ DOM และ script หลักโหลดเสร็จ (ตรวจสอบว่ามี element จำเป็น)
    function waitForScript() {
        if (document.getElementById('searchInput') &&
            document.getElementById('submitLinkBtn') &&
            document.getElementById('clearAllBtn') &&
            document.getElementById('resetDefaultBtn')) {
            enhanceWithVoiceAI();
        } else {
            setTimeout(waitForScript, 100);
        }
    }

    // ---------- ตัวแปรสำหรับ Speech Recognition ----------
    let recognition = null;
    let isListening = false;

    // ตัวแปรควบคุมเสียง (ปรับได้ด้วยคำสั่ง)
    if (typeof window._voiceMuted === 'undefined') window._voiceMuted = false;
    if (typeof window._voiceRate === 'undefined') window._voiceRate = 0.9;

    // ---------- Text-to-Speech (พูด) ----------
    function speakText(text, rate = null) {
        if (!window.speechSynthesis) return;
        if (window._voiceMuted) return;
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'th-TH';
        utterance.rate = (rate !== null) ? rate : window._voiceRate;
        utterance.pitch = 1.0;
        utterance.volume = 1;
        window.speechSynthesis.cancel();
        window.speechSynthesis.speak(utterance);
    }

    // ---------- ขออนุญาตไมโครโฟน ----------
    async function requestMicrophonePermission() {
        try {
            await navigator.mediaDevices.getUserMedia({ audio: true });
        } catch (err) {
            console.warn("Microphone permission denied", err);
        }
    }

    // ---------- Speech Recognition ----------
    function startListening() {
        if (!window.webkitSpeechRecognition && !window.SpeechRecognition) {
            alert("เบราว์เซอร์ไม่รองรับ Speech Recognition");
            return;
        }
        if (isListening && recognition) {
            recognition.stop();
            return;
        }
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = 'th-TH';
        recognition.maxAlternatives = 1;

        recognition.onstart = () => {
            isListening = true;
            const micBtn = document.getElementById('voiceMicBtn');
            if (micBtn) micBtn.style.background = "#ef4444";
            speakText("กำลังฟัง กรุณาพูดคำสั่ง");
        };
        recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript;
            processVoiceCommand(transcript);
        };
        recognition.onerror = () => {
            speakText("ไม่สามารถฟังเสียงได้");
            stopListeningUI();
        };
        recognition.onend = () => stopListeningUI();
        recognition.start();
    }

    function stopListeningUI() {
        isListening = false;
        const micBtn = document.getElementById('voiceMicBtn');
        if (micBtn) micBtn.style.background = "";
    }

    // ---------- แปลงหมวดหมู่ภาษาไทยเป็นรหัส (ใช้ในคำสั่งแสดงหมวดหมู่) ----------
    const categoryNameToCode = {
        'เสิร์ช': 'search_engine', 'ค้นหา': 'search_engine',
        'บันเทิง': 'video_entertainment', 'วิดีโอ': 'video_entertainment',
        'นักพัฒนา': 'developer_tools', 'โค้ด': 'developer_tools',
        'การศึกษา': 'reference_education', 'เรียนรู้': 'reference_education',
        'โซเชียล': 'social_community', 'ชุมชน': 'social_community',
        'ช้อปปิ้ง': 'shopping', 'ชอป': 'shopping',
        'ai': 'ai_productivity', 'เอไอ': 'ai_productivity',
        'ข่าว': 'news', 'ข่าวสาร': 'news',
        'สุขภาพ': 'health_fitness', 'ฟิตเนส': 'health_fitness',
        'ท่องเที่ยว': 'travel', 'เดินทาง': 'travel',
        'การเงิน': 'finance', 'เงิน': 'finance',
        'เกม': 'gaming', 'เกมมิ่ง': 'gaming',
        'ทั่วไป': 'general'
    };

    // ---------- helper: ค้นหาปุ่มลบจากชื่อลิงก์ ----------
    function findDeleteButtonByLinkName(linkName) {
        const cards = document.querySelectorAll('.link-card');
        for (let card of cards) {
            const nameEl = card.querySelector('.link-name a');
            if (nameEl && nameEl.textContent.trim().toLowerCase() === linkName.toLowerCase()) {
                return card.querySelector('.delete-btn');
            }
        }
        return null;
    }

    // ---------- คำสั่งเสียง (ใช้ DOM simulation เท่านั้น) ----------
    async function processVoiceCommand(transcript) {
        const lower = transcript.toLowerCase().trim();
        console.log("Voice command:", lower);

        // 1. ค้นหา
        if (lower.startsWith('ค้นหา') || lower.startsWith('search')) {
            let query = lower.replace(/^(ค้นหา|search)\s*/i, '');
            if (!query) {
                speakText("ไม่พบคำค้นหา");
                return;
            }
            const searchInput = document.getElementById('searchInput');
            if (searchInput) {
                searchInput.value = query;
                // trigger input event เพื่อให้ script หลักทำงานค้นหา
                searchInput.dispatchEvent(new Event('input', { bubbles: true }));
                speakText(`กำลังค้นหา ${query}`);
            }
            return;
        }

        // 2. เพิ่มลิงก์ (จำลองการกรอกฟอร์ม + คลิกปุ่มเพิ่ม)
        if (lower.startsWith('เพิ่มลิงก์') || lower.startsWith('add link')) {
            let rest = lower.replace(/^(เพิ่มลิงก์|add link)\s*/i, '');
            let nameMatch = rest.match(/ชื่อ\s+(.+?)\s+url\s+(.+)$/i);
            if (!nameMatch) {
                const words = rest.split(/\s+/);
                if (words.length >= 2) {
                    let possibleUrl = words[words.length-1];
                    let possibleName = words.slice(0, -1).join(' ');
                    if (!possibleUrl.startsWith('http')) possibleUrl = 'https://' + possibleUrl;
                    nameMatch = [null, possibleName, possibleUrl];
                }
            }
            if (nameMatch && nameMatch[1] && nameMatch[2]) {
                const nameInput = document.getElementById('linkName');
                const urlInput = document.getElementById('linkUrl');
                const submitBtn = document.getElementById('submitLinkBtn');
                if (nameInput && urlInput && submitBtn) {
                    nameInput.value = nameMatch[1];
                    urlInput.value = nameMatch[2];
                    // เรียก click ปุ่มเพิ่ม (script หลักจะจัดการทุกอย่างเอง)
                    submitBtn.click();
                    speakText(`เพิ่มลิงก์ ${nameMatch[1]} เรียบร้อย`);
                } else {
                    speakText("ไม่พบฟอร์มเพิ่มลิงก์");
                }
            } else {
                speakText("รูปแบบไม่ถูกต้อง เช่น เพิ่มลิงก์ ชื่อ Google URL google.com");
            }
            return;
        }

        // 3. ลบลิงก์ตามชื่อ (จำลองการกดปุ่มลบในการ์ด)
        if (lower.startsWith('ลบลิงก์') || lower.startsWith('delete link')) {
            let targetName = lower.replace(/^(ลบลิงก์|delete link)\s*/i, '');
            if (!targetName) {
                speakText("กรุณาระบุชื่อลิงก์");
                return;
            }
            const deleteBtn = findDeleteButtonByLinkName(targetName);
            if (deleteBtn) {
                deleteBtn.click();
                speakText(`ลบลิงก์ ${targetName} เรียบร้อย`);
            } else {
                speakText(`ไม่พบลิงก์ชื่อ ${targetName}`);
            }
            return;
        }

        // 4. รีเซ็ตเริ่มต้น (คลิกปุ่มรีเซ็ต)
        if (lower === 'รีเซ็ต' || lower === 'reset' || lower === 'รีเซ็ตเริ่มต้น') {
            const resetBtn = document.getElementById('resetDefaultBtn');
            if (resetBtn) {
                resetBtn.click();
                speakText("รีเซ็ตลิงก์กลับค่าเริ่มต้นแล้ว");
            }
            return;
        }

        // 5. ล้างทั้งหมด (คลิกปุ่มล้างทั้งหมด)
        if (lower === 'ล้างทั้งหมด' || lower === 'clear all' || lower === 'ลบลิงก์ทั้งหมด') {
            const clearBtn = document.getElementById('clearAllBtn');
            if (clearBtn) {
                clearBtn.click();
                speakText("ลบลิงก์ทั้งหมดแล้ว");
            }
            return;
        }

        // 6. เปิดลิงก์ตามชื่อ (ใช้ window.open โดยตรง ไม่ต้องผ่าน script หลัก)
        if (lower.startsWith('เปิดลิงก์') || lower.startsWith('open')) {
            let targetName = lower.replace(/^(เปิดลิงก์|open)\s*/i, '');
            if (!targetName) {
                speakText("กรุณาระบุชื่อลิงก์");
                return;
            }
            // หา element ลิงก์ในหน้า
            const cards = document.querySelectorAll('.link-card');
            let foundUrl = null;
            for (let card of cards) {
                const nameEl = card.querySelector('.link-name a');
                if (nameEl && nameEl.textContent.trim().toLowerCase() === targetName.toLowerCase()) {
                    foundUrl = nameEl.href;
                    break;
                }
            }
            if (foundUrl) {
                window.open(foundUrl, '_blank');
                speakText(`กำลังเปิด ${targetName}`);
            } else {
                speakText(`ไม่พบลิงก์ชื่อ ${targetName}`);
            }
            return;
        }

        // 7. แสดงทั้งหมด (ล้างช่องค้นหา + ส่ง event input)
        if (lower === 'แสดงทั้งหมด' || lower === 'show all' || lower === 'ทั้งหมด') {
            const searchInput = document.getElementById('searchInput');
            if (searchInput) {
                searchInput.value = '';
                searchInput.dispatchEvent(new Event('input', { bubbles: true }));
                speakText("แสดงลิงก์ทั้งหมด");
            }
            return;
        }

        // 8. นับจำนวนลิงก์ (อ่านจาก DOM หรือ window.links แต่ window.links มีจาก script หลัก)
        if (lower === 'มีกี่ลิงก์' || lower === 'how many links' || lower === 'จำนวนลิงก์') {
            let count = 0;
            if (window.links && Array.isArray(window.links)) {
                count = window.links.length;
            } else {
                // fallback นับจากการ์ดใน DOM
                count = document.querySelectorAll('.link-card').length;
            }
            speakText(`ขณะนี้มีลิงก์ทั้งหมด ${count} รายการ`);
            return;
        }

        // 9. แสดงตามหมวดหมู่ (กรองผ่านฟังก์ชันที่มีใน script1.js ถ้ามี แต่เราจะทำผ่าน UI?)
        //    เนื่องจาก script หลักอาจไม่มีหมวดหมู่ เราจะใช้การค้นหาปกติแทน (หรือใช้ถ้ามี window.filterLinks)
        if (lower.startsWith('แสดงหมวดหมู่') || lower.startsWith('show category')) {
            let categoryQuery = lower.replace(/^(แสดงหมวดหมู่|show category)\s*/i, '');
            if (!categoryQuery) {
                speakText("โปรดระบุชื่อหมวดหมู่ เช่น บันเทิง");
                return;
            }
            const categoryCode = categoryNameToCode[categoryQuery] || categoryQuery;
            // ถ้ามี window.links และฟังก์ชัน renderLinks ที่รองรับหมวดหมู่ ให้ใช้
            if (window.links && typeof window.renderLinks === 'function' && window.links[0]?.category !== undefined) {
                // สร้างตัวกรองชั่วคราว (เลียนแบบการค้นหาด้วยข้อความ "cat:ชื่อ")
                const fakeFilter = `cat:${categoryQuery}`;
                if (typeof window.currentFilter !== 'undefined') window.currentFilter = fakeFilter;
                if (typeof window.renderLinks === 'function') window.renderLinks();
                const count = window.links.filter(link => link.category === categoryCode).length;
                speakText(`พบ ${count} ลิงก์ในหมวดหมู่ ${categoryQuery}`);
            } else {
                // fallback: ค้นหาด้วยคำสำคัญ
                const searchInput = document.getElementById('searchInput');
                if (searchInput) {
                    searchInput.value = categoryQuery;
                    searchInput.dispatchEvent(new Event('input', { bubbles: true }));
                    speakText(`ค้นหาหมวดหมู่ ${categoryQuery}`);
                }
            }
            return;
        }

        // 10. สุ่มลิงก์ (สุ่มจาก window.links หรือจากการ์ดใน DOM)
        if (lower === 'สุ่มลิงก์' || lower === 'random link') {
            let linksArray = null;
            if (window.links && Array.isArray(window.links)) {
                linksArray = window.links;
            } else {
                // สร้าง array จาก DOM
                const cards = document.querySelectorAll('.link-card');
                linksArray = Array.from(cards).map(card => ({
                    name: card.querySelector('.link-name a')?.textContent,
                    url: card.querySelector('.link-name a')?.href
                }));
            }
            if (linksArray && linksArray.length > 0) {
                const random = linksArray[Math.floor(Math.random() * linksArray.length)];
                if (random.url) {
                    window.open(random.url, '_blank');
                    speakText(`สุ่มเปิด ${random.name}`);
                } else {
                    speakText("ไม่พบลิงก์ที่สุ่มได้");
                }
            } else {
                speakText("ไม่มีลิงก์ให้สุ่ม");
            }
            return;
        }

        // 11. เปลี่ยนธีม (คลิกปุ่มธีมที่มีอยู่แล้วในหน้า)
        if (lower === 'เปลี่ยนเป็นธีมสว่าง' || lower === 'light theme') {
            const themeBtn = document.getElementById('themeToggleBtn');
            if (themeBtn && document.body.classList.contains('dark')) {
                themeBtn.click();
                speakText("เปลี่ยนเป็นธีมสว่างแล้ว");
            } else {
                speakText("ธีมสว่างอยู่แล้ว");
            }
            return;
        }
        if (lower === 'เปลี่ยนเป็นธีมมืด' || lower === 'dark theme') {
            const themeBtn = document.getElementById('themeToggleBtn');
            if (themeBtn && !document.body.classList.contains('dark')) {
                themeBtn.click();
                speakText("เปลี่ยนเป็นธีมมืดแล้ว");
            } else {
                speakText("ธีมมืดอยู่แล้ว");
            }
            return;
        }
        if (lower === 'สลับธีม' || lower === 'toggle theme') {
            const themeBtn = document.getElementById('themeToggleBtn');
            if (themeBtn) {
                themeBtn.click();
                speakText("สลับธีมเรียบร้อย");
            }
            return;
        }

        // 12. ปรับความเร็วเสียง
        if (lower === 'เพิ่มความเร็วเสียง' || lower === 'faster') {
            window._voiceRate = Math.min(1.8, window._voiceRate + 0.1);
            speakText(`เพิ่มความเร็วเสียงเป็น ${window._voiceRate.toFixed(1)} เท่า`, window._voiceRate);
            return;
        }
        if (lower === 'ลดความเร็วเสียง' || lower === 'slower') {
            window._voiceRate = Math.max(0.5, window._voiceRate - 0.1);
            speakText(`ลดความเร็วเสียงเป็น ${window._voiceRate.toFixed(1)} เท่า`, window._voiceRate);
            return;
        }

        // 13. ปิด/เปิดเสียง
        if (lower === 'ปิดเสียง' || lower === 'mute') {
            window._voiceMuted = true;
            speakText("ปิดเสียงแจ้งเตือนแล้ว");
            return;
        }
        if (lower === 'เปิดเสียง' || lower === 'unmute') {
            window._voiceMuted = false;
            speakText("เปิดเสียงแจ้งเตือนแล้ว");
            return;
        }

        // 14. ช่วยเหลือ
        if (lower === 'ช่วยเหลือ' || lower === 'help' || lower === 'คำสั่ง') {
            const helpText = `คำสั่งเสียง: ค้นหา [ข้อความ], เพิ่มลิงก์ ชื่อ [ชื่อ] URL [ลิงก์], ลบลิงก์ [ชื่อ], รีเซ็ต, ล้างทั้งหมด, เปิดลิงก์ [ชื่อ], แสดงทั้งหมด, มีกี่ลิงก์, แสดงหมวดหมู่ [ชื่อ], สุ่มลิงก์, เปลี่ยนธีมสว่าง/มืด/สลับ, เพิ่ม/ลดความเร็วเสียง, ปิด/เปิดเสียง`;
            speakText(helpText);
            return;
        }

        // fallback: ค้นหาด้วยข้อความที่พูด
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.value = transcript;
            searchInput.dispatchEvent(new Event('input', { bubbles: true }));
            speakText(`ค้นหา ${transcript}`);
        } else {
            speakText("ไม่เข้าใจคำสั่ง กรุณาพูดใหม่");
        }
    }

    // ---------- เพิ่มปุ่มไมโครโฟน ----------
    function addMicrophoneButton() {
        const searchWrapper = document.querySelector('.search-wrapper');
        if (!searchWrapper || document.getElementById('voiceMicBtn')) return;
        const micBtn = document.createElement('button');
        micBtn.id = 'voiceMicBtn';
        micBtn.innerHTML = '<i class="fas fa-microphone"></i>';
        micBtn.style.background = "rgba(0,0,0,0.6)";
        micBtn.style.border = "1px solid rgba(255,255,255,0.5)";
        micBtn.style.borderRadius = "2rem";
        micBtn.style.padding = "0.4rem 0.8rem";
        micBtn.style.cursor = "pointer";
        micBtn.style.color = "white";
        micBtn.style.marginLeft = "0.5rem";
        micBtn.title = "คลิกเพื่อพูดสั่งงานด้วยเสียง";
        micBtn.addEventListener('click', startListening);
        searchWrapper.appendChild(micBtn);
        requestMicrophonePermission();
    }

    // ---------- เพิ่มปุ่มอ่านเสียงในการ์ดลิงก์ (ไม่รบกวนฟังก์ชัน render) ----------
    function addSpeakButtonsToCards() {
        const cards = document.querySelectorAll('.link-card');
        cards.forEach(card => {
            if (card.querySelector('.speak-link-btn')) return;
            const linkNameEl = card.querySelector('.link-name a');
            if (!linkNameEl) return;
            const linkName = linkNameEl.textContent;
            const categoryBadge = card.querySelector('.ai-badge');
            let categoryText = categoryBadge ? categoryBadge.textContent.trim() : "";

            const footer = card.querySelector('.card-footer');
            if (footer) {
                const speakBtn = document.createElement('button');
                speakBtn.className = 'speak-link-btn';
                speakBtn.innerHTML = '<i class="fas fa-volume-up"></i>';
                speakBtn.style.background = "rgba(0,0,0,0.5)";
                speakBtn.style.border = "none";
                speakBtn.style.borderRadius = "20px";
                speakBtn.style.padding = "0.2rem 0.5rem";
                speakBtn.style.marginLeft = "0.5rem";
                speakBtn.style.cursor = "pointer";
                speakBtn.style.color = "white";
                speakBtn.title = "อ่านชื่อลิงก์และหมวดหมู่";
                speakBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    let message = linkName;
                    if (categoryText) message += ` หมวดหมู่ ${categoryText}`;
                    speakText(message);
                });
                const firstSpan = footer.querySelector('span:first-child');
                if (firstSpan && firstSpan.classList.contains('ai-badge')) {
                    firstSpan.appendChild(speakBtn);
                } else {
                    footer.insertBefore(speakBtn, footer.firstChild);
                }
            }
        });
    }

    // สังเกตการเปลี่ยนแปลงของการ์ด (MutationObserver)
    function observeCardChanges() {
        const container = document.getElementById('linksContainer');
        if (!container) return;
        const observer = new MutationObserver(() => addSpeakButtonsToCards());
        observer.observe(container, { childList: true, subtree: true });
        addSpeakButtonsToCards();
    }

    // ---------- เริ่มต้นระบบ ----------
    function enhanceWithVoiceAI() {
        addMicrophoneButton();
        observeCardChanges();
        console.log("✅ script3.js (Non-invasive) โหลดแล้ว: ระบบเสียง AI พร้อมใช้งาน โดยไม่ยุ่งกับสคริปต์หลัก");
    }

    waitForScript();
})();