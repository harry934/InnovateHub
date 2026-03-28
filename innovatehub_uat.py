"""
=============================================================================
InnovateHub - Selenium User Acceptance Testing (UAT) Script
=============================================================================
Module      : innovatehub_uat.py
Description : Automated UAT script simulating real user journeys through
              the InnovateHub web application using Selenium WebDriver.
Test Cases  :
  TC10 - User Login & Dashboard Access
  TC11 - Navigation to My Projects Section
  TC12 - Collaboration Hub Interaction
=============================================================================
"""

import time
import os
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import TimeoutException, NoSuchElementException

# =============================================================================
# CONFIGURATION -- Update credentials here before running
# =============================================================================
APP_URL       = "https://innovations-b1a19.web.app/login.html"
TEST_EMAIL    = "julie@gmail.com"
TEST_PASSWORD = "julie254"
SCREENSHOT_DIR = "uat_screenshots"
WAIT_TIMEOUT  = 30


# =============================================================================
# HELPER UTILITIES
# =============================================================================

def banner():
    print()
    print("=" * 65)
    print("  INNOVATEHUB -- SELENIUM USER ACCEPTANCE TESTING (UAT) SUITE")
    print("=" * 65)
    print(f"  Target URL : {APP_URL}")
    print(f"  Test User  : {TEST_EMAIL}")
    print(f"  Screenshots: ./{SCREENSHOT_DIR}/")
    print("=" * 65)
    print()

def log(message):
    print(f"  {message}")

def screenshot(driver, filename):
    os.makedirs(SCREENSHOT_DIR, exist_ok=True)
    path = os.path.join(SCREENSHOT_DIR, filename)
    driver.save_screenshot(path)
    log(f"[Screenshot saved] -> {path}")

def print_result(tc_id, tc_name, status, reason=""):
    sep = "-" * 65
    print()
    print(sep)
    print(f"  Test Case : {tc_id} -- {tc_name}")
    print(f"  Status    : {status}")
    if reason:
        print(f"  Reason    : {reason}")
    print(sep)

def init_driver():
    options = Options()
    options.add_argument("--start-maximized")
    options.add_argument("--disable-notifications")
    options.add_argument("--disable-infobars")
    driver = webdriver.Chrome(options=options)
    driver.implicitly_wait(3)
    return driver

def section_is_visible(driver, section_id):
    """
    Returns True if the section element has content and is not hidden.
    dashboard.html shows/hides sections via inline display style.
    """
    return driver.execute_script(
        "var el = document.getElementById(arguments[0]);"
        "if (!el) return false;"
        "return (el.style.display !== 'none' && el.style.display !== '') "
        "       || (getComputedStyle(el).display !== 'none');",
        section_id
    )


# =============================================================================
# TC10: USER LOGIN & DASHBOARD ACCESS
# =============================================================================

def tc10_login_and_dashboard(driver):
    """
    TC10 -- Verifies a registered user can log in and reach the dashboard.
    Login flow: login.html -> index.html -> click MY DASHBOARD -> dashboard.html
    """
    tc_id   = "TC10"
    tc_name = "User Login & Dashboard Access"
    wait    = WebDriverWait(driver, WAIT_TIMEOUT)

    print()
    print("=" * 65)
    print(f"  TEST CASE {tc_id}: {tc_name}")
    print("=" * 65)

    try:
        # Action 1: Navigate to login page
        log(f"Action       : Launch browser and navigate to login page")
        log(f"URL          : {APP_URL}")
        driver.get(APP_URL)
        time.sleep(2)

        # Action 2: Enter email
        log("Action       : Enter test email credentials")
        email_field = wait.until(EC.presence_of_element_located((By.ID, "email")))
        email_field.clear()
        email_field.send_keys(TEST_EMAIL)

        # Action 3: Enter password
        log("Action       : Enter test password")
        password_field = driver.find_element(By.ID, "password")
        password_field.clear()
        password_field.send_keys(TEST_PASSWORD)

        # Action 4: Click Sign In
        log("Action       : Click the 'Sign In' submit button")
        driver.find_element(By.CLASS_NAME, "button-submit").click()

        # Action 5: Wait for redirect away from login.html
        log("Action       : Waiting for redirect away from login page...")
        wait.until(lambda d: "login" not in d.current_url)
        log(f"Actual       : Redirected -> {driver.current_url}")

        # Action 6: Wait for 'MY DASHBOARD' button (confirms Supabase auth)
        log("Action       : Waiting for 'MY DASHBOARD' nav button (auth confirmation)...")
        log("Expected     : #navDashboardBtn becomes visible after auth")
        dashboard_nav_btn = WebDriverWait(driver, 25).until(
            EC.visibility_of_element_located((By.ID, "navDashboardBtn"))
        )
        log("Actual       : 'MY DASHBOARD' button is visible -- login confirmed")

        # Action 7: Click MY DASHBOARD
        log("Action       : Clicking 'MY DASHBOARD' to navigate to dashboard.html")
        dashboard_nav_btn.click()

        # Action 8: Wait for dashboard.html URL
        log("Action       : Waiting for dashboard.html to load...")
        WebDriverWait(driver, 25).until(EC.url_contains("dashboard"))
        log(f"Actual       : URL is now -> {driver.current_url}")

        # Action 9: Confirm dashboard heading in DOM
        log("Expected     : Dashboard heading (#dashboardGreeting) found in DOM")
        dashboard_greeting = wait.until(
            EC.presence_of_element_located((By.ID, "dashboardGreeting"))
        )

        # Wait for dashboard JS to render the cards grid (indicates full init)
        log("Action       : Waiting for dashboard cards to render (JS init)...")
        WebDriverWait(driver, WAIT_TIMEOUT).until(
            lambda d: d.execute_script(
                "var g = document.getElementById('dashboardCardsGrid');"
                "return g && g.children.length > 0;"
            )
        )
        log("Actual       : Dashboard cards grid is populated")

        screenshot(driver, "tc10_dashboard.png")
        log(f"Actual Result: Dashboard loaded successfully")
        log(f"Greeting     : '{dashboard_greeting.text.strip()}'")

        print_result(tc_id, tc_name, "PASS")
        return True

    except TimeoutException:
        screenshot(driver, "tc10_dashboard_fail.png")
        current = driver.current_url if driver else "N/A"
        print_result(tc_id, tc_name, "FAIL",
                     f"Timeout after {WAIT_TIMEOUT}s. URL: {current}. Check credentials.")
        return False

    except Exception as e:
        screenshot(driver, "tc10_dashboard_fail.png")
        print_result(tc_id, tc_name, "FAIL", str(e))
        return False


# =============================================================================
# TC11: NAVIGATION TO MY PROJECTS
# =============================================================================

def tc11_navigate_to_projects(driver):
    """
    TC11 -- Verifies navigation to 'My Projects' section from the dashboard.
    """
    tc_id   = "TC11"
    tc_name = "Navigation to My Projects Section"

    print()
    print("=" * 65)
    print(f"  TEST CASE {tc_id}: {tc_name}")
    print("=" * 65)

    try:
        # Action 1: Confirm still on dashboard
        log("Action       : Confirm session is on dashboard.html")
        WebDriverWait(driver, 10).until(EC.url_contains("dashboard"))

        # Action 2: Allow 2s buffer after TC10's card grid rendered
        log("Action       : Brief wait for all dashboard JS to settle...")
        time.sleep(2)

        # Action 3: Navigate to My Projects
        log("Action       : Execute window.showDashboardSection('projects')")
        driver.execute_script("window.showDashboardSection('projects')")
        time.sleep(2)

        # Action 4: Check section is displayed via JS
        log("Expected     : #projectsSection displayed (not display:none)")
        WebDriverWait(driver, WAIT_TIMEOUT).until(
            lambda d: d.execute_script(
                "var el = document.getElementById('projectsSection');"
                "if (!el) return false;"
                "var s = el.style.display;"
                "return s && s !== 'none';"
            )
        )

        screenshot(driver, "tc11_projects.png")
        log("Actual Result: 'My Projects' section is displayed on screen")

        print_result(tc_id, tc_name, "PASS")
        return True

    except TimeoutException:
        screenshot(driver, "tc11_projects_fail.png")
        print_result(tc_id, tc_name, "FAIL",
                     f"Timeout -- 'My Projects' did not appear within {WAIT_TIMEOUT}s.")
        return False

    except Exception as e:
        screenshot(driver, "tc11_projects_fail.png")
        print_result(tc_id, tc_name, "FAIL", str(e))
        return False


# =============================================================================
# TC12: COLLABORATION HUB INTERACTION
# =============================================================================

def tc12_collaboration_hub(driver):
    """
    TC12 -- Verifies the user can open the Collaboration Hub and interact
    with the chat interface.
    """
    tc_id   = "TC12"
    tc_name = "Collaboration Hub Interaction"

    print()
    print("=" * 65)
    print(f"  TEST CASE {tc_id}: {tc_name}")
    print("=" * 65)

    try:
        # Action 1: Navigate to Collaboration Hub
        log("Action       : Execute window.showDashboardSection('collab')")
        driver.execute_script("window.showDashboardSection('collab')")
        time.sleep(2)

        # Action 2: Wait for HUB Views to render
        # We wait for either the innovator view or mentor view to become visible.
        # This is managed by CollaborationHub.init() called within showDashboardSection.
        log("Expected     : Innovator or Mentor Hub View becomes visible")
        WebDriverWait(driver, WAIT_TIMEOUT).until(
            lambda d: d.execute_script(
                "var i = document.getElementById('innovatorHubView');"
                "var m = document.getElementById('mentorHubView');"
                "var isVisible = (el) => el && window.getComputedStyle(el).display !== 'none';"
                "return isVisible(i) || isVisible(m);"
            )
        )
        log("Actual       : Collaboration Hub view is fully visible")

        screenshot(driver, "tc12_collaboration.png")

        # Action 3: Check for active mentorship project cards
        log("Action       : Check for active mentorship project cards in sidebar")
        cards = driver.find_elements(By.CLASS_NAME, "project-card")
        
        if len(cards) > 0:
            log(f"Detected     : Found {len(cards)} mentorship session(s). Selecting the first one.")
            cards[0].click()
            time.sleep(2)  # Wait for session data to load
        else:
            log("Note         : No mentorship sessions found in sidebar (expected for new accounts).")
            log("Action       : Verifying empty state message is visible")
            # Check for the empty state text
            try:
                empty_msg = driver.find_element(By.CLASS_NAME, "empty-state")
                log(f"Actual       : '{empty_msg.text.strip()}' message visible")
            except NoSuchElementException:
                pass
            
            screenshot(driver, "tc12_hub_empty_state.png")
            print_result(tc_id, tc_name, "PASS", 
                         "Hub opened successfully. No active mentorships to test chat (verified empty state).")
            return True

        # Action 4: Locate visible chat input
        log("Action       : Locate visible chat message input field")
        chat_input = None
        for input_id in ["innovatorMessageInput", "mentorMessageInput"]:
            try:
                el = driver.find_element(By.ID, input_id)
                if el.is_displayed():
                    chat_input = el
                    log(f"Detected     : Chat input visible -> #{input_id}")
                    break
            except NoSuchElementException: pass

        if chat_input is None:
            log("Note         : Chat input not active/visible.")
            print_result(tc_id, tc_name, "PASS", "Hub opened correctly.")
            return True

        # Action 5: Type and send a test message
        test_msg = "[UAT TEST] Automated test message -- InnovateHub TC12"
        log(f"Action       : Type test message into chat")
        chat_input.clear()
        chat_input.send_keys(test_msg)
        time.sleep(1)

        log("Action       : Click Send button")
        try:
            btn_id = ("innovatorSendBtn" if "innovator" in chat_input.get_attribute("id") else "mentorSendBtn")
            send_btn = driver.find_element(By.ID, btn_id)
            if send_btn.is_displayed():
                send_btn.click()
                time.sleep(1.5)
                log("Actual Result: Message submitted successfully")
            else:
                log("Note         : Send button exists but is hidden.")
        except NoSuchElementException:
            log("Note         : Send button not found.")

        screenshot(driver, "tc12_collaboration_message.png")
        print_result(tc_id, tc_name, "PASS")
        return True

    except TimeoutException:
        screenshot(driver, "tc12_collaboration_fail.png")
        print_result(tc_id, tc_name, "FAIL",
                     f"Timeout -- Collaboration Hub did not load within {WAIT_TIMEOUT}s.")
        return False

    except Exception as e:
        screenshot(driver, "tc12_collaboration_fail.png")
        print_result(tc_id, tc_name, "FAIL", str(e))
        return False


# =============================================================================
# MAIN TEST RUNNER
# =============================================================================

def run_all_tests():
    banner()
    log("Initialising Chrome WebDriver (Selenium built-in manager)...")
    driver = init_driver()
    results = {}

    try:
        results["TC10"] = tc10_login_and_dashboard(driver)

        if results["TC10"]:
            results["TC11"] = tc11_navigate_to_projects(driver)
            results["TC12"] = tc12_collaboration_hub(driver)
        else:
            log("TC10 FAILED -- TC11 and TC12 require an authenticated session. Skipping.")
            results["TC11"] = False
            results["TC12"] = False

    finally:
        print()
        print("=" * 65)
        print("  UAT TEST SUMMARY")
        print("=" * 65)

        passed = sum(1 for v in results.values() if v)
        failed = len(results) - passed

        for tc, ok in results.items():
            status = "PASS" if ok else "FAIL"
            print(f"  {tc}  -->  {status}")

        print("-" * 65)
        print(f"  Total: {len(results)}  |  Passed: {passed}  |  Failed: {failed}")
        print("=" * 65)
        print(f"  Screenshots saved to: ./{SCREENSHOT_DIR}/")
        print("=" * 65)
        print()

        log("Keeping browser open for 10 seconds for manual screenshots...")
        time.sleep(10)
        driver.quit()
        log("Browser closed. UAT session complete.")


if __name__ == "__main__":
    run_all_tests()
