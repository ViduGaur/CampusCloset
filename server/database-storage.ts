import { eq, and, or, desc, sql } from "drizzle-orm";
import { db } from "./db";
import {
  users, User, InsertUser,
  verificationRequests, VerificationRequest, InsertVerificationRequest,
  categories, Category, InsertCategory,
  items, Item, InsertItem,
  rentalRequests, RentalRequest, InsertRentalRequest,
  ratings, Rating, InsertRating,
  messages, Message, InsertMessage,
  rentalRatings, RentalRating, InsertRentalRating
} from "@shared/schema";
import { IStorage } from "./storage";

export class DatabaseStorage implements IStorage {
  // User methods
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async createUser(user: InsertUser): Promise<User> {
    const [newUser] = await db.insert(users).values(user).returning();
    return newUser;
  }

  async updateUser(id: number, update: Partial<User>): Promise<User | undefined> {
    const [updatedUser] = await db
      .update(users)
      .set(update)
      .where(eq(users.id, id))
      .returning();
    return updatedUser;
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users);
  }

  // Verification request methods
  async getVerificationRequest(id: number): Promise<VerificationRequest | undefined> {
    const [request] = await db.select().from(verificationRequests).where(eq(verificationRequests.id, id));
    return request;
  }

  async getVerificationRequestByUserId(userId: number): Promise<VerificationRequest | undefined> {
    const [request] = await db.select().from(verificationRequests).where(eq(verificationRequests.userId, userId));
    return request;
  }

  async createVerificationRequest(request: InsertVerificationRequest): Promise<VerificationRequest> {
    const [newRequest] = await db.insert(verificationRequests).values(request).returning();
    return newRequest;
  }

  async updateVerificationRequest(id: number, update: Partial<VerificationRequest>): Promise<VerificationRequest | undefined> {
    const [updatedRequest] = await db
      .update(verificationRequests)
      .set(update)
      .where(eq(verificationRequests.id, id))
      .returning();
    return updatedRequest;
  }

  async getAllPendingVerificationRequests(): Promise<VerificationRequest[]> {
    return await db
      .select()
      .from(verificationRequests)
      .where(eq(verificationRequests.status, "pending"));
  }

  // Category methods
  async getCategory(id: number): Promise<Category | undefined> {
    const [category] = await db.select().from(categories).where(eq(categories.id, id));
    return category;
  }

  async getCategoryByName(name: string): Promise<Category | undefined> {
    const [category] = await db.select().from(categories).where(eq(categories.name, name));
    return category;
  }

  async createCategory(category: InsertCategory): Promise<Category> {
    const [newCategory] = await db.insert(categories).values(category).returning();
    return newCategory;
  }

  async getAllCategories(): Promise<Category[]> {
    return await db.select().from(categories);
  }

  // Item methods
  async getItem(id: number): Promise<Item | undefined> {
    const [item] = await db.select().from(items).where(eq(items.id, id));
    return item;
  }

  async createItem(item: InsertItem): Promise<Item> {
    const [newItem] = await db.insert(items).values(item).returning();
    return newItem;
  }

  async updateItem(id: number, update: Partial<Item>): Promise<Item | undefined> {
    const [updatedItem] = await db
      .update(items)
      .set(update)
      .where(eq(items.id, id))
      .returning();
    return updatedItem;
  }

  async getAllItems(): Promise<Item[]> {
    return await db.select().from(items);
  }

  async getItemsByCategory(categoryId: number): Promise<Item[]> {
    return await db.select().from(items).where(eq(items.categoryId, categoryId));
  }

  async getItemsByOwner(ownerId: number): Promise<Item[]> {
    return await db.select().from(items).where(eq(items.ownerId, ownerId));
  }

  // Rental request methods
  async getRentalRequest(id: number): Promise<RentalRequest | undefined> {
    const [request] = await db.select().from(rentalRequests).where(eq(rentalRequests.id, id));
    return request;
  }

  async createRentalRequest(request: InsertRentalRequest): Promise<RentalRequest> {
    const [newRequest] = await db.insert(rentalRequests).values(request).returning();
    return newRequest;
  }

  async updateRentalRequest(id: number, update: Partial<RentalRequest>): Promise<RentalRequest | undefined> {
    const [updatedRequest] = await db
      .update(rentalRequests)
      .set(update)
      .where(eq(rentalRequests.id, id))
      .returning();
    return updatedRequest;
  }

  async getRentalRequestsByItem(itemId: number): Promise<RentalRequest[]> {
    return await db.select().from(rentalRequests).where(eq(rentalRequests.itemId, itemId));
  }

  async getRentalRequestsByRequester(requesterId: number): Promise<RentalRequest[]> {
    return await db.select().from(rentalRequests).where(eq(rentalRequests.requesterId, requesterId));
  }

  async getRentalRequestsByOwner(ownerId: number): Promise<RentalRequest[]> {
    // Join with items to get owner info
    const itemsWithOwner = await db.select().from(items).where(eq(items.ownerId, ownerId));
    
    if (itemsWithOwner.length === 0) {
      return [];
    }
    
    const itemIds = itemsWithOwner.map(item => item.id);
    return await db
      .select()
      .from(rentalRequests)
      .where(sql`${rentalRequests.itemId} IN (${sql.join(itemIds, sql`, `)})`)
  }

  // Rating methods
  async getRating(id: number): Promise<Rating | undefined> {
    const [rating] = await db.select().from(ratings).where(eq(ratings.id, id));
    return rating;
  }

  async createRating(rating: InsertRating): Promise<Rating> {
    const [newRating] = await db.insert(ratings).values(rating).returning();
    return newRating;
  }

  async getRatingsByUser(userId: number): Promise<Rating[]> {
    return await db.select().from(ratings).where(
      or(
        eq(ratings.fromUserId, userId),
        eq(ratings.toUserId, userId)
      )
    );
  }

  // This calculates the average rating for a user and updates their avgRating
  async updateUserRating(userId: number): Promise<User | undefined> {
    const user = await this.getUser(userId);
    if (!user) return undefined;
    
    const ratingsReceived = await db
      .select()
      .from(ratings)
      .where(eq(ratings.toUserId, userId));
    
    if (ratingsReceived.length === 0) {
      return await this.updateUser(userId, { avgRating: 0, ratingCount: 0 });
    }
    
    const sum = ratingsReceived.reduce((acc, rating) => acc + rating.rating, 0);
    const avg = Math.round((sum / ratingsReceived.length) * 100); // Store as integer (0-500)
    
    return await this.updateUser(userId, { 
      avgRating: avg,
      ratingCount: ratingsReceived.length 
    });
  }

  // Message methods
  async getMessage(id: number): Promise<Message | undefined> {
    const [message] = await db.select().from(messages).where(eq(messages.id, id));
    return message;
  }

  async createMessage(message: InsertMessage): Promise<Message> {
    const [newMessage] = await db.insert(messages).values(message).returning();
    return newMessage;
  }

  async getMessagesByUser(userId: number): Promise<Message[]> {
    return await db
      .select()
      .from(messages)
      .where(
        or(
          eq(messages.fromUserId, userId),
          eq(messages.toUserId, userId)
        )
      )
      .orderBy(desc(messages.createdAt));
  }

  async getConversation(user1Id: number, user2Id: number, itemId?: number): Promise<Message[]> {
    const conditions = [
      or(
        and(
          eq(messages.fromUserId, user1Id),
          eq(messages.toUserId, user2Id)
        ),
        and(
          eq(messages.fromUserId, user2Id),
          eq(messages.toUserId, user1Id)
        )
      )
    ];
    
    // If itemId is provided, filter by item
    if (itemId) {
      conditions.push(eq(messages.itemId, itemId));
    }
    
    return await db
      .select()
      .from(messages)
      .where(and(...conditions))
      .orderBy(desc(messages.createdAt));
  }

  async createRentalRating(rating: InsertRentalRating): Promise<RentalRating> {
    const [newRating] = await db.insert(rentalRatings).values(rating).returning();
    return newRating;
  }

  async getRentalRatingByRequestAndRater(rentalRequestId: number, ratedBy: number): Promise<RentalRating | undefined> {
    const [rating] = await db
      .select()
      .from(rentalRatings)
      .where(
        and(
          eq(rentalRatings.rentalRequestId, rentalRequestId),
          eq(rentalRatings.ratedBy, ratedBy)
        )
      );
    return rating;
  }

  async getRentalRatingsForUser(userId: number): Promise<RentalRating[]> {
    // Get all ratings where the user was the requester of the rental
    return await db
      .select()
      .from(rentalRatings)
      .where(
        sql`${rentalRatings.rentalRequestId} IN (SELECT id FROM rental_requests WHERE requester_id = ${userId})`
      );
  }

  async markRentalCompleted(rentalRequestId: number, userId: number, isLender: boolean): Promise<RentalRequest | undefined> {
    // Update the appropriate flag
    const update: Partial<RentalRequest> = isLender
      ? { completedByLender: true }
      : { completedByBorrower: true };
    const [updated] = await db
      .update(rentalRequests)
      .set(update)
      .where(eq(rentalRequests.id, rentalRequestId))
      .returning();
    return updated;
  }
}