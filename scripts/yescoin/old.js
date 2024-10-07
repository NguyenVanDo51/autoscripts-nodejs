fetch("https://api-backend.yescoin.gold/mission/claimReward", {
  "headers": {
    "accept": "application/json, text/plain, */*",
    "accept-language": "en-US,en;q=0.9,vi;q=0.8",
    "content-type": "application/json",
    "priority": "u=1, i",
    "sec-ch-ua": "\"Google Chrome\";v=\"129\", \"Not=A?Brand\";v=\"8\", \"Chromium\";v=\"129\"",
    "sec-ch-ua-mobile": "?0",
    "sec-ch-ua-platform": "\"Windows\"",
    "sec-fetch-dest": "empty",
    "sec-fetch-mode": "cors",
    "sec-fetch-site": "same-site",
    "token": "eyJhbGciOiJIUzUxMiJ9.eyJzdWIiOiI1MDYwMjkzNjE2IiwiY2hhdElkIjoiNTA2MDI5MzYxNiIsImlhdCI6MTcyODMwMzQyMiwiZXhwIjoxNzMwODk1NDIyLCJyb2xlQXV0aG9yaXplcyI6W10sInVzZXJJZCI6MTgzODA1OTMzMjUzOTc4OTMxMn0.TTcz8XoUBYPWXA6y5Ib_GkmX93km7wJmhdwatDmuz868gQ7aIC84YZo5nxp2cHZxskUvcBOKChEUppC2i2P2rQ",
    "Referer": "https://www.yescoin.gold/",
    "Referrer-Policy": "strict-origin-when-cross-origin"
  },
  "body": "10001",
  "method": "POST"
}).then(r => r.json()).then(r => console.log(r));