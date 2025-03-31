import {
  users, User, InsertUser,
  verificationRequests, VerificationRequest, InsertVerificationRequest,
  categories, Category, InsertCategory,
  items, Item, InsertItem,
  rentalRequests, RentalRequest, InsertRentalRequest,
  ratings, Rating, InsertRating,
  messages, Message, InsertMessage
} from "@shared/schema";

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, update: Partial<User>): Promise<User | undefined>;
  getAllUsers(): Promise<User[]>;
  
  // Verification request methods
  getVerificationRequest(id: number): Promise<VerificationRequest | undefined>;
  getVerificationRequestByUserId(userId: number): Promise<VerificationRequest | undefined>;
  createVerificationRequest(request: InsertVerificationRequest): Promise<VerificationRequest>;
  updateVerificationRequest(id: number, update: Partial<VerificationRequest>): Promise<VerificationRequest | undefined>;
  getAllPendingVerificationRequests(): Promise<VerificationRequest[]>;
  
  // Category methods
  getCategory(id: number): Promise<Category | undefined>;
  getCategoryByName(name: string): Promise<Category | undefined>;
  createCategory(category: InsertCategory): Promise<Category>;
  getAllCategories(): Promise<Category[]>;
  
  // Item methods
  getItem(id: number): Promise<Item | undefined>;
  createItem(item: InsertItem): Promise<Item>;
  updateItem(id: number, update: Partial<Item>): Promise<Item | undefined>;
  getAllItems(): Promise<Item[]>;
  getItemsByCategory(categoryId: number): Promise<Item[]>;
  getItemsByOwner(ownerId: number): Promise<Item[]>;
  
  // Rental request methods
  getRentalRequest(id: number): Promise<RentalRequest | undefined>;
  createRentalRequest(request: InsertRentalRequest): Promise<RentalRequest>;
  updateRentalRequest(id: number, update: Partial<RentalRequest>): Promise<RentalRequest | undefined>;
  getRentalRequestsByItem(itemId: number): Promise<RentalRequest[]>;
  getRentalRequestsByRequester(requesterId: number): Promise<RentalRequest[]>;
  getRentalRequestsByOwner(ownerId: number): Promise<RentalRequest[]>;
  
  // Rating methods
  getRating(id: number): Promise<Rating | undefined>;
  createRating(rating: InsertRating): Promise<Rating>;
  getRatingsByUser(userId: number): Promise<Rating[]>;
  
  // Message methods
  getMessage(id: number): Promise<Message | undefined>;
  createMessage(message: InsertMessage): Promise<Message>;
  getMessagesByUser(userId: number): Promise<Message[]>;
  getConversation(user1Id: number, user2Id: number): Promise<Message[]>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private verificationRequests: Map<number, VerificationRequest>;
  private categories: Map<number, Category>;
  private items: Map<number, Item>;
  private rentalRequests: Map<number, RentalRequest>;
  private ratings: Map<number, Rating>;
  private messages: Map<number, Message>;
  
  private userId: number;
  private verificationRequestId: number;
  private categoryId: number;
  private itemId: number;
  private rentalRequestId: number;
  private ratingId: number;
  private messageId: number;
  
  constructor() {
    this.users = new Map();
    this.verificationRequests = new Map();
    this.categories = new Map();
    this.items = new Map();
    this.rentalRequests = new Map();
    this.ratings = new Map();
    this.messages = new Map();
    
    this.userId = 1;
    this.verificationRequestId = 1;
    this.categoryId = 1;
    this.itemId = 1;
    this.rentalRequestId = 1;
    this.ratingId = 1;
    this.messageId = 1;
    
    // Create admin user
    this.createUser({
      username: "admin",
      password: "admin123", // In a real app, this would be hashed
      email: "admin@campus.edu",
      fullName: "Admin User",
      hostel: "Admin Building"
    }).then(user => {
      this.updateUser(user.id, {
        isAdmin: true,
        isVerified: true
      });
    });
    
    // Create default categories
    const categories = [
      { name: "Clothes", icon: "shirt" },
      { name: "Accessories", icon: "gem" },
      { name: "Footwear", icon: "shoe-prints" }
    ];
    
    categories.forEach(category => {
      this.createCategory({
        name: category.name,
        icon: category.icon,
        parentId: null
      });
    });
    
    // Add subcategories
    const clothesSubcategories = [
      { name: "Formal", icon: "user-tie", parentId: 1 },
      { name: "Casual", icon: "tshirt", parentId: 1 },
      { name: "Ethnic", icon: "vest", parentId: 1 }
    ];
    
    clothesSubcategories.forEach(subcategory => {
      this.createCategory({
        name: subcategory.name,
        icon: subcategory.icon,
        parentId: subcategory.parentId
      });
    });
    
    // Create a demo user
    this.createUser({
      username: "demo_user",
      password: "password123",
      email: "demo@example.com", 
      fullName: "Demo User",
      hostel: "HB3"
    }).then(user => {
      this.updateUser(user.id, {
        isVerified: true,
        isAdmin: false
      });
      
      // Create sample items for demo user
      this.createItem({
        name: "Navy Blue Blazer",
        description: "Formal navy blue blazer, perfect for interviews and formal events. Barely used, in excellent condition.",
        size: "Medium",
        pricePerDay: 120,
        categoryId: 4, // Formal
        ownerId: user.id,
        imageData: "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iIzFhMzY1ZCIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LXNpemU9IjIwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBhbGlnbm1lbnQtYmFzZWxpbmU9Im1pZGRsZSIgZmlsbD0id2hpdGUiPk5hdnkgQmx1ZSBCbGF6ZXI8L3RleHQ+PC9zdmc+"
      });
      
      this.createItem({
        name: "Designer Denim Jeans",
        description: "Stylish designer jeans, slim fit. Comfortable for everyday wear. Rented once before.",
        size: "32 waist",
        pricePerDay: 80,
        categoryId: 5, // Casual
        ownerId: user.id,
        imageData: "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iIzEwNGU4YiIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LXNpemU9IjE4IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBhbGlnbm1lbnQtYmFzZWxpbmU9Im1pZGRsZSIgZmlsbD0id2hpdGUiPkRlc2lnbmVyIERlbmltPC90ZXh0Pjwvc3ZnPg=="
      });
      
      this.createItem({
        name: "Traditional Silk Kurta",
        description: "Hand-embroidered silk kurta, perfect for cultural events. Rich color and design.",
        size: "Large",
        pricePerDay: 200,
        categoryId: 6, // Ethnic
        ownerId: user.id,
        imageData: "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI2IyMDAyZiIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LXNpemU9IjE4IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBhbGlnbm1lbnQtYmFzZWxpbmU9Im1pZGRsZSIgZmlsbD0id2hpdGUiPlNpbGsgS3VydGE8L3RleHQ+PC9zdmc+"
      });
      
      this.createItem({
        name: "Silver Bracelet",
        description: "Elegant silver bracelet that goes with any outfit. Perfect for special occasions.",
        size: "One size",
        pricePerDay: 60,
        categoryId: 2, // Accessories
        ownerId: user.id,
        imageData: "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI2M0YzRjNCIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LXNpemU9IjE4IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBhbGlnbm1lbnQtYmFzZWxpbmU9Im1pZGRsZSIgZmlsbD0iIzMzMyI+U2lsdmVyIEJyYWNlbGV0PC90ZXh0Pjwvc3ZnPg=="
      });
      
      this.createItem({
        name: "Leather Dress Shoes",
        description: "Brown leather dress shoes, barely worn. Perfect for formal events or interviews.",
        size: "UK 9",
        pricePerDay: 100,
        categoryId: 3, // Footwear
        ownerId: user.id,
        imageData: "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iIzZkNGMyMCIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LXNpemU9IjE4IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBhbGlnbm1lbnQtYmFzZWxpbmU9Im1pZGRsZSIgZmlsbD0id2hpdGUiPkxlYXRoZXIgU2hvZXM8L3RleHQ+PC9zdmc+"
      });
      
      // Create a second user with different hostel
      this.createUser({
        username: "another_user",
        password: "password123",
        email: "another@example.com",
        fullName: "Another User",
        hostel: "HB1"
      }).then(user2 => {
        this.updateUser(user2.id, {
          isVerified: true,
          isAdmin: false
        });
        
        // Create some items for the second user
        this.createItem({
          name: "Floral Party Dress",
          description: "Beautiful floral dress, perfect for parties and special occasions. Worn only once.",
          size: "Small",
          pricePerDay: 150,
          categoryId: 1, // Clothes
          ownerId: user2.id,
          imageData: "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI2YyN2ViOCIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LXNpemU9IjIwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBhbGlnbm1lbnQtYmFzZWxpbmU9Im1pZGRsZSIgZmlsbD0id2hpdGUiPkZsb3JhbCBEcmVzczwvdGV4dD48L3N2Zz4="
        });
        
        this.createItem({
          name: "Designer Handbag",
          description: "Authentic designer handbag in excellent condition. Perfect accessory for any outfit.",
          size: "One size",
          pricePerDay: 200,
          categoryId: 2, // Accessories
          ownerId: user2.id,
          imageData: "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iIzgzNTYyNCIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LXNpemU9IjE4IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBhbGlnbm1lbnQtYmFzZWxpbmU9Im1pZGRsZSIgZmlsbD0id2hpdGUiPkRlc2lnbmVyIEhhbmRiYWc8L3RleHQ+PC9zdmc+"
        });
        
        this.createItem({
          name: "White Sneakers",
          description: "Clean white sneakers, minimal wear. Great for casual outfits.",
          size: "UK 7",
          pricePerDay: 70,
          categoryId: 3, // Footwear
          ownerId: user2.id,
          imageData: "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI2YxZjFmMSIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LXNpemU9IjIwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBhbGlnbm1lbnQtYmFzZWxpbmU9Im1pZGRsZSIgZmlsbD0iIzMzMyI+V2hpdGUgU25lYWtlcnM8L3RleHQ+PC9zdmc+"
        });
        
        // Create some rental requests between the two users
        const now = new Date();
        const nextWeek = new Date(now);
        nextWeek.setDate(now.getDate() + 7);
        
        // Demo user rents from second user
        this.createRentalRequest({
          itemId: 6, // Floral Party Dress
          requesterId: 1, // Demo user
          startDate: now,
          endDate: nextWeek,
        }).then(request => {
          // Auto-approve this request
          this.updateRentalRequest(request.id, {
            status: "approved"
          });
        });
        
        // Second user rents from demo user
        this.createRentalRequest({
          itemId: 1, // Navy Blue Blazer
          requesterId: 2, // Second user
          startDate: now,
          endDate: nextWeek,
        }).then(request => {
          // Auto-approve this request
          this.updateRentalRequest(request.id, {
            status: "approved"
          });
        });
        
        // Add some messages between users
        this.createMessage({
          fromUserId: 1, // Demo user
          toUserId: 2, // Second user
          content: "Hi, I'm interested in renting your floral dress for an upcoming event.",
          itemId: 6 // Floral Party Dress
        });
        
        this.createMessage({
          fromUserId: 2, // Second user
          toUserId: 1, // Demo user
          content: "Absolutely! It's available. When do you need it?",
          itemId: 6 // Floral Party Dress
        });
        
        this.createMessage({
          fromUserId: 1, // Demo user
          toUserId: 2, // Second user
          content: "I was thinking this weekend? Would that work for you?",
          itemId: 6 // Floral Party Dress
        });
        
        this.createMessage({
          fromUserId: 2, // Second user
          toUserId: 1, // Demo user
          content: "That works! I just approved your request. Enjoy the dress!",
          itemId: 6 // Floral Party Dress
        });
      });
    });
  }
  
  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }
  
  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username
    );
  }
  
  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.email === email
    );
  }
  
  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userId++;
    const now = new Date();
    const user: User = {
      ...insertUser,
      id,
      isVerified: false,
      isAdmin: false,
      createdAt: now
    };
    this.users.set(id, user);
    return user;
  }
  
  async updateUser(id: number, update: Partial<User>): Promise<User | undefined> {
    const user = await this.getUser(id);
    if (!user) return undefined;
    
    const updatedUser = { ...user, ...update };
    this.users.set(id, updatedUser);
    return updatedUser;
  }
  
  async getAllUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }
  
  // Verification request methods
  async getVerificationRequest(id: number): Promise<VerificationRequest | undefined> {
    return this.verificationRequests.get(id);
  }
  
  async getVerificationRequestByUserId(userId: number): Promise<VerificationRequest | undefined> {
    return Array.from(this.verificationRequests.values()).find(
      (request) => request.userId === userId
    );
  }
  
  async createVerificationRequest(request: InsertVerificationRequest): Promise<VerificationRequest> {
    const id = this.verificationRequestId++;
    const now = new Date();
    const verificationRequest: VerificationRequest = {
      ...request,
      id,
      status: "pending",
      reviewedBy: null,
      createdAt: now,
      reviewedAt: null,
      notes: null
    };
    this.verificationRequests.set(id, verificationRequest);
    return verificationRequest;
  }
  
  async updateVerificationRequest(id: number, update: Partial<VerificationRequest>): Promise<VerificationRequest | undefined> {
    const request = await this.getVerificationRequest(id);
    if (!request) return undefined;
    
    const updatedRequest = { ...request, ...update };
    this.verificationRequests.set(id, updatedRequest);
    return updatedRequest;
  }
  
  async getAllPendingVerificationRequests(): Promise<VerificationRequest[]> {
    return Array.from(this.verificationRequests.values()).filter(
      (request) => request.status === "pending"
    );
  }
  
  // Category methods
  async getCategory(id: number): Promise<Category | undefined> {
    return this.categories.get(id);
  }
  
  async getCategoryByName(name: string): Promise<Category | undefined> {
    return Array.from(this.categories.values()).find(
      (category) => category.name === name
    );
  }
  
  async createCategory(category: InsertCategory): Promise<Category> {
    const id = this.categoryId++;
    const newCategory: Category = {
      ...category,
      id
    };
    this.categories.set(id, newCategory);
    return newCategory;
  }
  
  async getAllCategories(): Promise<Category[]> {
    return Array.from(this.categories.values());
  }
  
  // Item methods
  async getItem(id: number): Promise<Item | undefined> {
    return this.items.get(id);
  }
  
  async createItem(item: InsertItem): Promise<Item> {
    const id = this.itemId++;
    const now = new Date();
    const newItem: Item = {
      ...item,
      id,
      isAvailable: true,
      createdAt: now
    };
    this.items.set(id, newItem);
    return newItem;
  }
  
  async updateItem(id: number, update: Partial<Item>): Promise<Item | undefined> {
    const item = await this.getItem(id);
    if (!item) return undefined;
    
    const updatedItem = { ...item, ...update };
    this.items.set(id, updatedItem);
    return updatedItem;
  }
  
  async getAllItems(): Promise<Item[]> {
    return Array.from(this.items.values()).filter(item => item.isAvailable);
  }
  
  async getItemsByCategory(categoryId: number): Promise<Item[]> {
    return Array.from(this.items.values()).filter(
      (item) => item.categoryId === categoryId && item.isAvailable
    );
  }
  
  async getItemsByOwner(ownerId: number): Promise<Item[]> {
    return Array.from(this.items.values()).filter(
      (item) => item.ownerId === ownerId
    );
  }
  
  // Rental request methods
  async getRentalRequest(id: number): Promise<RentalRequest | undefined> {
    return this.rentalRequests.get(id);
  }
  
  async createRentalRequest(request: InsertRentalRequest): Promise<RentalRequest> {
    const id = this.rentalRequestId++;
    const now = new Date();
    const rentalRequest: RentalRequest = {
      ...request,
      id,
      status: "pending",
      createdAt: now,
      updatedAt: now
    };
    this.rentalRequests.set(id, rentalRequest);
    return rentalRequest;
  }
  
  async updateRentalRequest(id: number, update: Partial<RentalRequest>): Promise<RentalRequest | undefined> {
    const request = await this.getRentalRequest(id);
    if (!request) return undefined;
    
    const updatedRequest = { 
      ...request, 
      ...update,
      updatedAt: new Date()
    };
    this.rentalRequests.set(id, updatedRequest);
    return updatedRequest;
  }
  
  async getRentalRequestsByItem(itemId: number): Promise<RentalRequest[]> {
    return Array.from(this.rentalRequests.values()).filter(
      (request) => request.itemId === itemId
    );
  }
  
  async getRentalRequestsByRequester(requesterId: number): Promise<RentalRequest[]> {
    return Array.from(this.rentalRequests.values()).filter(
      (request) => request.requesterId === requesterId
    );
  }
  
  async getRentalRequestsByOwner(ownerId: number): Promise<RentalRequest[]> {
    const ownerItems = await this.getItemsByOwner(ownerId);
    const itemIds = ownerItems.map(item => item.id);
    
    return Array.from(this.rentalRequests.values()).filter(
      (request) => itemIds.includes(request.itemId)
    );
  }
  
  // Rating methods
  async getRating(id: number): Promise<Rating | undefined> {
    return this.ratings.get(id);
  }
  
  async createRating(rating: InsertRating): Promise<Rating> {
    const id = this.ratingId++;
    const now = new Date();
    const newRating: Rating = {
      ...rating,
      id,
      createdAt: now
    };
    this.ratings.set(id, newRating);
    return newRating;
  }
  
  async getRatingsByUser(userId: number): Promise<Rating[]> {
    return Array.from(this.ratings.values()).filter(
      (rating) => rating.toUserId === userId
    );
  }
  
  // Message methods
  async getMessage(id: number): Promise<Message | undefined> {
    return this.messages.get(id);
  }
  
  async createMessage(message: InsertMessage): Promise<Message> {
    const id = this.messageId++;
    const now = new Date();
    const newMessage: Message = {
      ...message,
      id,
      isRead: false,
      createdAt: now
    };
    this.messages.set(id, newMessage);
    return newMessage;
  }
  
  async getMessagesByUser(userId: number): Promise<Message[]> {
    return Array.from(this.messages.values()).filter(
      (message) => message.toUserId === userId || message.fromUserId === userId
    );
  }
  
  async getConversation(user1Id: number, user2Id: number): Promise<Message[]> {
    return Array.from(this.messages.values())
      .filter(
        (message) => 
          (message.fromUserId === user1Id && message.toUserId === user2Id) ||
          (message.fromUserId === user2Id && message.toUserId === user1Id)
      )
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  }
}

export const storage = new MemStorage();
