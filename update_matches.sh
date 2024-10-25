#!/bin/bash

# Đường dẫn tới file UserScript
USERSCRIPT_FILE="anti-popup.user.js"

# Đường dẫn tới file chứa danh sách tên miền (blacklist)
BLACKLIST_FILE="black.txt"

# Sao lưu file UserScript trước khi chỉnh sửa
cp "$USERSCRIPT_FILE" "${USERSCRIPT_FILE}.bak"

# Xoá tất cả các dòng bắt đầu với // @match để chuẩn bị cập nhật lại
sed -i '/\/\/ @match/d' "$USERSCRIPT_FILE"

# Đọc toàn bộ nội dung của file Userscript
script_content=$(<"$USERSCRIPT_FILE")

# Tìm vị trí ngay sau dòng // ==UserScript==
insert_position=$(grep -n "^// ==UserScript==" "$USERSCRIPT_FILE" | cut -d: -f1)
insert_position=$((insert_position + 1))  # Thêm 1 để chèn sau dòng này

# Tạo phần nội dung chứa các dòng @match từ black.txt
match_lines=""
while IFS= read -r domain
do
    if [[ -n "$domain" ]]; then
        match_lines="$match_lines// @match        *://$domain/*"$'\n'
    fi
done < "$BLACKLIST_FILE"

# Chèn các dòng @match vào ngay sau // ==UserScript==
sed -i "${insert_position}i\\
$match_lines" "$USERSCRIPT_FILE"

# Thông báo hoàn tất
echo "Updated @match lines in $USERSCRIPT_FILE based on $BLACKLIST_FILE"
