import os
import glob

def clean_links():
    base_dir = r"c:\Users\kibag\Desktop\USIU DOCS\4th Year\SWE 3090 A\InnovateHub\Charitize-1.0.0"
    html_files = glob.glob(os.path.join(base_dir, "*.html"))
    
    for filepath in html_files:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
            
        original_content = content
        
        # Replace the nav link
        content = content.replace(
            'href="innovator-dashboard.html" class="nav-item nav-link d-none logged-in-only" id="navDashboardLink"',
            'href="javascript:void(0)" onclick="goToDashboard()" class="nav-item nav-link d-none logged-in-only" id="navDashboardLink"'
        )
        # Any other stray innovator/mentor dashboard links in main templates
        content = content.replace('href="innovator-dashboard.html"', 'href="javascript:void(0)" onclick="goToDashboard()"')
        content = content.replace('href="mentor-dashboard.html"', 'href="javascript:void(0)" onclick="goToDashboard()"')
        
        if content != original_content:
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(content)
            print(f"Updated links in {os.path.basename(filepath)}")

clean_links()
