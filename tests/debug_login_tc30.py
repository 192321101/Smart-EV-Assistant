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
        # Step 1: Initial Login (replicating TC-028/029 state)
        print("Replicating initial login...")
        driver.get("http://localhost:3000/signin")
        time.sleep(3)
        
        email_input = driver.find_element(By.CSS_SELECTOR, "input[type='email']")
        pass_input = driver.find_element(By.CSS_SELECTOR, "input[type='password']")
        submit_btn = driver.find_element(By.CSS_SELECTOR, "button[type='submit']")
        
        email_input.click()
        email_input.clear()
        email_input.send_keys("test1@ev.app")
        pass_input.click()
        pass_input.clear()
        pass_input.send_keys("Test@1234")
        driver.execute_script("arguments[0].click();", submit_btn)
        time.sleep(6)
        print("Logged in. Current URL:", driver.current_url)
        
        # Step 2: TC-030 Clear state and navigate
        print("Executing TC-030 clear state...")
        driver.get("http://localhost:3000/signin")
        time.sleep(2)
        driver.execute_script("localStorage.clear(); sessionStorage.clear();")
        driver.delete_all_cookies()
        
        print("Navigating to /dashboard...")
        driver.get("http://localhost:3000/dashboard")
        time.sleep(8)
        print("After TC-030 clear: current URL =", driver.current_url)
        
        # Step 3: Run finally do_login
        print("Attempting finally do_login...")
        driver.get("http://localhost:3000/signin")
        time.sleep(6)
        
        email_input = driver.find_element(By.CSS_SELECTOR, "input[type='email']")
        pass_input = driver.find_element(By.CSS_SELECTOR, "input[type='password']")
        submit_btn = driver.find_element(By.CSS_SELECTOR, "button[type='submit']")
        
        print("Filling credentials...")
        email_input.click()
        email_input.clear()
        email_input.send_keys("test1@ev.app")
        
        pass_input.click()
        pass_input.clear()
        pass_input.send_keys("Test@1234")
        time.sleep(0.5)
        
        print("Values after typing:")
        print("Email val:", email_input.get_attribute("value"))
        print("Pass val:", pass_input.get_attribute("value"))
        
        print("Clicking submit...")
        driver.execute_script("arguments[0].click();", submit_btn)
        time.sleep(9)
        
        print("Final URL:", driver.current_url)
        print("Final body text:")
        print(driver.find_element(By.TAG_NAME, "body").text)
        
    finally:
        driver.quit()

if __name__ == "__main__":
    main()
