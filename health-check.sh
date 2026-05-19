# Health check configuration for enhanced All Folders Directory feature

# Health check endpoint
HEALTH_CHECK_URL="http://localhost:5173"
HEALTH_CHECK_TIMEOUT=30
HEALTH_CHECK_INTERVAL=60
HEALTH_CHECK_RETRIES=3

# Feature-specific health checks
FEATURE_CHECKS=(
    "Document manager loads"
    "All Folders Directory displays"
    "Folder expansion works"
    "Keyboard navigation available"
)

# Deployment validation script
validate_deployment() {
    echo "🩺 Validating deployment of enhanced All Folders Directory feature..."
    
    # Check if application is running
    if ! curl -s --max-time 5 "$HEALTH_CHECK_URL" > /dev/null; then
        echo "❌ Application not responding at $HEALTH_CHECK_URL"
        return 1
    fi
    
    echo "✅ Application is running"
    
    # Check build artifacts
    echo "📦 Checking build artifacts..."
    REQUIRED_FILES=(
        "dist/index.html"
        "dist/assets"
    )
    
    for file in "${REQUIRED_FILES[@]}"; do
        if [ -e "/usr/share/nginx/html/${file##*/}" ]; then
            echo "  ✅ $(basename "$file") exists"
        else
            echo "  ❌ $(basename "$file") missing"
        fi
    done
    
    # Feature validation (simulated - would require browser testing in real deployment)
    echo "🔧 Feature validation..."
    for feature in "${FEATURE_CHECKS[@]}"; do
        echo "  ⚙️ $feature"
        # In real deployment, this would run actual browser tests
    done
    
    echo "📊 Deployment validation complete"
    echo "   Note: Full feature validation requires browser automation"
}

# Quick health check
quick_health_check() {
    echo "⚡ Quick health check..."
    
    # Check nginx is running
    if pgrep nginx > /dev/null; then
        echo "  ✅ nginx is running"
    else
        echo "  ❌ nginx not running"
        return 1
    fi
    
    # Check if port is listening
    if netstat -tuln | grep -q ":80 "; then
        echo "  ✅ Port 80 is listening"
    else
        echo "  ❌ Port 80 not listening"
        return 1
    fi
    
    # Check disk space
    DISK_USAGE=$(df /usr/share/nginx/html | tail -1 | awk '{print $5}' | sed 's/%//')
    if [ "$DISK_USAGE" -lt 90 ]; then
        echo "  ✅ Disk usage: ${DISK_USAGE}% (OK)"
    else
        echo "  ⚠️ Disk usage: ${DISK_USAGE}% (High)"
    fi
    
    echo "✅ Quick health check passed"
}

# Main execution
case "${1:-validate}" in
    validate)
        validate_deployment
        ;;
    quick)
        quick_health_check
        ;;
    full)
        validate_deployment
        quick_health_check
        ;;
    *)
        echo "Usage: $0 {validate|quick|full}"
        echo "  validate - Full deployment validation"
        echo "  quick    - Quick health check"
        echo "  full     - Both validation and health check"
        exit 1
        ;;
esac