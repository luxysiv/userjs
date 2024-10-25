// ==UserScript==
// @match        *://game4u.*/*

// @name         Smart Block Irregular URLs and Remove Leave Confirmations
// @namespace    luxysiv
// @version      4.4
// @description  Block irregular URLs and remove leave confirmations.
// @author       Mạnh Dương
// @grant        none
// @run-at       document-start
// @icon         https://img.icons8.com/fluency/48/000000/shield.png
// ==/UserScript==

(function() {
    'use strict';

    // Danh sách các mẫu URL quảng cáo sử dụng regex
    const suspiciousPatterns = [
        // Chặn tên miền không rõ nguồn gốc
        /^(https?:\/\/)?(www\.)?[a-z0-9-]{1,63}\.(com|net|org|xyz|info|top|club|site|biz|tk|pw|gq|ml)(\/[^\s]*)?$/, // Tên miền phổ biến
        // Chặn các tham số quảng cáo
        /.*[?&](aff_sub|utm_source|utm_medium|utm_campaign|utm_term|utm_content|z|var|id|ads)=.+/, // Tham số quảng cáo
        // Chặn các chuỗi ký tự không rõ nguồn gốc
        /[0-9a-z]{20,}/, // Chuỗi ký tự dài không rõ nguồn gốc
        // Chặn các từ khóa trong URL
        /.*(ads|redirect|click|survey|sweep|offer|promo|sale|win|contest|popunder|track).*/, // Các từ khóa liên quan đến quảng cáo
        // Chặn about:blank
        /^about:blank$/ // Chặn kết nối about:blank
    ];

    // Hàm kiểm tra xem URL có phải là kỳ lạ không
    function isSuspiciousUrl(url) {
        return suspiciousPatterns.some(pattern => pattern.test(url));
    }

    // Ghi đè window.open để chặn các URL kỳ lạ
    const originalWindowOpen = window.open;
    window.open = function(url, target) {
        if (isSuspiciousUrl(url)) {
            console.log(`Blocked window.open for suspicious URL: ${url}`);
            return null; // Ngăn không cho mở tab mới
        }
        return originalWindowOpen(url, target);
    };

    // Ghi đè addEventListener để chặn click trên các link mở tab mới
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

    // Chặn yêu cầu mạng với XMLHttpRequest
    const originalXhrOpen = XMLHttpRequest.prototype.open;
    XMLHttpRequest.prototype.open = function(method, url) {
        if (isSuspiciousUrl(url)) {
            console.log(`Blocked XMLHttpRequest to: ${url}`);
            return; // Ngăn không cho thực hiện yêu cầu
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

    // Chặn mọi thay đổi location.href hoặc location.assign
    const originalLocationAssign = Location.prototype.assign;
    Location.prototype.assign = function(url) {
        if (isSuspiciousUrl(url)) {
            console.log(`Blocked location.assign to: ${url}`);
            return; // Ngăn không cho chuyển hướng
        }
        return originalLocationAssign.call(this, url);
    };

    // Chặn mọi thay đổi location.replace
    const originalLocationReplace = Location.prototype.replace;
    Location.prototype.replace = function(url) {
        if (isSuspiciousUrl(url)) {
            console.log(`Blocked location.replace to: ${url}`);
            return; // Ngăn không cho chuyển hướng
        }
        return originalLocationReplace.call(this, url);
    };

    // Chặn mọi thay đổi location.href
    Object.defineProperty(Location.prototype, 'href', {
        set: function(url) {
            if (isSuspiciousUrl(url)) {
                console.log(`Blocked setting location.href to: ${url}`);
                return; // Ngăn không cho thay đổi href
            }
            return Object.getOwnPropertyDescriptor(Location.prototype, 'href').set.call(this, url);
        }
    });

    // Gỡ bỏ hoàn toàn hộp thoại xác nhận rời khỏi trang
    window.onbeforeunload = null;

})();
