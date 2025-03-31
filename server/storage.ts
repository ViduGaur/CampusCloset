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
