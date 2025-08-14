// Test script for Rental Invoice System Endpoints
import axios from 'axios';

const BASE_URL = 'http://localhost:5000/api';

// Test data
const testData = {
  // You'll need to replace these with actual IDs from your database
  companyId: '507f1f77bcf86cd799439011', // Replace with actual company ID
  userId: 'test@example.com',
  password: 'testpassword'
};

let authToken = '';
let advanceInvoiceId = '';
let companyId = '';

// Helper function to make authenticated requests
const makeRequest = async (method, url, data = null) => {
  try {
    const config = {
      method,
      url: `${BASE_URL}${url}`,
      headers: authToken ? { 'Authorization': `Bearer ${authToken}` } : {},
      data
    };
    
    const response = await axios(config);
    return { success: true, data: response.data };
  } catch (error) {
    return { 
      success: false, 
      error: error.response?.data || error.message,
      status: error.response?.status 
    };
  }
};

// Test functions
const testLogin = async () => {
  console.log('\n🔐 Testing User Login...');
  const result = await makeRequest('POST', '/user/login', {
    email: testData.userId,
    password: testData.password
  });
  
  if (result.success && result.data.token) {
    authToken = result.data.token;
    console.log('✅ Login successful');
    return true;
  } else {
    console.log('❌ Login failed:', result.error);
    return false;
  }
};

const testGetCompanies = async () => {
  console.log('\n🏢 Testing Get Companies...');
  const result = await makeRequest('GET', '/companies/get');
  
  if (result.success && result.data.length > 0) {
    companyId = result.data[0]._id;
    console.log('✅ Companies fetched successfully');
    console.log(`📝 Using company ID: ${companyId}`);
    return true;
  } else {
    console.log('❌ Failed to fetch companies:', result.error);
    return false;
  }
};

const testAdvanceInvoice = async () => {
  console.log('\n💰 Testing Advance Invoice Creation...');
  
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

  const result = await makeRequest('POST', '/invoice/rental/advance', advanceData);
  
  if (result.success) {
    advanceInvoiceId = result.data.data._id;
    console.log('✅ Advance invoice created successfully');
    console.log(`📝 Invoice ID: ${advanceInvoiceId}`);
    console.log(`💵 Total Rent: ₹${result.data.data.paymentDetails.totalRentAmount}`);
    console.log(`💰 Advance: ₹${result.data.data.paymentDetails.advanceAmount}`);
    console.log(`📊 Outstanding: ₹${result.data.data.paymentDetails.outstandingAmount}`);
    return true;
  } else {
    console.log('❌ Advance invoice creation failed:', result.error);
    return false;
  }
};

const testPartialReturn = async () => {
  console.log('\n🔄 Testing Partial Return Invoice...');
  
  const partialData = {
    parentInvoiceId: advanceInvoiceId,
    returnedItems: [
      {
        productName: "Laptop C",
        returnedQuantity: 20
      }
    ],
    returnDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(), // 10 days later
    additionalPayment: 5000
  };

  const result = await makeRequest('POST', '/invoice/rental/partial-return', partialData);
  
  if (result.success) {
    console.log('✅ Partial return invoice created successfully');
    console.log(`📝 Partial Invoice ID: ${result.data.data._id}`);
    console.log(`💵 Refund Amount: ₹${result.data.data.paymentDetails.refundAmount}`);
    console.log(`📊 New Outstanding: ₹${result.data.data.paymentDetails.outstandingAmount}`);
    return true;
  } else {
    console.log('❌ Partial return invoice creation failed:', result.error);
    return false;
  }
};

const testFullSettlement = async () => {
  console.log('\n🏁 Testing Full Settlement Invoice...');
  
  const settlementData = {
    parentInvoiceId: advanceInvoiceId,
    finalReturnDate: new Date(Date.now() + 16 * 24 * 60 * 60 * 1000).toISOString(), // 16 days later
    finalPayment: 20000
  };

  const result = await makeRequest('POST', '/invoice/rental/full-settlement', settlementData);
  
  if (result.success) {
    console.log('✅ Full settlement invoice created successfully');
    console.log(`📝 Settlement Invoice ID: ${result.data.data._id}`);
    console.log(`💵 Final Amount: ₹${result.data.data.paymentDetails.finalAmount}`);
    console.log(`💰 Total Paid: ₹${result.data.data.paymentDetails.paidAmount}`);
    console.log(`🔄 Refund: ₹${result.data.data.paymentDetails.refundAmount}`);
    return true;
  } else {
    console.log('❌ Full settlement invoice creation failed:', result.error);
    return false;
  }
};

const testRentalDetails = async () => {
  console.log('\n📋 Testing Rental Invoice Details...');
  
  const result = await makeRequest('GET', `/invoice/rental/details/${advanceInvoiceId}`);
  
  if (result.success) {
    console.log('✅ Rental details fetched successfully');
    console.log(`📊 Status: ${result.data.data.summary.status}`);
    console.log(`📝 Related Invoices: ${result.data.data.relatedInvoices.length}`);
    return true;
  } else {
    console.log('❌ Failed to fetch rental details:', result.error);
    return false;
  }
};

const testOutstandingRentals = async () => {
  console.log('\n📊 Testing Outstanding Rentals...');
  
  const result = await makeRequest('GET', `/invoice/rental/outstanding/${companyId}`);
  
  if (result.success) {
    console.log('✅ Outstanding rentals fetched successfully');
    console.log(`📝 Outstanding Count: ${result.data.data.length}`);
    return true;
  } else {
    console.log('❌ Failed to fetch outstanding rentals:', result.error);
    return false;
  }
};

// Main test runner
const runTests = async () => {
  console.log('🚀 Starting Rental Invoice System Tests...\n');
  
  const tests = [
    { name: 'Login', fn: testLogin },
    { name: 'Get Companies', fn: testGetCompanies },
    { name: 'Advance Invoice', fn: testAdvanceInvoice },
    { name: 'Partial Return', fn: testPartialReturn },
    { name: 'Full Settlement', fn: testFullSettlement },
    { name: 'Rental Details', fn: testRentalDetails },
    { name: 'Outstanding Rentals', fn: testOutstandingRentals }
  ];
  
  let passed = 0;
  let failed = 0;
  
  for (const test of tests) {
    const result = await test.fn();
    if (result) {
      passed++;
    } else {
      failed++;
    }
    
    // Wait a bit between tests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.log('\n📊 Test Results:');
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📈 Success Rate: ${((passed / (passed + failed)) * 100).toFixed(1)}%`);
  
  if (failed === 0) {
    console.log('\n🎉 All tests passed! Rental Invoice System is working correctly.');
  } else {
    console.log('\n⚠️ Some tests failed. Please check the error messages above.');
  }
};

// Run the tests
runTests().catch(console.error);
