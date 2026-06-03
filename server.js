const express = require('express');
const session = require('express-session');
const db = require('./db-sqlite');

const app = express();
const PORT = 3000;

app.use(express.json());

// Cau hinh thu muc public lam noi chua file tinh (HTML, CSS, JS)
app.use(express.static('public'));

// Cau hinh session
app.use(session({
    secret: 'bepviet_secret_key',
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 7 * 24 * 60 * 60 * 1000 }
}));

// ========== API CONG KHAI ==========
app.get('/api/danhmuc', async (req, res) => {
    const data = await db.getDanhMucs();
    res.json(data);
});

app.get('/api/monan', async (req, res) => {
    const { danhMucId, search } = req.query;
    const data = await db.getMonAns(danhMucId, search);
    res.json(data);
});

app.get('/api/chitiet/:id', async (req, res) => {
    const id = parseInt(req.params.id);
    const data = await db.getChiTietMonAn(id);
    res.json(data);
});

// ========== API DANG NHAP / DANG KY ==========
app.get('/api/current-user', (req, res) => {
    if (req.session.user) {
        res.json({ loggedIn: true, user: req.session.user });
    } else {
        res.json({ loggedIn: false });
    }
});

app.post('/api/register', async (req, res) => {
    const { username, password, fullname } = req.body;
    
    if (!username || !password) {
        return res.json({ success: false, error: 'Vui long nhap du thong tin' });
    }
    
    const existing = await db.getUserByUsername(username);
    if (existing) {
        return res.json({ success: false, error: 'Ten dang nhap da ton tai' });
    }
    
    await db.createUser({ username, password, fullname });
    res.json({ success: true, message: 'Dang ky thanh cong!' });
});

app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;
    
    const user = await db.getUserByUsername(username);
    if (!user || user.Password !== password) {
        return res.json({ success: false, error: 'Sai ten dang nhap hoac mat khau' });
    }
    
    req.session.user = {
        id: user.Id,
        username: user.Username,
        fullname: user.FullName,
        role: user.Role
    };
    
    res.json({ success: true, user: req.session.user });
});

app.post('/api/logout', (req, res) => {
    req.session.destroy();
    res.json({ success: true });
});

// ========== API YEU THICH (FAVORITES) ==========
app.get('/api/favorites', async (req, res) => {
    if (!req.session.user) return res.json([]);
    try {
        const data = await db.getFavorites(req.session.user.id);
        const favIds = data.map(item => item.Id);
        res.json(favIds);
    } catch (err) {
        res.status(500).json({ error: 'Loi lay danh sach yeu thich' });
    }
});

app.post('/api/favorites/add', async (req, res) => {
    if (!req.session.user) return res.json({ success: false, error: 'Vui long dang nhap' });
    const { monAnId } = req.body;
    try {
        await db.addFavorite(req.session.user.id, monAnId);
        res.json({ success: true });
    } catch (err) {
        res.json({ success: false, error: 'Loi khi them yeu thich' });
    }
});

app.post('/api/favorites/remove', async (req, res) => {
    if (!req.session.user) return res.json({ success: false, error: 'Vui long dang nhap' });
    const { monAnId } = req.body;
    try {
        await db.removeFavorite(req.session.user.id, monAnId);
        res.json({ success: true });
    } catch (err) {
        res.json({ success: false, error: 'Loi khi xoa yeu thich' });
    }
});

// ========== API QUAN LY (DANH CHO ADMIN) ==========
app.post('/api/admin/monan', async (req, res) => {
    if (!req.session.user || req.session.user.role !== 'admin') {
        return res.status(403).json({ success: false, error: 'Quyen truy cap bi tu choi!' });
    }
    
    const { TenMon, MoTa, HinhAnh, NguyenLieu, CachLam, DanhMucId } = req.body;
    if (!TenMon || !DanhMucId) {
        return res.json({ success: false, error: 'Vui long nhap ten mon va chon danh muc' });
    }

    try {
        const lastID = await db.addMonAn({ TenMon, MoTa, HinhAnh, NguyenLieu, CachLam, DanhMucId: parseInt(DanhMucId) });
        res.json({ success: true, id: lastID });
    } catch (err) {
        res.json({ success: false, error: 'Loi thao tac co so du lieu' });
    }
});

app.delete('/api/admin/monan/:id', async (req, res) => {
    if (!req.session.user || req.session.user.role !== 'admin') {
        return res.status(403).json({ success: false, error: 'Quyen truy cap bi tu choi!' });
    }
    
    const id = parseInt(req.params.id);
    try {
        await db.deleteMonAn(id);
        res.json({ success: true });
    } catch (err) {
        res.json({ success: false, error: 'Loi khi xoa mon an' });
    }
});
app.put('/api/admin/monan/:id', async (req, res) => {
    if (!req.session.user || req.session.user.role !== 'admin') {
        return res.status(403).json({ success: false, error: 'Quyen truy cap bi tu choi!' });
    }
    
    const id = parseInt(req.params.id);
    const { TenMon, MoTa, HinhAnh, NguyenLieu, CachLam, DanhMucId } = req.body;
    
    if (!TenMon || !DanhMucId) {
        return res.json({ success: false, error: 'Vui long nhap ten mon va chon danh muc' });
    }

    try {
        await db.updateMonAn({ Id: id, TenMon, MoTa, HinhAnh, NguyenLieu, CachLam, DanhMucId: parseInt(DanhMucId) });
        res.json({ success: true });
    } catch (err) {
        res.json({ success: false, error: 'Loi cap nhat co so du lieu' });
    }
});

// Trang chu - Tro vao file index.html trong thu muc public
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/public/index.html');
});

app.listen(PORT, () => {
    console.log(`Server dang chay tai: http://localhost:${PORT}`);
    console.log('Tai khoan mac dinh:');
    console.log('  Admin: admin / 123456');
    console.log('  User: user1 / 123456');
});
// Lấy danh sách bình luận của một món ăn
app.get('/api/binhluan/:monAnId', async (req, res) => {
    const monAnId = parseInt(req.params.monAnId);
    const data = await db.getBinhLuans(monAnId);
    res.json(data);
});

// Gửi bình luận mới
app.post('/api/binhluan', async (req, res) => {
    const { monAnId, noiDung } = req.body;
    if (!noiDung) return res.json({ success: false, error: 'Nội dung không được để trống' });
    
    // Lấy tên hiển thị, nếu chưa đăng nhập thì để là Khách ẩn danh
    const fullName = req.session.user ? (req.session.user.fullname || req.session.user.username) : 'Khách ẩn danh';
    
    try {
        await db.addBinhLuan({ monAnId: parseInt(monAnId), fullName, noiDung });
        res.json({ success: true });
    } catch (err) {
        res.json({ success: false, error: 'Lỗi lưu bình luận' });
    }
});