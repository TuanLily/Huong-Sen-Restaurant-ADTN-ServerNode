const express = require('express');
const router = express.Router();
const connection = require('../../index');

// Lấy tất cả danh sách tài khoản khách hàng với phân trang
router.get('/', (req, res) => {
    const { search = '', page = 1, pageSize = 10 } = req.query;

    // Đảm bảo page và pageSize là số nguyên
    const pageNumber = parseInt(page, 10) || 1;
    const size = parseInt(pageSize, 10) || 10;
    const offset = (pageNumber - 1) * size;

    // SQL truy vấn để lấy tổng số bản ghi
    const sqlCount = 'SELECT COUNT(*) as total FROM role_permissions WHERE role_id LIKE ?';
    
    // SQL truy vấn để lấy danh sách khách hàng phân trang
    let sql = 'SELECT * FROM role_permissions WHERE role_id LIKE ? ORDER BY id DESC LIMIT ? OFFSET ?';

    // Đếm tổng số bản ghi khớp với tìm kiếm
    connection.query(sqlCount, [`%${search}%`], (err, countResults) => {
        if (err) {
            console.error('Error counting role_permissions:', err);
            return res.status(500).json({ error: 'Failed to count role_permissions' });
        }

        const totalCount = countResults[0].total;
        const totalPages = Math.ceil(totalCount / size); // Tính tổng số trang

        // Lấy danh sách khách hàng cho trang hiện tại
        connection.query(sql, [`%${search}%`, size, offset], (err, results) => {
            if (err) {
                console.error('Error fetching role_permissions:', err);
                return res.status(500).json({ error: 'Failed to fetch role_permissions' });
            }

            // Trả về kết quả với thông tin phân trang
            res.status(200).json({
                message: 'Show list role successfully',
                results,
                totalCount,
                totalPages,
                currentPage: pageNumber
            });
        });
    });
});

// *Lấy thông tin vai trò theo id
router.get('/:id', (req, res) => {
    const { id } = req.params;
    const sql = 'SELECT * FROM role_permissions WHERE role_id = ?';
    connection.query(sql, [id], (err, results) => {
        if (err) {
            console.error('Lỗi khi lấy thông tin vai trò:', err);
            return res.status(500).json({ error: 'Không thể lấy thông tin vai trò' });
        }
        if (results.length === 0) {
            return res.status(404).json({ error: 'Không tìm thấy vai trò' });
        }
        res.status(200).json(results[0]);
    });
});

// *Thêm vai trò mới
router.post('/', (req, res) => {
    const permissions = req.body; // Mảng chứa các đối tượng { role_id, permission_id }
  
    if (!Array.isArray(permissions) || permissions.length === 0) {
      console.log('Invalid data:', req.body); // Debugging line to check the data
      return res.status(400).json({ error: 'Dữ liệu không hợp lệ' });
    }
  
    // Thực hiện chèn từng đối tượng vào cơ sở dữ liệu
    const sql = 'INSERT INTO role_permissions (role_id, permission_id) VALUES ?';
    const values = permissions.map(p => [p.role_id, p.permission_id]);
  
    connection.query(sql, [values], (err, results) => {
      if (err) {
        console.error('Lỗi khi tạo thêm quyền hạn vào vai trò:', err);
        return res.status(500).json({ error: 'Không thể tạo quyền hạn vào vai trò' });
      }
      res.status(201).json({ message: "Thêm quyền hạn vào vai trò thành công", affectedRows: results.affectedRows });
    });
  });
  

  
  
// *Cập nhật vai trò theo id bằng phương thức put
router.put('/:id', (req, res) => {
    const { id } = req.params;
    const { name, description } = req.body;

    if(!name){
        return res.status(404).json({ error: 'Name is required' });
    }

    const sql = 'UPDATE role_permissions SET name = ?, description = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?';
    connection.query(sql, [name, description, id], (err, results) => {
        if (err) {
            if (err.code === 'ER_DUP_ENTRY') {
                return res.status(409).json({ error: 'Vai trò đã tồn tại' });
            }
            console.error('Lỗi khi cập nhật vai trò:', err);
            return res.status(500).json({ error: 'Không thể cập nhật vai trò' });
        }
        if (results.affectedRows === 0) {
            return res.status(404).json({ error: 'Không tìm thấy vai trò' });
        }
        res.status(200).json({ message: "Cập nhật vai trò thành công" });
    });
});

// *Cập nhật vai trò theo id bằng phương thức patch
router.patch('/:id', (req, res) => {
    const { id } = req.params;
    const updates = req.body;

    if(!updates.name){
        return res.status(404).json({ error: 'Name is required' });
    }

    // Kiểm tra xem vai trò có phải là "Chưa phân loại" hay không
    const checkSql = 'SELECT name FROM role_permissions WHERE id = ?';
    connection.query(checkSql, [id], (checkErr, checkResults) => {
        if (checkErr) {
            console.error('Lỗi khi kiểm tra vai trò:', checkErr);
            return res.status(500).json({ error: 'Không thể kiểm tra vai trò' });
        }

        if (checkResults.length === 0) {
            return res.status(404).json({ error: 'Không tìm thấy vai trò' });
        }

        const roleName = checkResults[0].name;

        if (roleName === 'Chưa phân loại') {
            return res.status(403).json({ error: 'Không thể chỉnh sửa vai trò "Chưa phân loại"' });
        }

    const sql = 'UPDATE role_permissions SET ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?';
    connection.query(sql, [updates, id], (err, results) => {
        if (err) {
            if (err.code === 'ER_DUP_ENTRY') {
                return res.status(409).json({ error: 'Vai trò đã tồn tại' });
            }
            console.error('Lỗi khi cập nhật một phần vai trò:', err);
            return res.status(500).json({ error: 'Không thể cập nhật một phần vai trò' });
        }
        if (results.affectedRows === 0) {
            return res.status(404).json({ error: 'Không tìm thấy vai trò' });
        }
        res.status(200).json({ message: "Cập nhật một phần vai trò thành công" });
        });
    });
});

// *Xóa vai trò theo id
router.delete('/:id', (req, res) => {
    const { id } = req.params;

    // Đầu tiên, kiểm tra xem vai trò có phải là "Chưa phân loại" không
    const checkrole_permissionsql = 'SELECT name FROM role_permissions WHERE id = ? LIMIT 1';
    connection.query(checkrole_permissionsql, [id], (checkRoleErr, checkRoleResults) => {
        if (checkRoleErr) {
            console.error('Lỗi khi kiểm tra vai trò:', checkRoleErr);
            return res.status(500).json({ error: 'Không thể kiểm tra vai trò' });
        }

        if (checkRoleResults.length === 0) {
            return res.status(404).json({ error: 'Không tìm thấy vai trò' });
        }

        const roleName = checkRoleResults[0].name;

        if (roleName === 'Chưa phân loại') {
            return res.status(400).json({ error: 'Không thể xóa vai trò "Chưa phân loại"' });
        }

    // Đầu tiên, cập nhật các tài khoản có vai trò này về "Chưa phân vai trò"
    const updateSql = 'UPDATE employees SET role_id = (SELECT id FROM role_permissions WHERE name = "Chưa phân loại" LIMIT 1) WHERE role_id = ?';
    connection.query(updateSql, [id], (updateErr, updateResults) => {
        if (updateErr) {
            console.error('Lỗi khi cập nhật tài khoản:', updateErr); 
            return res.status(500).json({ error: 'Không thể cập nhật tài khoản' });
        }

        // Sau khi cập nhật xong, tiến hành xóa vai trò
        const deleteSql = 'DELETE FROM role_permissions WHERE id = ?';
        connection.query(deleteSql, [id], (deleteErr, deleteResults) => {
            if (deleteErr) {
                console.error('Lỗi khi xóa vai trò:', deleteErr);
                return res.status(500).json({ error: 'Không thể xóa vai trò' });
            }
            if (deleteResults.affectedRows === 0) {
                return res.status(404).json({ error: 'Không tìm thấy vai trò' });
            }
            res.status(200).json({ message: 'Xóa vai trò thành công và các tài khoản đã được cập nhật' });
            });
        });
    });
});

module.exports = router;