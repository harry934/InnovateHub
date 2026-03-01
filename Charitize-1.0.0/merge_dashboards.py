import os
import re

def extract_section(filepath, start_marker, end_marker=None):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    start_idx = content.find(start_marker)
    if start_idx == -1:
        return ""
    
    if end_marker:
        end_idx = content.find(end_marker, start_idx)
        if end_idx == -1:
            end_idx = len(content)
        return content[start_idx:end_idx]
    else:
        # Default: if no end marker, just a heuristic or something.
        pass

def main():
    base_dir = r"c:\Users\kibag\Desktop\USIU DOCS\4th Year\SWE 3090 A\InnovateHub\Charitize-1.0.0"
    inno_file = os.path.join(base_dir, "innovator-dashboard.html")
    mentor_file = os.path.join(base_dir, "mentor-dashboard.html")
    index_file = os.path.join(base_dir, "index.html")

    # 1. Extract Innovator Sections
    # From <div id="projectsSection" to the end of <div id="notificationsSection" ... </div></div>
    with open(inno_file, 'r', encoding='utf-8') as f:
        inno_content = f.read()

    start_inno = inno_content.find('<!-- My Projects Section -->')
    end_inno = inno_content.find('</div>\n        </div>\n    </div>\n    \n    <!-- Scripts -->')
    
    innovator_html = inno_content[start_inno:end_inno]

    # 2. Extract Mentor Sections
    with open(mentor_file, 'r', encoding='utf-8') as f:
        mentor_content = f.read()

    start_mentor = mentor_content.find('<!-- Overview Section -->')
    end_mentor = mentor_content.find('</div>\n      </div>\n    </div>\n\n    <!-- ONBOARDING MODAL -->')
    
    mentor_html = mentor_content[start_mentor:end_mentor]

    # Clean up Mentor sections to avoid ID conflicts with Innovator sections
    # Remove the Mentor notifications section entirely since we'll use the shared Innovator one.
    mentor_notif_start = mentor_html.find('<!-- Notifications Section -->')
    mentor_notif_end = mentor_html.find('<!-- Profile Section -->', mentor_notif_start)
    if mentor_notif_start != -1 and mentor_notif_end != -1:
        mentor_html = mentor_html[:mentor_notif_start] + mentor_html[mentor_notif_end:]

    # Rename Mentor profile IDs
    mentor_html = mentor_html.replace('id="profileSection"', 'id="mentorProfileSection"')
    mentor_html = mentor_html.replace('id="profileForm"', 'id="mentorProfileForm"')
    mentor_html = mentor_html.replace('id="profileName"', 'id="mentorProfileName"')
    mentor_html = mentor_html.replace('id="profileBio"', 'id="mentorProfileBio"')

    # 3. Inject Modals from Mentor Dashboard
    modals_start = mentor_content.find('<!-- ONBOARDING MODAL -->')
    modals_end = mentor_content.find('<!-- Core Logic -->')
    modals_html = mentor_content[modals_start:modals_end].replace('<script src="https://code.jquery.com/jquery-3.4.1.min.js"></script>', '').replace('<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.0.0/dist/js/bootstrap.bundle.min.js"></script>', '').replace('<script type="module" src="js/firebase-config.js"></script>', '')
    
    # 4. Inject into index.html
    with open(index_file, 'r', encoding='utf-8') as f:
        index_content = f.read()
    
    combined_dashboard_html = f"""
            {innovator_html}
            
            {mentor_html}
            
            {modals_html}
    """
    
    new_index_content = index_content.replace('<!-- DASHBOARD_SECTIONS_PLACEHOLDER -->', combined_dashboard_html)
    
    # Also add the missing CSS link for responsive dashboard
    if 'responsive-dashboard.css' not in new_index_content:
        new_index_content = new_index_content.replace('<!-- Unified Dashboard Styles -->', '<!-- Unified Dashboard Styles -->\n    <link href="css/responsive-dashboard.css?v=2.1.0" rel="stylesheet">')

    with open(index_file, 'w', encoding='utf-8') as f:
        f.write(new_index_content)
        
    print("Dashboard sections successfully merged into index.html")

if __name__ == "__main__":
    main()
