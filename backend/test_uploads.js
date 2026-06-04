const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const connectDB = require('./src/config/db');
const attachmentService = require('./src/services/attachmentService');
const Attachment = require('./src/models/Attachment');

// Helper to convert plain string to base64
const stringToBase64 = (str) => Buffer.from(str).toString('base64');

async function runTests() {
  console.log('=== STARTING SUPABASE UPLOAD VALIDATION TESTS ===\n');

  try {
    // 1. Connect to Database
    console.log('Connecting to database...');
    await connectDB();
    console.log('Database connected successfully.\n');
  } catch (err) {
    console.error('Failed to connect to database:', err.message);
    process.exit(1);
  }

  const mockUserId = new mongoose.Types.ObjectId();
  const createdIds = [];

  // MOCKS
  const validImageBase64 = `data:image/png;base64,${stringToBase64('mock image data content')}`;
  const validDocBase64 = `data:application/pdf;base64,${stringToBase64('mock pdf document data content')}`;
  const zipFileBase64 = `data:application/zip;base64,${stringToBase64('mock zip content')}`;
  
  // Create an oversized file mock (11 MB buffer)
  const oversizedBuffer = Buffer.alloc(11 * 1024 * 1024, 'a');
  const oversizedBase64 = `data:image/png;base64,${oversizedBuffer.toString('base64')}`;

  let passed = 0;
  let failed = 0;

  async function testCase(name, fn) {
    console.log(`[TEST] ${name}`);
    try {
      await fn();
      console.log(` -> \x1b[32mPASSED\x1b[0m\n`);
      passed++;
    } catch (err) {
      console.log(` -> \x1b[31mFAILED: ${err.message}\x1b[0m\n`);
      failed++;
    }
  }

  // --- Test Case 1: Valid Image Upload ---
  await testCase('Upload Valid Image (should succeed & go to Images/ folder)', async () => {
    const attachment = await attachmentService.createAttachment(
      mockUserId,
      validImageBase64,
      'image/png',
      'TestImage'
    );
    
    createdIds.push(attachment._id);
    console.log(`   Saved attachment ID: ${attachment._id}`);
    console.log(`   Public URL: ${attachment.imageUrl}`);
    
    if (!attachment.imageUrl.includes('/Images/')) {
      throw new Error(`Expected storage path to contain 'Images/', got: ${attachment.imageUrl}`);
    }
  });

  // --- Test Case 2: Valid Document Upload ---
  await testCase('Upload Valid Document (should succeed & go to Documents/ folder)', async () => {
    const attachment = await attachmentService.createAttachment(
      mockUserId,
      validDocBase64,
      'application/pdf',
      'TestDocument'
    );
    
    createdIds.push(attachment._id);
    console.log(`   Saved attachment ID: ${attachment._id}`);
    console.log(`   Public URL: ${attachment.imageUrl}`);
    
    if (!attachment.imageUrl.includes('/Documents/')) {
      throw new Error(`Expected storage path to contain 'Documents/', got: ${attachment.imageUrl}`);
    }
  });

  // --- Test Case 3: ZIP File Rejection ---
  await testCase('Upload ZIP File (should be rejected)', async () => {
    try {
      await attachmentService.createAttachment(
        mockUserId,
        zipFileBase64,
        'application/zip',
        'TestZip'
      );
      throw new Error('Upload succeeded, but was expected to fail.');
    } catch (err) {
      if (err.message.includes('ZIP files are not allowed')) {
        console.log(`   Correctly rejected: ${err.message}`);
      } else {
        throw err;
      }
    }
  });

  // --- Test Case 4: Oversized File Rejection ---
  await testCase('Upload File > 10MB (should be rejected)', async () => {
    try {
      await attachmentService.createAttachment(
        mockUserId,
        oversizedBase64,
        'image/png',
        'OversizedImage'
      );
      throw new Error('Upload succeeded, but was expected to fail.');
    } catch (err) {
      if (err.message.includes('exceeds the limit of 10MB')) {
        console.log(`   Correctly rejected: ${err.message}`);
      } else {
        throw err;
      }
    }
  });

  // CLEANUP
  console.log('Cleaning up mock data from MongoDB...');
  if (createdIds.length > 0) {
    const res = await Attachment.deleteMany({ _id: { $in: createdIds } });
    console.log(`Deleted ${res.deletedCount} temporary testing documents from MongoDB.`);
  }

  console.log('\n=== TEST RUN SUMMARY ===');
  console.log(`Total Cases: ${passed + failed}`);
  console.log(`Passed: \x1b[32m${passed}\x1b[0m`);
  console.log(`Failed: \x1b[31m${failed}\x1b[0m`);

  // Close connection
  await mongoose.disconnect();
  console.log('\nDisconnected from database.');
}

runTests();
