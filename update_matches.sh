#!/bin/bash

# Đường dẫn tới file UserScript
USERSCRIPT_FILE="anti-popup.user.js"

# Đường dẫn tới file chứa danh sách tên miền (blacklist)
BLACKLIST_FILE="black.txt"

# Sao lưu file UserScript trước khi chỉnh sửa
cp "$USERSCRIPT_FILE" "${USERSCRIPT_FILE}.bak"

# Xoá tất cả các dòng bắt đầu với // @match để chuẩn bị cập nhật lại
sed -i '/\/\/ @match/d' "$USERSCRIPT_FILE"

# Thêm lại phần đầu của file, nơi chứa các thông tin meta @match
sed -i '/^\/\/ ==UserScript==/a\\' "$USERSCRIPT_FILE"

# Đọc từng dòng trong file black.txt và thêm nó vào dưới dạng @match
while IFS= read -r domain
do
    if [[ -n "$domain" ]]; then
        echo "// @match        *://$domain/*" >> "$USERSCRIPT_FILE"
    fi
done < "$BLACKLIST_FILE"

# Thông báo hoàn tất
echo "Updated @match lines in $USERSCRIPT_FILE based on $BLACKLIST_FILE"
