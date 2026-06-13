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
        
        emails = driver.find_elements(By.CSS_SELECTOR, "input[type='email']")
        print("Number of email inputs found:", len(emails))
        for i, el in enumerate(emails):
            print(f"Input {i} HTML:", el.get_attribute("outerHTML"))
            print(f"Input {i} Displayed:", el.is_displayed())
            print(f"Input {i} Enabled:", el.is_enabled())
            
    finally:
        driver.quit()

if __name__ == "__main__":
    main()
