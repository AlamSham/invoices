// Simple test to check database connection and get test data
import axios from 'axios';

const BASE_URL = 'http://localhost:5000/api';

const testBasicEndpoints = async () => {
  console.log('🔍 Testing basic endpoints...\n');
  
  try {
    // Test server health
    console.log('1. Testing server health...');
    const healthResponse = await axios.get(`${BASE_URL}/invoice/nextInvoiceNumber`);
    console.log('✅ Server is responding');
    console.log(`📝 Next invoice number: ${healthResponse.data.nextInvoiceNumber}`);
    
    // Test getting companies (without auth for now)
    console.log('\n2. Testing companies endpoint...');
    try {
      const companiesResponse = await axios.get(`${BASE_URL}/companies/get`);
      console.log('✅ Companies endpoint accessible');
      console.log(`📊 Found ${companiesResponse.data.length} companies`);
      
      if (companiesResponse.data.length > 0) {
        console.log('📝 First company:', {
          id: companiesResponse.data[0]._id,
          name: companiesResponse.data[0].name || 'No name'
        });
      }
    } catch (error) {
      console.log('⚠️ Companies endpoint requires auth:', error.response?.status);
    }
    
    // Test getting users (without auth)
    console.log('\n3. Testing users endpoint...');
    try {
      const usersResponse = await axios.get(`${BASE_URL}/user/get`);
      console.log('✅ Users endpoint accessible');
      console.log(`📊 Found ${usersResponse.data.length} users`);
    } catch (error) {
      console.log('⚠️ Users endpoint requires auth:', error.response?.status);
    }
    
    // Test creating a test user for our tests
    console.log('\n4. Testing user registration...');
    try {
      const testUser = {
        name: 'Test User',
        email: 'test@rental.com',
        password: 'test123456'
      };
      
      const registerResponse = await axios.post(`${BASE_URL}/user/register`, testUser);
      console.log('✅ Test user created successfully');
      console.log('📝 User ID:', registerResponse.data.user?._id);
    } catch (error) {
      if (error.response?.status === 400) {
        console.log('ℹ️ Test user already exists or validation error');
      } else {
        console.log('❌ User registration failed:', error.response?.data);
      }
    }
    
    // Test login with test user
    console.log('\n5. Testing login...');
    try {
      const loginResponse = await axios.post(`${BASE_URL}/user/login`, {
        email: 'test@rental.com',
        password: 'test123456'
      });
      
      if (loginResponse.data.token) {
        console.log('✅ Login successful');
        console.log('🔑 Token received');
        
        // Now test authenticated endpoints
        const authHeaders = { 'Authorization': `Bearer ${loginResponse.data.token}` };
        
        // Test companies with auth
        console.log('\n6. Testing companies with auth...');
        try {
          const companiesResponse = await axios.get(`${BASE_URL}/companies/get`, { headers: authHeaders });
          console.log('✅ Companies fetched with auth');
          console.log(`📊 Found ${companiesResponse.data.length} companies`);
          
          if (companiesResponse.data.length === 0) {
            // Create a test company
            console.log('\n7. Creating test company...');
            const testCompany = {
              name: 'Test Rental Company',
              address: '123 Test Street, Test City',
              gstin: '29TESTCO1234F1Z5',
              email: 'test@company.com',
              phone: '9876543210'
            };
            
            const companyResponse = await axios.post(`${BASE_URL}/companies/add`, testCompany, { headers: authHeaders });
            console.log('✅ Test company created');
            console.log('📝 Company ID:', companyResponse.data._id);
          }
        } catch (error) {
          console.log('❌ Companies with auth failed:', error.response?.data);
        }
        
      }
    } catch (error) {
      console.log('❌ Login failed:', error.response?.data);
    }
    
  } catch (error) {
    console.log('❌ Server connection failed:', error.message);
  }
};

testBasicEndpoints();
