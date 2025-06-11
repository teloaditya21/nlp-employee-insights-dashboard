import fs from 'fs';
import path from 'path';

// Function to import data from JSON file to D1 database
export async function importDataFromJSON(db, jsonFilePath) {
  try {
    console.log('Starting data import from:', jsonFilePath);
    
    // Read the JSON file
    const jsonData = JSON.parse(fs.readFileSync(jsonFilePath, 'utf8'));
    console.log(`Found ${jsonData.length} records to import`);

    // Clear existing data
    console.log('Clearing existing data...');
    await db.prepare('DELETE FROM employee_insights').run();
    await db.prepare('DELETE FROM insight_summary').run();
    await db.prepare('DELETE FROM kota_summary').run();
    await db.prepare("DELETE FROM sqlite_sequence WHERE name IN ('employee_insights', 'insight_summary', 'kota_summary')").run();

    // Prepare insert statement
    const insertStmt = db.prepare(`
      INSERT INTO employee_insights (
        sourceData, employeeName, date, witel, kota, 
        originalInsight, sentenceInsight, wordInsight, sentimen
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    // Import data in batches
    const batchSize = 100;
    let imported = 0;
    
    for (let i = 0; i < jsonData.length; i += batchSize) {
      const batch = jsonData.slice(i, i + batchSize);
      
      // Start transaction for batch
      await db.prepare('BEGIN TRANSACTION').run();
      
      try {
        for (const record of batch) {
          await insertStmt.bind(
            record.sourceData,
            record.employeeName,
            record.date,
            record.witel,
            record.kota,
            record.originalInsight,
            record.sentenceInsight,
            record.wordInsight,
            record.sentimen
          ).run();
          imported++;
        }
        
        // Commit batch
        await db.prepare('COMMIT').run();
        console.log(`Imported ${imported}/${jsonData.length} records`);
        
      } catch (error) {
        // Rollback on error
        await db.prepare('ROLLBACK').run();
        throw error;
      }
    }

    console.log('Data import completed successfully!');
    
    // Regenerate summary tables
    console.log('Regenerating summary tables...');
    await regenerateSummaryTables(db);
    
    return { success: true, imported: imported };
    
  } catch (error) {
    console.error('Error importing data:', error);
    throw error;
  }
}

// Function to regenerate summary tables
async function regenerateSummaryTables(db) {
  try {
    // Regenerate insight_summary
    console.log('Regenerating insight_summary...');
    await db.prepare(`
      INSERT INTO insight_summary (
        wordInsight, total_count, positif_count, negatif_count, netral_count,
        positif_percentage, negatif_percentage, netral_percentage
      )
      SELECT 
        wordInsight,
        COUNT(*) as total_count,
        SUM(CASE WHEN sentimen = 'positif' THEN 1 ELSE 0 END) as positif_count,
        SUM(CASE WHEN sentimen = 'negatif' THEN 1 ELSE 0 END) as negatif_count,
        SUM(CASE WHEN sentimen = 'netral' THEN 1 ELSE 0 END) as netral_count,
        ROUND(
          (SUM(CASE WHEN sentimen = 'positif' THEN 1 ELSE 0 END) * 100.0) / COUNT(*), 
          2
        ) as positif_percentage,
        ROUND(
          (SUM(CASE WHEN sentimen = 'negatif' THEN 1 ELSE 0 END) * 100.0) / COUNT(*), 
          2
        ) as negatif_percentage,
        ROUND(
          (SUM(CASE WHEN sentimen = 'netral' THEN 1 ELSE 0 END) * 100.0) / COUNT(*), 
          2
        ) as netral_percentage
      FROM employee_insights 
      WHERE wordInsight IS NOT NULL AND wordInsight != '' 
      GROUP BY wordInsight
      HAVING COUNT(*) > 0
    `).run();

    // Regenerate kota_summary
    console.log('Regenerating kota_summary...');
    await db.prepare(`
      INSERT INTO kota_summary (
        kota, total_count, positif_count, negatif_count, netral_count,
        positif_percentage, negatif_percentage, netral_percentage
      )
      SELECT 
        kota,
        COUNT(*) as total_count,
        SUM(CASE WHEN sentimen = 'positif' THEN 1 ELSE 0 END) as positif_count,
        SUM(CASE WHEN sentimen = 'negatif' THEN 1 ELSE 0 END) as negatif_count,
        SUM(CASE WHEN sentimen = 'netral' THEN 1 ELSE 0 END) as netral_count,
        ROUND(
          (SUM(CASE WHEN sentimen = 'positif' THEN 1 ELSE 0 END) * 100.0) / COUNT(*), 
          2
        ) as positif_percentage,
        ROUND(
          (SUM(CASE WHEN sentimen = 'negatif' THEN 1 ELSE 0 END) * 100.0) / COUNT(*), 
          2
        ) as negatif_percentage,
        ROUND(
          (SUM(CASE WHEN sentimen = 'netral' THEN 1 ELSE 0 END) * 100.0) / COUNT(*), 
          2
        ) as netral_percentage
      FROM employee_insights 
      WHERE kota IS NOT NULL AND kota != '' 
      GROUP BY kota
      HAVING COUNT(*) > 0
    `).run();

    console.log('Summary tables regenerated successfully!');
    
  } catch (error) {
    console.error('Error regenerating summary tables:', error);
    throw error;
  }
}
