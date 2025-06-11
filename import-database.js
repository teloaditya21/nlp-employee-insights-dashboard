#!/usr/bin/env node

/**
 * Script to import database.json data into D1 database
 * This script reads the database.json file and imports all data into the D1 database
 */

import fs from 'fs';
import path from 'path';

// Configuration
const API_BASE_URL = 'https://employee-insights-api.adityalasika.workers.dev';
const DATABASE_JSON_PATH = './attached_assets/database.json';

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
 * Import data to D1 database
 */
async function importData(token, data) {
  try {
    console.log(`📤 Importing ${data.length} records to D1 database...`);
    
    const response = await fetch(`${API_BASE_URL}/api/data/import`, {
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

    console.log('✅ Data import successful');
    console.log('📊 Import Summary:');
    console.log(`   - Total records processed: ${result.data.total}`);
    console.log(`   - Successfully imported: ${result.data.imported}`);
    console.log(`   - Errors: ${result.data.errors || 0}`);
    
    if (result.data.final_counts) {
      console.log('📈 Final Database Counts:');
      console.log(`   - Employee insights: ${result.data.final_counts.employee_insights_count}`);
      console.log(`   - Insight summary: ${result.data.final_counts.insight_summary_count}`);
      console.log(`   - Kota summary: ${result.data.final_counts.kota_summary_count}`);
    }
    
    return result;
  } catch (error) {
    console.error('❌ Import error:', error.message);
    throw error;
  }
}

/**
 * Main function
 */
async function main() {
  try {
    console.log('🚀 Starting database import process...');
    console.log(`📁 Reading data from: ${DATABASE_JSON_PATH}`);
    
    // Check if database.json file exists
    if (!fs.existsSync(DATABASE_JSON_PATH)) {
      throw new Error(`Database file not found: ${DATABASE_JSON_PATH}`);
    }

    // Read and parse database.json
    const jsonData = fs.readFileSync(DATABASE_JSON_PATH, 'utf8');
    const data = JSON.parse(jsonData);
    
    if (!Array.isArray(data)) {
      throw new Error('Invalid data format: Expected an array of records');
    }
    
    console.log(`📋 Found ${data.length} records in database.json`);
    
    // Authenticate
    const token = await authenticate();
    
    // Import data
    await importData(token, data);
    
    console.log('🎉 Database import completed successfully!');
    console.log('');
    console.log('Next steps:');
    console.log('1. Test the API endpoints to verify data integrity');
    console.log('2. Check the frontend applications for proper data display');
    console.log('3. Verify filtering, search, and pagination functionality');
    
  } catch (error) {
    console.error('💥 Import process failed:', error.message);
    process.exit(1);
  }
}

// Run the script
console.log('🚀 Starting import script...');
main().catch(error => {
  console.error('💥 Script failed:', error.message);
  process.exit(1);
});
