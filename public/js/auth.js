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
    } catch(err) { alert('Lỗi kết nối'); }
}

async function register() {
    const username = document.getElementById('regUsername').value;
    const password = document.getElementById('regPassword').value;
    const confirmpassword = document.getElementById('regConfirmPassword').value;
    const fullname = document.getElementById('regFullname').value;
    
    if (!username || !password || !confirmpassword) {
        alert('Vui lòng nhập tên đăng nhập và mật khẩu');
        return;
    }
    if (password !== confirmpassword) {
        alert('Mật khẩu xác nhận không khớp');
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
        } else { alert(data.error); }
    } catch(err) { alert('Lỗi kết nối'); }
}

async function logout() {
    await fetch('/api/logout', { method: 'POST' });
    alert('Đã đăng xuất');
    location.reload();
}