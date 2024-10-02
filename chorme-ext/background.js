console.log('background is running')
let sent = false

// chrome.webRequest.onBeforeSendHeaders.addListener(
//   function (details) {
//     console.log('details', details)
//     const requestCookies = details.requestHeaders.find(header => header.name.toLowerCase() === 'cookie');
//     if (requestCookies) {
//       console.log('Request Cookies:', requestCookies.value);
//     }
//     return { requestHeaders: details.requestHeaders };
//   },
//   { urls: ["https://www.kucoin.com/*"] }, // Chỉ lắng nghe URL từ KuCoin
//   ["requestHeaders"]
// );

const handleCookie = (details) => {
  // Lấy cookie cho domain 'kucoin.com'
  console.log('details', details)
  chrome.cookies.getAll({ domain: 'www.kucoin.com' }, function (cookies) {
    if (cookies.length > 0) {
      let c = []
      cookies.forEach((cookie) => {
        c.push(`${cookie.name}=${cookie.value}`)
      })

      console.log('Cookie', c.join('; '))
      const cookieData = c.join('; ')
      sent = true
      console.log(chrome.tabs)
      chrome.tabs.query({ active: true, lastFocusedWindow: true }, function (tabs) {
        console.log('tabs', tabs)
        tabs.forEach((tab) => {
          chrome.tabs.sendMessage(tab.id, { type: 'sendCookies', cookies: cookieData })
        })
      })

      chrome.webRequest.onBeforeSendHeaders.removeListener(
        handleCookie,
        { urls: ['https://www.kucoin.com/*'] },
        ['requestHeaders']
      )
    } else {
      console.log('No cookies found for kucoin.com')
    }
  })
  return { requestHeaders: details.requestHeaders }
}

chrome.webRequest.onBeforeSendHeaders.addListener(
  handleCookie,
  { urls: ['https://www.kucoin.com/*'] },
  ['requestHeaders']
)
