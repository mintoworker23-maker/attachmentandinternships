#!/bin/bash

# Job Scraper Hourly Runner
# This script runs the job scraper and commits/pushes changes if new jobs are found
# Set up in crontab with: 0 * * * * /home/teddy-omondi/Desktop/job-posting-website/scripts/run-scraper.sh

set -e

PROJECT_DIR="/home/teddy-omondi/Desktop/job-posting-website"
SCRIPT="$PROJECT_DIR/scripts/scrape-jobs.mjs"
LOG_FILE="$PROJECT_DIR/logs/scraper.log"
DATA_FILE="$PROJECT_DIR/public/data/all-jobs.json"

# Create logs directory if it doesn't exist
mkdir -p "$PROJECT_DIR/logs"

# Timestamp for logging
TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')
echo "[$TIMESTAMP] Starting job scraper..." >> "$LOG_FILE"

# Change to project directory
cd "$PROJECT_DIR"

# Store current job count for comparison
JOBS_BEFORE=$(node -e "const fs = require('fs'); try { const data = JSON.parse(fs.readFileSync('$DATA_FILE', 'utf8')); console.log(data.length); } catch(e) { console.log(0); }" 2>/dev/null || echo 0)

# Run the scraper
if node "$SCRIPT" >> "$LOG_FILE" 2>&1; then
    echo "[$TIMESTAMP] Scraper completed successfully" >> "$LOG_FILE"
    
    # Get new job count
    JOBS_AFTER=$(node -e "const fs = require('fs'); try { const data = JSON.parse(fs.readFileSync('$DATA_FILE', 'utf8')); console.log(data.length); } catch(e) { console.log(0); }" 2>/dev/null || echo 0)
    
    echo "[$TIMESTAMP] Jobs before: $JOBS_BEFORE, after: $JOBS_AFTER" >> "$LOG_FILE"
    
    # Update jobs.json
    cp "$DATA_FILE" "$PROJECT_DIR/public/data/jobs.json"
    
    # If there are changes, commit and push
    if [ "$(git status --porcelain | wc -l)" -gt 0 ]; then
        echo "[$TIMESTAMP] Changes detected, committing..." >> "$LOG_FILE"
        git add public/data/jobs.json public/data/all-jobs.json public/data/all-jobs-raw.json 2>/dev/null || true
        git commit -m "Auto-update: Scrape jobs ($(date '+%Y-%m-%d %H:%M'))" >> "$LOG_FILE" 2>&1 || true
        git push origin main >> "$LOG_FILE" 2>&1 || echo "[$TIMESTAMP] Push failed" >> "$LOG_FILE"
        echo "[$TIMESTAMP] Changes committed and pushed" >> "$LOG_FILE"
    else
        echo "[$TIMESTAMP] No changes detected" >> "$LOG_FILE"
    fi
else
    echo "[$TIMESTAMP] Scraper failed!" >> "$LOG_FILE"
    exit 1
fi

echo "[$TIMESTAMP] Scraper run complete" >> "$LOG_FILE"
