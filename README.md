# Ôn thi Vật lí 12 — Web Quiz Trắc nghiệm & Thi thử KTGKI

Hệ thống web quiz tĩnh ôn tập và thi thử trực tuyến môn **Vật lí 12** chuẩn cấu trúc mới của Bộ GD&ĐT (Kiểm tra giữa kì 1: Sự chuyển thể, Nội năng, Nhiệt độ, Khí lí tưởng).

Giao diện áp dụng phong cách thiết kế **"Sketch"** (Working sheet vẽ tay, giấy phác thảo warm paper, bút chì than, mực bút bi xanh và highlight vàng rực rỡ).

## Tính năng chính

- **Chế độ Luyện tập:**
  - Tùy chọn 10 hoặc 20 câu hỏi ngẫu nhiên từ ngân hàng 149 câu (bốc ngẫu nhiên bằng thuật toán Fisher-Yates).
  - Phân loại theo 3 dạng thức: Trắc nghiệm 4 lựa chọn (MCQ), Trắc nghiệm Đúng/Sai (TF - 4 ý), Trả lời ngắn (Short).
  - Phản hồi đúng/sai tức thì với biểu tượng và giải thích rõ ràng, hỗ trợ làm lại riêng các câu làm sai.
- **Chế độ Thi thử (Exam Mode):**
  - Cấu trúc đề chuẩn 28 câu (40 lệnh hỏi) trong 50 phút theo đúng ma trận KTGKI:
    - **Phần I:** 18 câu MCQ (4.5 điểm)
    - **Phần II:** 4 câu Đúng/Sai (4.0 điểm, tính điểm theo thang 1 ý: 0.1đ, 2 ý: 0.25đ, 3 ý: 0.5đ, 4 ý: 1.0đ)
    - **Phần III:** 6 câu Trả lời ngắn (1.5 điểm)
  - Đồng hồ đếm ngược thông minh tính theo timestamp (không lệch khi tab ngủ), cảnh báo khẩn cấp khi còn dưới 5 phút, tự động nộp bài khi hết giờ.
  - Bảng điều hướng 28 câu nhảy câu tự do, có tính năng đánh dấu cờ xem lại (⚑).
  - Đổi câu trả lời tự do, cho phép bỏ chọn phương án trước khi nộp.
  - Bảng tổng kết điểm chi tiết từng phần, bộ lọc xem lại câu sai/bỏ trống.
- **Hiển thị công thức Toán học KaTeX:**
  - Tự động parse và hiển thị chuẩn các công thức LaTeX, phân số, ký hiệu nhiệt học ($^\circ\text{C}$, $\text{kJ/(kg}\cdot\text{K)}$, $\Delta U = Q$).

## Cài đặt và Chạy cục bộ

```bash
# 1. Cài đặt dependencies
npm install

# 2. Khởi chạy môi trường phát triển (Dev)
npm run dev

# 3. Chạy kiểm thử tự động (Vitest)
npm run test

# 4. Đóng gói cho Production
npm run build

# 5. Xem trước bản build Production
npm run preview
```

## Công nghệ sử dụng

- **Frontend:** React 18, TypeScript, Vite 5, React Router v6.
- **Công thức:** KaTeX (Self-hosted qua npm).
- **Typography:** Patrick Hand & Permanent Marker (Self-hosted qua `@fontsource`).
- **Styling:** Vanilla CSS với hệ thống tokens `--dp-*` phong cách Sketch.
- **Kiểm thử:** Vitest.
- **Deploy:** Tương thích chuẩn Vercel (SPA rewrites & Cache-Control headers).
