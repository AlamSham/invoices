// Test rental endpoints using curl commands
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);
const BASE_URL = 'http://localhost:5000/api';

let authToken = '';
let companyId = '';
let advanceInvoiceId = '';

const runCurl = async (command) => {
  try {
    const { stdout, stderr } = await execAsync(command);
    if (stderr) {
      console.log('⚠️ Warning:', stderr);
    }
    return JSON.parse(stdout);
  } catch (error) {
    console.log('❌ Error:', error.message);
    return null;
  }
};

const testEndpoints = async () => {
  console.log('🚀 Testing Rental Invoice System with cURL...\n');

  // Step 1: Register test user
  console.log('1. 👤 Registering test user...');
  const registerCmd = `curl -s -X POST ${BASE_URL}/user/register -H "Content-Type: application/json" -d "{\\"name\\": \\"Test User\\", \\"email\\": \\"test@rental.com\\", \\"password\\": \\"test123456\\"}"`;
  
  const registerResult = await runCurl(registerCmd);
  if (registerResult) {
    console.log('✅ User registration response received');
  }

  // Step 2: Login
  console.log('\n2. 🔐 Logging in...');
  const loginCmd = `curl -s -X POST ${BASE_URL}/user/login -H "Content-Type: application/json" -d "{\\"email\\": \\"test@rental.com\\", \\"password\\": \\"test123456\\"}"`;
  
  const loginResult = await runCurl(loginCmd);
  if (loginResult && loginResult.token) {
    authToken = loginResult.token;
    console.log('✅ Login successful');
    console.log('🔑 Auth token received');
  } else {
    console.log('❌ Login failed');
    return;
  }

  // Step 3: Get/Create Company
  console.log('\n3. 🏢 Getting companies...');
  const companiesCmd = `curl -s -X GET ${BASE_URL}/companies/get -H "Authorization: Bearer ${authToken}"`;
  
  const companiesResult = await runCurl(companiesCmd);
  if (companiesResult && companiesResult.length > 0) {
    companyId = companiesResult[0]._id;
    console.log('✅ Companies fetched');
    console.log(`📝 Using company: ${companiesResult[0].name} (${companyId})`);
  } else {
    // Create test company
    console.log('📝 Creating test company...');
    const createCompanyCmd = `curl -s -X POST ${BASE_URL}/companies/add -H "Authorization: Bearer ${authToken}" -H "Content-Type: application/json" -d "{\\"name\\": \\"Test Rental Co\\", \\"address\\": \\"123 Test St\\", \\"gstin\\": \\"29TEST1234F1Z5\\"}"`;
    
    const companyResult = await runCurl(createCompanyCmd);
    if (companyResult && companyResult._id) {
      companyId = companyResult._id;
      console.log('✅ Test company created');
      console.log(`📝 Company ID: ${companyId}`);
    } else {
      console.log('❌ Failed to create company');
      return;
    }
  }

  // Step 4: Test Advance Invoice
  console.log('\n4. 💰 Testing Advance Invoice...');
  const advanceData = {
    companyId: companyId,
    billTo: {
      name: "Test Client Ltd",
      address: "123 Test Street, Test City",
      gstin: "29ABCDE1234F1Z5"
    },
    items: [
      {
        productName: "Laptop A",
        quantity: 10,
        rentedQuantity: 10,
        dailyRate: 100,
        hsnCode: "8471"
      },
      {
        productName: "Laptop B", 
        quantity: 20,
        rentedQuantity: 20,
        dailyRate: 100,
        hsnCode: "8471"
      },
      {
        productName: "Laptop C",
        quantity: 30,
        rentedQuantity: 30,
        dailyRate: 100,
        hsnCode: "8471"
      }
    ],
    rentalDetails: {
      startDate: new Date().toISOString(),
      totalDays: 15
    },
    paymentDetails: {
      advanceAmount: 30000
    },
    Date: new Date().toISOString().split('T')[0],
    paymentTerms: "Advance payment received",
    termsConditions: "Equipment rental terms apply"
  };

  const advanceCmd = `curl -s -X POST ${BASE_URL}/invoice/rental/advance -H "Authorization: Bearer ${authToken}" -H "Content-Type: application/json" -d '${JSON.stringify(advanceData)}'`;
  
  const advanceResult = await runCurl(advanceCmd);
  if (advanceResult && advanceResult.success) {
    advanceInvoiceId = advanceResult.data._id;
    console.log('✅ Advance invoice created');
    console.log(`📝 Invoice ID: ${advanceInvoiceId}`);
    console.log(`💵 Total Rent: ₹${advanceResult.data.paymentDetails.totalRentAmount}`);
    console.log(`💰 Advance: ₹${advanceResult.data.paymentDetails.advanceAmount}`);
    console.log(`📊 Outstanding: ₹${advanceResult.data.paymentDetails.outstandingAmount}`);
  } else {
    console.log('❌ Advance invoice failed:', advanceResult);
    return;
  }

  // Step 5: Test Partial Return
  console.log('\n5. 🔄 Testing Partial Return...');
  const partialData = {
    parentInvoiceId: advanceInvoiceId,
    returnedItems: [
      {
        productName: "Laptop C",
        returnedQuantity: 20
      }
    ],
    returnDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
    additionalPayment: 5000
  };

  const partialCmd = `curl -s -X POST ${BASE_URL}/invoice/rental/partial-return -H "Authorization: Bearer ${authToken}" -H "Content-Type: application/json" -d '${JSON.stringify(partialData)}'`;
  
  const partialResult = await runCurl(partialCmd);
  if (partialResult && partialResult.success) {
    console.log('✅ Partial return invoice created');
    console.log(`📝 Partial Invoice ID: ${partialResult.data._id}`);
    console.log(`💵 Refund: ₹${partialResult.data.paymentDetails.refundAmount}`);
    console.log(`📊 Outstanding: ₹${partialResult.data.paymentDetails.outstandingAmount}`);
  } else {
    console.log('❌ Partial return failed:', partialResult);
  }

  // Step 6: Test Rental Details
  console.log('\n6. 📋 Testing Rental Details...');
  const detailsCmd = `curl -s -X GET ${BASE_URL}/invoice/rental/details/${advanceInvoiceId} -H "Authorization: Bearer ${authToken}"`;
  
  const detailsResult = await runCurl(detailsCmd);
  if (detailsResult && detailsResult.success) {
    console.log('✅ Rental details fetched');
    console.log(`📊 Status: ${detailsResult.data.summary.status}`);
    console.log(`📝 Related Invoices: ${detailsResult.data.relatedInvoices.length}`);
  } else {
    console.log('❌ Rental details failed:', detailsResult);
  }

  // Step 7: Test Outstanding Rentals
  console.log('\n7. 📊 Testing Outstanding Rentals...');
  const outstandingCmd = `curl -s -X GET ${BASE_URL}/invoice/rental/outstanding/${companyId} -H "Authorization: Bearer ${authToken}"`;
  
  const outstandingResult = await runCurl(outstandingCmd);
  if (outstandingResult && outstandingResult.success) {
    console.log('✅ Outstanding rentals fetched');
    console.log(`📝 Outstanding Count: ${outstandingResult.data.length}`);
  } else {
    console.log('❌ Outstanding rentals failed:', outstandingResult);
  }

  // Step 8: Test Full Settlement
  console.log('\n8. 🏁 Testing Full Settlement...');
  const settlementData = {
    parentInvoiceId: advanceInvoiceId,
    finalReturnDate: new Date(Date.now() + 16 * 24 * 60 * 60 * 1000).toISOString(),
    finalPayment: 25000
  };

  const settlementCmd = `curl -s -X POST ${BASE_URL}/invoice/rental/full-settlement -H "Authorization: Bearer ${authToken}" -H "Content-Type: application/json" -d '${JSON.stringify(settlementData)}'`;
  
  const settlementResult = await runCurl(settlementCmd);
  if (settlementResult && settlementResult.success) {
    console.log('✅ Full settlement invoice created');
    console.log(`📝 Settlement ID: ${settlementResult.data._id}`);
    console.log(`💵 Final Amount: ₹${settlementResult.data.paymentDetails.finalAmount}`);
    console.log(`💰 Total Paid: ₹${settlementResult.data.paymentDetails.paidAmount}`);
    console.log(`🔄 Refund: ₹${settlementResult.data.paymentDetails.refundAmount}`);
  } else {
    console.log('❌ Full settlement failed:', settlementResult);
  }

  console.log('\n🎉 Rental Invoice System Testing Complete!');
};

testEndpoints().catch(console.error);
