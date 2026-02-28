import os

def main():
    base_dir = r"c:\Users\kibag\Desktop\USIU DOCS\4th Year\SWE 3090 A\InnovateHub\Charitize-1.0.0"
    inno_file = os.path.join(base_dir, "innovator-dashboard.html")
    output_js_file = os.path.join(base_dir, "js", "innovator-dashboard.js")
    index_file = os.path.join(base_dir, "index.html")

    with open(inno_file, 'r', encoding='utf-8') as f:
        content = f.read()

    start_idx = content.find('<script type="module">')
    if start_idx == -1:
        print("Could not find script block")
        return
    
    end_idx = content.find('</script>', start_idx)
    raw_script = content[start_idx + len('<script type="module">'):end_idx].strip()

    # Refactor `window.showSection` to `window.showDashboardSection`
    raw_script = raw_script.replace("window.showSection(", "window.showDashboardSection(")

    # Remove the global `window.logout` since it's already defined in shared-ui.js natively
    # Or just let it be, but let's just make it distinct
    
    # Check if we should only run if there's an actual #unified-dashboard-container
    wrapper = f"""
// Auto-extracted from innovator-dashboard.html
{raw_script}
"""

    with open(output_js_file, 'w', encoding='utf-8') as f:
        f.write(wrapper)
        
    print("Successfully created js/innovator-dashboard.js")

    # Now add the script tag to index.html
    with open(index_file, 'r', encoding='utf-8') as f:
        idx_content = f.read()
        
    if 'src="js/innovator-dashboard.js"' not in idx_content:
        # We append it below innovate-hub.js
        idx_content = idx_content.replace(
            '<script type="module" src="js/innovate-hub.js?v=2.1.6"></script>',
            '<script type="module" src="js/innovate-hub.js?v=2.1.6"></script>\n    <script type="module" src="js/innovator-dashboard.js?v=1.0.0"></script>'
        )
        
        with open(index_file, 'w', encoding='utf-8') as f:
            f.write(idx_content)
        print("Injected script tag into index.html")

if __name__ == "__main__":
    main()
