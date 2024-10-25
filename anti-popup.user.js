// ==UserScript==
// @name         Auto Block Suspicious URLs on Page Load
// @namespace    luxysiv
// @version      5.0
// @description  Automatically block suspicious URLs on page load and save them for future blocks.
// @author       Mạnh Dương
// @match        *://*/*
// @grant        none
// @run-at       document-start
// @icon         https://img.icons8.com/fluency/48/000000/shield.png
// ==/UserScript==

(function() {
    'use strict';

    // Lấy danh sách các trang đã được block từ localStorage hoặc khởi tạo danh sách mới
    let blockedUrls = JSON.parse(localStorage.getItem('blockedUrls')) || [];

    // Lưu danh sách vào localStorage
    function saveBlockedUrls() {
        localStorage.setItem('blockedUrls', JSON.stringify(blockedUrls));
    }

    // Kiểm tra xem URL có nằm trong danh sách bị block không
    function isBlockedUrl(url) {
        return blockedUrls.some(blockedUrl => url.includes(blockedUrl));
    }

    // Thêm URL vào danh sách block
    function addToBlockedUrls(url) {
        if (!blockedUrls.includes(url)) {
            blockedUrls.push(url);
            console.log(`Added to blocked URLs: ${url}`);
            saveBlockedUrls();
        }
    }

    // Hàm để phát hiện URL lạ (có thể là quảng cáo hoặc redirect)
    function isSuspiciousUrl(url) {
        return !url.includes(window.location.hostname); // URL lạ nếu không thuộc cùng domain với trang hiện tại
    }

    // Ghi đè window.open để phát hiện các URL lạ
    const originalWindowOpen = window.open;
    window.open = function(url, target) {
        if (isBlockedUrl(url)) {
            console.log(`Blocked window.open for URL: ${url}`);
            return null;
        }
        if (isSuspiciousUrl(url)) {
            addToBlockedUrls(url); // Thêm URL lạ vào danh sách chặn
            return null; // Ngăn mở tab mới
        }
        return originalWindowOpen(url, target);
    };

    // Ghi đè location.assign và location.replace để phát hiện URL lạ
    const originalLocationAssign = Location.prototype.assign;
    Location.prototype.assign = function(url) {
        if (isBlockedUrl(url)) {
            console.log(`Blocked location.assign to: ${url}`);
            return;
        }
        if (isSuspiciousUrl(url)) {
            addToBlockedUrls(url); // Thêm URL lạ vào danh sách chặn
            return;
        }
        return originalLocationAssign.call(this, url);
    };

    const originalLocationReplace = Location.prototype.replace;
    Location.prototype.replace = function(url) {
        if (isBlockedUrl(url)) {
            console.log(`Blocked location.replace to: ${url}`);
            return;
        }
        if (isSuspiciousUrl(url)) {
            addToBlockedUrls(url); // Thêm URL lạ vào danh sách chặn
            return;
        }
        return originalLocationReplace.call(this, url);
    };

    // Ghi đè thay đổi location.href để phát hiện URL lạ
    Object.defineProperty(Location.prototype, 'href', {
        set: function(url) {
            if (isBlockedUrl(url)) {
                console.log(`Blocked setting location.href to: ${url}`);
                return;
            }
            if (isSuspiciousUrl(url)) {
                addToBlockedUrls(url); // Thêm URL lạ vào danh sách chặn
                return;
            }
            return Object.getOwnPropertyDescriptor(Location.prototype, 'href').set.call(this, url);
        }
    });

    // Chặn các hành động nếu URL đã nằm trong danh sách chặn
    if (blockedUrls.length > 0) {
        // Chặn XMLHttpRequest tới các URL bị chặn
        const originalXhrOpen = XMLHttpRequest.prototype.open;
        XMLHttpRequest.prototype.open = function(method, url) {
            if (isBlockedUrl(url)) {
                console.log(`Blocked XMLHttpRequest to: ${url}`);
                return;
            }
            return originalXhrOpen.apply(this, arguments);
        };

        // Chặn các yêu cầu fetch tới các URL bị chặn
        const originalFetch = window.fetch;
        window.fetch = function(input, init) {
            const url = typeof input === 'string' ? input : input.url;
            if (isBlockedUrl(url)) {
                console.log(`Blocked fetch request to: ${url}`);
                return Promise.reject(new Error('Blocked suspicious URL'));
            }
            return originalFetch.apply(this, arguments);
        };
    }

    // Gỡ bỏ hoàn toàn hộp thoại xác nhận rời khỏi trang
    window.onbeforeunload = null;

})();
