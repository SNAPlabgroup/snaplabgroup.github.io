from pathlib import Path

STATCOUNTER_SNIPPET = """
<!-- Default Statcounter code for SNAPlab Website
https://snaplabgroup.github.io/ -->
<script type="text/javascript">
var sc_project=13196782; 
var sc_invisible=1; 
var sc_security="2d4c010f"; 
</script>
<script type="text/javascript"
src="https://www.statcounter.com/counter/counter.js"
async></script>
<noscript><div class="statcounter"><a title="Web Analytics"
href="https://statcounter.com/" target="_blank"><img
class="statcounter"
src="https://c.statcounter.com/13196782/0/2d4c010f/1/"
alt="Web Analytics"
referrerPolicy="no-referrer-when-downgrade"></a></div></noscript>
<!-- End of Statcounter Code -->
"""

root = Path(".")

for html_file in root.glob("*.html"):
    text = html_file.read_text(encoding="utf-8")

    # Skip files that already include StatCounter
    if "statcounter.com/counter/counter.js" in text:
        print(f"Skipping (already has StatCounter): {html_file}")
        continue

    lower = text.lower()
    if "</body>" not in lower:
        print(f"Skipping (no </body>): {html_file}")
        continue

    idx = lower.rfind("</body>")
    new_text = text[:idx] + STATCOUNTER_SNIPPET + "\n" + text[idx:]

    html_file.write_text(new_text, encoding="utf-8")
    print(f"Updated: {html_file}")