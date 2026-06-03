const API_URL = 'http://localhost:3000/api';
let currentCategoryId = null;
let currentUser = null;

// ========== HOAT DONG KHI TRANG SAN SANG ==========
document.addEventListener('DOMContentLoaded', async () => {
    await checkLoginStatus();
    loadDanhMuc();
    loadMonAn();

    // Thêm su kien gõ Enter cho thanh tim kiem
    document.getElementById('search-input')?.addEventListener('keypress', function (e) {
        if (e.key === 'Enter') {
            handleSearch();
        }
    });
});

// ========== KIEM TRA TRANG THAI DANG NHAP ==========
async function checkLoginStatus() {
    try {
        const res = await fetch('/api/current-user');
        const data = await res.json();
        if (data.loggedIn) {
            currentUser = data.user;
            document.getElementById('auth-buttons').style.display = 'none';
            document.getElementById('user-info').style.display = 'block';
            document.getElementById('userName').innerText = currentUser.fullname || currentUser.username;
            
            // Hien thi nut mon yeu thich o sidebar cho User
            if (document.getElementById('fav-menu-item')) {
                document.getElementById('fav-menu-item').style.display = 'flex';
            }

            // Hien thi nut quan ly neu quyen la admin
            if (currentUser.role === 'admin') {
                const adminBtn = document.getElementById('admin-panel-btn');
                if (adminBtn) adminBtn.style.display = 'inline-block';
            }
        } else {
            currentUser = null;
            document.getElementById('auth-buttons').style.display = 'block';
            document.getElementById('user-info').style.display = 'none';
            
            if (document.getElementById('fav-menu-item')) {
                document.getElementById('fav-menu-item').style.display = 'none';
            }
            
            const adminBtn = document.getElementById('admin-panel-btn');
            if (adminBtn) adminBtn.style.display = 'none';
        }
    } catch(err) { 
        console.error('Loi checkLoginStatus:', err); 
    }
}

// ========== LOAD DANH MUC ==========
async function loadDanhMuc() {
    try {
        const res = await fetch(`${API_URL}/danhmuc`);
        const data = await res.json();
        const container = document.getElementById('category-list');
        
        container.innerHTML = `
            <div class="category-item ${currentCategoryId === null ? 'active' : ''}" onclick="loadMonAn()">
                <i class="fas fa-home"></i>
                <span>Tất cả món ăn</span>
            </div>
            <div class="category-item text-danger" id="fav-menu-item" style="display: ${currentUser ? 'flex' : 'none'};" onclick="loadFavoriteFoods()">
                <i class="fas fa-heart"></i>
                <span>Món yêu thích</span>
            </div>
        `;
        
        data.forEach(item => {
            container.innerHTML += `
                <div class="category-item ${currentCategoryId === item.Id ? 'active' : ''}" onclick="loadMonAn(${item.Id})">
                    <i class="fas fa-tag"></i>
                    <span>${item.TenDanhMuc}</span>
                </div>
            `;
        });
    } catch (err) {
        console.error('Loi load danh muc:', err);
        document.getElementById('category-list').innerHTML = '<div class="text-danger text-center">Không thể tải danh mục</div>';
    }
}

// ========== LOAD MON AN NANG CAP (CO TIM KIEM) ==========
async function loadMonAn(danhMucId = null, keyword = '') {
    currentCategoryId = danhMucId;
    
    // Cap nhat lop active giao dien
    document.querySelectorAll('.category-item').forEach(item => {
        item.classList.remove('active');
    });

    if (typeof event !== 'undefined' && event && event.target && typeof event.target.closest === 'function') {
        event.target.closest('.category-item')?.classList.add('active');
    }
    
    if (!danhMucId && (!event || !event.target.closest('#fav-menu-item'))) {
        document.querySelector('.category-item:first-child')?.classList.add('active');
    }
    
    try {
        let url = `${API_URL}/monan?`;
        if (danhMucId) url += `danhMucId=${danhMucId}&`;
        if (keyword) url += `search=${encodeURIComponent(keyword)}`;
        
        const res = await fetch(url);
        const data = await res.json();
        
        await renderFoodCards(data);
        
    } catch (err) {
        console.error('Loi load mon an:', err);
        document.getElementById('monan-list').innerHTML = '<div class="text-center text-danger">Có lỗi xảy ra</div>';
    }
}

// ========== VE CARD MON AN PHAN QUYEN (ADMIN HIEN NUT SUA/XOA) ==========
async function renderFoodCards(data) {
    const container = document.getElementById('monan-list');
    
    if (data.length === 0) {
        container.innerHTML = `
            <div class="text-center py-5">
                <i class="fas fa-frown fa-3x" style="color: #ccc;"></i>
                <p class="mt-3 text-muted">Không tìm thấy món ăn nào</p>
            </div>
        `;
        return;
    }

    let favIds = [];
    if (currentUser) {
        try {
            const resFav = await fetch('/api/favorites');
            favIds = await resFav.json();
        } catch (e) {
            console.error('Loi lay danh sach favorites:', e);
        }
    }

    container.innerHTML = data.map(item => {
        const isFav = favIds.includes(item.Id);
        const heartColor = isFav ? 'text-danger' : 'text-secondary';
        
        let ActionBtnHTML = '';
        
        // Thuc hien doi nut bam dua tren quyen han tai khoan
        if (currentUser && currentUser.role === 'admin') {
            // Neu la Admin: Xoa nut trai tim, thay the bang nut Sua o goc phai va nut Xoa o goc trai
            ActionBtnHTML = `
                <div onclick="event.stopPropagation(); deleteMonAnByAdmin(${item.Id})" 
                     style="position: absolute; top: 10px; left: 10px; z-index: 10; background: #dc3545; color: white; border-radius: 50%; width: 35px; height: 35px; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 5px rgba(0,0,0,0.2); cursor: pointer;" title="Xóa món ăn">
                     <i class="fas fa-trash-alt"></i>
                </div>
                <div onclick="event.stopPropagation(); openAdminModalForEdit(${item.Id})" 
                     style="position: absolute; top: 10px; right: 10px; z-index: 10; background: #ffc107; color: black; border-radius: 50%; width: 35px; height: 35px; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 5px rgba(0,0,0,0.2); cursor: pointer;" title="Sửa món ăn">
                     <i class="fas fa-edit"></i>
                </div>
            `;
        } else {
            // Neu la User hoac Khach: Hien thi icon hinh trai tim yeu thich nhu cu
            ActionBtnHTML = `
                <div class="fav-heart-btn" onclick="event.stopPropagation(); toggleFavorite(${item.Id}, ${isFav})" 
                     style="position: absolute; top: 10px; right: 10px; z-index: 10; background: white; border-radius: 50%; width: 35px; height: 35px; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 5px rgba(0,0,0,0.2); cursor: pointer;">
                     <i class="fas fa-heart ${heartColor}" id="heart-${item.Id}"></i>
                </div>
            `;
        }

        return `
            <div class="col-md-4 mb-4" style="display: inline-block; width: 33.333%; float: left; padding: 0 12px;">
                <div class="food-card" onclick="showDetail(${item.Id})" style="position: relative;">
                    
                    ${ActionBtnHTML}

                    <div class="food-img">
                        <img src="${item.HinhAnh}" 
                             style="width: 100%; height: 100%; object-fit: cover;"
                             onerror="this.parentElement.innerHTML='<i class=\\'fas fa-utensils\\' style=\\'font-size: 64px; color: white;\\'></i>'; this.parentElement.style.background='linear-gradient(135deg, #ff6b35, #f7931e)'">
                    </div>
                    <div class="food-body">
                        <div class="food-title">🍲 ${item.TenMon}</div>
                        <div class="food-desc">${item.MoTa ? (item.MoTa.length > 80 ? item.MoTa.substring(0, 80) + '...' : item.MoTa) : 'Món ăn hấp dẫn'}</div>
                        <button class="btn-detail" onclick="event.stopPropagation(); showDetail(${item.Id})">
                            <i class="fas fa-eye"></i> Xem chi tiết
                        </button>
                    </div>
                </div>
            </div>
        `;
    }).join('');
    
    container.style.display = 'block';
    container.style.overflow = 'hidden';
}

// ========== XU LY TIM KIEM ==========
function handleSearch() {
    const keyword = document.getElementById('search-input').value.trim();
    loadMonAn(currentCategoryId, keyword);
}

// ========== LOAD MON AN YEU THICH ==========
async function loadFavoriteFoods() {
    document.querySelectorAll('.category-item').forEach(item => item.classList.remove('active'));
    document.getElementById('fav-menu-item')?.classList.add('active');
    
    try {
        const resFav = await fetch('/api/favorites');
        const favIds = await resFav.json();
        
        const resAll = await fetch(`${API_URL}/monan`);
        const allMonAn = await resAll.json();
        
        const favFoods = allMonAn.filter(item => favIds.includes(item.Id));
        await renderFoodCards(favFoods);
    } catch (err) {
        console.error('Loi tai mon yeu thich:', err);
    }
}

// ========== XU LY BOM / GO BO YEU THICH (SQLITE) ==========
async function toggleFavorite(monAnId, isFav) {
    if (!currentUser) {
        alert('Vui lòng đăng nhập để sử dụng tính năng yêu thích!');
        return;
    }
    
    const endpoint = isFav ? '/api/favorites/remove' : '/api/favorites/add';
    try {
        const res = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ monAnId })
        });
        
        const result = await res.json();
        if (result.success) {
            const isFavPage = document.getElementById('fav-menu-item')?.classList.contains('active');
            if (isFavPage) {
                loadFavoriteFoods();
            } else {
                loadMonAn(currentCategoryId, document.getElementById('search-input').value.trim());
            }
        }
    } catch (err) {
        console.error('Loi toggleFavorite:', err);
    }
}

// ========== HIEN THI CHI TIET MON AN & BINH LUAN ==========
async function showDetail(id) {
    const panel = new bootstrap.Offcanvas(document.getElementById('detailPanel'));
    const content = document.getElementById('detailContent');
    
    content.innerHTML = `
        <div class="text-center py-5">
            <i class="fas fa-spinner fa-spin fa-2x" style="color: #ff6b35;"></i>
            <p class="mt-3">Đang tải chi tiết...</p>
        </div>
    `;
    panel.show();
    
    try {
        const res = await fetch(`${API_URL}/chitiet/${id}`);
        const data = await res.json();
        
        const resComment = await fetch(`/api/binhluan/${id}`);
        const comments = await resComment.json();

        let commentListHTML = comments.map(c => `
            <div style="background: #f8f9fa; padding: 10px; border-radius: 8px; margin-bottom: 8px; font-size: 13px;">
                <strong style="color: #ff6b35;">${c.FullName}</strong> 
                <span style="font-size: 11px; color: #999; float: right;">${new Date(c.CreatedAt).toLocaleDateString('vi-VN')}</span>
                <p class="mb-0 mt-1 text-secondary">${c.NoiDung}</p>
            </div>
        `).join('');

        if (comments.length === 0) {
            commentListHTML = '<p class="text-muted" style="font-size: 13px;">Chưa có bình luận nào. Hãy là người đóng góp đầu tiên!</p>';
        }
        
        content.innerHTML = `
            <div class="detail-img">
                <img src="${data.HinhAnh}" 
                     style="width: 100%; height: 200px; object-fit: cover; border-radius: 10px;"
                     onerror="this.style.display='none'; this.parentElement.innerHTML='<i class=\\'fas fa-utensil-spoon\\' style=\'font-size: 64px; color: #ff6b35;\\'></i>'; this.parentElement.style.background='linear-gradient(135deg, #ffecd2, #fcb69f)'">
            </div>
            <div class="detail-title">🍲 ${data.TenMon}</div>
            <div class="detail-section">
                <h6><i class="fas fa-align-left"></i> Mô tả</h6>
                <p>${data.MoTa || 'Chưa có mô tả'}</p>
            </div>
            
            <div class="detail-section">
                <h6><i class="fas fa-shopping-basket"></i> Nguyên liệu</h6>
                <p>${data.NguyenLieu ? data.NguyenLieu.replace(/\n/g, '<br>') : 'Chưa có thông tin'}</p>
            </div>
            
            <div class="detail-section">
                <h6><i class="fas fa-blender"></i> Cách làm</h6>
                <p>${data.CachLam ? data.CachLam.replace(/\n/g, '<br>') : 'Chưa có thông tin'}</p>
            </div>

            <div class="detail-section border-top pt-3 mt-4">
                <h6><i class="fas fa-comments"></i> Bình luận cộng đồng</h6>
                <div id="comment-box" style="max-height: 200px; overflow-y: auto; margin-bottom: 15px; padding-right: 5px;">
                    ${commentListHTML}
                </div>
                
                <div class="input-group input-group-sm">
                    <input type="text" id="input-comment" class="form-control" placeholder="Chia sẻ cảm nghĩ về món ăn...">
                    <button class="btn btn-warning text-white" type="button" onclick="submitComment(${id})">Gửi</button>
                </div>
            </div>
        `;
    } catch (err) {
        content.innerHTML = `
            <div class="text-center py-5">
                <i class="fas fa-exclamation-triangle fa-2x" style="color: #dc3545;"></i>
                <p class="mt-3 text-danger">Có lỗi xảy ra khi tải chi tiết</p>
            </div>
        `;
    }
}

// ========== THEM BINH LUAN MOI ==========
async function submitComment(monAnId) {
    const noiDung = document.getElementById('input-comment').value.trim();
    if (!noiDung) {
        alert('Vui lòng nhập nội dung trước khi gửi!');
        return;
    }
    
    try {
        const res = await fetch('/api/binhluan', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ monAnId, noiDung })
        });
        
        const result = await res.json();
        if (result.success) {
            showDetail(monAnId);
        } else {
            alert('Lỗi: ' + result.error);
        }
    } catch (err) {
        console.error('Loi khi comment:', err);
    }
}

// ========== HE THONG MODAL CUNG ==========
function showLoginModal() { document.getElementById('loginModal').style.display = 'flex'; }
function showRegisterModal() { document.getElementById('registerModal').style.display = 'flex'; }
function closeModal(id) { document.getElementById(id).style.display = 'none'; }

// ========== HIEU CHINH PANEL CUA ADMIN (MODAL DA NANG) ==========
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
        const res = await fetch(`${API_URL}/chitiet/${id}`);
        const data = await res.json();
        
        document.getElementById('adminTenMon').value = data.TenMon || '';
        document.getElementById('adminMoTa').value = data.MoTa || '';
        document.getElementById('adminHinhAnh').value = data.HinhAnh || '';
        document.getElementById('adminDanhMuc').value = data.DanhMucId || '1';
        document.getElementById('adminNguyenLieu').value = data.NguyenLieu || '';
        document.getElementById('adminCachLam').value = data.CachLam || '';
        
        document.getElementById('adminModal').style.display = 'flex';
    } catch (err) {
        alert('Không thể tải dữ liệu món ăn để chỉnh sửa');
    }
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
        } else {
            alert('Lỗi: ' + result.error);
        }
    } catch (e) {
        alert('Lỗi kết nối hệ thống server');
    }
}

async function deleteMonAnByAdmin(id) {
    if (!confirm('Bạn có chắc chắn muốn xóa vĩnh viễn món ăn này khỏi cơ sở dữ liệu?')) return;
    
    try {
        const res = await fetch(`/api/admin/monan/${id}`, { method: 'DELETE' });
        const result = await res.json();
        if (result.success) {
            alert('Đã xóa món ăn thành công!');
            loadMonAn(currentCategoryId);
        } else {
            alert('Xóa thất bại: ' + result.error);
        }
    } catch (e) {
        alert('Lỗi kết nối hệ thống server');
    }
}

// ========== DANG NHAP ==========
async function login() {
    const username = document.getElementById('loginUsername').value;
    const password = document.getElementById('loginPassword').value;
    
    if (!username || !password) {
        alert('Vui lòng nhập tên đăng nhập và mật khẩu');
        return;
    }
    
    try {
        const res = await fetch('/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        const data = await res.json();
        
        if (data.success) {
            alert('Đăng nhập thành công!');
            closeModal('loginModal');
            location.reload();
        } else {
            alert(data.error);
        }
    } catch(err) {
        alert('Lỗi kết nối');
    }
}

// ========== DANG KY ==========
async function register() {
    const username = document.getElementById('regUsername').value;
    const password = document.getElementById('regPassword').value;
    const confirmpassword = document.getElementById('regConfirmPassword').value;
    const fullname = document.getElementById('regFullname').value;
    
    if (!username || !password || !confirmpassword) {
        alert('Vui lòng nhập tên đăng nhập và mật khẩu');
        return;
    }
    if (password.length < 4) {
        alert('Đặt mật khẩu dài lên ít nhất 4 kí tự');
        return;
    }
    try {
        const res = await fetch('/api/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password, fullname })
        });
        const data = await res.json();
        
        if (data.success) {
            alert('Đăng ký thành công! Hãy đăng nhập.');
            closeModal('registerModal');
        } else {
            alert(data.error);
        }
    } catch(err) {
        alert('Lỗi kết nối');
    }
}

// ========== DANG XUAT ==========
async function logout() {
    await fetch('/api/logout', { method: 'POST' });
    alert('Đã đăng xuất');
    location.reload();
}