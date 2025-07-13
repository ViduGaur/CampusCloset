import { relations } from "drizzle-orm";
import { pgTable, text, serial, integer, boolean, timestamp, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User model
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").notNull().unique(),
  fullName: text("full_name").notNull(),
  hostel: text("hostel").notNull(),
  isVerified: boolean("is_verified").notNull().default(false),
  isAdmin: boolean("is_admin").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  // Trust score will be calculated from average rating
  avgRating: integer("avg_rating").default(0), // 0-500 (0-5 stars with 2 decimal places, multiplied by 100)
  ratingCount: integer("rating_count").default(0),
});

// User relations will be defined after all tables are declared to avoid circular dependencies

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  isVerified: true,
  isAdmin: true,
  createdAt: true,
  avgRating: true,
  ratingCount: true,
});

// Verification request model
export const verificationRequests = pgTable("verification_requests", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  idImageData: text("id_image_data").notNull(), // Base64 encoded image
  status: text("status").notNull().default("pending"), // pending, approved, rejected
  reviewedBy: integer("reviewed_by").references(() => users.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  reviewedAt: timestamp("reviewed_at"),
  notes: text("notes"),
});

export const verificationRequestsRelations = relations(verificationRequests, ({ one }) => {
  return {
    user: one(users, {
      fields: [verificationRequests.userId],
      references: [users.id],
    }),
    reviewer: one(users, {
      fields: [verificationRequests.reviewedBy],
      references: [users.id],
    }),
  };
});

export const insertVerificationRequestSchema = createInsertSchema(verificationRequests).omit({
  id: true,
  status: true,
  reviewedBy: true,
  createdAt: true,
  reviewedAt: true,
  notes: true,
});

// Item categories
export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  parentId: integer("parent_id"),
  icon: text("icon").notNull().default("tshirt"),
});

export const categoriesRelations = relations(categories, ({ one, many }) => {
  return {
    parent: one(categories, {
      fields: [categories.parentId],
      references: [categories.id],
    }),
    children: many(categories),
    items: many(items),
  };
});

export const insertCategorySchema = createInsertSchema(categories).omit({
  id: true,
});

// Items for rent
export const items = pgTable("items", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  size: text("size").notNull(),
  ownerId: integer("owner_id").notNull().references(() => users.id),
  categoryId: integer("category_id").notNull().references(() => categories.id),
  pricePerDay: integer("price_per_day").notNull(), // in cents
  imageData: text("image_data").notNull(), // Base64 encoded image
  isAvailable: boolean("is_available").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const itemsRelations = relations(items, ({ one, many }) => {
  return {
    owner: one(users, {
      fields: [items.ownerId],
      references: [users.id],
    }),
    category: one(categories, {
      fields: [items.categoryId],
      references: [categories.id],
    }),
    rentalRequests: many(rentalRequests),
    messages: many(messages),
  };
});

export const insertItemSchema = createInsertSchema(items).omit({
  id: true,
  isAvailable: true,
  createdAt: true,
});

// Rental requests
export const rentalRequests = pgTable("rental_requests", {
  id: serial("id").primaryKey(),
  itemId: integer("item_id").notNull().references(() => items.id),
  requesterId: integer("requester_id").notNull().references(() => users.id),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  status: text("status").notNull().default("pending"), // pending, approved, rejected, completed
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  completedByLender: boolean("completed_by_lender").notNull().default(false),
  completedByBorrower: boolean("completed_by_borrower").notNull().default(false),
});

export const rentalRequestsRelations = relations(rentalRequests, ({ one, many }) => {
  return {
    item: one(items, {
      fields: [rentalRequests.itemId],
      references: [items.id],
    }),
    requester: one(users, {
      fields: [rentalRequests.requesterId],
      references: [users.id],
    }),
    ratings: many(ratings),
  };
});

export const insertRentalRequestSchema = z.object({
  itemId: z.number(),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  requesterId: z.number(), // always required
});

// User ratings
export const ratings = pgTable("ratings", {
  id: serial("id").primaryKey(),
  fromUserId: integer("from_user_id").notNull().references(() => users.id),
  toUserId: integer("to_user_id").notNull().references(() => users.id),
  rentalRequestId: integer("rental_request_id").notNull().references(() => rentalRequests.id),
  rating: integer("rating").notNull(), // 1-5
  comment: text("comment"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const ratingsRelations = relations(ratings, ({ one }) => {
  return {
    fromUser: one(users, {
      fields: [ratings.fromUserId],
      references: [users.id],
      relationName: "rater",
    }),
    toUser: one(users, {
      fields: [ratings.toUserId],
      references: [users.id],
      relationName: "rated",
    }),
    rentalRequest: one(rentalRequests, {
      fields: [ratings.rentalRequestId],
      references: [rentalRequests.id],
    }),
  };
});

export const insertRatingSchema = createInsertSchema(ratings).omit({
  id: true,
  createdAt: true,
});

// Messages between users
export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  fromUserId: integer("from_user_id").notNull().references(() => users.id),
  toUserId: integer("to_user_id").notNull().references(() => users.id),
  itemId: integer("item_id").references(() => items.id),
  content: text("content").notNull(),
  isRead: boolean("is_read").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const messagesRelations = relations(messages, ({ one }) => {
  return {
    sender: one(users, {
      fields: [messages.fromUserId],
      references: [users.id],
      relationName: "sender",
    }),
    recipient: one(users, {
      fields: [messages.toUserId],
      references: [users.id],
      relationName: "recipient",
    }),
    item: one(items, {
      fields: [messages.itemId],
      references: [items.id],
    }),
  };
});

export const insertMessageSchema = createInsertSchema(messages).omit({
  id: true,
  isRead: true,
  createdAt: true,
});

// Rental ratings
export const rentalRatings = pgTable("rental_ratings", {
  id: serial("id").primaryKey(),
  rentalRequestId: integer("rental_request_id").notNull().references(() => rentalRequests.id),
  rating: integer("rating").notNull(), // 1-5
  comment: text("comment"),
  ratedBy: integer("rated_by").notNull().references(() => users.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Type exports
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type VerificationRequest = typeof verificationRequests.$inferSelect;
export type InsertVerificationRequest = z.infer<typeof insertVerificationRequestSchema>;

export type Category = typeof categories.$inferSelect;
export type InsertCategory = z.infer<typeof insertCategorySchema>;

export type Item = typeof items.$inferSelect;
export type InsertItem = z.infer<typeof insertItemSchema>;

export type RentalRequest = typeof rentalRequests.$inferSelect;
export type InsertRentalRequest = z.infer<typeof insertRentalRequestSchema>;

export type Rating = typeof ratings.$inferSelect;
export type InsertRating = z.infer<typeof insertRatingSchema>;

export type Message = typeof messages.$inferSelect;
export type InsertMessage = z.infer<typeof insertMessageSchema>;

export const insertRentalRatingSchema = createInsertSchema(rentalRatings).omit({ id: true, createdAt: true });
export type RentalRating = typeof rentalRatings.$inferSelect;
export type InsertRentalRating = z.infer<typeof insertRentalRatingSchema>;

// Define relations after all tables are defined to avoid circular dependencies
export const usersRelations = relations(users, ({ many }) => {
  return {
    items: many(items),
    sentMessages: many(messages, { relationName: "sender" }),
    receivedMessages: many(messages, { relationName: "recipient" }),
    verificationRequests: many(verificationRequests),
    givenRatings: many(ratings, { relationName: "rater" }),
    receivedRatings: many(ratings, { relationName: "rated" }),
  };
});
