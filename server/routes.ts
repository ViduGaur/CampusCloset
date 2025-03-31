import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  insertUserSchema, 
  insertVerificationRequestSchema,
  insertItemSchema,
  insertRentalRequestSchema,
  insertRatingSchema,
  insertMessageSchema
} from "@shared/schema";
import multer from "multer";
import { z } from "zod";
import { ZodError } from "zod";
import { fromZodError } from "zod-validation-error";

// Setup in-memory file storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10 MB
  },
});

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);

  // Error handler middleware for zod validation errors
  const validateRequest = (schema: z.ZodSchema<any>) => {
    return (req: Request, res: Response, next: Function) => {
      try {
        schema.parse(req.body);
        next();
      } catch (error) {
        if (error instanceof ZodError) {
          const validationError = fromZodError(error);
          return res.status(400).json({
            message: 'Validation error',
            errors: validationError.details
          });
        }
        next(error);
      }
    };
  };

  // Authentication middleware
  const requireAuth = async (req: Request, res: Response, next: Function) => {
    const userId = req.headers['user-id'];
    
    if (!userId || typeof userId !== 'string') {
      return res.status(401).json({ message: 'Authentication required' });
    }
    
    const user = await storage.getUser(parseInt(userId));
    
    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }
    
    req.user = user;
    next();
  };

  // Admin middleware
  const requireAdmin = async (req: Request, res: Response, next: Function) => {
    if (!req.user || !req.user.isAdmin) {
      return res.status(403).json({ message: 'Admin access required' });
    }
    
    next();
  };

  // Verified user middleware
  const requireVerified = async (req: Request, res: Response, next: Function) => {
    if (!req.user || !req.user.isVerified) {
      return res.status(403).json({ message: 'Verified account required' });
    }
    
    next();
  };

  // ==================== User Routes ====================
  
  // User registration
  app.post('/api/register', validateRequest(insertUserSchema), async (req, res) => {
    try {
      const userData = req.body;
      
      // Check if username or email already exists
      const existingUsername = await storage.getUserByUsername(userData.username);
      if (existingUsername) {
        return res.status(400).json({ message: 'Username already exists' });
      }
      
      const existingEmail = await storage.getUserByEmail(userData.email);
      if (existingEmail) {
        return res.status(400).json({ message: 'Email already exists' });
      }
      
      const user = await storage.createUser(userData);
      
      // Don't send password back
      const { password, ...userWithoutPassword } = user;
      
      res.status(201).json(userWithoutPassword);
    } catch (error) {
      console.error('Error registering user:', error);
      res.status(500).json({ message: 'An error occurred while registering' });
    }
  });
  
  // Login (basic authentication for demo purposes)
  app.post('/api/login', async (req, res) => {
    try {
      const { username, password } = req.body;
      
      if (!username || !password) {
        return res.status(400).json({ message: 'Username and password are required' });
      }
      
      const user = await storage.getUserByUsername(username);
      
      if (!user || user.password !== password) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }
      
      // In a real app, we would create a session or JWT here
      const { password: _, ...userWithoutPassword } = user;
      
      res.status(200).json(userWithoutPassword);
    } catch (error) {
      console.error('Error logging in:', error);
      res.status(500).json({ message: 'An error occurred while logging in' });
    }
  });
  
  // Get current user
  app.get('/api/user', requireAuth, async (req, res) => {
    const { password, ...userWithoutPassword } = req.user;
    res.status(200).json(userWithoutPassword);
  });
  
  // ==================== Verification Routes ====================
  
  // Submit verification request
  app.post('/api/verification', requireAuth, upload.single('idImage'), async (req, res) => {
    try {
      // Check if the user already has a verification request
      const existingRequest = await storage.getVerificationRequestByUserId(req.user.id);
      
      if (existingRequest) {
        return res.status(400).json({ message: 'You already have a pending verification request' });
      }
      
      if (!req.file) {
        return res.status(400).json({ message: 'ID image is required' });
      }
      
      // Convert file buffer to base64
      const idImageData = req.file.buffer.toString('base64');
      
      const verificationRequest = await storage.createVerificationRequest({
        userId: req.user.id,
        idImageData,
      });
      
      res.status(201).json(verificationRequest);
    } catch (error) {
      console.error('Error submitting verification request:', error);
      res.status(500).json({ message: 'An error occurred while submitting verification request' });
    }
  });
  
  // Get verification request status for current user
  app.get('/api/verification/status', requireAuth, async (req, res) => {
    try {
      const verificationRequest = await storage.getVerificationRequestByUserId(req.user.id);
      
      if (!verificationRequest) {
        return res.status(404).json({ message: 'No verification request found' });
      }
      
      res.status(200).json(verificationRequest);
    } catch (error) {
      console.error('Error getting verification status:', error);
      res.status(500).json({ message: 'An error occurred while getting verification status' });
    }
  });
  
  // Get all pending verification requests (admin only)
  app.get('/api/admin/verification/pending', requireAuth, requireAdmin, async (req, res) => {
    try {
      const pendingRequests = await storage.getAllPendingVerificationRequests();
      
      // Get user details for each request
      const requestsWithUserDetails = await Promise.all(
        pendingRequests.map(async (request) => {
          const user = await storage.getUser(request.userId);
          return {
            ...request,
            user: user ? { 
              id: user.id,
              username: user.username,
              email: user.email,
              fullName: user.fullName,
              hostel: user.hostel
            } : null,
          };
        })
      );
      
      res.status(200).json(requestsWithUserDetails);
    } catch (error) {
      console.error('Error getting pending verification requests:', error);
      res.status(500).json({ message: 'An error occurred while getting pending verification requests' });
    }
  });
  
  // Approve/reject verification request (admin only)
  app.post('/api/admin/verification/:id/review', requireAuth, requireAdmin, async (req, res) => {
    try {
      const requestId = parseInt(req.params.id);
      const { action, notes } = req.body;
      
      if (action !== 'approve' && action !== 'reject') {
        return res.status(400).json({ message: 'Invalid action. Must be "approve" or "reject"' });
      }
      
      const verificationRequest = await storage.getVerificationRequest(requestId);
      
      if (!verificationRequest) {
        return res.status(404).json({ message: 'Verification request not found' });
      }
      
      if (verificationRequest.status !== 'pending') {
        return res.status(400).json({ message: 'Verification request has already been processed' });
      }
      
      // Update the verification request
      const updatedRequest = await storage.updateVerificationRequest(requestId, {
        status: action === 'approve' ? 'approved' : 'rejected',
        reviewedBy: req.user.id,
        reviewedAt: new Date(),
        notes: notes || null,
      });
      
      // If approved, update the user's verification status
      if (action === 'approve') {
        await storage.updateUser(verificationRequest.userId, {
          isVerified: true,
        });
      }
      
      res.status(200).json(updatedRequest);
    } catch (error) {
      console.error('Error reviewing verification request:', error);
      res.status(500).json({ message: 'An error occurred while reviewing verification request' });
    }
  });
  
  // ==================== Category Routes ====================
  
  // Get all categories
  app.get('/api/categories', async (req, res) => {
    try {
      const categories = await storage.getAllCategories();
      res.status(200).json(categories);
    } catch (error) {
      console.error('Error getting categories:', error);
      res.status(500).json({ message: 'An error occurred while getting categories' });
    }
  });
  
  // ==================== Item Routes ====================
  
  // Create a new item
  app.post('/api/items', requireAuth, requireVerified, upload.single('image'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: 'Item image is required' });
      }
      
      // Parse and validate JSON data
      let itemData;
      try {
        itemData = JSON.parse(req.body.data);
        insertItemSchema.parse(itemData);
      } catch (error) {
        if (error instanceof ZodError) {
          const validationError = fromZodError(error);
          return res.status(400).json({
            message: 'Validation error',
            errors: validationError.details
          });
        }
        throw error;
      }
      
      // Convert file buffer to base64
      const imageData = req.file.buffer.toString('base64');
      
      const item = await storage.createItem({
        ...itemData,
        ownerId: req.user.id,
        imageData,
      });
      
      res.status(201).json(item);
    } catch (error) {
      console.error('Error creating item:', error);
      res.status(500).json({ message: 'An error occurred while creating item' });
    }
  });
  
  // Get all items
  app.get('/api/items', async (req, res) => {
    try {
      const categoryId = req.query.categoryId ? parseInt(req.query.categoryId as string) : null;
      
      let items;
      if (categoryId) {
        items = await storage.getItemsByCategory(categoryId);
      } else {
        items = await storage.getAllItems();
      }
      
      // Get owner info for each item
      const itemsWithOwnerInfo = await Promise.all(
        items.map(async (item) => {
          const owner = await storage.getUser(item.ownerId);
          return {
            ...item,
            owner: owner ? {
              id: owner.id,
              username: owner.username,
              fullName: owner.fullName,
              hostel: owner.hostel,
            } : null,
          };
        })
      );
      
      res.status(200).json(itemsWithOwnerInfo);
    } catch (error) {
      console.error('Error getting items:', error);
      res.status(500).json({ message: 'An error occurred while getting items' });
    }
  });
  
  // Get item by ID
  app.get('/api/items/:id', async (req, res) => {
    try {
      const itemId = parseInt(req.params.id);
      const item = await storage.getItem(itemId);
      
      if (!item) {
        return res.status(404).json({ message: 'Item not found' });
      }
      
      const owner = await storage.getUser(item.ownerId);
      
      res.status(200).json({
        ...item,
        owner: owner ? {
          id: owner.id,
          username: owner.username,
          fullName: owner.fullName,
          hostel: owner.hostel,
        } : null,
      });
    } catch (error) {
      console.error('Error getting item:', error);
      res.status(500).json({ message: 'An error occurred while getting item' });
    }
  });
  
  // Get items by owner
  app.get('/api/users/:id/items', async (req, res) => {
    try {
      const ownerId = parseInt(req.params.id);
      const items = await storage.getItemsByOwner(ownerId);
      res.status(200).json(items);
    } catch (error) {
      console.error('Error getting items by owner:', error);
      res.status(500).json({ message: 'An error occurred while getting items by owner' });
    }
  });
  
  // ==================== Rental Request Routes ====================
  
  // Create a rental request
  app.post('/api/rental-requests', requireAuth, requireVerified, validateRequest(insertRentalRequestSchema), async (req, res) => {
    try {
      const { itemId, startDate, endDate } = req.body;
      
      // Check if the item exists and is available
      const item = await storage.getItem(itemId);
      
      if (!item) {
        return res.status(404).json({ message: 'Item not found' });
      }
      
      if (!item.isAvailable) {
        return res.status(400).json({ message: 'Item is not available for rent' });
      }
      
      // Make sure user is not renting their own item
      if (item.ownerId === req.user.id) {
        return res.status(400).json({ message: 'You cannot rent your own item' });
      }
      
      const rentalRequest = await storage.createRentalRequest({
        itemId,
        requesterId: req.user.id,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
      });
      
      res.status(201).json(rentalRequest);
    } catch (error) {
      console.error('Error creating rental request:', error);
      res.status(500).json({ message: 'An error occurred while creating rental request' });
    }
  });
  
  // Get rental requests for an item
  app.get('/api/items/:id/rental-requests', requireAuth, async (req, res) => {
    try {
      const itemId = parseInt(req.params.id);
      
      // Check if the user owns the item
      const item = await storage.getItem(itemId);
      
      if (!item) {
        return res.status(404).json({ message: 'Item not found' });
      }
      
      if (item.ownerId !== req.user.id) {
        return res.status(403).json({ message: 'You do not have permission to view these rental requests' });
      }
      
      const rentalRequests = await storage.getRentalRequestsByItem(itemId);
      
      // Get requester info for each request
      const requestsWithRequesterInfo = await Promise.all(
        rentalRequests.map(async (request) => {
          const requester = await storage.getUser(request.requesterId);
          return {
            ...request,
            requester: requester ? {
              id: requester.id,
              username: requester.username,
              fullName: requester.fullName,
              hostel: requester.hostel,
            } : null,
          };
        })
      );
      
      res.status(200).json(requestsWithRequesterInfo);
    } catch (error) {
      console.error('Error getting rental requests for item:', error);
      res.status(500).json({ message: 'An error occurred while getting rental requests for item' });
    }
  });
  
  // Approve/reject rental request
  app.post('/api/rental-requests/:id/review', requireAuth, requireVerified, async (req, res) => {
    try {
      const requestId = parseInt(req.params.id);
      const { action } = req.body;
      
      if (action !== 'approve' && action !== 'reject') {
        return res.status(400).json({ message: 'Invalid action. Must be "approve" or "reject"' });
      }
      
      const rentalRequest = await storage.getRentalRequest(requestId);
      
      if (!rentalRequest) {
        return res.status(404).json({ message: 'Rental request not found' });
      }
      
      // Check if the user owns the item
      const item = await storage.getItem(rentalRequest.itemId);
      
      if (!item) {
        return res.status(404).json({ message: 'Item not found' });
      }
      
      if (item.ownerId !== req.user.id) {
        return res.status(403).json({ message: 'You do not have permission to review this rental request' });
      }
      
      if (rentalRequest.status !== 'pending') {
        return res.status(400).json({ message: 'Rental request has already been processed' });
      }
      
      // Update the rental request
      const updatedRequest = await storage.updateRentalRequest(requestId, {
        status: action === 'approve' ? 'approved' : 'rejected',
      });
      
      res.status(200).json(updatedRequest);
    } catch (error) {
      console.error('Error reviewing rental request:', error);
      res.status(500).json({ message: 'An error occurred while reviewing rental request' });
    }
  });
  
  // Get my rental requests (as a requester)
  app.get('/api/my-rental-requests', requireAuth, async (req, res) => {
    try {
      const rentalRequests = await storage.getRentalRequestsByRequester(req.user.id);
      
      // Get item info for each request
      const requestsWithItemInfo = await Promise.all(
        rentalRequests.map(async (request) => {
          const item = await storage.getItem(request.itemId);
          const owner = item ? await storage.getUser(item.ownerId) : null;
          
          return {
            ...request,
            item: item || null,
            owner: owner ? {
              id: owner.id,
              username: owner.username,
              fullName: owner.fullName,
              hostel: owner.hostel,
            } : null,
          };
        })
      );
      
      res.status(200).json(requestsWithItemInfo);
    } catch (error) {
      console.error('Error getting my rental requests:', error);
      res.status(500).json({ message: 'An error occurred while getting my rental requests' });
    }
  });
  
  // Get requests for my items (as an owner)
  app.get('/api/my-items/rental-requests', requireAuth, async (req, res) => {
    try {
      const rentalRequests = await storage.getRentalRequestsByOwner(req.user.id);
      
      // Get requester and item info for each request
      const requestsWithDetails = await Promise.all(
        rentalRequests.map(async (request) => {
          const requester = await storage.getUser(request.requesterId);
          const item = await storage.getItem(request.itemId);
          
          return {
            ...request,
            requester: requester ? {
              id: requester.id,
              username: requester.username,
              fullName: requester.fullName,
              hostel: requester.hostel,
            } : null,
            item: item || null,
          };
        })
      );
      
      res.status(200).json(requestsWithDetails);
    } catch (error) {
      console.error('Error getting rental requests for my items:', error);
      res.status(500).json({ message: 'An error occurred while getting rental requests for my items' });
    }
  });
  
  // Update rental request status (mark as complete)
  app.patch('/api/rental-requests/:id/status', requireAuth, requireVerified, async (req, res) => {
    try {
      const requestId = parseInt(req.params.id);
      if (isNaN(requestId)) {
        return res.status(400).json({ message: 'Invalid request ID' });
      }
      
      const { status } = req.body;
      if (!status || !['completed'].includes(status)) {
        return res.status(400).json({ message: 'Invalid status. Only "completed" is allowed for this endpoint.' });
      }
      
      // Get the rental request
      const rentalRequest = await storage.getRentalRequest(requestId);
      if (!rentalRequest) {
        return res.status(404).json({ message: 'Rental request not found' });
      }
      
      // Only approved requests can be marked as completed
      if (rentalRequest.status !== 'approved') {
        return res.status(400).json({ message: 'Only approved rentals can be marked as completed' });
      }
      
      // Get the item
      const item = await storage.getItem(rentalRequest.itemId);
      if (!item) {
        return res.status(404).json({ message: 'Item not found' });
      }
      
      // Verify user is authorized to update this request
      const isOwner = item.ownerId === req.user.id;
      const isRequester = rentalRequest.requesterId === req.user.id;
      
      if (!isOwner && !isRequester) {
        return res.status(403).json({ message: 'Only parties involved in the rental can mark it as completed' });
      }
      
      // Update the request status
      const updatedRequest = await storage.updateRentalRequest(requestId, { status });
      
      res.json(updatedRequest);
    } catch (error) {
      console.error('Error updating rental request status:', error);
      res.status(500).json({ message: 'An error occurred while updating rental request' });
    }
  });

  // Get my rental requests (where I am the requester)
  app.get('/api/my-rental-requests', requireAuth, async (req, res) => {
    try {
      const userId = req.user.id;
      const rentalRequests = await storage.getRentalRequestsByRequester(userId);
      
      // Get details for each request
      const requestsWithDetails = await Promise.all(
        rentalRequests.map(async (request) => {
          const item = await storage.getItem(request.itemId);
          const owner = await storage.getUser(request.ownerId);
          return {
            ...request,
            item,
            owner: owner ? {
              id: owner.id,
              username: owner.username,
              fullName: owner.fullName,
              hostel: owner.hostel,
              isVerified: owner.isVerified,
              averageRating: owner.averageRating,
              ratingCount: owner.ratingCount,
            } : null,
          };
        })
      );
      
      res.status(200).json(requestsWithDetails);
    } catch (error) {
      console.error('Error getting user\'s rental requests:', error);
      res.status(500).json({ message: 'An error occurred while getting rental requests' });
    }
  });

  // Get rental requests for my items (where I am the owner)
  app.get('/api/my-items/rental-requests', requireAuth, async (req, res) => {
    try {
      const userId = req.user.id;
      const rentalRequests = await storage.getRentalRequestsByOwner(userId);
      
      // Filter for approved or completed requests
      const activeRequests = rentalRequests.filter(request => 
        request.status === "approved" || request.status === "completed");
      
      // Get details for each request
      const requestsWithDetails = await Promise.all(
        activeRequests.map(async (request) => {
          const item = await storage.getItem(request.itemId);
          const requester = await storage.getUser(request.requesterId);
          return {
            ...request,
            item,
            requester: requester ? {
              id: requester.id,
              username: requester.username,
              fullName: requester.fullName,
              hostel: requester.hostel,
              isVerified: requester.isVerified,
              averageRating: requester.averageRating,
              ratingCount: requester.ratingCount,
            } : null,
          };
        })
      );
      
      res.status(200).json(requestsWithDetails);
    } catch (error) {
      console.error('Error getting owner\'s rental requests:', error);
      res.status(500).json({ message: 'An error occurred while getting rental requests' });
    }
  });

  // Mark a rental request as completed
  app.patch('/api/rental-requests/:id/complete', requireAuth, async (req, res) => {
    try {
      const rentalRequestId = parseInt(req.params.id);
      const userId = req.user.id;
      
      const rentalRequest = await storage.getRentalRequest(rentalRequestId);
      if (!rentalRequest) {
        return res.status(404).json({ message: 'Rental request not found' });
      }
      
      // Only the requester or owner can mark as completed
      if (rentalRequest.requesterId !== userId && rentalRequest.ownerId !== userId) {
        return res.status(403).json({ message: 'Unauthorized to update this rental request' });
      }
      
      // Only approved requests can be marked as completed
      if (rentalRequest.status !== "approved") {
        return res.status(400).json({ message: 'Only approved requests can be marked as completed' });
      }
      
      const updatedRequest = await storage.updateRentalRequest(rentalRequestId, {
        status: "completed",
        updatedAt: new Date().toISOString(),
      });
      
      res.status(200).json(updatedRequest);
    } catch (error) {
      console.error('Error completing rental request:', error);
      res.status(500).json({ message: 'An error occurred while completing rental request' });
    }
  });

  // Rating routes
  
  // Get user's ratings
  app.get('/api/users/:userId/ratings', async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      if (isNaN(userId)) {
        return res.status(400).json({ message: 'Invalid user ID' });
      }
      
      // Check if user exists
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      // Get user ratings
      const ratings = await storage.getRatingsByUser(userId);
      
      // Return ratings with user info
      const ratingsWithUserInfo = await Promise.all(
        ratings.map(async (rating) => {
          const fromUser = await storage.getUser(rating.fromUserId);
          return {
            ...rating,
            fromUser: fromUser ? {
              id: fromUser.id,
              username: fromUser.username,
              fullName: fromUser.fullName,
              hostel: fromUser.hostel
            } : null
          };
        })
      );
      
      res.json(ratingsWithUserInfo);
    } catch (error) {
      console.error('Error getting user ratings:', error);
      res.status(500).json({ message: 'An error occurred while fetching ratings' });
    }
  });
  
  // Submit a rating for a user based on a completed rental
  app.post('/api/ratings', requireAuth, validateRequest(insertRatingSchema), async (req, res) => {
    try {
      const { toUserId, rentalRequestId, rating, comment } = req.body;
      
      // Check if the rental request exists and is completed
      const rentalRequest = await storage.getRentalRequest(rentalRequestId);
      if (!rentalRequest) {
        return res.status(404).json({ message: 'Rental request not found' });
      }
      
      // Only allow rating if the rental is completed
      if (rentalRequest.status !== 'completed') {
        return res.status(400).json({ message: 'Rental must be completed before rating' });
      }
      
      // Check if the user is a party to this rental (either requester or owner)
      const item = await storage.getItem(rentalRequest.itemId);
      if (!item) {
        return res.status(404).json({ message: 'Item not found' });
      }
      
      const isRequester = rentalRequest.requesterId === req.user.id;
      const isOwner = item.ownerId === req.user.id;
      
      if (!isRequester && !isOwner) {
        return res.status(403).json({ message: 'You are not authorized to rate this rental' });
      }
      
      // Users can only rate the other party
      if ((isRequester && toUserId !== item.ownerId) || 
          (isOwner && toUserId !== rentalRequest.requesterId)) {
        return res.status(400).json({ message: 'You can only rate the other party in the rental' });
      }
      
      // Check if user has already rated this rental
      const existingRatings = await storage.getRatingsByUser(toUserId);
      const alreadyRated = existingRatings.some(r => 
        r.rentalRequestId === rentalRequestId && r.fromUserId === req.user.id
      );
      
      if (alreadyRated) {
        return res.status(400).json({ message: 'You have already rated this rental' });
      }
      
      // Create rating
      const newRating = await storage.createRating({
        fromUserId: req.user.id,
        toUserId,
        rentalRequestId,
        rating,
        comment
      });
      
      res.status(201).json(newRating);
    } catch (error) {
      console.error('Error creating rating:', error);
      res.status(500).json({ message: 'An error occurred while creating rating' });
    }
  });
  
  // Get info about a user with their rating info
  app.get('/api/users/:userId/profile', async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      if (isNaN(userId)) {
        return res.status(400).json({ message: 'Invalid user ID' });
      }
      
      // Get user info
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      // Get user's items
      const items = await storage.getItemsByOwner(userId);
      
      // Format user data for public view (remove sensitive info)
      const publicUser = {
        id: user.id,
        username: user.username,
        fullName: user.fullName,
        hostel: user.hostel,
        isVerified: user.isVerified,
        avgRating: user.avgRating / 100, // Convert from integer (0-500) to decimal (0-5)
        ratingCount: user.ratingCount,
        itemCount: items.length
      };
      
      res.json(publicUser);
    } catch (error) {
      console.error('Error getting user profile:', error);
      res.status(500).json({ message: 'An error occurred while fetching user profile' });
    }
  });

  return httpServer;
}

// Extend Express Request type to include user
declare global {
  namespace Express {
    interface Request {
      user?: any;
    }
  }
}
