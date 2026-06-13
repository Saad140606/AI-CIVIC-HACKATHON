import urllib.request
import re

url = "https://en.wikipedia.org/wiki/List_of_members_of_the_16th_National_Assembly_of_Pakistan"
headers = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"}

try:
    req = urllib.request.Request(url, headers=headers)
    with urllib.request.urlopen(req) as response:
        html = response.read().decode('utf-8')
        
    tables = re.findall(r'<table class="wikitable.*?>(.*?)</table>', html, re.DOTALL)
    table = tables[0]
    
    rows = re.findall(r'<tr.*?>(.*?)</tr>', table, re.DOTALL)
    
    parsed = []
    current_province = "Unknown"
    
    for row in rows:
        if "NA-" not in row:
            continue
            
        cells = re.findall(r'<t[dh].*?>(.*?)</t[dh]>', row, re.DOTALL)
        if not cells:
            continue
            
        c_idx = -1
        for i, cell in enumerate(cells):
            clean_cell = re.sub(r'<[^>]*>', '', cell).strip()
            if re.search(r'\bNA-\d+\b', clean_cell):
                c_idx = i
                break
        
        if c_idx == -1:
            continue
            
        if c_idx > 0:
            # The cells before c_idx contain the province name
            prov_cell = re.sub(r'<[^>]*>', '', cells[0]).strip()
            current_province = prov_cell.split('\n')[0].strip()
            
        constituency_cell = re.sub(r'<[^>]*>', '', cells[c_idx]).strip()
        constituency_cell = re.sub(r'\[\d+\]', '', constituency_cell).replace('\n', ' ').strip()
        
        const_match = re.match(r'(NA-\d+)\s*(.*)', constituency_cell)
        constituency_code = const_match.group(1) if const_match else constituency_cell
        constituency_name = const_match.group(2) if const_match else ""
        
        member_cell = re.sub(r'<[^>]*>', '', cells[c_idx + 1]).strip()
        member_name = re.sub(r'\[\d+\]', '', member_cell).split('\n')[0].strip()
        
        party_cell = re.sub(r'<[^>]*>', '', cells[c_idx + 3]).strip()
        party_name = re.sub(r'\[\d+\]', '', party_cell).split('\n')[0].strip()
        
        # Clean party names
        party_name = re.sub(r'&\#91;.*&\#93;', '', party_name) # Clean html brackets
        party_name = re.sub(r'\[.*\]', '', party_name).strip()
        
        if "Independent" in party_name or party_name == "IND":
            party_name = "IND"
        elif "Muttahida Qaumi Movement" in party_name:
            party_name = "MQM-P"
        elif "Muslim League (N)" in party_name or "PML(N)" in party_name or "PML-N" in party_name:
            party_name = "PML-N"
        elif "Peoples Party" in party_name:
            party_name = "PPP"
        elif "Ulema-e-Islam" in party_name or "JUI-F" in party_name:
            party_name = "JUI-F"
        elif "Muslim League (Q)" in party_name or "PML(Q)" in party_name or "PML-Q" in party_name:
            party_name = "PML-Q"
        elif "Sunni Ittehad" in party_name or party_name == "SIC":
            party_name = "SIC"
        elif "Istihkam-e-Pakistan" in party_name or party_name == "IPP":
            party_name = "IPP"
        elif "Balochistan National Party" in party_name or party_name == "BNP-M":
            party_name = "BNP-M"
        elif "Pashtunkhwa National Awami" in party_name or "PkMAP" in party_name:
            party_name = "PkMAP"
        elif "Majlis Wahdat-e-Muslimeen" in party_name or "MWM" in party_name:
            party_name = "MWM"
            
        parsed.append({
            "code": constituency_code,
            "constituency_name": constituency_name,
            "province": current_province,
            "name": member_name,
            "party": party_name
        })
        
    print("Total parsed directly elected MNAs:", len(parsed))
    print("First 5 parsed MNAs:")
    for p in parsed[:5]:
        print(p)
    print("Last 5 parsed MNAs:")
    for p in parsed[-5:]:
        print(p)
        
except Exception as e:
    import traceback
    traceback.print_exc()
