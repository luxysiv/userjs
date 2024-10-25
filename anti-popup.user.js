// ==UserScript==
// @name         Smart Block Irregular URLs and Remove Leave Confirmations (Specific Domain Match)
// @namespace    luxysiv
// @version      4.7
// @description  Block irregular URLs on specific sites and remove leave confirmations, with specific domain matching.
// @author       Mạnh Dương
// @match        *://*/*
// @grant        none
// @run-at       document-start
// @icon         https://img.icons8.com/fluency/48/000000/shield.png
// ==/UserScript==

(function() {
    'use strict';

    // Danh sách đen với khả năng khớp một phần domain
    const blacklist = [
        /^https:\/\/game4u\./,   // Khớp với mọi tên miền bắt đầu bằng 'game4u.'
        /^https:\/\/vlxx\./      // Khớp với mọi tên miền bắt đầu bằng 'vlxx.'
        // Thêm các regex khác nếu cần
    ];

    // Hàm kiểm tra nếu URL thuộc danh sách đen (dùng regex để khớp)
    function isBlacklistedSite(url) {
        return blacklist.some(pattern => pattern.test(url));
    }

    // Danh sách các mẫu URL quảng cáo sử dụng regex
    const suspiciousPatterns = [
        /^(https?:\/\/)?(www\.)?[a-z0-9-]{1,63}\.(com|net|org|xyz|info|top|club|site|biz|tk|pw|gq|ml)(\/[^\s]*)?$/, // Tên miền phổ biến
        /.*[?&](aff_sub|utm_source|utm_medium|utm_campaign|utm_term|utm_content|z|var|id|ads)=.+/, // Tham số quảng cáo
        /[0-9a-z]{20,}/, // Chuỗi ký tự dài không rõ nguồn gốc
        /.*(ads|redirect|click|survey|sweep|offer|promo|sale|win|contest|popunder|track).*/, // Các từ khóa liên quan đến quảng cáo
        /^about:blank$/ // Chặn kết nối about:blank
    ];

    // Hàm kiểm tra xem URL có phải là kỳ lạ không
    function isSuspiciousUrl(url) {
        return suspiciousPatterns.some(pattern => pattern.test(url));
    }

    // Ghi đè window.open để chặn các URL kỳ lạ trên trang web thuộc danh sách đen
    const originalWindowOpen = window.open;
    window.open = function(url, target) {
        if (isBlacklistedSite(window.location.href) && isSuspiciousUrl(url)) {
            console.log(`Blocked window.open for suspicious URL: ${url}`);
            return null; // Ngăn không cho mở tab mới
        }
        return originalWindowOpen(url, target);
    };

    // Ghi đè addEventListener để chặn click trên các link mở tab mới trên trang web thuộc danh sách đen
    const originalAddEventListener = EventTarget.prototype.addEventListener;
    EventTarget.prototype.addEventListener = function(type, listener, options) {
        if (type === 'click' && isBlacklistedSite(window.location.href)) {
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

    // Chặn yêu cầu mạng với XMLHttpRequest trên trang web thuộc danh sách đen
    const originalXhrOpen = XMLHttpRequest.prototype.open;
    XMLHttpRequest.prototype.open = function(method, url) {
        if (isBlacklistedSite(window.location.href) && isSuspiciousUrl(url)) {
            console.log(`Blocked XMLHttpRequest to: ${url}`);
            return; // Ngăn không cho thực hiện yêu cầu
        }
        return originalXhrOpen.apply(this, arguments);
    };

    // Chặn các yêu cầu mạng với fetch trên trang web thuộc danh sách đen
    const originalFetch = window.fetch;
    window.fetch = function(input, init) {
        const url = typeof input === 'string' ? input : input.url;
        if (isBlacklistedSite(window.location.href) && isSuspiciousUrl(url)) {
            console.log(`Blocked fetch request to: ${url}`);
            return Promise.reject(new Error('Blocked suspicious URL'));
        }
        return originalFetch.apply(this, arguments);
    };

    // Chặn mọi thay đổi location.href hoặc location.assign trên trang web thuộc danh sách đen
    const originalLocationAssign = Location.prototype.assign;
    Location.prototype.assign = function(url) {
        if (isBlacklistedSite(window.location.href) && isSuspiciousUrl(url)) {
            console.log(`Blocked location.assign to: ${url}`);
            return; // Ngăn không cho chuyển hướng
        }
        return originalLocationAssign.call(this, url);
    };

    // Chặn mọi thay đổi location.replace trên trang web thuộc danh sách đen
    const originalLocationReplace = Location.prototype.replace;
    Location.prototype.replace = function(url) {
        if (isBlacklistedSite(window.location.href) && isSuspiciousUrl(url)) {
            console.log(`Blocked location.replace to: ${url}`);
            return; // Ngăn không cho chuyển hướng
        }
        return originalLocationReplace.call(this, url);
    };

    // Chặn mọi thay đổi location.href trên trang web thuộc danh sách đen
    Object.defineProperty(Location.prototype, 'href', {
        set: function(url) {
            if (isBlacklistedSite(window.location.href) && isSuspiciousUrl(url)) {
                console.log(`Blocked setting location.href to: ${url}`);
                return; // Ngăn không cho thay đổi href
            }
            return Object.getOwnPropertyDescriptor(Location.prototype, 'href').set.call(this, url);
        }
    });

    // Gỡ bỏ hoàn toàn hộp thoại xác nhận rời khỏi trang
    window.onbeforeunload = null;

})();
