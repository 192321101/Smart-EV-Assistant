import time
import sys
import io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from webdriver_manager.chrome import ChromeDriverManager

def main():
    opts = Options()
    opts.add_argument("--headless=new")
    opts.add_argument("--window-size=1920,1080")
    opts.add_argument("--no-sandbox")
    opts.add_argument("--disable-dev-shm-usage")
    
    svc = Service(ChromeDriverManager().install())
    driver = webdriver.Chrome(service=svc, options=opts)
    
    try:
        print("Navigating to signin...")
        driver.get("http://localhost:3000/signin")
        time.sleep(3)
        
        print("Console logs at start:")
        for entry in driver.get_log('browser'):
            print(str(entry))
            
        print("Body text at start:")
        print(driver.find_element(By.TAG_NAME, "body").text)
        
        # Check inputs
        email_input = driver.find_element(By.CSS_SELECTOR, "input[type='email']")
        pass_input = driver.find_element(By.CSS_SELECTOR, "input[type='password']")
        submit_btn = driver.find_element(By.CSS_SELECTOR, "button[type='submit']")
        
        print("Filling credentials...")
        email_input.clear()
        email_input.send_keys("test1@ev.app")
        pass_input.clear()
        pass_input.send_keys("Test@1234")
        
        print("Clicking submit...")
        submit_btn.click()
        
        time.sleep(6)
        print("Current URL:", driver.current_url)
        print("Body text after login attempt:")
        print(driver.find_element(By.TAG_NAME, "body").text)
        
        print("Console logs after login attempt:")
        for entry in driver.get_log('browser'):
            print(str(entry))
            
    finally:
        driver.quit()

if __name__ == "__main__":
    main()
