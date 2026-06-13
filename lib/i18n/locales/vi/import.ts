export const csvImport = {
  header: {
    title: 'Nhập CSV',
    desc: 'Nhập lịch sử giao dịch từ MetaTrader hoặc TopStep'
  },
  card: {
    title: 'Tải Lên Lịch Sử Giao Dịch',
    desc: 'Chọn một tài khoản giao dịch và tải lên tệp CSV hoặc Excel (.xlsx, .xls) của bạn.',
    labelSelectAccount: 'Chọn tài khoản giao dịch đích',
    createAccount: '+ Tạo tài khoản mới...',
    btnManageAccounts: 'Quản lý tài khoản'
  },
  form: {
    createAccountTitle: 'Tạo tài khoản giao dịch mới',
    accountNamePlaceholder: 'Tên tài khoản (VD: MT5 cá nhân)',
    startingBalancePlaceholder: 'Số dư ban đầu (VD: 2500)',
    btnCreate: 'Tạo tài khoản',
    btnCancel: 'Hủy'
  },
  dropzone: {
    dragActive: 'Thả tệp vào đây...',
    idle: 'Kéo và thả tệp của bạn vào đây, hoặc click để chọn tệp',
    supportText: 'Hỗ trợ CSV, XLSX, XLS',
    selectedFile: 'Tệp đã chọn:',
    importing: 'Đang nhập các lệnh giao dịch...',
    btnImport: 'Nhập các lệnh giao dịch ({count})',
    btnVerify: 'Xác minh & Nhập',
    btnClear: 'Xóa'
  },
  mapping: {
    title: 'Ánh xạ cột',
    desc: 'Ánh xạ tiêu đề cột trong tệp CSV của bạn với các trường giao dịch của SilentOp.',
    required: 'Bắt buộc',
    optional: 'Tùy chọn',
    ticket: 'Ticket / ID Đơn hàng',
    symbol: 'Symbol (Cặp tiền)',
    direction: 'Hướng lệnh (Buy/Sell)',
    lots: 'Khối lượng / Lots',
    openTime: 'Thời gian mở',
    closeTime: 'Thời gian đóng',
    openPrice: 'Giá mở',
    closePrice: 'Giá đóng',
    profit: 'Lợi nhuận / Lỗ',
    commission: 'Hoa hồng',
    swap: 'Phí qua đêm (Swap)',
    sl: 'Cắt lỗ (SL)',
    tp: 'Chốt lời (TP)',
    pips: 'Pips',
    duration: 'Thời lượng (Phút)',
    notes: 'Ghi chú / Nhận xét',
    selectField: 'Chọn cột CSV...'
  },
  feedback: {
    success: 'Đã nhập thành công {count} lệnh giao dịch!',
    successSub: 'Đi tới Lịch Giao Dịch hoặc Tổng quan để phân tích chúng!',
    error: 'Nhập lệnh thất bại. Vui lòng kiểm tra định dạng tệp.'
  }
}
