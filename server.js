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
  const { col, pass } = req.query

  if (pass !== 'fuckyou') return []

  if (!!col) {
    query += ` WHERE proxy IS NOT NULL AND ${col} IS NOT NULL AND ${col} != ''`
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

const updateOrCreateUser = (req, res) => {
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
}

// UPDATE - Cập nhật thông tin một user
app.put('/users', updateOrCreateUser)
app.post('/users', updateOrCreateUser)

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

const proxyList = [
  '14.225.57.205:12345:surn0t9s:zFIK6g8d',
  '103.252.93.104:44935:EIbFyihAeB:lO89svdY8EVpCKF801',
  '103.252.93.85:27218:uLyyhgHKcl:4sqKbuqhIonVGA5361',
  '14.225.49.152:6666:ProxyVN282165:wEbC0a2A',
  '103.68.85.190:46875:NBhbWLCNgs:yVmSl36XsX9tRhT457',
  '103.68.85.185:15287:YhBvlsQoWj:YpVQdWp9tqq9UjO440',
  '103.68.85.182:58621:BRGvbvtEOV:uPHmdvBBhnPBV3j142',
  '103.68.84.236:64363:OKVkBQQJDy:k31FGJLLslLuNTi588',
  '103.68.85.182:58621:BRGvbvtEOV:uPHmdvBBhnPBV3j142',
  '103.68.85.201:31419:qKfxftxUlI:wqSzcialBSRzP6W660',
  '103.68.85.150:64372:xwqRjqDQEQ:5Xo657BdC1xv2xl240',
  '103.176.22.213:46361:LincoayHmU:jvAk5ZLsdjBaU8V737',
  '103.180.138.26:39503:XCLHWMPapI:0FDaXAy7CigdLO0914',
  '103.179.174.82:57981:YflqAvQhlQ:fSLlZDEBq07nGED943',
  '103.180.139.16:60660:etAAmxEXko:HwFPvONuGgNGTcB017',
  '103.176.24.143:24526:MTTRbLhaCQ:kdCeqbW76iRjjC8122',
  '103.161.170.44:36348:VfqbgswgRP:JDsjzmFwwoRtmtM548',
  '103.176.24.17:47367:QPqAeuQKfC:2TlgdHQkfvax7lT224',
  '103.178.232.101:61003:DFDAsEycyu:hKyDwOm0NmWc9Du298',
  '103.178.232.106:40452:BaVFJNPSgQ:JgcVoiTRF3B1DwU119',
  '103.68.84.113:25296:Iyomccmhpj:wfQLEjF6yfQjBGp336',
  '103.68.85.99:40356:GqEIDtPVZP:yobMiluqasraglA981',
  '103.68.85.119:36858:fwwRkZHYcM:UckLBtANpc4VlfG936',
  '103.68.85.131:19515:UwhEYEhKBw:qed3M3l1uEOZ9UU155',
  '103.68.85.139:29904:FBCEUYSmlb:w0DSJVzZ4DgZ1ci189',
  '103.228.75.224:61494:ZbSAPyquiV:HJ3iFEqI7byWTkR200',
  '103.252.93.23:52595:YQAArWWKti:uA52UNZ16Sr9EQL033',
  '103.252.93.23:52595:YQAArWWKti:uA52UNZ16Sr9EQL033',
  '103.178.232.106:40452:BaVFJNPSgQ:JgcVoiTRF3B1DwU119',
  '103.68.84.113:25296:Iyomccmhpj:wfQLEjF6yfQjBGp336',
  '103.68.85.99:40356:GqEIDtPVZP:yobMiluqasraglA981',
  '103.110.32.235:31144:zPkxNVdzfk:tHoAWfGuvs52D7N938',
  '202.158.244.237:64122:PVpSRtgHQN:Lf0j4uwRD3uSFz7858',
  '103.162.24.192:56380:DdNWPIbHXl:4SNxudKWCAZ3hr1803',
  '103.95.198.145:61572:rnYWoTJOWe:YkBSezbnHMBcq3G682',
  '103.110.33.244:26079:yEGEWSgWRk:zk4PtqUYoXfY5Za852',
  '103.190.121.45:41090:zJCNUeOsqt:Fs9TKrIvH3BRZym396',
  '103.252.93.23:52595:YQAArWWKti:uA52UNZ16Sr9EQL033',
  '103.190.120.251:46349:uSdIzmNFSh:4HFCIGpJrdrtAQi279',
]

app.get('/proxies', (req, res) => {
  const { pass } = req.query
  if (pass !== 'fuckyou') return []

  res.json(proxyList.map((proxy) => convertProxyFormat(proxy)))
})

// Hàm trả về danh sách user
app.get('/ui/users', (req, res) => {
  const selectQuery = `SELECT * FROM user ORDER BY username ASC`
  db.all(selectQuery, [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message })
    }

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
