const express = require('express')
const bodyParser = require('body-parser')
const db = require('./db')

const app = express()
app.use(bodyParser.json())

// Cấu hình view engine
app.set('view engine', 'ejs')

// Cấu hình thư mục chứa các template
app.set('views', __dirname + '/views') // Thay đổi nếu thư mục views của bạn khác

function convertProxyFormat(proxy) {
  try {
    // Tách chuỗi proxy thành các phần
    const [ip, port, user, pass] = proxy.split(':')

    // Tạo chuỗi mới theo định dạng http://user:pass@ip:port
    const formattedProxy = `http://${user}:${pass}@${ip}:${port}`

    return formattedProxy
  } catch (e) {
    return proxy
  }
}

// READ - Lấy thông tin một user
app.get('/users/:username', (req, res) => {
  const { username } = req.params

  const query = `SELECT * FROM user WHERE username = ?`

  db.get(query, [username], (err, row) => {
    if (err) {
      return res.status(500).json({ error: err.message })
    }
    if (!row) {
      return res.status(404).json({ error: 'User not found' })
    }
    res.json(row)
  })
})

// READ - Lấy danh sách tất cả users
app.get('/users', (req, res) => {
  let query = `SELECT * FROM user`
  const { col } = req.query

  if (!!col) {
    query += ` WHERE proxy IS NOT NULL AND blum IS NOT NULL AND ${col} != ''`
  }

  db.all(query, [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message })
    }
    res.json(
      rows.map((u) => ({
        ...u,
        httpProxy: convertProxyFormat(u.proxy),
      }))
    )
  })
})

// UPDATE - Cập nhật thông tin một user
app.put('/users', (req, res) => {
  const { username, ...otherFields } = req.body
  console.log('otherFields', otherFields)
  // Kiểm tra nếu có các key khác ngoài "blum"
  const additionalColumns = Object.keys(otherFields)

  if (additionalColumns.length > 0) {
    // Thêm từng cột vào bảng nếu chưa có
    additionalColumns.forEach((col) => {
      const addColumnQuery = `ALTER TABLE user ADD COLUMN ${col} TEXT`

      db.run(addColumnQuery, [], (err) => {
        if (err && !err.message.includes('duplicate column name')) {
          // Nếu cột đã tồn tại thì bỏ qua lỗi, các lỗi khác sẽ được trả về
          return res.status(500).json({ error: err.message })
        }
      })
    })
  }

  // Kiểm tra xem user có tồn tại không
  const selectQuery = `SELECT * FROM user WHERE username = ?`

  db.get(selectQuery, [username], (err, row) => {
    if (err) {
      return res.status(500).json({ error: err.message })
    }

    if (!row) {
      // Nếu không tồn tại, thêm mới user
      const insertQuery = `INSERT INTO user (username, ${additionalColumns.join(
        ', '
      )}) VALUES (?, ${additionalColumns.map(() => '?').join(', ')})`
      const values = [username, ...Object.values(otherFields)]

      db.run(insertQuery, values, function (err) {
        if (err) {
          return res.status(400).json({ error: err.message })
        }
        res.status(201).json({ message: 'User created successfully', id: this.lastID })
      })
    } else {
      // Nếu user đã tồn tại, cập nhật user
      const updateQuery = `UPDATE user SET ${additionalColumns
        .map((col) => `${col} = ?`)
        .join(', ')} WHERE username = ?`
      const values = [...Object.values(otherFields), username]
      console.log('updateQuery', updateQuery)
      db.run(updateQuery, values, function (err) {
        if (err) {
          return res.status(400).json({ error: err.message })
        }
        res.json({ message: 'User updated successfully' })
      })
    }
  })
})

// DELETE - Xóa một user
app.delete('/users/:username', (req, res) => {
  const { username } = req.params

  const query = `DELETE FROM user WHERE username = ?`

  db.run(query, [username], function (err) {
    if (err) {
      return res.status(500).json({ error: err.message })
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: 'User not found' })
    }
    res.json({ message: 'User deleted successfully' })
  })
})

// Hàm trả về danh sách user
app.get('/ui/users', (req, res) => {
  const selectQuery = `SELECT * FROM user`
  db.all(selectQuery, [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message })
    }
    const proxyList = [
      '14.225.66.94:12344:VN78470:sYVCmr08',
      '180.214.239.207:2023:Proxyviet51447:iVtD3m1B',
      '14.225.63.213:6666:rqyc8w2w:rQYC8w2W',
      '14.225.64.181:6666:ewme5n7i:eWmE5n7I',
      '14.225.52.232:12345:ifje4u1c:iFJE4u1c',
      '36.50.53.131:49068:qqqn1t0f:qQqN1t0f',
      '49.236.211.161:3179:modsbe1o:CjHWzgw34QRJ',
      '14.225.57.7:12345:PVN77433:yVQB7z2q',
      'prxmik1.ddns.net:20009:Acbd1234:Acbd1234^%',
      '14.225.57.205:12345:surn0t9s:zFIK6g8d',
    ]
    res.render('users', { users: rows, proxyList }) // Giả sử bạn sử dụng EJS hoặc một template engine khác
  })
})
// Hàm trả về form sửa user
app.get('/ui/users/edit/:username', (req, res) => {
  const { username } = req.params
  const selectQuery = `SELECT * FROM user WHERE username = ?`

  db.get(selectQuery, [username], (err, row) => {
    if (err) {
      return res.status(500).json({ error: err.message })
    }
    if (!row) {
      return res.status(404).send('User not found')
    }
    const proxyList = [
      '14.225.66.94:12344:VN78470:sYVCmr08',
      '180.214.239.207:2023:Proxyviet51447:iVtD3m1B',
      '14.225.63.213:6666:rqyc8w2w:rQYC8w2W',
      '14.225.64.181:6666:ewme5n7i:eWmE5n7I',
      '14.225.52.232:12345:ifje4u1c:iFJE4u1c',
      '36.50.53.131:49068:qqqn1t0f:qQqN1t0f',
      '49.236.211.161:3179:modsbe1o:CjHWzgw34QRJ',
      '14.225.57.7:12345:PVN77433:yVQB7z2q',
      'prxmik1.ddns.net:20009:Acbd1234:Acbd1234^%',
      '14.225.57.205:12345:surn0t9s:zFIK6g8d',
    ]
    res.render('editUser', { user: row, proxyList }) // Giả sử bạn có một template cho việc sửa user
  })
})

// Start server
const PORT = process.env.PORT || 3456
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`)
})
