// ==UserScript==
// @name         Smart Block Irregular URLs and Remove Leave Confirmations with Auto-Whitelist for Non-Ad Sites
// @namespace    luxysiv
// @version      4.6
// @description  Block irregular URLs, auto-whitelist non-ad sites, and remove leave confirmations.
// @author       Mạnh Dương
// @match        *://*/*
// @grant        none
// @run-at       document-start
// @icon         https://img.icons8.com/fluency/48/000000/shield.png
// ==/UserScript==

(function() {
    'use strict';

    // Danh sách các trang đã được white-list
    let whiteListedSites = new Set();

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

    // Kiểm tra xem trang hiện tại đã được white-list chưa
    function isWhiteListed() {
        return whiteListedSites.has(window.location.hostname);
    }

    // Thêm trang vào danh sách white-list
    function addToWhiteList() {
        whiteListedSites.add(window.location.hostname);
        console.log(`Added to whitelist: ${window.location.hostname}`);
    }

    // Theo dõi các trang mở tab để hiện quảng cáo
    let adTabOpened = false;
    window.addEventListener('focus', function() {
        if (adTabOpened) {
            console.log('Detected and skipped a tab that opened ads.');
            adTabOpened = false;
        } else if (!isWhiteListed()) {
            addToWhiteList(); // Trang không mở quảng cáo, thêm vào white-list
        }
    });

    // Ghi đè window.open để phát hiện và chặn các URL quảng cáo
    const originalWindowOpen = window.open;
    window.open = function(url, target) {
        if (!isWhiteListed() && isSuspiciousUrl(url)) {
            console.log(`Blocked window.open for suspicious URL: ${url}`);
            return null;
        }
        adTabOpened = true;
        return originalWindowOpen(url, target);
    };

    // Ghi đè addEventListener để chặn click trên các link mở tab mới
    const originalAddEventListener = EventTarget.prototype.addEventListener;
    EventTarget.prototype.addEventListener = function(type, listener, options) {
        if (type === 'click') {
            const wrappedListener = function(event) {
                const target = event.target.closest('a[target="_blank"]');
                if (target && !isWhiteListed() && isSuspiciousUrl(target.href)) {
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

    // Chặn yêu cầu mạng với XMLHttpRequest
    const originalXhrOpen = XMLHttpRequest.prototype.open;
    XMLHttpRequest.prototype.open = function(method, url) {
        if (!isWhiteListed() && isSuspiciousUrl(url)) {
            console.log(`Blocked XMLHttpRequest to: ${url}`);
            return;
        }
        return originalXhrOpen.apply(this, arguments);
    };

    // Chặn các yêu cầu mạng với fetch
    const originalFetch = window.fetch;
    window.fetch = function(input, init) {
        const url = typeof input === 'string' ? input : input.url;
        if (!isWhiteListed() && isSuspiciousUrl(url)) {
            console.log(`Blocked fetch request to: ${url}`);
            return Promise.reject(new Error('Blocked suspicious URL'));
        }
        return originalFetch.apply(this, arguments);
    };

    // Chặn mọi thay đổi location.href hoặc location.assign
    const originalLocationAssign = Location.prototype.assign;
    Location.prototype.assign = function(url) {
        if (!isWhiteListed() && isSuspiciousUrl(url)) {
            console.log(`Blocked location.assign to: ${url}`);
            return;
        }
        return originalLocationAssign.call(this, url);
    };

    // Chặn mọi thay đổi location.replace
    const originalLocationReplace = Location.prototype.replace;
    Location.prototype.replace = function(url) {
        if (!isWhiteListed() && isSuspiciousUrl(url)) {
            console.log(`Blocked location.replace to: ${url}`);
            return;
        }
        return originalLocationReplace.call(this, url);
    };

    // Chặn mọi thay đổi location.href
    Object.defineProperty(Location.prototype, 'href', {
        set: function(url) {
            if (!isWhiteListed() && isSuspiciousUrl(url)) {
                console.log(`Blocked setting location.href to: ${url}`);
                return;
            }
            return Object.getOwnPropertyDescriptor(Location.prototype, 'href').set.call(this, url);
        }
    });

    // Gỡ bỏ hoàn toàn hộp thoại xác nhận rời khỏi trang
    window.onbeforeunload = null;

})();
