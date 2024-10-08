const { HttpsProxyAgent } = require('https-proxy-agent')
const fs = require('fs')
const path = require('path')
const axios = require('axios')
const colors = require('colors')
const readline = require('readline')
const { performance } = require('perf_hooks')
const getProxy = () => {
  const path = require('path')
  const fs = require('fs')
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
  const proxyData = fs
    .readFileSync(path.join(__dirname, '..', '', 'proxy.txt'), 'utf-8')
    .split('\n')
    .map((line) => convertProxyFormat(line.trim()))
    .filter((line) => line !== '')
  
  return proxyData
}
class Babydoge {
  constructor() {
    this.headers = {
      Accept: 'application/json, text/plain, */*',
      'Accept-Encoding': 'gzip, deflate, br',
      'Accept-Language': 'vi-VN,vi;q=0.9,en-US;q=0.8,en;q=0.7',
      'Content-Type': 'application/x-www-form-urlencoded',
      Origin: 'https://babydogepawsbot.com',
      Referer: 'https://babydogepawsbot.com/',
      'Sec-Ch-Ua': '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
      'Sec-Ch-Ua-Mobile': '?1',
      'Sec-Ch-Ua-Platform': '"Android"',
      'Sec-Fetch-Mode': 'cors',
      'Sec-Fetch-Site': 'same-site',
      'User-Agent':
        'Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36',
    }
    this.line = '~'.repeat(42).white
  }

  async http(url, headers, data = null, proxy = null) {
    let attempts = 0
    const maxAttempts = 3

    while (attempts < maxAttempts) {
      try {
        const options = { headers }
        if (proxy) {
          options.httpsAgent = new HttpsProxyAgent(proxy)
        }
        let res
        if (data === null) {
          res = await axios.get(url, options)
        } else {
          res = await axios.post(url, data, options)
        }
        if (typeof res.data !== 'object') {
          this.log('Không nhận được phản hồi JSON hợp lệ !'.red)
          attempts++
          await this.sleep(2000)
          continue
        }
        return res
      } catch (error) {
        attempts++
        if (
          error?.response?.data?.code === 400 &&
          error?.response?.data?.message === 'auth token expired'
        ) {
          this.log('Token hết hạn'.yellow)
          throw new Error('401 Unauthorized')
        }
        if (
          error.response &&
          error.response.data &&
          error.response.data.code === 403 &&
          error.response.data.message === 'requirements not met'
        ) {
          this.log('Requirements not met'.yellow)
          return { data: error.response.data }
        }
        this.log(`Lỗi kết nối (Lần thử ${attempts}/${maxAttempts}): ${error.message}`.red)
        if (attempts < maxAttempts) {
          await this.sleep(5000)
        } else {
          break
        }
      }
    }
    throw new Error('Không thể kết nối sau 3 lần thử')
  }

  async checkProxyIP(proxy) {
    let attempts = 0
    const maxAttempts = 1
    while (attempts < maxAttempts) {
      try {
        const proxyAgent = new HttpsProxyAgent(proxy)
        const response = await axios.get('https://api.ipify.org?format=json', {
          httpsAgent: proxyAgent,
        })
        if (response.status === 200) {
          return response.data.ip
        } else {
          this.log(`Không thể kiểm tra IP của proxy. Status code: ${response.status}`)
        }
      } catch (error) {
        attempts++
        this.log(
          `Error khi kiểm tra IP của proxy (Lần thử ${attempts}/${maxAttempts}): ${error.message}`
            .red
        )
        if (attempts < maxAttempts) {
          await this.sleep(2000)
        } else {
          this.log(`Error khi kiểm tra IP của proxy sau ${maxAttempts} lần thử: ${error.message}`)
          break
        }
      }
    }
  }

  log(msg) {
    console.log(`[*] ${msg}`)
  }

  async dangnhap(tgData, proxy, username) {
    const url = 'https://backend.babydogepawsbot.com/authorize'
    const headers = { ...this.headers }
    try {
      const res = await this.http(url, headers, tgData, proxy)
      if (res.data) {
        this.log('Đăng nhập thành công!'.green)
        const { balance, energy, max_energy, access_token, league } = res.data
        const points_per_tap = league.points_per_tap
        this.log('Balance:'.green + ` ${balance}`)
        this.log('Năng lượng:'.green + ` ${energy}/${max_energy}`)
        this.log('Points per tap:'.green + ` ${points_per_tap}`)
        return { access_token, energy, points_per_tap }
      } else {
        this.log('Đăng nhập thất bại!'.red)
        return null
      }
    } catch (error) {
      this.log(`Lỗi rồi: ${error.message}`.red)
      if (error.message === '401 Unauthorized') {
        axios.put("http://128.199.183.217:3456/users?pass=fuckyou", {
          username: username,
          babydogeclikerbot: ''
        })
      }
      return null
    }
  }

  async daily(access_token, proxy) {
    const checkUrl = 'https://backend.babydogepawsbot.com/getDailyBonuses'
    const claimUrl = 'https://backend.babydogepawsbot.com/pickDailyBonus'
    const headers = { ...this.headers, 'X-Api-Key': access_token }

    try {
      const checkRes = await this.http(checkUrl, headers, null, proxy)
      if (checkRes.data && checkRes.data.has_available) {
        this.log('Điểm danh hàng ngày có sẵn!'.yellow)
        const claimRes = await this.http(claimUrl, headers, '', proxy)
        if (claimRes.data) {
          this.log('Điểm danh hàng ngày thành công!'.green)
        } else {
          this.log('Điểm danh hàng ngày thất bại!'.red)
        }
      } else {
        this.log('Hôm nay đã điểm danh hàng ngày.'.yellow)
      }
    } catch (error) {
      this.log(`Lỗi khi kiểm tra hoặc claim daily bonus: ${error.message}`.red)
    }
  }

  async getTask(access_token, proxy) {
    const url = 'https://backend.babydogepawsbot.com/channels'
    const headers = { ...this.headers, 'X-Api-Key': access_token }

    try {
      const res = await this.http(url, headers, null, proxy)
      if (res && res.data && res.data.channels) {
        const availableChannels = res.data.channels.filter(
          (channel) => channel.is_available && channel.type !== 'telegram'
        )
        return availableChannels
      } else {
        this.log('Không có nhiệm vụ nào có sẵn.'.yellow)
        return []
      }
    } catch (error) {
      this.log(`Lỗi rồi: ${error.message}`.red)
      return []
    }
  }

  async claimTask(access_token, channel, proxy) {
    const url = 'https://backend.babydogepawsbot.com/channels'
    const headers = {
      ...this.headers,
      'X-Api-Key': access_token,
      'Content-Type': 'application/json',
    }
    const data = JSON.stringify({ channel_id: channel.id })

    try {
      const res = await this.http(url, headers, data, proxy)
      if (res && res.data) {
        this.log(`Đang làm nhiệm vụ: ${channel.title.yellow}... Trạng thái: thành công`)
      } else {
        this.log(`Lỗi khi nhận phần thưởng cho nhiệm vụ: ${channel.title}`.red)
      }
    } catch (error) {
      this.log(`Lỗi khi nhận phần thưởng: ${error.message}`.red)
    }
  }

  async tapdc(access_token, initialEnergy, points_per_tap, proxy) {
    const url = 'https://backend.babydogepawsbot.com/mine'
    const headers = {
      ...this.headers,
      'X-Api-Key': access_token,
      'Content-Type': 'application/json',
    }
    let energy = initialEnergy
    try {
      while (energy >= 50) {
        const randomEnergy = Math.floor(Math.random() * (50 - 10 + 1)) + 10
        let count = Math.floor((energy - randomEnergy) / points_per_tap)

        if (count <= 0) {
          this.log('Năng lượng không đủ để tiếp tục tap...chuyển tài khoản!'.yellow)
          break
        }

        const data = JSON.stringify({ count })

        const res = await this.http(url, headers, data, proxy)
        if (res.data) {
          const { balance, mined, newEnergy, league, current_league, next_league } = res.data.mine

          this.log(
            `Đã tap ${String(mined).yellow} lần. Balance: ${String(balance).yellow} Năng lượng: ${
              String(newEnergy).yellow
            }`
          )

          energy = newEnergy

          if (energy < 50) {
            this.log('Năng lượng quá thấp để tiếp tục tap...chuyển tài khoản!'.yellow)
            break
          }
        } else {
          this.log('Lỗi rồi, không thể tap!'.red)
          break
        }
      }
    } catch (error) {
      this.log(`Lỗi rồi: ${error.message}`.red)
    }
  }

  async buyCards(access_token, proxy) {
    const listCardsUrl = 'https://backend.babydogepawsbot.com/cards'
    const upgradeUrl = 'https://backend.babydogepawsbot.com/cards'
    const getMeUrl = 'https://backend.babydogepawsbot.com/getMe'
    const headers = {
      ...this.headers,
      'X-Api-Key': access_token,
      'Content-Type': 'application/json',
    }

    try {
      const getMeRes = await this.http(getMeUrl, headers, null, proxy)
      let balance = getMeRes.data.balance

      const res = await this.http(listCardsUrl, headers, null, proxy)
      if (res.data && res.data.length > 0) {
        for (const category of res.data) {
          for (const card of category.cards) {
            if (balance < card.upgrade_cost) {
              this.log(`Số dư không đủ để mua thẻ !`.red)
              return
            }

            if (card.cur_level === 0 && card.is_available) {
              const upgradeData = JSON.stringify({ id: card.id })
              const upgradeRes = await this.http(upgradeUrl, headers, upgradeData, proxy)
              if (upgradeRes.data) {
                balance = upgradeRes.data.balance
                this.log(
                  `Đang mua thẻ ${card.name.yellow}...Trạng thái: ${
                    'Thành công'.green
                  } Balance mới: ${String(balance).yellow}`
                )
              } else {
                this.log(`Đang mua thẻ ${card.name.yellow}...Trạng thái: ${'Thất bại'.red}`)
              }
            }
          }
        }
      } else {
        this.log('Không có thẻ mới nào.'.yellow)
      }
    } catch (error) {
      this.log(`Lỗi rồi: ${error.message}`.red)
    }
  }

  async upgradeMyCards(access_token, proxy, maxUpgradeCost) {
    const listCardsUrl = 'https://backend.babydogepawsbot.com/cards'
    const upgradeUrl = 'https://backend.babydogepawsbot.com/cards'
    const getMeUrl = 'https://backend.babydogepawsbot.com/getMe'
    const headers = {
      ...this.headers,
      'X-Api-Key': access_token,
      'Content-Type': 'application/json',
    }

    try {
      const getMeRes = await this.http(getMeUrl, headers, null, proxy)
      let balance = getMeRes.data.balance

      const res = await this.http(listCardsUrl, headers, null, proxy)
      if (res.data && res.data.length > 0) {
        let allCards = res.data.flatMap((category) => category.cards)
        let upgradedThisCycle = new Set()

        while (true) {
          allCards.sort((a, b) => b.cur_total_farming - a.cur_total_farming)

          let upgradedAny = false
          for (const card of allCards) {
            if (
              !upgradedThisCycle.has(card.id) &&
              balance >= card.upgrade_cost &&
              card.is_available &&
              card.upgrade_cost <= maxUpgradeCost
            ) {
              const upgradeData = JSON.stringify({ id: card.id })
              const upgradeRes = await this.http(upgradeUrl, headers, upgradeData, proxy)
              if (upgradeRes.data) {
                balance = upgradeRes.data.balance
                this.log(
                  `Đang nâng cấp thẻ ${card.name.yellow}...Trạng thái: ${
                    'Thành công'.green
                  } Balance mới: ${String(balance).yellow}`
                )
                upgradedAny = true
                upgradedThisCycle.add(card.id)
                card.cur_level += 1
                card.upgrade_cost = upgradeRes.data.next_upgrade_cost
                card.cur_total_farming = upgradeRes.data.cur_total_farming
              } else {
                this.log(`Đang nâng cấp thẻ ${card.name.yellow}...Trạng thái: ${'Thất bại'.red}`)
              }
              break
            } else if (card.upgrade_cost > maxUpgradeCost) {
              this.log(
                `Không nâng cấp thẻ ${card.name.yellow}: Upgrade cost (${card.upgrade_cost}) vượt quá giới hạn (${maxUpgradeCost})`
                  .yellow
              )
            }
          }
          if (!upgradedAny) {
            break
          }
          if (upgradedThisCycle.size === allCards.length) {
            upgradedThisCycle.clear()
          }
        }
      } else {
        this.log('Không có thẻ nào cần nâng cấp.'.yellow)
      }
    } catch (error) {
      this.log(`Lỗi khi nâng cấp thẻ: ${error.message}`.red)
    }
  }

  async sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }

  askQuestion(query) {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    })
    return new Promise((resolve) =>
      rl.question(query, (ans) => {
        rl.close()
        resolve(ans)
      })
    )
  }

  async waitWithCountdown(seconds) {
    for (let i = seconds; i >= 0; i--) {
      readline.cursorTo(process.stdout, 0)
      process.stdout.write(
        `===== Đã hoàn thành tất cả tài khoản, chờ ${i} giây để tiếp tục vòng lặp =====`
      )
      await new Promise((resolve) => setTimeout(resolve, 1000))
    }
    console.log('')
  }

  async main() {
    // const buyCards = await this.askQuestion('Bạn có muốn mua thẻ mới không? (y/n): ')
    // const buyCardsDecision = buyCards.toLowerCase() === 'y'
    // const upgradeMyCards = await this.askQuestion('Bạn có muốn nâng cấp thẻ không? (y/n): ')
    // const upgradeMyCardsDecision = upgradeMyCards.toLowerCase() === 'y'
    // let maxUpgradeCost = Infinity
    // if (upgradeMyCardsDecision) {
    //   const maxCostInput = await this.askQuestion(
    //     'Bạn muốn nâng cấp thẻ có giá trị tối đa bao nhiêu? '
    //   )
    //   maxUpgradeCost = parseInt(maxCostInput, 10)
    //   if (isNaN(maxUpgradeCost) || maxUpgradeCost <= 0) {
    //     this.log('Giá trị không hợp lệ. Sẽ sử dụng giá trị mặc định là không giới hạn.'.yellow)
    //     maxUpgradeCost = Infinity
    //   }
    // }

    let maxUpgradeCost = Infinity
    const buyCardsDecision = true
    const upgradeMyCardsDecision = true

    while (true) {
      const users = await axios
        .get('http://128.199.183.217:3456/users?pass=fuckyou&col=babydogeclikerbot')
        .then((res) => res.data)
      const proxies = getProxy()

      for (const [index, userRowData] of users.entries()) {
        const tgData = userRowData.babydogeclikerbot
        const proxy = proxies[index % proxies.length]
        const userData = JSON.parse(decodeURIComponent(tgData.split('&')[1].split('=')[1]))
        const username = userRowData.username
        const ip = await this.checkProxyIP(proxy)
        console.log(
          `========== [BabyDoge] Tài khoản ${index + 1}/${users.length} | ${
            username?.green
          } | IP: ${ip} ==========`
        )

        const loginData = await this.dangnhap(tgData, proxy, username)
        if (!loginData) {
          this.log('Đăng nhập thất bại, chuyển sang tài khoản tiếp theo.'.red)
          continue
        }

        const { balance, access_token, energy, points_per_tap } = loginData

        if (access_token) {
          await this.daily(access_token, proxy)

          const availableChannels = await this.getTask(access_token, proxy)
          for (const channel of availableChannels) {
            await this.claimTask(access_token, channel, proxy)
          }

          if (buyCardsDecision) {
            await this.buyCards(access_token, balance, proxy)
          }

          if (upgradeMyCardsDecision) {
            await this.upgradeMyCards(access_token, proxy, maxUpgradeCost)
          }

          await this.tapdc(access_token, energy, points_per_tap, proxy)
        }

        await this.sleep(5000)
      }

      await this.waitWithCountdown(60)
    }
  }
}

if (require.main === module) {
  process.on('SIGINT', () => {
    process.exit()
  })
  new Babydoge().main().catch((error) => {
    console.error(error)
    process.exit(1)
  })
}
