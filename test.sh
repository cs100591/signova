#!/bin/bash

# Test Runner Script for Signova
# Runs all Playwright tests and generates report

echo "🧪 Signova Test Suite"
echo "====================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if Playwright is installed
if ! command -v npx &> /dev/null; then
    echo -e "${RED}Error: npx not found. Please install Node.js.${NC}"
    exit 1
fi

# Run tests based on argument
case "${1:-all}" in
    login)
        echo -e "${YELLOW}Running Login Tests...${NC}"
        npx playwright test e2e/login.spec.ts --reporter=list
        ;;
    upload)
        echo -e "${YELLOW}Running Upload Tests...${NC}"
        npx playwright test e2e/upload.spec.ts --reporter=list
        ;;
    contracts)
        echo -e "${YELLOW}Running Contracts Tests...${NC}"
        npx playwright test e2e/contracts.spec.ts --reporter=list
        ;;
    terminal)
        echo -e "${YELLOW}Running Terminal Tests...${NC}"
        npx playwright test e2e/terminal.spec.ts --reporter=list
        ;;
    ui)
        echo -e "${YELLOW}Starting Playwright UI Mode...${NC}"
        npx playwright test --ui
        ;;
    headed)
        echo -e "${YELLOW}Running Tests in Headed Mode...${NC}"
        npx playwright test --headed
        ;;
    debug)
        echo -e "${YELLOW}Running Tests in Debug Mode...${NC}"
        npx playwright test --debug
        ;;
    prod)
        echo -e "${YELLOW}Running Tests Against Production...${NC}"
        TEST_BASE_URL=https://signova-blond.vercel.app npx playwright test
        ;;
    *)
        echo -e "${YELLOW}Running All Tests...${NC}"
        echo ""
        echo "Test Categories:"
        echo "  1. Login Flow"
        echo "  2. PDF Upload & Confirm Page"
        echo "  3. Contracts List (Real Data)"
        echo "  4. Terminal Chat"
        echo ""
        npx playwright test
        ;;
esac

# Check exit code
if [ $? -eq 0 ]; then
    echo ""
    echo -e "${GREEN}✅ All tests passed!${NC}"
    echo ""
    echo "View detailed report:"
    echo "  npx playwright show-report"
else
    echo ""
    echo -e "${RED}❌ Some tests failed.${NC}"
    echo ""
    echo "View detailed report:"
    echo "  npx playwright show-report"
    exit 1
fi
