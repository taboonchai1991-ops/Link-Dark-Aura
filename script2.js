// ============================================================
// script2.js - เพิ่มระบบรหัสผ่านสำหรับการลบและรีเซ็ต
// ใช้ร่วมกับ script.js (และ script1.js ได้) โดยไม่ต้องแก้ไขไฟล์เดิม
// ============================================================
(function() {
    // ตั้งค่ารหัสผ่าน (สามารถแก้ไขได้ตามต้องการ)
    const REQUIRED_PASSWORD = "Trojan";  // <-- เปลี่ยนรหัสผ่านที่นี่

    // รอให้ script.js โหลดและฟังก์ชันพร้อม
    function waitForScript() {
        if (typeof window.deleteLinkById === 'function' &&
            typeof window.clearAllLinks === 'function' &&
            typeof window.resetToDefault === 'function') {
            enhanceWithPasswordProtection();
        } else {
            setTimeout(waitForScript, 50);
        }
    }

    // ฟังก์ชันขอรหัสผ่าน (ถ้าถูกต้องคืน true)
    function askForPassword(actionName) {
        const userPassword = prompt(`🔒 ยืนยันตัวตนเพื่อ${actionName}\nกรุณากรอกรหัสผ่าน:`);
        if (userPassword === REQUIRED_PASSWORD) {
            return true;
        } else if (userPassword !== null) {
            alert("❌ รหัสผ่านไม่ถูกต้อง ยกเลิกการทำงาน");
        } else {
            alert("ยกเลิกการทำงาน");
        }
        return false;
    }

    function enhanceWithPasswordProtection() {
        // เก็บฟังก์ชันเดิม
        const originalDeleteLinkById = window.deleteLinkById;
        const originalClearAllLinks = window.clearAllLinks;
        const originalResetToDefault = window.resetToDefault;

        // --- Override deleteLinkById ---
        window.deleteLinkById = function(id) {
            // หาชื่อลิงก์เพื่อแสดงในข้อความ (ถ้าหาได้)
            let linkName = "ลิงก์นี้";
            if (window.links) {
                const found = window.links.find(link => link.id === id);
                if (found) linkName = found.name;
            }
            if (askForPassword(`ลบลิงก์ "${linkName}"`)) {
                originalDeleteLinkById(id);
            }
        };

        // --- Override clearAllLinks ---
        window.clearAllLinks = function() {
            if (askForPassword("ลบลิงก์ทั้งหมด")) {
                originalClearAllLinks();
            }
        };

        // --- Override resetToDefault ---
        window.resetToDefault = function() {
            if (askForPassword("รีเซ็ตกลับค่าเริ่มต้น")) {
                originalResetToDefault();
            }
        };

        console.log("✅ script2.js โหลดแล้ว: ระบบรหัสผ่านป้องกันการลบ/รีเซ็ตทำงาน");
    }

    waitForScript();
})();