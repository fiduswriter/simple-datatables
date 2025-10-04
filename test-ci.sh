#!/bin/bash

# CI Simulation Test Script
# This script simulates the GitHub Actions CI environment for debugging test issues

set -e

echo "🔧 CI Simulation Test Script"
echo "=============================="

# Set CI environment variables to simulate GitHub Actions
export CI=true
export TEST_HEADLESS=1

echo "📋 Environment Variables:"
echo "CI=$CI"
echo "TEST_HEADLESS=$TEST_HEADLESS"
echo ""

echo "🏗️  Installing dependencies..."
npm install

echo ""
echo "🧪 Running tests in CI simulation mode..."
echo "This will run tests with:"
echo "- Headless Chrome"
echo "- CI timeout settings (wait=500ms, testWait=10000ms)"
echo "- 30 second test timeout"
echo "- Comprehensive debug output"
echo ""

# Run the tests with verbose output
npm test

echo ""
echo "✅ CI simulation completed!"
echo ""
echo "If tests failed, check the debug output above for:"
echo "- Browser initialization time"
echo "- DataTable ready time" 
echo "- Test completion time"
echo "- Any timeout warnings"
echo "- JavaScript errors in browser logs"