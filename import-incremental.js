#!/usr/bin/env node

/**
 * Script to incrementally import database_gabungan.json data into D1 database
 * This script adds new data without replacing existing records
 */

import fs from 'fs';
import path from 'path';

// Configuration
const API_BASE_URL = 'https://employee-insights-api.adityalasika.workers.dev';
const DATABASE_JSON_PATH = './attached_assets/database_gabungan.json';

// Admin credentials for authentication
const ADMIN_CREDENTIALS = {
  username: 'nlp@admin',
  password: '12345'
};

/**
 * Authenticate and get session token
 */
async function authenticate() {
  try {
    console.log('🔐 Authenticating with admin credentials...');
    
    const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(ADMIN_CREDENTIALS)
    });

    if (!response.ok) {
      throw new Error(`Authentication failed: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();
    
    if (!result.success) {
      throw new Error(`Authentication failed: ${result.message}`);
    }

    console.log('✅ Authentication successful');
    return result.data.session_token;
  } catch (error) {
    console.error('❌ Authentication error:', error.message);
    throw error;
  }
}

/**
 * Import data incrementally to D1 database
 */
async function importDataIncremental(token, data) {
  try {
    console.log(`📤 Adding ${data.length} new records to existing D1 database...`);
    
    const response = await fetch(`${API_BASE_URL}/api/data/import-incremental`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ data })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Import failed: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const result = await response.json();
    
    if (!result.success) {
      throw new Error(`Import failed: ${result.message}`);
    }

    console.log('✅ Incremental data import successful');
    console.log('📊 Import Summary:');
    console.log(`   - Previous record count: ${result.data.previous_count}`);
    console.log(`   - New records processed: ${result.data.total_new_records}`);
    console.log(`   - Successfully added: ${result.data.new_records_added}`);
    console.log(`   - Errors: ${result.data.errors || 0}`);
    console.log(`   - Final total records: ${result.data.final_total}`);
    
    if (result.data.final_counts) {
      console.log('📈 Final Database Counts:');
      console.log(`   - Employee insights: ${result.data.final_counts.employee_insights_count}`);
      console.log(`   - Insight summary: ${result.data.final_counts.insight_summary_count}`);
      console.log(`   - Kota summary: ${result.data.final_counts.kota_summary_count}`);
    }
    
    return result;
  } catch (error) {
    console.error('❌ Incremental import error:', error.message);
    throw error;
  }
}

/**
 * Verify current database state
 */
async function verifyCurrentState() {
  try {
    console.log('🔍 Checking current database state...');
    
    const response = await fetch(`${API_BASE_URL}/api/debug/table-info`);
    
    if (!response.ok) {
      throw new Error(`Verification failed: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();
    
    if (result.success && result.data) {
      console.log('📊 Current Database State:');
      result.data.forEach(table => {
        console.log(`   - ${table.table_name}: ${table.row_count} records`);
      });
      return result.data;
    }
    
    return null;
  } catch (error) {
    console.error('⚠️  Could not verify current state:', error.message);
    return null;
  }
}

/**
 * Main function
 */
async function main() {
  try {
    console.log('🚀 Starting incremental database import process...');
    console.log(`📁 Reading new data from: ${DATABASE_JSON_PATH}`);
    
    // Check if database_gabungan.json file exists
    if (!fs.existsSync(DATABASE_JSON_PATH)) {
      throw new Error(`Database file not found: ${DATABASE_JSON_PATH}`);
    }

    // Verify current database state
    await verifyCurrentState();

    // Read and parse database_gabungan.json
    const jsonData = fs.readFileSync(DATABASE_JSON_PATH, 'utf8');
    const data = JSON.parse(jsonData);
    
    if (!Array.isArray(data)) {
      throw new Error('Invalid data format: Expected an array of records');
    }
    
    console.log(`📋 Found ${data.length} new records in database_gabungan.json`);
    
    // Authenticate
    const token = await authenticate();
    
    // Import data incrementally
    await importDataIncremental(token, data);
    
    console.log('🎉 Incremental database import completed successfully!');
    console.log('');
    console.log('Next steps:');
    console.log('1. Test the API endpoints to verify data integrity');
    console.log('2. Check the frontend applications for proper data display');
    console.log('3. Verify filtering, search, and pagination functionality');
    console.log('4. Deploy the updated system to production');
    
  } catch (error) {
    console.error('💥 Incremental import process failed:', error.message);
    process.exit(1);
  }
}

// Run the script
console.log('🚀 Starting incremental import script...');
main().catch(error => {
  console.error('💥 Script failed:', error.message);
  process.exit(1);
});
