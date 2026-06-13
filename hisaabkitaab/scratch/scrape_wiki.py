import urllib.request
import re

url = "https://en.wikipedia.org/wiki/List_of_members_of_the_16th_National_Assembly_of_Pakistan"
headers = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"}

try:
    req = urllib.request.Request(url, headers=headers)
    with urllib.request.urlopen(req) as response:
        html = response.read().decode('utf-8')
        
    print("Fetched HTML length:", len(html))
    
    # Find all table rows containing NA- constituency codes
    # A constituency link usually looks like: title="NA-1 (Chitral)" or similar, or text "NA-1"
    # Let's extract rows inside the main tables
    # Find tables with class wikitable
    tables = re.findall(r'<table class="wikitable.*?>(.*?)</table>', html, re.DOTALL)
    print("Found tables with class wikitable:", len(tables))
    
    for idx, table in enumerate(tables):
        # Find all rows in this table
        rows = re.findall(r'<tr.*?>(.*?)</tr>', table, re.DOTALL)
        print(f"Table {idx} has {len(rows)} rows.")
        # Find constituency references
        na_rows_count = 0
        sample_rows = []
        for row in rows:
            if "NA-" in row:
                na_rows_count += 1
                if len(sample_rows) < 5:
                    sample_rows.append(row)
        print(f"Table {idx} has {na_rows_count} rows containing 'NA-'.")
        if sample_rows:
            print("Sample Row Markup:")
            for s_row in sample_rows:
                # Clean html tags slightly to see content
                clean_cells = []
                cells = re.findall(r'<t[dh].*?>(.*?)</t[dh]>', s_row, re.DOTALL)
                for cell in cells:
                    # Strip links/tags
                    clean_cell = re.sub(r'<[^>]*>', '', cell).strip()
                    clean_cells.append(clean_cell)
                print(" | ".join(clean_cells))
            print("="*40)
            
except Exception as e:
    import traceback
    traceback.print_exc()
