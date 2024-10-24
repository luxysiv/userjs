// ==UserScript==
// @name         Smart Block Irregular URLs and Remove Leave Confirmations with Auto-detect Ads
// @namespace    luxysiv
// @version      4.5
// @description  Block irregular URLs, auto-detect tabs that open ads, and remove leave confirmations.
// @author       Mạnh Dương
// @match        *://*/*
// @grant        none
// @run-at       document-start
// @icon         https://img.icons8.com/fluency/48/000000/shield.png
// ==/UserScript==

(function() {
    'use strict';

    // Danh sách các mẫu URL quảng cáo sử dụng regex
    const suspiciousPatterns = [
        /^(https?:\/\/)?(www\.)?[a-z0-9-]{1,63}\.(com|net|org|xyz|info|top|club|site|biz|tk|pw|gq|ml)(\/[^\s]*)?$/, 
        /.*[?&](aff_sub|utm_source|utm_medium|utm_campaign|utm_term|utm_content|z|var|id|ads)=.+/, 
        /[0-9a-z]{20,}/, 
        /.*(ads|redirect|click|survey|sweep|offer|promo|sale|win|contest|popunder|track).*/, 
        /^about:blank$/
    ];

    // Hàm kiểm tra xem URL có phải là kỳ lạ không
    function isSuspiciousUrl(url) {
        return suspiciousPatterns.some(pattern => pattern.test(url));
    }

    // Theo dõi các trang mở tab để hiện quảng cáo
    let adTabOpened = false;
    window.addEventListener('focus', function() {
        if (adTabOpened) {
            console.log('Detected and skipped a tab that opened ads.');
            window.close(); // Đóng tab quảng cáo
            adTabOpened = false;
        }
    });

    // Ghi đè window.open để phát hiện và chặn các URL quảng cáo
    const originalWindowOpen = window.open;
    window.open = function(url, target) {
        if (isSuspiciousUrl(url)) {
            console.log(`Blocked window.open for suspicious URL: ${url}`);
            return null; 
        }
        adTabOpened = true; 
        return originalWindowOpen(url, target);
    };

    // Các tính năng khác vẫn giữ nguyên...

    // Chặn click mở tab với URL kỳ lạ
    const originalAddEventListener = EventTarget.prototype.addEventListener;
    EventTarget.prototype.addEventListener = function(type, listener, options) {
        if (type === 'click') {
            const wrappedListener = function(event) {
                const target = event.target.closest('a[target="_blank"]');
                if (target && isSuspiciousUrl(target.href)) {
                    console.log(`Blocked link click: ${target.href}`);
                    event.preventDefault();
                } else {
                    listener.call(this, event);
                }
            };
            return originalAddEventListener.call(this, type, wrappedListener, options);
        }
        return originalAddEventListener.call(this, type, listener, options);
    };

    // Gỡ bỏ hoàn toàn hộp thoại xác nhận rời khỏi trang
    window.onbeforeunload = null;

})();
