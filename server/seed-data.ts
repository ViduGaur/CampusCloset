// This file is used to seed the database with test data
import { storage } from './storage';

export async function seedTestData() {
  console.log("Adding test lender-borrower relationship for admin...");
  
  // Create clothing categories if they don't exist
  let formalCategory = await storage.getCategoryByName('Formal');
  if (!formalCategory) {
    formalCategory = await storage.createCategory({
      name: 'Formal',
      icon: 'GraduationCap'
    });
    console.log("Created formal category:", formalCategory);
  }
  
  let ethnicCategory = await storage.getCategoryByName('Ethnic');
  if (!ethnicCategory) {
    ethnicCategory = await storage.createCategory({
      name: 'Ethnic',
      icon: 'LandPlot'
    });
    console.log("Created ethnic category:", ethnicCategory);
  }
  
  // Create a test user (if it doesn't exist)
  let testUser = await storage.getUserByUsername('testuser');
  if (!testUser) {
    testUser = await storage.createUser({
      username: 'testuser',
      password: 'password123',
      email: 'test@campus.edu',
      fullName: 'Test User',
      hostel: 'HB4'
    });
    
    // Manually update the user to set additional fields
    await storage.updateUser(testUser.id, {
      isVerified: true,
      isAdmin: false,
      avgRating: 400, // 4.0 out of 5
      ratingCount: 5
    });
    console.log("Created test user:", testUser);
  }
  
  // Create an admin user (if it doesn't exist)
  let adminUser = await storage.getUserByUsername('admin');
  if (!adminUser) {
    adminUser = await storage.createUser({
      username: 'admin',
      password: 'admin123',
      email: 'admin@campus.edu',
      fullName: 'Admin User',
      hostel: 'HB1'
    });
    
    // Set admin privileges
    await storage.updateUser(adminUser.id, {
      isVerified: true,
      isAdmin: true,
      avgRating: 500, // 5.0 out of 5
      ratingCount: 10
    });
    console.log("Created admin user:", adminUser);
  }
  
  // Find an existing admin item or create a new one
  const adminItems = await storage.getItemsByOwner(adminUser.id);
  let adminItem;
  
  if (adminItems.length === 0) {
    // Create a new item for admin
    adminItem = await storage.createItem({
      name: 'Elegant Evening Gown',
      description: 'Perfect for formal events and parties. Black with subtle sequin details.',
      size: 'M',
      pricePerDay: 500, // $5.00 per day
      ownerId: adminUser.id,
      categoryId: formalCategory.id, // Formal category
      imageData: 'https://images.unsplash.com/photo-1562137369-1a1a0bc66744?q=80&w=1000&auto=format&fit=crop'
    });
    
    // Update item availability if needed
    await storage.updateItem(adminItem.id, {
      isAvailable: true
    });
    console.log("Created test item for admin:", adminItem);
  } else {
    adminItem = adminItems[0];
  }
  
  // Create a rental request from test user to admin (admin is lender)
  const existingRequests = await storage.getRentalRequestsByItem(adminItem.id);
  const hasTestUserRequest = existingRequests.some(req => req.requesterId === testUser.id);
  
  if (!hasTestUserRequest) {
    // Create a pending request
    const rentalRequest = await storage.createRentalRequest({
      itemId: adminItem.id,
      requesterId: testUser.id,
      startDate: new Date(), 
      endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days from now
    });
    
    // Update the status to approved
    await storage.updateRentalRequest(rentalRequest.id, {
      status: 'approved'
    });
    
    console.log("Created test rental request:", rentalRequest);
  } else {
    console.log("Test rental request already exists");
  }
  
  console.log("Test data seeding complete!");
}