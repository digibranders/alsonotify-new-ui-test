
import json

input_path = "/Users/apple/Desktop/Alsonotify/alsonotify-new-ui/src/assets/Animation - 1768027869490.json"
output_path = "/Users/apple/Desktop/Alsonotify/alsonotify-new-ui/src/assets/email-sent-animation.json"

# Define color mapping (RGBA arrays 0-1)
# Main Blue to Red (#ff3b3b -> [1, 0.231, 0.231, 1])
# Darker blues to darker reds
color_map = {
    (0.42, 0.576, 0.937, 1): [1, 0.231, 0.231, 1],
    (0.294, 0.482, 0.925, 1): [0.85, 0.15, 0.15, 1], # Approximation for variety
    (0.153, 0.235, 0.459, 1): [0.6, 0.1, 0.1, 1],
    (0.145, 0.243, 0.494, 1): [0.55, 0.08, 0.08, 1],
    (0.098, 0.165, 0.337, 1): [0.4, 0.05, 0.05, 1]
}

def replace_colors(obj):
    if isinstance(obj, dict):
        # formatted to match exact keys if they exist in a standard way, but usually "c": { "k": [r,g,b,a] }
        if "c" in obj and isinstance(obj["c"], dict) and "k" in obj["c"]:
            color = obj["c"]["k"]
            if isinstance(color, list) and len(color) == 4:
                # Check for match (fuzzy or exact)
                # Using tuple for hashable key
                # We round to 3 decimals to be safe with float comparison issues if any, but exact match is preferred first
                c_tuple = tuple(color)
                if c_tuple in color_map:
                    obj["c"]["k"] = color_map[c_tuple]
                else:
                    # Try rounded match
                    rounded = tuple([round(x, 3) for x in color])
                    # Re-check map keys rounded
                    for k, v in color_map.items():
                        k_rounded = tuple([round(x, 3) for x in k])
                        if k_rounded == rounded:
                            obj["c"]["k"] = v
                            break
        
        for key in obj:
            replace_colors(obj[key])
    elif isinstance(obj, list):
        for item in obj:
            replace_colors(item)

with open(input_path, 'r') as f:
    data = json.load(f)

replace_colors(data)

with open(output_path, 'w') as f:
    json.dump(data, f)

print("Converted animation saved to", output_path)
