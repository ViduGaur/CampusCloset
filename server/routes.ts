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
        console.log('=== VALIDATION DEBUG ===');
        console.log('Content-Type:', req.headers['content-type']);
        console.log('Raw request body before validation:', JSON.stringify(req.body, null, 2));
        console.log('Request body type:', typeof req.body);
        console.log('Request body keys:', Object.keys(req.body || {}));
        
        const result = schema.safeParse(req.body);
        console.log('Validation result:', result);
        
        if (!result.success) {
          console.log('Validation failed with errors:', result.error.flatten());
          return res.status(400).json({
            message: 'Validation error',
            errors: result.error.flatten(),
          });
        }
        
        console.log('Validation successful, parsed data:', result.data);
        // Overwrite req.body with parsed data (coerced types)
        req.body = result.data;
        next();
      } catch (error) {
        console.error('Unexpected error in validation middleware:', error);
        if (error instanceof ZodError) {
          return res.status(400).json({
            message: 'Validation error',
            errors: error.flatten(),
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
      
      // Parse JSON data
      let itemData;
      try {
        itemData = JSON.parse(req.body.data);
        // Add ownerId and imageData before validation
        itemData.ownerId = req.user.id;
        itemData.imageData = req.file.buffer.toString('base64');
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
      
      const item = await storage.createItem(itemData);
      
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
  
  // Get items owned by the authenticated user
  app.get('/api/my-items', requireAuth, async (req, res) => {
    try {
      const items = await storage.getItemsByOwner(req.user.id);
      
      // Get category info for each item
      const itemsWithDetails = await Promise.all(
        items.map(async (item) => {
          const category = item.categoryId ? await storage.getCategory(item.categoryId) : null;
          
          return {
            ...item,
            category: category ? {
              id: category.id,
              name: category.name
            } : null
          };
        })
      );
      
      res.status(200).json(itemsWithDetails);
    } catch (error) {
      console.error('Error getting user items:', error);
      res.status(500).json({ message: 'An error occurred while getting your items' });
    }
  });

  // Get items currently being rented by the authenticated user (as owner)
  app.get('/api/my-items-being-rented', requireAuth, async (req, res) => {
    try {
      const rentalRequests = await storage.getRentalRequestsByOwner(req.user.id);
      
      // Filter to only approved rentals and get full details
      const activeRentals = await Promise.all(
        rentalRequests
          .filter(request => request.status === 'approved')
          .map(async (request) => {
            const item = await storage.getItem(request.itemId);
            const requester = await storage.getUser(request.requesterId);
            
            return {
              ...request,
              item: item ? {
                id: item.id,
                name: item.name,
                description: item.description,
                imageData: item.imageData,
                categoryId: item.categoryId,
              } : null,
              requester: requester ? {
                id: requester.id,
                username: requester.username,
                fullName: requester.fullName,
                hostel: requester.hostel,
              } : null,
            };
          })
      );
      
      res.status(200).json(activeRentals);
    } catch (error) {
      console.error('Error getting items being rented:', error);
      res.status(500).json({ message: 'An error occurred while getting items being rented' });
    }
  });
  
  // ==================== Rental Request Routes ====================
  
  // Create a rental request
  app.post('/api/rental-requests', requireAuth, requireVerified, validateRequest(insertRentalRequestSchema), async (req, res) => {
    try {
      const { itemId, startDate, endDate } = req.body;
      // Log the incoming payload for debugging
      console.log('Rental request payload (after validation):', req.body);

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
      // If it's a Zod error, return details
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({
          message: 'Validation error',
          errors: validationError.details
        });
      }
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

  // Get pending rental requests for items owned by the current user
  app.get('/api/rental-requests/pending', requireAuth, async (req, res) => {
    try {
      const rentalRequests = await storage.getRentalRequestsByOwner(req.user.id);
      
      // Filter to only pending requests and get requester info
      const pendingRequestsWithInfo = await Promise.all(
        rentalRequests
          .filter(request => request.status === 'pending')
          .map(async (request) => {
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
              item: item ? {
                id: item.id,
                name: item.name,
                description: item.description,
                imageData: item.imageData,
              } : null,
            };
          })
      );
      
      res.status(200).json(pendingRequestsWithInfo);
    } catch (error) {
      console.error('Error getting pending rental requests:', error);
      res.status(500).json({ message: 'An error occurred while getting pending rental requests' });
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
  
  // 1. Get my rental requests (as a requester, only approved, always with item info)
  app.get('/api/my-rental-requests', requireAuth, async (req, res) => {
    try {
      // Only fetch rentals where the user is the requester and status is 'approved'
      const rentalRequests = (await storage.getRentalRequestsByRequester(req.user.id))
        .filter(r => r.status === 'approved');
      // Always include item info
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

  // 2. Get user profile by ID (with trust rating)
  app.get('/api/users/:id/profile', async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      if (isNaN(userId)) return res.status(400).json({ message: 'Invalid user ID' });
      const user = await storage.getUser(userId);
      if (!user) return res.status(404).json({ message: 'User not found' });
      // Get trust ratings
      const ratings = await storage.getRentalRatingsForUser(userId);
      const avgRating = ratings.length > 0 ? (ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length) : null;
      res.json({
        id: user.id,
        username: user.username,
        email: user.email,
        fullName: user.fullName,
        trustRating: avgRating,
        ratingCount: ratings.length
      });
    } catch (error) {
      console.error('Error fetching user profile:', error);
      res.status(500).json({ message: 'An error occurred while fetching user profile' });
    }
  });

  // 3. Get messages thread between two users for an item
  app.get('/api/messages/thread', requireAuth, async (req, res) => {
    try {
      const { userId, itemId } = req.query;
      if (!userId || !itemId) return res.status(400).json({ message: 'userId and itemId required' });
      const thread = await storage.getConversation(parseInt(userId as string), req.user.id, parseInt(itemId as string));
      res.json(thread);
    } catch (error) {
      console.error('Error fetching messages thread:', error);
      res.status(500).json({ message: 'An error occurred while fetching messages' });
    }
  });

  // 4. Send a message between users for an item
  app.post('/api/messages/send', requireAuth, async (req, res) => {
    try {
      const { toUserId, itemId, content } = req.body;
      if (!toUserId || !itemId || !content) return res.status(400).json({ message: 'toUserId, itemId, and content required' });
      const message = await storage.createMessage({
        fromUserId: req.user.id,
        toUserId,
        itemId,
        content,
      });
      res.status(201).json(message);
    } catch (error) {
      console.error('Error sending message:', error);
      res.status(500).json({ message: 'An error occurred while sending message' });
    }
  });

  // List all message threads for the current user (unique per user+item, only if rental relationship exists)
  app.get('/api/messages/threads', requireAuth, async (req, res) => {
    try {
      // Get all messages involving the current user
      const messages = await storage.getMessagesByUser(req.user.id);
      // Build a map of unique (otherUserId, itemId) pairs
      const threadMap = new Map();
      for (const msg of messages) {
        const otherUserId = msg.fromUserId === req.user.id ? msg.toUserId : msg.fromUserId;
        if (!msg.itemId) continue;
        // Only allow if there is a rental relationship for this item
        const rental = await storage.getRentalRequestsByItem(msg.itemId);
        const isRelated = rental.some(r =>
          (r.requesterId === req.user.id && r.status === 'approved') ||
          (r.requesterId === otherUserId && r.status === 'approved') ||
          (r.itemId === msg.itemId && (r.requesterId === req.user.id || r.requesterId === otherUserId))
        );
        if (!isRelated) continue;
        const key = `${otherUserId}-${msg.itemId}`;
        // Only keep the latest message for the thread
        if (!threadMap.has(key) || new Date(msg.createdAt).getTime() > new Date(threadMap.get(key).createdAt).getTime()) {
          threadMap.set(key, msg);
        }
      }
      // Build thread previews
      const threads = await Promise.all(Array.from(threadMap.values()).map(async (msg) => {
        const otherUserId = msg.fromUserId === req.user.id ? msg.toUserId : msg.fromUserId;
        const otherUser = await storage.getUser(otherUserId);
        const item = msg.itemId ? await storage.getItem(msg.itemId) : null;
        return {
          userId: otherUserId,
          userName: otherUser?.fullName || otherUser?.username || 'User',
          itemId: msg.itemId,
          itemName: item?.name || '',
          lastMessage: msg.content,
          timestamp: msg.createdAt
        };
      }));
      // Sort by most recent
      threads.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      res.json(threads);
    } catch (error) {
      console.error('Error fetching message threads:', error);
      res.status(500).json({ message: 'An error occurred while fetching message threads' });
    }
  });

  // PATCH: Mark rental as completed by lender or borrower
  app.patch('/api/rental-requests/:id/status', requireAuth, requireVerified, async (req, res) => {
    try {
      const requestId = parseInt(req.params.id);
      if (isNaN(requestId)) {
        return res.status(400).json({ message: 'Invalid request ID' });
      }
      // Get the rental request
      const rentalRequest = await storage.getRentalRequest(requestId);
      if (!rentalRequest) {
        return res.status(404).json({ message: 'Rental request not found' });
      }
      if (rentalRequest.status !== 'approved') {
        return res.status(400).json({ message: 'Only approved rentals can be marked as completed' });
      }
      // Get the item
      const item = await storage.getItem(rentalRequest.itemId);
      if (!item) {
        return res.status(404).json({ message: 'Item not found' });
      }
      // Determine if user is lender or borrower
      const isLender = item.ownerId === req.user.id;
      const isBorrower = rentalRequest.requesterId === req.user.id;
      if (!isLender && !isBorrower) {
        return res.status(403).json({ message: 'Only parties involved in the rental can mark it as completed' });
      }
      // Mark completed for the correct party
      const updatedRequest = await storage.markRentalCompleted(requestId, req.user.id, isLender);
      
      // Get updated request with all details for frontend
      const fullUpdatedRequest = await storage.getRentalRequest(requestId);
      if (!fullUpdatedRequest) {
        return res.status(500).json({ message: 'Failed to retrieve updated rental request' });
      }
      
      // Get item and user details for the response
      const itemDetails = await storage.getItem(fullUpdatedRequest.itemId);
      const owner = itemDetails ? await storage.getUser(itemDetails.ownerId) : null;
      const requester = await storage.getUser(fullUpdatedRequest.requesterId);
      
      res.json({
        ...fullUpdatedRequest,
        item: itemDetails,
        owner: owner ? {
          id: owner.id,
          username: owner.username,
          fullName: owner.fullName,
          hostel: owner.hostel,
        } : null,
        requester: requester ? {
          id: requester.id,
          username: requester.username,
          fullName: requester.fullName,
          hostel: requester.hostel,
        } : null,
        completedByLender: fullUpdatedRequest.completedByLender,
        completedByBorrower: fullUpdatedRequest.completedByBorrower,
        status: fullUpdatedRequest.status
      });
    } catch (error) {
      console.error('Error updating rental request status:', error);
      res.status(500).json({ message: 'An error occurred while updating rental request' });
    }
  });

  // POST: Submit a trust rating (lender rates borrower)
  app.post('/api/rental-ratings', requireAuth, requireVerified, async (req, res) => {
    try {
      const { rentalRequestId, rating, comment } = req.body;
      if (!rentalRequestId || typeof rating !== 'number' || rating < 1 || rating > 5) {
        return res.status(400).json({ message: 'Invalid rating or rentalRequestId' });
      }
      const rentalRequest = await storage.getRentalRequest(rentalRequestId);
      if (!rentalRequest) {
        return res.status(404).json({ message: 'Rental request not found' });
      }
      const item = await storage.getItem(rentalRequest.itemId);
      if (!item) {
        return res.status(404).json({ message: 'Item not found' });
      }
      // Only allow owner (lender) to rate
      if (item.ownerId !== req.user.id) {
        return res.status(403).json({ message: 'Only the lender can rate the borrower' });
      }
      // Only allow if both completed
      if (!rentalRequest.completedByLender || !rentalRequest.completedByBorrower) {
        return res.status(400).json({ message: 'Rental must be marked completed by both parties before rating' });
      }
      // Only allow if not already rated
      const existing = await storage.getRentalRatingByRequestAndRater(rentalRequestId, req.user.id);
      if (existing) {
        return res.status(400).json({ message: 'You have already rated this rental' });
      }
      // Store rating
      const newRating = await storage.createRentalRating({
        rentalRequestId,
        rating,
        comment,
        ratedBy: req.user.id
      });
      res.status(201).json(newRating);
    } catch (error) {
      console.error('Error creating rental rating:', error);
      res.status(500).json({ message: 'An error occurred while creating rating' });
    }
  });

  // GET: Fetch all ratings for a user (as borrower)
  app.get('/api/users/:id/ratings', async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      if (isNaN(userId)) {
        return res.status(400).json({ message: 'Invalid user ID' });
      }
      const ratings = await storage.getRentalRatingsForUser(userId);
      res.json(ratings);
    } catch (error) {
      console.error('Error fetching user ratings:', error);
      res.status(500).json({ message: 'An error occurred while fetching user ratings' });
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
        avgRating: (user.avgRating || 0) / 100, // Convert from integer (0-500) to decimal (0-5)
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
