import pytest
import time
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

@pytest.fixture(scope="module")
def driver():
    chrome_options = Options()
    # Run in headless mode only in CI environments
    import os
    if os.environ.get("GITHUB_ACTIONS") == "true":
        chrome_options.add_argument("--headless")
        chrome_options.add_argument("--no-sandbox")
        chrome_options.add_argument("--disable-dev-shm-usage")
    # Bypass camera prompts and supply fake camera stream for automated testing
    chrome_options.add_argument("--use-fake-ui-for-media-stream")
    chrome_options.add_argument("--use-fake-device-for-media-stream")
    
    driver = webdriver.Chrome(options=chrome_options)
    driver.implicitly_wait(5)
    yield driver
    driver.quit()

def test_create_account_and_login_with_remember_me(driver):
    # Load the web application
    driver.get("http://localhost:8000")
    
    # 1. Verify we are initially on the login page
    login_page = driver.find_element(By.ID, "loginPage")
    assert login_page.is_displayed(), "Login page should be visible initially"
    
    # 2. Go to Create Account page
    create_btn = driver.find_element(By.XPATH, "//button[text()='Create Account']")
    create_btn.click()
    
    # Verify create page is displayed
    create_page = driver.find_element(By.ID, "createPage")
    assert create_page.is_displayed(), "Create account page should be visible"
    
    # Click "Back" button to verify it returns to login page
    back_btn = driver.find_element(By.XPATH, "//button[text()='Back']")
    back_btn.click()
    assert login_page.is_displayed(), "Should return to login page after clicking Back"
    
    # Go back to Create Account page again
    create_btn = driver.find_element(By.XPATH, "//button[text()='Create Account']")
    create_btn.click()
    assert create_page.is_displayed(), "Create account page should be visible again"
    
    # 3. Fill in details and create account
    driver.find_element(By.ID, "newUser").send_keys("teacher1")
    driver.find_element(By.ID, "newPass").send_keys("securepassword123")
    driver.find_element(By.XPATH, "//button[text()='Create']").click()
    
    # Handle the "Account Created Successfully" alert
    WebDriverWait(driver, 5).until(EC.alert_is_present())
    alert = driver.switch_to.alert
    assert "Account Created Successfully" in alert.text
    alert.accept()
    
    # 4. Verify we are returned to the login page
    assert login_page.is_displayed(), "Should return to login page after account creation"
    
    # 5. Check the "Remember Session" checkbox
    remember_checkbox = driver.find_element(By.ID, "rememberMe")
    if not remember_checkbox.is_selected():
        remember_checkbox.click()
        
    # 6. Try logging in with the new credentials
    driver.find_element(By.ID, "username").send_keys("teacher1")
    driver.find_element(By.ID, "password").send_keys("securepassword123")
    driver.find_element(By.XPATH, "//button[text()='Login']").click()
    
    # 7. Verify we are now logged in and dashboard is visible
    WebDriverWait(driver, 5).until(
        lambda d: not "hidden" in d.find_element(By.ID, "dashboard").get_attribute("class")
    )
    dashboard = driver.find_element(By.ID, "dashboard")
    assert dashboard.is_displayed(), "Dashboard should be visible after successful login"

def test_session_persistence_on_reload(driver):
    # Refresh the browser page to test auto-login persistence
    driver.refresh()
    
    # Verify we bypass the login page and land straight on the dashboard
    WebDriverWait(driver, 5).until(
        lambda d: not "hidden" in d.find_element(By.ID, "dashboard").get_attribute("class")
    )
    dashboard = driver.find_element(By.ID, "dashboard")
    assert dashboard.is_displayed(), "Should auto-login and show dashboard on page reload"

def test_dashboard_metrics_and_student_count(driver):
    # Verify average attention, student count, and dominant emotion elements are present
    students_el = driver.find_element(By.ID, "students")
    
    # Verify initial student count is automatically detected (between 4 and 10)
    initial_count = int(students_el.get_attribute("textContent"))
    assert 4 <= initial_count <= 10, f"Initial automatic count should be between 4 and 10, found {initial_count}"
    
    # Click "Re-scan Classroom" button to trigger auto-detection
    rescan_btn = driver.find_element(By.XPATH, "//button[contains(text(), 'Re-scan')]")
    rescan_btn.click()
    
    # Verify status changes to scanning
    status_el = driver.find_element(By.ID, "detectionStatus")
    WebDriverWait(driver, 5).until(lambda d: "Scanning" in status_el.text)
    
    # Wait for scan to complete and status to show active count
    WebDriverWait(driver, 5).until(lambda d: "Active (" in status_el.text)
    
    # Verify student count is updated and is a number between 4 and 10
    detected_count = int(students_el.get_attribute("textContent"))
    assert 4 <= detected_count <= 10, f"Detected count should be between 4 and 10, found {detected_count}"

def test_sidebar_navigation_and_features(driver):
    # 1. Navigate to Real-time Attention
    driver.find_element(By.ID, "nav-attention").click()
    attention_sec = driver.find_element(By.ID, "attentionSection")
    assert not "hidden" in attention_sec.get_attribute("class"), "Attention section should not be hidden"
    assert driver.find_element(By.ID, "attentionGaugeValue").is_displayed()
    
    # 2. Navigate to Student Registry and Add a Student
    driver.find_element(By.ID, "nav-registry").click()
    registry_sec = driver.find_element(By.ID, "registrySection")
    assert not "hidden" in registry_sec.get_attribute("class"), "Registry section should not be hidden"
    
    # Fill student registration form
    driver.find_element(By.ID, "regStudentName").send_keys("Marcus Aurelius")
    driver.find_element(By.ID, "regStudentSeat").send_keys("15")
    driver.find_element(By.XPATH, "//button[text()='Add Student']").click()
    
    # Verify registered student appears in the roster table
    WebDriverWait(driver, 5).until(
        lambda d: "Marcus Aurelius" in d.find_element(By.ID, "registryTableBody").get_attribute("innerHTML")
    )
    
    # 3. Navigate to Student Emotion Analysis
    driver.find_element(By.ID, "nav-emotions").click()
    emotions_sec = driver.find_element(By.ID, "emotionsSection")
    assert not "hidden" in emotions_sec.get_attribute("class"), "Emotions section should not be hidden"
    
    # Verify progress bars are rendered
    emotions_rows = driver.find_elements(By.CLASS_NAME, "emotion-row")
    assert len(emotions_rows) > 0, "Should display emotions progress bar rows"
    
    # 4. Navigate back to Dashboard home
    driver.find_element(By.ID, "nav-home").click()
    home_sec = driver.find_element(By.ID, "homeSection")
    assert not "hidden" in home_sec.get_attribute("class"), "Home section should not be hidden"

def test_logout(driver):
    # 1. Navigate to Logout Confirmation section
    driver.find_element(By.ID, "nav-logout-view").click()
    logout_sec = driver.find_element(By.ID, "logoutViewSection")
    assert not "hidden" in logout_sec.get_attribute("class"), "Logout section should not be hidden"
    
    # 2. Click Logout button
    driver.find_element(By.XPATH, "//button[text()='Logout Immediately']").click()
    
    # Verify we are redirected back to login page
    login_page = driver.find_element(By.ID, "loginPage")
    dashboard = driver.find_element(By.ID, "dashboard")
    assert login_page.is_displayed(), "Login page should be visible on logout"
    assert "hidden" in dashboard.get_attribute("class"), "Dashboard should be hidden on logout"
    
    # Verify credentials and checkbox inputs are cleared
    assert driver.find_element(By.ID, "username").get_attribute("value") == "", "Username field should be empty"
    assert driver.find_element(By.ID, "password").get_attribute("value") == "", "Password field should be empty"
    assert not driver.find_element(By.ID, "rememberMe").is_selected(), "Remember Me checkbox should be unselected"
