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
  updateUserRating(userId: number): Promise<User | undefined>;
  
  // Message methods
  getMessage(id: number): Promise<Message | undefined>;
  createMessage(message: InsertMessage): Promise<Message>;
  getMessagesByUser(userId: number): Promise<Message[]>;
  getConversation(user1Id: number, user2Id: number): Promise<Message[]>;
}

// Now using the DatabaseStorage implementation
import { DatabaseStorage } from "./database-storage";
export const storage = new DatabaseStorage();
