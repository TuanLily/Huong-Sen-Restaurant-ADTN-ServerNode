const express = require('express');
const router = express.Router();
const connection = require('../../index');

// *Kiểm tra trùng lặp tên quyền hạn
const checkDuplicatePermissionName = (name, callback) => {
    const sql = 'SELECT * FROM permissions WHERE name = ?';
    connection.query(sql, [name], (err, results) => {
        if (err) {
            console.error('Lỗi khi kiểm tra trùng lặp tên quyền hạn:', err);
            return callback(err, null);
        }
        callback(null, results.length > 0); // Nếu tồn tại thì trả về true
    });
};

// *Lấy tất cả danh sách quyền hạn
router.get('/', (req, res) => {
    const { search = '', page = 1, pageSize = 5 } = req.query;

    const pageNumber = parseInt(page, 10) || 1;
    const size = parseInt(pageSize, 10) || 5;
    const offset = (pageNumber - 1) * size;

    const sqlCount = 'SELECT COUNT(*) as total FROM permissions WHERE name LIKE ?';
    const sql = 'SELECT * FROM permissions WHERE name LIKE ? ORDER BY id DESC LIMIT ? OFFSET ?';

    connection.query(sqlCount, [`%${search}%`], (err, countResults) => {
        if (err) {
            console.error('Lỗi khi đếm quyền hạn:', err);
            return res.status(500).json({ error: 'Không thể đếm quyền hạn' });
        }

        const totalCount = countResults[0].total;
        const totalPages = Math.ceil(totalCount / size);

        connection.query(sql, [`%${search}%`, size, offset], (err, results) => {
            if (err) {
                console.error('Lỗi khi lấy danh sách quyền hạn:', err);
                return res.status(500).json({ error: 'Không thể lấy danh sách quyền hạn' });
            }

            res.status(200).json({
                message: 'Hiển thị danh sách quyền hạn thành công',
                results,
                totalCount,
                totalPages,
                currentPage: pageNumber
            });
        });
    });
});

// *Lấy thông tin quyền hạn theo id
router.get('/:id', (req, res) => {
    const { id } = req.params;
    const sql = 'SELECT * FROM permissions WHERE id = ?';
    connection.query(sql, [id], (err, results) => {
        if (err) {
            console.error('Lỗi khi lấy thông tin quyền hạn:', err);
            return res.status(500).json({ error: 'Không thể lấy thông tin quyền hạn' });
        }
        if (results.length === 0) {
            return res.status(404).json({ error: 'Không tìm thấy quyền hạn' });
        }
        res.status(200).json(results[0]);
    });
});

// *Thêm quyền hạn mới
router.post('/', (req, res) => {
    const { name } = req.body;

    checkDuplicatePermissionName(name, (err, isDuplicate) => {
        if (err) {
            return res.status(500).json({ error: 'Không thể kiểm tra trùng lặp tên quyền hạn' });
        }
        if (isDuplicate) {
            return res.status(400).json({ error: 'Tên quyền hạn đã tồn tại' });
        }

        const sql = 'INSERT INTO permissions (name) VALUES (?)';
        connection.query(sql, [name], (err, results) => {
            if (err) {
                console.error('Lỗi khi tạo quyền hạn:', err);
                return res.status(500).json({ error: 'Không thể tạo quyền hạn' });
            }
            res.status(201).json({ message: "Thêm quyền hạn thành công" });
        });
    });
});

// *Cập nhật quyền hạn theo id bằng phương thức put
router.put('/:id', (req, res) => {
    const { id } = req.params;
    const { name } = req.body;

    checkDuplicatePermissionName(name, (err, isDuplicate) => {
        if (err) {
            return res.status(500).json({ error: 'Không thể kiểm tra trùng lặp tên quyền hạn' });
        }
        if (isDuplicate) {
            return res.status(400).json({ error: 'Tên quyền hạn đã tồn tại' });
        }

        const sql = 'UPDATE permissions SET name = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?';
        connection.query(sql, [name, id], (err, results) => {
            if (err) {
                console.error('Lỗi khi cập nhật quyền hạn:', err);
                return res.status(500).json({ error: 'Không thể cập nhật quyền hạn' });
            }
            if (results.affectedRows === 0) {
                return res.status(404).json({ error: 'Không tìm thấy quyền hạn' });
            }
            res.status(200).json({ message: "Cập nhật quyền hạn thành công" });
        });
    });
});

// *Cập nhật quyền hạn theo id bằng phương thức patch
router.patch('/:id', (req, res) => {
    const { id } = req.params;
    const updates = req.body;

    const sql = 'UPDATE permissions SET ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?';
    connection.query(sql, [updates, id], (err, results) => {
        if (err) {
            console.error('Lỗi khi cập nhật một phần quyền hạn:', err);
            return res.status(500).json({ error: 'Không thể cập nhật một phần quyền hạn' });
        }
        if (results.affectedRows === 0) {
            return res.status(404).json({ error: 'Không tìm thấy quyền hạn' });
        }
        res.status(200).json({ message: "Cập nhật một phần quyền hạn thành công" });
    });
});

// *Xóa quyền hạn theo id
router.delete('/:id', (req, res) => {
    const { id } = req.params;
    const sql = 'DELETE FROM permissions WHERE id = ?';
    connection.query(sql, [id], (err, results) => {
        if (err) {
            console.error('Lỗi khi xóa quyền hạn:', err);
            return res.status(500).json({ error: 'Không thể xóa quyền hạn' });
        }
        if (results.affectedRows === 0) {
            return res.status(404).json({ error: 'Không tìm thấy quyền hạn' });
        }
        res.status(200).json({ message: 'Xóa quyền hạn thành công' });
    });
});

module.exports = router;
