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
        driver.get("http://localhost:3000/signin")
        time.sleep(4)
        
        email_input = driver.find_element(By.CSS_SELECTOR, "input[type='email']")
        pass_input = driver.find_element(By.CSS_SELECTOR, "input[type='password']")
        
        print("Before typing:")
        print("Email val:", email_input.get_attribute("value"))
        print("Pass val:", pass_input.get_attribute("value"))
        
        print("Typing...")
        email_input.click()
        email_input.clear()
        email_input.send_keys("test1@ev.app")
        
        pass_input.click()
        pass_input.clear()
        pass_input.send_keys("Test@1234")
        
        print("After typing:")
        print("Email val:", email_input.get_attribute("value"))
        print("Pass val:", pass_input.get_attribute("value"))
        
        # Check React state by looking at value attribute and dispatching events if needed
        submit_btn = driver.find_element(By.CSS_SELECTOR, "button[type='submit']")
        driver.execute_script("arguments[0].click();", submit_btn)
        
        time.sleep(4)
        print("URL after submit:", driver.current_url)
        print("Body text:")
        print(driver.find_element(By.TAG_NAME, "body").text)
        
    finally:
        driver.quit()

if __name__ == "__main__":
    main()
