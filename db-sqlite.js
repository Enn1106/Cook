const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Duong dan file database
const dbPath = path.join(__dirname, 'bepviet.db');
const db = new sqlite3.Database(dbPath);

// Tao bang va du lieu mau
db.serialize(() => {
    // 1. Tao bang DanhMuc
    db.run(`CREATE TABLE IF NOT EXISTS DanhMuc (
        Id INTEGER PRIMARY KEY AUTOINCREMENT,
        TenDanhMuc TEXT NOT NULL
    )`);
    
    // 2. Tao bang MonAn
    db.run(`CREATE TABLE IF NOT EXISTS MonAn (
        Id INTEGER PRIMARY KEY AUTOINCREMENT,
        TenMon TEXT NOT NULL,
        MoTa TEXT,
        HinhAnh TEXT,
        NguyenLieu TEXT,
        CachLam TEXT,
        DanhMucId INTEGER
    )`);

    // 3. Tao bang Users
    db.run(`CREATE TABLE IF NOT EXISTS Users (
        Id INTEGER PRIMARY KEY AUTOINCREMENT,
        Username TEXT UNIQUE NOT NULL,
        Password TEXT NOT NULL,
        Email TEXT,
        FullName TEXT,
        Role TEXT DEFAULT 'user',
        CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        Status TEXT DEFAULT 'active'
    )`);

    // 4. Tao bang Favorites (yeu thich)
    db.run(`CREATE TABLE IF NOT EXISTS Favorites (
        Id INTEGER PRIMARY KEY AUTOINCREMENT,
        UserId INTEGER,
        MonAnId INTEGER,
        CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(UserId, MonAnId)
    )`);

    // 5. Tao bang BinhLuan
    db.run(`CREATE TABLE IF NOT EXISTS BinhLuan (
        Id INTEGER PRIMARY KEY AUTOINCREMENT,
        MonAnId INTEGER,
        FullName TEXT,
        NoiDung TEXT,
        CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // 6. Khoi tao tai khoan Admin mac dinh (Dat doc lap de luon luon kiem tra)
    db.get("SELECT COUNT(*) as count FROM Users WHERE Username = 'admin'", (err, row) => {
        if (!err && row.count === 0) {
            db.run(`INSERT INTO Users (Username, Password, FullName, Role) VALUES (?, ?, ?, ?)`,
                ['admin', '123456', 'Quản Trị Viên', 'admin'],
                (err) => {
                    if (!err) console.log('Da tu dong khoi tao tai khoan Admin vao DB!');
                }
            );
        }
    });

    // 7. Them du lieu mon an mau neu danh muc trong rong
    db.get("SELECT COUNT(*) as count FROM DanhMuc", (err, row) => {
        if (err) {
            console.error('Loi kiem tra DanhMuc:', err);
            return;
        }
        
        if (row.count === 0) {
            console.log('Dang them du lieu mau vao database...');
            
            db.run("INSERT INTO DanhMuc (TenDanhMuc) VALUES ('Món kho')");
            db.run("INSERT INTO DanhMuc (TenDanhMuc) VALUES ('Món canh')");
            db.run("INSERT INTO DanhMuc (TenDanhMuc) VALUES ('Món xào')");
            db.run("INSERT INTO DanhMuc (TenDanhMuc) VALUES ('Món luộc')");
            db.run("INSERT INTO DanhMuc (TenDanhMuc) VALUES ('Món chiên')");
            
            db.run(`INSERT INTO MonAn (TenMon, MoTa, NguyenLieu, CachLam, HinhAnh, DanhMucId) VALUES (?, ?, ?, ?, ?, ?)`,
                'Thịt kho tàu',
                'Thịt kho mềm, thơm đậm đà, ăn kèm cơm rất ngon',
                'Thịt ba chỉ 500g, Trứng vịt 4 quả, Nước dừa 500ml, Hành tím, Tỏi, Nước mắm, Đường, Tiêu',
                'Bước 1: Cắt thịt miếng vừa ăn\nBước 2: Ướp thịt với hành tỏi, nước mắm, đường, tiêu 30 phút\nBước 3: Cho thịt vào nồi, đổ nước dừa\nBước 4: Kho lửa nhỏ đến khi thịt mềm\nBước 5: Thêm trứng luộc vào kho cùng\nBước 6: Kho đến khi nước sệt lại',
                'images/thit-kho.jpg',  
                1
            );

            db.run(`INSERT INTO MonAn (TenMon, MoTa, NguyenLieu, CachLam, HinhAnh, DanhMucId) VALUES (?, ?, ?, ?, ?, ?)`,
                'Canh chua cá lóc',
                'Canh chua đậm đà vị me, cá ngọt thơm',
                'Cá lóc 500g, Me 50g, Cà chua 2 quả, Đậu bắp 5 trái, Giá đỗ 100g, Rau thơm',
                'Bước 1: Cá lóc làm sạch, cắt khúc\nBước 2: Me ngâm nước ấm, lọc lấy nước cốt\nBước 3: Xào cà chua với hành tím\nBước 4: Đổ nước vào nồi, cho nước me\nBước 5: Cho cá vào nấu chín\nBước 6: Thêm đậu bắp, giá đỗ\nBước 7: Nêm gia vị',
                'images/canh-chua.jpg',  
                2
            );

            db.run(`INSERT INTO MonAn (TenMon, MoTa, NguyenLieu, CachLam, HinhAnh, DanhMucId) VALUES (?, ?, ?, ?, ?, ?)`,
                'Rau muống xào tỏi',
                'Rau muống giòn ngon, thanh mát',
                'Rau muống 1 bó, Tỏi 5 tép, Dầu ăn, Muối, Hạt nêm, Nước mắm',
                'Bước 1: Rau muống nhặt, rửa sạch, cắt khúc\nBước 2: Tỏi băm nhỏ\nBước 3: Phi thơm tỏi với dầu\nBước 4: Cho rau vào xào lửa lớn\nBước 5: Nêm gia vị\nBước 6: Xào chín tới',
                'images/rau-muong.jpg',  
                3
            );
            console.log('Da them du lieu mau thanh cong!');
        } else {
            console.log('Database da co san du lieu mon an!');
        }
    });
});

// ========== CAC HAM TRUY VAN DU LIEU ==========

function getDanhMucs() {
    return new Promise((resolve, reject) => {
        db.all('SELECT Id, TenDanhMuc FROM DanhMuc', (err, rows) => {
            if (err) reject(err);
            else resolve(rows);
        });
    });
}

function getUserByUsername(username) {
    return new Promise((resolve, reject) => {
        db.get('SELECT * FROM Users WHERE Username = ?', [username], (err, row) => {
            if (err) reject(err);
            else resolve(row);
        });
    });
}

function getMonAns(danhMucId = null, search = null) {
    return new Promise((resolve, reject) => {
        let query = 'SELECT Id, TenMon, MoTa, HinhAnh, DanhMucId FROM MonAn WHERE 1=1';
        let params = [];
        
        if (danhMucId) {
            query += ' AND DanhMucId = ?';
            params.push(danhMucId);
        }

        if (search) {
            query += ' AND TenMon LIKE ?';
            params.push(`%${search}%`);
        }
        
        db.all(query, params, (err, rows) => {
            if (err) reject(err);
            else resolve(rows);
        });
    });
}

function getChiTietMonAn(id) {
    return new Promise((resolve, reject) => {
        db.get('SELECT * FROM MonAn WHERE Id = ?', [id], (err, row) => {
            if (err) reject(err);
            else resolve(row);
        });
    });
}

function addFavorite(userId, monAnId) {
    return new Promise((resolve, reject) => {
        db.run(`INSERT OR IGNORE INTO Favorites (UserId, MonAnId) VALUES (?, ?)`,
            [userId, monAnId], (err) => {
                if (err) reject(err);
                else resolve(true);
            });
    });
}

function removeFavorite(userId, monAnId) {
    return new Promise((resolve, reject) => {
        db.run(`DELETE FROM Favorites WHERE UserId = ? AND MonAnId = ?`,
            [userId, monAnId], (err) => {
                if (err) reject(err);
                else resolve(true);
            });
    });
}

function createUser(user) {
    return new Promise((resolve, reject) => {
        db.run(`INSERT INTO Users (Username, Password, FullName, Role) VALUES (?, ?, ?, ?)`,
            [user.username, user.password, user.fullname || '', 'user'],
            function(err) {
                if (err) reject(err);
                else resolve(this.lastID);
            });
    });
}

function getFavorites(userId) {
    return new Promise((resolve, reject) => {
        db.all(`SELECT m.* FROM MonAn m 
                JOIN Favorites f ON m.Id = f.MonAnId 
                WHERE f.UserId = ?`, [userId], (err, rows) => {
            if (err) reject(err);
            else resolve(rows);
        });
    });
}

function addMonAn(monAn) {
    return new Promise((resolve, reject) => {
        db.run(`INSERT INTO MonAn (TenMon, MoTa, HinhAnh, NguyenLieu, CachLam, DanhMucId) 
                VALUES (?, ?, ?, ?, ?, ?)`,
            [monAn.TenMon, monAn.MoTa, monAn.HinhAnh, monAn.NguyenLieu, monAn.CachLam, monAn.DanhMucId],
            function(err) {
                if (err) reject(err);
                else resolve(this.lastID);
            });
    });
}

function deleteMonAn(id) {
    return new Promise((resolve, reject) => {
        db.run(`DELETE FROM MonAn WHERE Id = ?`, [id], (err) => {
            if (err) reject(err);
            else resolve(true);
        });
    });
}

// Hàm lấy bình luận
function getBinhLuans(monAnId) {
    return new Promise((resolve, reject) => {
        db.all('SELECT * FROM BinhLuan WHERE MonAnId = ? ORDER BY CreatedAt DESC', [monAnId], (err, rows) => {
            if (err) reject(err);
            else resolve(rows);
        });
    });
}

// Hàm thêm bình luận mới
function addBinhLuan(binhLuan) {
    return new Promise((resolve, reject) => {
        db.run('INSERT INTO BinhLuan (MonAnId, FullName, NoiDung) VALUES (?, ?, ?)',
            [binhLuan.monAnId, binhLuan.fullName, binhLuan.noiDung], function(err) {
                if (err) reject(err);
                else resolve(this.lastID);
            });
    });
}

console.log('SQLite database da san sang!');
// Thêm vào db-sqlite.js
function updateMonAn(monAn) {
    return new Promise((resolve, reject) => {
        db.run(`UPDATE MonAn 
                SET TenMon = ?, MoTa = ?, HinhAnh = ?, NguyenLieu = ?, CachLam = ?, DanhMucId = ? 
                WHERE Id = ?`,
            [monAn.TenMon, monAn.MoTa, monAn.HinhAnh, monAn.NguyenLieu, monAn.CachLam, monAn.DanhMucId, monAn.Id],
            function(err) {
                if (err) reject(err);
                else resolve(true);
            });
    });
}
module.exports = {
    getDanhMucs,
    getMonAns,
    getChiTietMonAn,
    getUserByUsername,
    createUser,
    addFavorite,
    removeFavorite,
    getFavorites,
    addMonAn,
    deleteMonAn,
    getBinhLuans,
    addBinhLuan,
    updateMonAn
};