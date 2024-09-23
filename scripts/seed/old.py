import requests
import time
from colorama import init, Fore, Style
import sys
import os
import datetime
import pytz

init(autoreset=True)

def clear_console():
    os.system('cls' if os.name == 'nt' else 'clear')

url_claim = 'https://elb.seeddao.org/api/v1/seed/claim'
url_balance = 'https://elb.seeddao.org/api/v1/profile/balance'
url_checkin = 'https://elb.seeddao.org/api/v1/login-bonuses'
url_upgrade_storage = 'https://elb.seeddao.org/api/v1/seed/storage-size/upgrade'
url_upgrade_mining = 'https://elb.seeddao.org/api/v1/seed/mining-speed/upgrade'
url_upgrade_holy = 'https://elb.seeddao.org/api/v1/upgrades/holy-water'
url_get_profile = 'https://elb.seeddao.org/api/v1/profile'

headers = {
    'accept': 'application/json, text/plain, */*',
    'accept-language': 'en-ID,en-US;q=0.9,en;q=0.8,id;q=0.7',
    'content-length': '0',
    'dnt': '1',
    'origin': 'https://cf.seeddao.org',
    'priority': 'u=1, i',
    'referer': 'https://cf.seeddao.org/',
    'sec-ch-ua': '"Google Chrome";v="125", "Chromium";v="125", "Not.A/Brand";v="24"',
    'sec-ch-ua-mobile': '?0',
    'sec-ch-ua-platform': '"Windows"',
    'sec-fetch-dest': 'empty',
    'sec-fetch-mode': 'cors',
    'sec-fetch-site': 'same-site',
    'telegram-data': 'tokens',
    'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36'
}

def load_credentials():
    try:
        with open('query.txt', 'r') as file:
            tokens = file.read().strip().split('\n')
        return tokens
    except FileNotFoundError:
        print("Không tìm thấy file query.txt")
        return []
    except Exception as e:
        print("Đã xảy ra lỗi:", str(e))
        return []

def load_proxies():
    try:
        with open('proxy.txt', 'r') as file:
            proxies = file.read().strip().split('\n')
        return proxies
    except FileNotFoundError:
        print("Không tìm thấy file proxy.txt")
        return []
    except Exception as e:
        print("Đã xảy ra lỗi:", str(e))
        return []

def get_proxy_dict(proxy):
    return {
        "http": proxy,
        "https": proxy
    }
def check_proxy_ip(proxy):
    try:
        response = requests.get('https://api.ipify.org?format=json', proxies=get_proxy_dict(proxy), timeout=10)
        if response.status_code == 200:
            ip_data = response.json()
            return ip_data.get('ip', 'Không tìm thấy IP')
        else:
            return 'Không lấy được IP'
    except Exception as e:
        return f'Lỗi: {str(e)}'
def check_worm(proxy):
    response = requests.get('https://elb.seeddao.org/api/v1/worms', headers=headers, proxies=get_proxy_dict(proxy))
    if response.status_code == 200:
        worm_data = response.json().get('data', {})
        next_refresh = worm_data.get('next_refresh')
        is_caught = worm_data.get('is_caught')

        if next_refresh is not None and is_caught is not None:
            next_refresh_dt = datetime.datetime.fromisoformat(next_refresh[:-1] + '+00:00')
            now_utc = datetime.datetime.now(pytz.utc)

            time_diff_seconds = (next_refresh_dt - now_utc).total_seconds()
            hours = int(time_diff_seconds // 3600)
            minutes = int((time_diff_seconds % 3600) // 60)

            print(f"{Fore.GREEN+Style.BRIGHT}[ Worms ]: Tiếp theo trong {hours} giờ {minutes} phút - Trạng thái: {'Đã bắt' if is_caught else 'Có sẵn'}")
        else:
            print(f"{Fore.RED+Style.BRIGHT}[ Worms ]: Dữ liệu worm không đầy đủ")

        return worm_data
    else:
        print(f"{Fore.RED+Style.BRIGHT}[ Worms ]: Không lấy được dữ liệu.")
        return None

def catch_worm(proxy):
    worm_data = check_worm(proxy)
    if worm_data and not worm_data.get('is_caught', True):
        response = requests.post('https://elb.seeddao.org/api/v1/worms/catch', headers=headers, proxies=get_proxy_dict(proxy))
        if response.status_code == 200:
            print(f"{Fore.GREEN+Style.BRIGHT}[ Worms ]: Bắt sâu thành công")
        elif response.status_code == 400:
            print(f"{Fore.RED+Style.BRIGHT}[ Worms ]: Đã bắt sâu")
        elif response.status_code == 404:
            print(f"{Fore.RED+Style.BRIGHT}[ Worms ]: Không tìm thấy sâu")    
        else:
            print(f"{Fore.RED+Style.BRIGHT}[ Worms ]: Không bắt được sâu, mã trạng thái:", response)
    else:
        print(f"{Fore.RED+Style.BRIGHT}[ Worms ]: Sâu không có sẵn hoặc đã bắt.")

def get_profile(proxy):
    response = requests.get(url_get_profile, headers=headers, proxies=get_proxy_dict(proxy))
    if response.status_code == 200:
        profile_data = response.json()
        name = profile_data['data']['name']
        proxy_ip = check_proxy_ip(proxy)
        print(f"{Fore.CYAN+Style.BRIGHT}============== [ {name} - Proxy IP: {proxy_ip} ] ==============")
        upgrades = {}
        for upgrade in profile_data['data']['upgrades']:
            upgrade_type = upgrade['upgrade_type']
            upgrade_level = upgrade['upgrade_level']
            if upgrade_type in upgrades:
                if upgrade_level > upgrades[upgrade_type]:
                    upgrades[upgrade_type] = upgrade_level
            else:
                upgrades[upgrade_type] = upgrade_level

        for upgrade_type, level in upgrades.items():
            print(f"{Fore.BLUE+Style.BRIGHT}[ {upgrade_type.capitalize()} Level ]: {level + 1}")
    else:
        print("Không lấy được dữ liệu, mã trạng thái:", response.status_code)
        return None

def check_balance(proxy):
    response = requests.get(url_balance, headers=headers, proxies=get_proxy_dict(proxy))
    if response.status_code == 200:
        balance_data = response.json()
        print(f"{Fore.YELLOW+Style.BRIGHT}[ Balance ]: {balance_data['data'] / 1000000000}")
        return True
    else:
        print(f"{Fore.RED+Style.BRIGHT}[ Balance ]: Thất bại |{response.status_code}")
        return False

def checkin_daily(proxy):
    response = requests.post(url_checkin, headers=headers, proxies=get_proxy_dict(proxy))
    if response.status_code == 200:
        data = response.json()
        day = data.get('data', {}).get('no', '')
        print(f"{Fore.GREEN+Style.BRIGHT}[ Checkin ]: Điểm danh thành công | Ngày {day}")
    else:
        data = response.json()
        if data.get('message') == 'already claimed for today':
            print(f"{Fore.RED+Style.BRIGHT}[ Checkin ]: Đã điểm danh hôm nay")
        else:
            print(f"{Fore.RED+Style.BRIGHT}[ Checkin ]: Thất bại | {data}")

def upgrade_storage(confirm, proxy):
    if confirm.lower() == 'y':
        response = requests.post(url_upgrade_storage, headers=headers, proxies=get_proxy_dict(proxy))
        if response.status_code == 200:
            return '[ Upgrade storage ]: Thành công'
        else:
            return '[ Upgrade storage ]: Số dư không đủ'
    else:
        return None

def upgrade_mining(confirm, proxy):
    if confirm.lower() == 'y':
        response = requests.post(url_upgrade_mining, headers=headers, proxies=get_proxy_dict(proxy))
        if response.status_code == 200:
            return '[ Upgrade mining ]: Thành công'
        else:
            return '[ Upgrade mining ]: Số dư không đủ'
    else:
        return None

def upgrade_holy(confirm, proxy):
    if confirm.lower() == 'y':
        response = requests.post(url_upgrade_holy, headers=headers, proxies=get_proxy_dict(proxy))
        if response.status_code == 200:
            return '[ Upgrade holy ]: Thành công'
        else:
            return '[ Upgrade holy ]: Điều kiện không đủ'
    else:
        return None

def get_tasks(proxy):
    response = requests.get('https://elb.seeddao.org/api/v1/tasks/progresses', headers=headers, proxies=get_proxy_dict(proxy))
    tasks = response.json()['data']
    
    for task in tasks:
        if task['task_user'] is None or not task['task_user']['completed']:
            complete_task(task['id'], task['name'], proxy)

def complete_task(task_id, task_name, proxy):
    response = requests.post(f'https://elb.seeddao.org/api/v1/tasks/{task_id}', headers=headers, proxies=get_proxy_dict(proxy))
    if response.status_code == 200:
        print(f"{Fore.GREEN+Style.BRIGHT}[ Tasks ]: Nhiệm vụ {task_name} đã hoàn thành.")
    else:
        print(f"{Fore.RED+Style.BRIGHT}[ Tasks ]: Không thể hoàn thành nhiệm vụ {task_name}, mã trạng thái: {response.status_code}")

def main():
    tokens = load_credentials()
    proxies = load_proxies()

    if len(tokens) != len(proxies):
        print("Số lượng proxy không khớp với số lượng token.")
        return

    confirm_storage = input("Tự động nâng cấp storage? (y/n): ")
    confirm_mining = input("Tự động nâng cấp mining? (y/n): ")
    confirm_holy = input("Tự động nâng cấp holy? (y/n): ")
    confirm_task = input("Tự động hoàn thành nhiệm vụ? (y/n): ")

    while True:
        for index, (token, proxy) in enumerate(zip(tokens, proxies)):
            headers['telegram-data'] = token
            proxy_dict = get_proxy_dict(proxy)

            info = get_profile(proxy)
            if info:
                print(f"Đang xử lý tài khoản {info['data']['name']}")

            if confirm_storage.lower() == 'y':
                hasil_upgrade = upgrade_storage(confirm_storage, proxy)
                if hasil_upgrade:
                    print(hasil_upgrade)
                    time.sleep(1)

            if confirm_mining.lower() == 'y':
                hasil_upgrade1 = upgrade_mining(confirm_mining, proxy)
                if hasil_upgrade1:
                    print(hasil_upgrade1)
                    time.sleep(1)

            if confirm_holy.lower() == 'y':
                hasil_upgrade2 = upgrade_holy(confirm_holy, proxy)
                if hasil_upgrade2:
                    print(hasil_upgrade2)
                    time.sleep(1)

            if check_balance(proxy):
                response = requests.post(url_claim, headers=headers, proxies=proxy_dict)
                if response.status_code == 200:
                    print(f"{Fore.GREEN+Style.BRIGHT}[ Claim ]: Claim thành công")
                elif response.status_code == 400:
                    response_data = response.json()
                    print(f"{Fore.RED+Style.BRIGHT}[ Claim ]: Chưa đến giờ claim")
                else:
                    print("Đã xảy ra lỗi, mã trạng thái:", response.status_code)

                checkin_daily(proxy)
                catch_worm(proxy)
                if confirm_task.lower() == 'y':
                    get_tasks(proxy)

        for i in range(7200, 0, -1):
            sys.stdout.write(f"\r{Fore.CYAN+Style.BRIGHT}============ Đã xử lý hết tài khoản, đợi {i} giây trước khi tiếp tục vòng lặp ============")
            sys.stdout.flush()
            time.sleep(1)
        print()
        clear_console()

if __name__ == "__main__":
    main()