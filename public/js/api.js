const API_URL = 'http://localhost:3000/api';

const ApiService = {
    async getCurrentUser() {
        const res = await fetch('/api/current-user');
        return await res.json();
    },
    async getDanhMucs() {
        const res = await fetch(`${API_URL}/danhmuc`);
        return await res.json();
    },
    async getMonAns(danhMucId = null, keyword = '') {
        let url = `${API_URL}/monan?`;
        if (danhMucId) url += `danhMucId=${danhMucId}&`;
        if (keyword) url += `search=${encodeURIComponent(keyword)}`;
        const res = await fetch(url);
        return await res.json();
    },
    async getChiTietMonAn(id) {
        const res = await fetch(`${API_URL}/chitiet/${id}`);
        return await res.json();
    },
    async getBinhLuans(monAnId) {
        const res = await fetch(`/api/binhluan/${monAnId}`);
        return await res.json();
    },
    async postBinhLuan(monAnId, noiDung) {
        const res = await fetch('/api/binhluan', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ monAnId, noiDung })
        });
        return await res.json();
    },
    async getFavorites() {
        const res = await fetch('/api/favorites');
        return await res.json();
    },
    async toggleFavoriteEndpoint(endpoint, monAnId) {
        const res = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ monAnId })
        });
        return await res.json();
    }
};