import os
import re
from datetime import datetime

# Specify the path to your folder containing the HTML files
folder_path = '.'

# Get the current date and year
current_date = datetime.now().strftime("%B %d, %Y")
current_year = datetime.now().year

# Define the regex pattern to find the specific line
pattern = r'<p class="smallest-text">Revised: .*?\. &copy; \d{4}(?:-\d{4})? SNAPlab</p>'

def get_new_line(match):
    """Generate the updated line with the new date and copyright years."""
    if current_year == 2023:
        return f'<p class="smallest-text">Revised: {current_date}. &copy; 2023 SNAPlab</p>'
    else:
        return f'<p class="smallest-text">Revised: {current_date}. &copy; 2023-{current_year} SNAPlab</p>'

# Iterate through all files in the folder
for filename in os.listdir(folder_path):
    if filename.endswith(".html"):
        file_path = os.path.join(folder_path, filename)
        # Read the content of the file
        with open(file_path, 'r', encoding='utf-8') as file:
            content = file.read()
        # Check if the specific line exists in the file
        if re.search(pattern, content):
            # Replace the line with the updated line
            new_content, num_subs = re.subn(pattern, get_new_line, content, count=1)
            # Write the updated content back to the file
            with open(file_path, 'w', encoding='utf-8') as file:
                file.write(new_content)
            print(f"Updated {filename}")
        else:
            print(f"No matching line found in {filename}")
