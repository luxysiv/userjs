// ==UserScript==
// @name         Smart Block Irregular URLs and Remove Leave Confirmations with Auto-Blacklist for Ad Sites
// @namespace    luxysiv
// @version      4.9
// @description  Block irregular URLs, auto-blacklist ad sites, and remove leave confirmations.
// @author       Mạnh Dương
// @match        *://*/*
// @grant        none
// @run-at       document-start
// @icon         https://img.icons8.com/fluency/48/000000/shield.png
// ==/UserScript==

(function() {
    'use strict';

    // Lấy danh sách các trang đã được black-list từ localStorage hoặc khởi tạo danh sách mới
    let blackListedSites = JSON.parse(localStorage.getItem('blackListedSites')) || [];

    // Lưu danh sách vào localStorage
    function saveBlackList() {
        localStorage.setItem('blackListedSites', JSON.stringify(blackListedSites));
    }

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

    // Kiểm tra xem trang hiện tại đã bị black-list chưa
    function isBlackListed() {
        return blackListedSites.includes(window.location.hostname);
    }

    // Thêm trang vào danh sách black-list
    function addToBlackList() {
        if (!blackListedSites.includes(window.location.hostname)) {
            blackListedSites.push(window.location.hostname);
            console.log(`Added to blacklist: ${window.location.hostname}`);
            saveBlackList(); // Lưu lại danh sách sau khi thêm mới
        }
    }

    // Theo dõi các trang mở tab để hiện quảng cáo
    let adTabOpened = false;
    window.addEventListener('focus', function() {
        if (adTabOpened) {
            addToBlackList(); // Trang mở tab quảng cáo, thêm vào black-list
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
        adTabOpened = true; // Đánh dấu rằng đã mở tab quảng cáo
        return originalWindowOpen(url, target);
    };

    // Ghi đè location.assign để phát hiện các điều hướng trang
    const originalLocationAssign = Location.prototype.assign;
    Location.prototype.assign = function(url) {
        if (isSuspiciousUrl(url)) {
            console.log(`Blocked location.assign to: ${url}`);
            addToBlackList(); // Thêm vào danh sách đen nếu có điều hướng đến trang quảng cáo
            return;
        }
        return originalLocationAssign.call(this, url);
    };

    // Ghi đè location.replace để phát hiện các điều hướng trang
    const originalLocationReplace = Location.prototype.replace;
    Location.prototype.replace = function(url) {
        if (isSuspiciousUrl(url)) {
            console.log(`Blocked location.replace to: ${url}`);
            addToBlackList(); // Thêm vào danh sách đen nếu có điều hướng đến trang quảng cáo
            return;
        }
        return originalLocationReplace.call(this, url);
    };

    // Ghi đè location.href để phát hiện thay đổi trang
    Object.defineProperty(Location.prototype, 'href', {
        set: function(url) {
            if (isSuspiciousUrl(url)) {
                console.log(`Blocked setting location.href to: ${url}`);
                addToBlackList(); // Thêm vào danh sách đen nếu có thay đổi href dẫn đến trang quảng cáo
                return;
            }
            return Object.getOwnPropertyDescriptor(Location.prototype, 'href').set.call(this, url);
        }
    });

    // Chặn các hành động chỉ trên những trang đã có trong danh sách đen
    if (isBlackListed()) {
        // Chặn yêu cầu mạng với XMLHttpRequest
        const originalXhrOpen = XMLHttpRequest.prototype.open;
        XMLHttpRequest.prototype.open = function(method, url) {
            if (isSuspiciousUrl(url)) {
                console.log(`Blocked XMLHttpRequest to: ${url}`);
                return;
            }
            return originalXhrOpen.apply(this, arguments);
        };

        // Chặn các yêu cầu mạng với fetch
        const originalFetch = window.fetch;
        window.fetch = function(input, init) {
            const url = typeof input === 'string' ? input : input.url;
            if (isSuspiciousUrl(url)) {
                console.log(`Blocked fetch request to: ${url}`);
                return Promise.reject(new Error('Blocked suspicious URL'));
            }
            return originalFetch.apply(this, arguments);
        };

        console.log("This site is blacklisted. Blocking suspicious behavior.");
    }

    // Gỡ bỏ hoàn toàn hộp thoại xác nhận rời khỏi trang
    window.onbeforeunload = null;

})();
