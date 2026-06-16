// ============================================================
// script4.js - ป้องกันการเปิด Developer Tools และการตรวจสอบโค้ด
// (ปรับแต่งตามคำขอ: เปลี่ยนข้อความ, ล้างหน้าเว็บ, เปลี่ยนความถี่, ปิดการป้องกันคัดลอก)
// ============================================================
(function() {
    "use strict";

    let devToolsOpen = false;
    let checkInterval = null;
    let warningGiven = false;

    // ------------------- 1. ป้องกันคลิกขวา -------------------
    document.addEventListener('contextmenu', function(e) {
        e.preventDefault();
        return false;
    });

    // ------------------- 2. ป้องกันคีย์ลัด -------------------
    document.addEventListener('keydown', function(e) {
        if (e.key === 'F12' || e.keyCode === 123) {
            e.preventDefault();
            return false;
        }
        if (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.keyCode === 73)) {
            e.preventDefault();
            return false;
        }
        if (e.ctrlKey && e.shiftKey && (e.key === 'J' || e.keyCode === 74)) {
            e.preventDefault();
            return false;
        }
        if (e.ctrlKey && e.shiftKey && (e.key === 'C' || e.keyCode === 67)) {
            e.preventDefault();
            return false;
        }
        if (e.ctrlKey && (e.key === 'U' || e.keyCode === 85)) {
            e.preventDefault();
            return false;
        }
        if (e.ctrlKey && (e.key === 's' || e.key === 'S' || e.keyCode === 83)) {
            e.preventDefault();
            return false;
        }
        if (e.ctrlKey && e.shiftKey && (e.key === 'P' || e.keyCode === 80)) {
            e.preventDefault();
            return false;
        }
    });

    // ------------------- 3. ตรวจจับ Developer Tools -------------------
    function detectDevToolsBySize() {
        const threshold = 200;
        const widthDiff = window.outerWidth - window.innerWidth;
        const heightDiff = window.outerHeight - window.innerHeight;
        return (widthDiff > threshold || heightDiff > threshold);
    }

    function detectDevToolsByElement() {
        const start = performance.now();
        debugger;
        const end = performance.now();
        return (end - start > 100);
    }

    let devToolsDetectionMethod = false;
    (function() {
        const element = new Image();
        Object.defineProperty(element, 'id', {
            get: function() {
                devToolsDetectionMethod = true;
                return 'devtools_detected';
            }
        });
        console.log(element);
    })();

    function isDevToolsOpen() {
        return (detectDevToolsBySize() || detectDevToolsByElement() || devToolsDetectionMethod);
    }

    // ------------------- 4. เมื่อตรวจพบ ให้แจ้งเตือน + ล้างหน้าเว็บ -------------------
    function handleDevToolsOpen() {
        if (warningGiven) return;
        warningGiven = true;

        // เปลี่ยนข้อความแจ้งเตือนได้ที่นี่
        const message = "🚫 ตรวจพบการเปิด Developer Tools กรุณาปิดเพื่อใช้งานระบบต่อไป 🚫";
        
        alert(message);
        
        if (typeof window.speakText === 'function') {
            window.speakText(message);
        }
        
        // ✅ เพิ่มการล้างเนื้อหาหน้าเว็บ (ยกเลิกคอมเมนต์)
        document.body.innerHTML = '<div style="text-align:center;margin-top:20%;font-family:sans-serif;color:red;"><h1>🚫 ไม่สามารถแสดงเนื้อหาได้ 🚫</h1><p>กรุณาปิด Developer Tools และรีเฟรชหน้าเว็บ</p></div>';
        
        // ป้องกันไม่ให้ทำงานซ้ำอีก
        if (checkInterval) clearInterval(checkInterval);
    }

    // ------------------- 5. ตรวจสอบทุก X มิลลิวินาที (ปรับความถี่ได้ที่นี่) -------------------
    function startDevToolsMonitor() {
        if (checkInterval) clearInterval(checkInterval);
        // ✅ เปลี่ยนความถี่การตรวจสอบ (ค่าเริ่มต้น 3000 ms = 3 วินาที)
        const CHECK_INTERVAL_MS = 3000;   // แก้ไขตัวเลขนี้ตามต้องการ (เช่น 5000 = 5 วินาที)
        checkInterval = setInterval(function() {
            if (isDevToolsOpen()) {
                if (!devToolsOpen) {
                    devToolsOpen = true;
                    handleDevToolsOpen();
                }
            } else {
                devToolsOpen = false;
                warningGiven = false;
            }
        }, CHECK_INTERVAL_MS);
    }

    // ------------------- 6. ป้องกันการเลือกข้อความ (คงไว้) -------------------
    document.addEventListener('selectstart', function(e) {
        if (e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
            e.preventDefault();
        }
    });

    // ✅ ปิดการป้องกันการคัดลอก (คอมเมนต์ event listener ด้านล่าง)
    /*
    document.addEventListener('copy', function(e) {
        if (e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
            e.preventDefault();
            alert("ไม่สามารถคัดลอกเนื้อหานี้ได้");
        }
    });
    */

    // ------------------- เริ่มระบบ -------------------
    function initProtection() {
        startDevToolsMonitor();
        console.log("✅ script4.js ปรับแต่งแล้ว: ป้องกัน DevTools (ล้างหน้า + เปลี่ยนข้อความ) โดยไม่ป้องกันการคัดลอก");
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initProtection);
    } else {
        initProtection();
    }
})();