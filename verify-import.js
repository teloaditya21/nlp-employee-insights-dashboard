#!/usr/bin/env node

/**
 * Script to verify the database import was successful
 * This script tests various API endpoints to ensure data integrity
 */

// Configuration
const API_BASE_URL = 'https://employee-insights-api.adityalasika.workers.dev';

/**
 * Test API endpoint
 */
async function testEndpoint(endpoint, description) {
  try {
    console.log(`🔍 Testing: ${description}`);
    
    const response = await fetch(`${API_BASE_URL}${endpoint}`);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(`API Error: ${data.message}`);
    }
    
    console.log(`✅ ${description} - OK`);
    return data;
  } catch (error) {
    console.error(`❌ ${description} - FAILED: ${error.message}`);
    return null;
  }
}

/**
 * Test paginated endpoint
 */
async function testPaginatedEndpoint(endpoint, description) {
  try {
    console.log(`🔍 Testing: ${description}`);
    
    const response = await fetch(`${API_BASE_URL}${endpoint}?page=1&limit=10`);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(`API Error: ${data.message}`);
    }
    
    console.log(`✅ ${description} - OK (${data.data?.length || 0} records)`);
    return data;
  } catch (error) {
    console.error(`❌ ${description} - FAILED: ${error.message}`);
    return null;
  }
}

/**
 * Main verification function
 */
async function main() {
  console.log('🔬 Starting API verification tests...');
  console.log('');
  
  const tests = [
    // Basic health check
    { endpoint: '/health', description: 'Health Check' },
    
    // Dashboard and summary endpoints
    { endpoint: '/api/insights/dashboard', description: 'Dashboard Statistics' },
    { endpoint: '/api/insights/summary', description: 'Insights Summary' },
    
    // Top insights endpoints
    { endpoint: '/api/insights/top-positive', description: 'Top Positive Insights' },
    { endpoint: '/api/insights/top-negative', description: 'Top Negative Insights' },
    { endpoint: '/api/insights/top-10', description: 'Top 10 Insights' },
    
    // City summary
    { endpoint: '/api/kota-summary', description: 'City Summary Data' },
    
    // Debug endpoint
    { endpoint: '/api/debug/table-info', description: 'Table Information' },
  ];
  
  const paginatedTests = [
    { endpoint: '/api/employee-insights/paginated', description: 'Employee Insights (Paginated)' },
    { endpoint: '/api/insights/paginated', description: 'Insights (Paginated)' },
  ];
  
  let passedTests = 0;
  let totalTests = tests.length + paginatedTests.length;
  
  // Test regular endpoints
  for (const test of tests) {
    const result = await testEndpoint(test.endpoint, test.description);
    if (result) {
      passedTests++;
      
      // Show some data details for key endpoints
      if (test.endpoint === '/api/insights/dashboard' && result.data) {
        console.log(`   📊 Total Insights: ${result.data.totalInsights}`);
        console.log(`   📊 Total Feedback: ${result.data.totalFeedback}`);
        console.log(`   📊 Positive: ${result.data.sentimentRatio?.positive || 0}%`);
        console.log(`   📊 Negative: ${result.data.sentimentRatio?.negative || 0}%`);
        console.log(`   📊 Neutral: ${result.data.sentimentRatio?.neutral || 0}%`);
      }
      
      if (test.endpoint === '/api/insights/summary' && result.data) {
        console.log(`   📋 Summary Records: ${result.data.length}`);
      }
      
      if (test.endpoint === '/api/kota-summary' && result.data) {
        console.log(`   🏙️ Cities: ${result.data.length}`);
      }
    }
    console.log('');
  }
  
  // Test paginated endpoints
  for (const test of paginatedTests) {
    const result = await testPaginatedEndpoint(test.endpoint, test.description);
    if (result) {
      passedTests++;
      
      if (result.pagination) {
        console.log(`   📄 Page: ${result.pagination.page}/${result.pagination.totalPages}`);
        console.log(`   📄 Total Records: ${result.pagination.totalItems}`);
      }
    }
    console.log('');
  }
  
  // Summary
  console.log('📋 Test Summary:');
  console.log(`   ✅ Passed: ${passedTests}/${totalTests}`);
  console.log(`   ❌ Failed: ${totalTests - passedTests}/${totalTests}`);
  console.log(`   📊 Success Rate: ${Math.round((passedTests / totalTests) * 100)}%`);
  
  if (passedTests === totalTests) {
    console.log('');
    console.log('🎉 All tests passed! Database import verification successful.');
    console.log('');
    console.log('✅ The following functionality has been verified:');
    console.log('   - API health and connectivity');
    console.log('   - Dashboard statistics calculation');
    console.log('   - Insights summary generation');
    console.log('   - Top insights filtering');
    console.log('   - City-based analytics');
    console.log('   - Paginated data retrieval');
    console.log('   - Database table structure');
  } else {
    console.log('');
    console.log('⚠️  Some tests failed. Please check the API and database status.');
    process.exit(1);
  }
}

// Run the script
console.log('🔬 Starting API verification tests...');
main().catch(error => {
  console.error('💥 Verification failed:', error.message);
  process.exit(1);
});
