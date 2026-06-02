const express = require('express');
const session = require('express-session');
const db = require('./db-sqlite');

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(express.static('.'));

// Cấu hình session
app.use(session({
    secret: 'bepviet_secret_key',
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 7 * 24 * 60 * 60 * 1000 }
}));

// ========== API CÔNG KHAI ==========
app.get('/api/danhmuc', async (req, res) => {
    const data = await db.getDanhMucs();
    res.json(data);
});

app.get('/api/monan', async (req, res) => {
    const { danhMucId } = req.query;
    const data = await db.getMonAns(danhMucId);
    res.json(data);
});

app.get('/api/chitiet/:id', async (req, res) => {
    const id = parseInt(req.params.id);
    const data = await db.getChiTietMonAn(id);
    res.json(data);
});

// ========== API ĐĂNG NHẬP / ĐĂNG KÝ ==========
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
        return res.json({ success: false, error: 'Vui lòng nhập đủ thông tin' });
    }
    
    const existing = await db.getUserByUsername(username);
    if (existing) {
        return res.json({ success: false, error: 'Tên đăng nhập đã tồn tại' });
    }
    
    await db.createUser({ username, password, fullname });
    res.json({ success: true, message: 'Đăng ký thành công!' });
});

app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;
    
    const user = await db.getUserByUsername(username);
    if (!user || user.Password !== password) {
        return res.json({ success: false, error: 'Sai tên đăng nhập hoặc mật khẩu' });
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

// Trang chủ
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

app.listen(PORT, () => {
    console.log(`🚀 Server: http://localhost:${PORT}`);
    console.log('📝 Tài khoản mặc định:');
    console.log('   Admin: admin / 123456');
    console.log('   User: user1 / 123456');
});