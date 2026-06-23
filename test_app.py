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
    # Configuration for headless CI environments
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

def test_create_account_and_login(driver):
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
    
    # 5. Try logging in with the new credentials
    driver.find_element(By.ID, "username").send_keys("teacher1")
    driver.find_element(By.ID, "password").send_keys("securepassword123")
    driver.find_element(By.XPATH, "//button[text()='Login']").click()
    
    # 6. Verify we are now logged in and dashboard is visible
    WebDriverWait(driver, 5).until(
        lambda d: not "hidden" in d.find_element(By.ID, "dashboard").get_attribute("class")
    )
    dashboard = driver.find_element(By.ID, "dashboard")
    assert dashboard.is_displayed(), "Dashboard should be visible after successful login"

def test_dashboard_metrics_and_student_count(driver):
    # Verify average attention, student count, and dominant emotion elements are present
    students_el = driver.find_element(By.ID, "students")
    avg_attention_el = driver.find_element(By.ID, "avgAttention")
    main_emotion_el = driver.find_element(By.ID, "mainEmotion")
    
    # Verify initial student count defaults to 5
    assert students_el.text == "5", "Default student count should be 5"
    
    # Change the student count
    input_box = driver.find_element(By.ID, "studentCountInput")
    input_box.clear()
    input_box.send_keys("12")
    driver.find_element(By.XPATH, "//button[text()='Apply']").click()
    
    # Verify student count is updated to 12
    WebDriverWait(driver, 5).until(EC.text_to_be_present_in_element((By.ID, "students"), "12"))
    assert students_el.text == "12", "Student count should update to 12"

def test_sidebar_navigation(driver):
    # 1. Navigate to Live Camera
    driver.find_element(By.ID, "nav-camera").click()
    # Verify camera section is displayed and not hidden
    camera_sec = driver.find_element(By.ID, "cameraSection")
    assert not "hidden" in camera_sec.get_attribute("class"), "Camera section should not be hidden"
    
    # 2. Navigate to Students section
    driver.find_element(By.ID, "nav-students").click()
    students_sec = driver.find_element(By.ID, "studentsSection")
    assert not "hidden" in students_sec.get_attribute("class"), "Students section should not be hidden"
    
    # Verify student cards are generated and match the student count
    student_cards = driver.find_elements(By.CLASS_NAME, "student-card")
    assert len(student_cards) == 12, f"Should display 12 student cards, found {len(student_cards)}"
    
    # 3. Navigate to Quick Analysis
    driver.find_element(By.ID, "nav-analysis").click()
    analysis_sec = driver.find_element(By.ID, "analysisSection")
    assert not "hidden" in analysis_sec.get_attribute("class"), "Analysis section should not be hidden"
    
    analysis_text = driver.find_element(By.ID, "analysisText").text
    assert "attention" in analysis_text.lower(), "Analysis text should contain focus information"
    
    # 4. Navigate back to Dashboard home
    driver.find_element(By.ID, "nav-home").click()
    home_sec = driver.find_element(By.ID, "homeSection")
    assert not "hidden" in home_sec.get_attribute("class"), "Home section should not be hidden"

def test_logout(driver):
    # Click logout button
    driver.find_element(By.CLASS_NAME, "logout-btn").click()
    
    # Verify we are redirected to login page and dashboard is hidden
    login_page = driver.find_element(By.ID, "loginPage")
    dashboard = driver.find_element(By.ID, "dashboard")
    assert login_page.is_displayed(), "Login page should be visible on logout"
    assert "hidden" in dashboard.get_attribute("class"), "Dashboard should be hidden on logout"
    
    # Verify credentials inputs are cleared
    assert driver.find_element(By.ID, "username").get_attribute("value") == "", "Username field should be empty"
    assert driver.find_element(By.ID, "password").get_attribute("value") == "", "Password field should be empty"
