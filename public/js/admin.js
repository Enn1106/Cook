function openAdminModalForAdd() {
    document.getElementById('adminModalTitle').innerText = 'Thêm Món Ăn Mới';
    document.getElementById('adminMonAnId').value = ''; 
    document.getElementById('adminTenMon').value = '';
    document.getElementById('adminMoTa').value = '';
    document.getElementById('adminHinhAnh').value = '';
    document.getElementById('adminDanhMuc').value = '1';
    document.getElementById('adminNguyenLieu').value = '';
    document.getElementById('adminCachLam').value = '';
    document.getElementById('adminModal').style.display = 'flex';
}

async function openAdminModalForEdit(id) {
    document.getElementById('adminModalTitle').innerText = 'Chỉnh Sửa Món Ăn';
    document.getElementById('adminMonAnId').value = id; 
    try {
        const data = await ApiService.getChiTietMonAn(id);
        document.getElementById('adminTenMon').value = data.TenMon || '';
        document.getElementById('adminMoTa').value = data.MoTa || '';
        document.getElementById('adminHinhAnh').value = data.HinhAnh || '';
        document.getElementById('adminDanhMuc').value = data.DanhMucId || '1';
        document.getElementById('adminNguyenLieu').value = data.NguyenLieu || '';
        document.getElementById('adminCachLam').value = data.CachLam || '';
        document.getElementById('adminModal').style.display = 'flex';
    } catch (err) { alert('Không thể tải dữ liệu món ăn để chỉnh sửa'); }
}

async function saveMonAn() {
    const id = document.getElementById('adminMonAnId').value;
    const TenMon = document.getElementById('adminTenMon').value.trim();
    const MoTa = document.getElementById('adminMoTa').value.trim();
    const HinhAnh = document.getElementById('adminHinhAnh').value.trim() || 'images/default.jpg';
    const DanhMucId = document.getElementById('adminDanhMuc').value;
    const NguyenLieu = document.getElementById('adminNguyenLieu').value;
    const CachLam = document.getElementById('adminCachLam').value;

    if (!TenMon) {
        alert('Tên món ăn không được để trống!');
        return;
    }

    const payload = { TenMon, MoTa, HinhAnh, NguyenLieu, CachLam, DanhMucId };
    const url = id ? `/api/admin/monan/${id}` : '/api/admin/monan';
    const method = id ? 'PUT' : 'POST';

    try {
        const res = await fetch(url, {
            method: method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        const result = await res.json();
        if (result.success) {
            alert(id ? 'Cập nhật món ăn thành công!' : 'Thêm món ăn mới thành công!');
            closeModal('adminModal');
            loadMonAn(currentCategoryId);
        } else { alert('Lỗi: ' + result.error); }
    } catch (e) { alert('Lỗi kết nối hệ thống server'); }
}

async function deleteMonAnByAdmin(id) {
    if (!confirm('Bạn có chắc chắn muốn xóa vĩnh viễn món ăn này khỏi cơ sở dữ liệu?')) return;
    try {
        const res = await fetch(`/api/admin/monan/${id}`, { method: 'DELETE' });
        const result = await res.json();
        if (result.success) {
            alert('Đã xóa món ăn thành công!');
            loadMonAn(currentCategoryId);
        } else { alert('Xóa thất bại: ' + result.error); }
    } catch (e) { alert('Lỗi kết nối hệ thống server'); }
}