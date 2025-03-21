#!/bin/bash

echo "Please enter your Google API key:"
read -r api_key

# Validate that API key is not empty
if [ -z "$api_key" ]; then
    echo "Error: API key cannot be empty"
    exit 1
fi

# Create secrets.js file
cat > "$(dirname "$0")/secrets.js" << EOL
export const secrets = {  
  GOOGLE_API_KEY: "$api_key", // Google/Gemini API key
};
EOL

# Make the secrets.js file readable only by owner
chmod 600 "$(dirname "$0")/secrets.js"

echo "secrets.js file has been created successfully!"