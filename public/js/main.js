let currentCategoryId = null;
let currentUser = null;

document.addEventListener('DOMContentLoaded', async () => {
    await checkLoginStatus();
    loadDanhMuc();
    loadMonAn();

    document.getElementById('search-input')?.addEventListener('keypress', function (e) {
        if (e.key === 'Enter') handleSearch();
    });
});

async function checkLoginStatus() {
    try {
        const data = await ApiService.getCurrentUser();
        if (data.loggedIn) {
            currentUser = data.user;
            document.getElementById('auth-buttons').style.display = 'none';
            document.getElementById('user-info').style.display = 'block';
            document.getElementById('userName').innerText = currentUser.fullname || currentUser.username;
            if (document.getElementById('fav-menu-item')) document.getElementById('fav-menu-item').style.display = 'flex';
            if (currentUser.role === 'admin') {
                const adminBtn = document.getElementById('admin-panel-btn');
                if (adminBtn) adminBtn.style.display = 'inline-block';
            }
        } else {
            currentUser = null;
            document.getElementById('auth-buttons').style.display = 'block';
            document.getElementById('user-info').style.display = 'none';
            if (document.getElementById('fav-menu-item')) document.getElementById('fav-menu-item').style.display = 'none';
            const adminBtn = document.getElementById('admin-panel-btn');
            if (adminBtn) adminBtn.style.display = 'none';
        }
    } catch(err) { console.error('Loi checkLoginStatus:', err); }
}

async function loadDanhMuc() {
    try {
        const data = await ApiService.getDanhMucs();
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
    } catch (err) { console.error('Loi load danh muc:', err); }
}

async function loadMonAn(danhMucId = null, keyword = '') {
    currentCategoryId = danhMucId;
    document.querySelectorAll('.category-item').forEach(item => item.classList.remove('active'));
    if (typeof event !== 'undefined' && event && event.target && typeof event.target.closest === 'function') {
        event.target.closest('.category-item')?.classList.add('active');
    }
    if (!danhMucId && (!event || !event.target.closest('#fav-menu-item'))) {
        document.querySelector('.category-item:first-child')?.classList.add('active');
    }
    try {
        const data = await ApiService.getMonAns(danhMucId, keyword);
        await renderFoodCards(data);
    } catch (err) { console.error('Loi load mon an:', err); }
}

async function renderFoodCards(data) {
    const container = document.getElementById('monan-list');
    if (data.length === 0) {
        container.innerHTML = `<div class="text-center py-5"><i class="fas fa-frown fa-3x" style="color: #ccc;"></i><p class="mt-3 text-muted">Không tìm thấy món ăn nào</p></div>`;
        return;
    }

    let favIds = [];
    if (currentUser) {
        try { favIds = await ApiService.getFavorites(); } catch (e) {}
    }

    container.innerHTML = data.map(item => {
        const isFav = favIds.includes(item.Id);
        const heartColor = isFav ? 'text-danger' : 'text-secondary';
        let ActionBtnHTML = '';
        
        if (currentUser && currentUser.role === 'admin') {
            ActionBtnHTML = `
                <div onclick="event.stopPropagation(); deleteMonAnByAdmin(${item.Id})" style="position: absolute; top: 10px; left: 10px; z-index: 10; background: #dc3545; color: white; border-radius: 50%; width: 35px; height: 35px; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 5px rgba(0,0,0,0.2); cursor: pointer;"><i class="fas fa-trash-alt"></i></div>
                <div onclick="event.stopPropagation(); openAdminModalForEdit(${item.Id})" style="position: absolute; top: 10px; right: 10px; z-index: 10; background: #ffc107; color: black; border-radius: 50%; width: 35px; height: 35px; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 5px rgba(0,0,0,0.2); cursor: pointer;"><i class="fas fa-edit"></i></div>
            `;
        } else {
            ActionBtnHTML = `
                <div class="fav-heart-btn" onclick="event.stopPropagation(); toggleFavorite(${item.Id}, ${isFav})" style="position: absolute; top: 10px; right: 10px; z-index: 10; background: white; border-radius: 50%; width: 35px; height: 35px; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 5px rgba(0,0,0,0.2); cursor: pointer;"><i class="fas fa-heart ${heartColor}" id="heart-${item.Id}"></i></div>
            `;
        }

        return `
            <div class="col-md-4 mb-4" style="display: inline-block; width: 33.333%; float: left; padding: 0 12px;">
                <div class="food-card" onclick="showDetail(${item.Id})" style="position: relative;">
                    ${ActionBtnHTML}
                    <div class="food-img">
                        <img src="${item.HinhAnh}" style="width: 100%; height: 100%; object-fit: cover;" onerror="this.parentElement.innerHTML='<i class=\\'fas fa-utensils\\' style=\\'font-size: 64px; color: white;\\'></i>'; this.parentElement.style.background='linear-gradient(135deg, #ff6b35, #f7931e)'">
                    </div>
                    <div class="food-body">
                        <div class="food-title">🍲 ${item.TenMon}</div>
                        <div class="food-desc">${item.MoTa ? (item.MoTa.length > 80 ? item.MoTa.substring(0, 80) + '...' : item.MoTa) : 'Món ăn hấp dẫn'}</div>
                        <button class="btn-detail" onclick="event.stopPropagation(); showDetail(${item.Id})"><i class="fas fa-eye"></i> Xem chi tiết</button>
                    </div>
                </div>
            </div>
        `;
    }).join('');
    container.style.display = 'block'; container.style.overflow = 'hidden';
}

function handleSearch() {
    const keyword = document.getElementById('search-input').value.trim();
    loadMonAn(currentCategoryId, keyword);
}

async function loadFavoriteFoods() {
    document.querySelectorAll('.category-item').forEach(item => item.classList.remove('active'));
    document.getElementById('fav-menu-item')?.classList.add('active');
    try {
        const favIds = await ApiService.getFavorites();
        const allMonAn = await (await fetch(`${API_URL}/monan`)).json();
        await renderFoodCards(allMonAn.filter(item => favIds.includes(item.Id)));
    } catch (err) { console.error('Loi tai mon yeu thich:', err); }
}

async function toggleFavorite(monAnId, isFav) {
    if (!currentUser) { alert('Vui lòng đăng nhập để sử dụng tính năng yêu thích!'); return; }
    const endpoint = isFav ? '/api/favorites/remove' : '/api/favorites/add';
    try {
        const result = await ApiService.toggleFavoriteEndpoint(endpoint, monAnId);
        if (result.success) {
            if (document.getElementById('fav-menu-item')?.classList.contains('active')) loadFavoriteFoods();
            else loadMonAn(currentCategoryId, document.getElementById('search-input').value.trim());
        }
    } catch (err) { console.error('Loi toggleFavorite:', err); }
}

async function showDetail(id) {
    const panel = new bootstrap.Offcanvas(document.getElementById('detailPanel'));
    const content = document.getElementById('detailContent');
    content.innerHTML = `<div class="text-center py-5"><i class="fas fa-spinner fa-spin fa-2x" style="color: #ff6b35;"></i><p class="mt-3">Đang tải chi tiết...</p></div>`;
    panel.show();
    try {
        const data = await ApiService.getChiTietMonAn(id);
        const comments = await ApiService.getBinhLuans(id);
        let commentListHTML = comments.map(c => `
            <div style="background: #f8f9fa; padding: 10px; border-radius: 8px; margin-bottom: 8px; font-size: 13px;">
                <strong>${c.FullName}</strong> <span style="font-size: 11px; color: #999; float: right;">${new Date(c.CreatedAt).toLocaleDateString('vi-VN')}</span>
                <p class="mb-0 mt-1 text-secondary">${c.NoiDung}</p>
            </div>
        `).join('');
        if (comments.length === 0) commentListHTML = '<p class="text-muted" style="font-size: 13px;">Chưa có bình luận nào.</p>';
        
        content.innerHTML = `
            <div class="detail-img"><img src="${data.HinhAnh}" style="width: 100%; height: 200px; object-fit: cover; border-radius: 10px;"></div>
            <div class="detail-title">🍲 ${data.TenMon}</div>
            <div class="detail-section"><h6>Mô tả</h6><p>${data.MoTa || 'Chưa có mô tả'}</p></div>
            <div class="detail-section"><h6>Nguyên liệu</h6><p>${data.NguyenLieu ? data.NguyenLieu.replace(/\n/g, '<br>') : 'Chưa có thông tin'}</p></div>
            <div class="detail-section"><h6>Cách làm</h6><p>${data.CachLam ? data.CachLam.replace(/\n/g, '<br>') : 'Chưa có thông tin'}</p></div>
            <div class="detail-section border-top pt-3 mt-4">
                <h6>Bình luận cộng đồng</h6>
                <div id="comment-box" style="max-height: 200px; overflow-y: auto; margin-bottom: 15px;">${commentListHTML}</div>
                <div class="input-group input-group-sm">
                    <input type="text" id="input-comment" class="form-control" placeholder="Chia sẻ cảm nghĩ về món ăn...">
                    <button class="btn btn-warning text-white" type="button" onclick="submitComment(${id})">Gửi</button>
                </div>
            </div>
        `;
    } catch (err) { content.innerHTML = `<div class="text-center py-5"><p class="text-danger">Có lỗi xảy ra khi tải chi tiết</p></div>`; }
}

async function submitComment(monAnId) {
    const noiDung = document.getElementById('input-comment').value.trim();
    if (!noiDung) { alert('Vui lòng nhập nội dung!'); return; }
    try {
        const result = await ApiService.postBinhLuan(monAnId, noiDung);
        if (result.success) showDetail(monAnId);
    } catch (err) { console.error(err); }
}

function showLoginModal() { document.getElementById('loginModal').style.display = 'flex'; }
function showRegisterModal() { document.getElementById('registerModal').style.display = 'flex'; }
function closeModal(id) { document.getElementById(id).style.display = 'none'; }