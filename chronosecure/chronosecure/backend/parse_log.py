
log_file = "debug_full.log"

try:
    with open(log_file, "r", encoding="latin-1", errors="ignore") as f:
        lines = f.readlines()
        
    for i, line in enumerate(lines):
        if "MATCH Sahan" in line:
            print(f"FOUND MATCH at line {i+1}:")
            # Print context (next 5 lines)
            for j in range(1, 6):
                if i + j < len(lines):
                    print(lines[i+j].strip())
except Exception as e:
    print(f"Error: {e}")
