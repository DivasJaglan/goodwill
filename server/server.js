import express from "express";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import cors from "cors";

const app = express();

app.use(cors());
app.use(express.json());

// Connect to MongoDB Atlas
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("MongoDB connection error:", err));

// User Schema
const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  isVolunteer: { type: Boolean, default: false },
  itemsGiven: { type: Number, default: 0 },
  itemsTaken: { type: Number, default: 0 },
});
const User = mongoose.model("User", userSchema);

// Item Schema
const itemSchema = new mongoose.Schema({
  name: String,
  description: String,
  postedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  requestedBy: [
    { type: mongoose.Schema.Types.ObjectId, ref: "User", default: [] },
  ],
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    default: null,
  },
  status: {
    type: String,
    default: "posted",
    enum: ["posted", "picked", "delivered"],
  },
  createdAt: { type: Date, default: Date.now },
});
const Item = mongoose.model("Item", itemSchema);

// Notification Schema
const notificationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  message: String,
  itemId: { type: mongoose.Schema.Types.ObjectId, ref: "Item" },
  read: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});
const Notification = mongoose.model("Notification", notificationSchema);

// Middleware to verify token
const auth = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ message: "No token" });
  jwt.verify(token, "secret", (err, decoded) => {
    if (err) return res.status(401).json({ message: "Invalid token" });
    req.user = decoded;
    next();
  });
};

// Auth Routes
app.post("/api/auth/signup", async (req, res) => {
  const { email, password, isVolunteer } = req.body;
  try {
    const user = new User({ email, password, isVolunteer });
    await user.save();
    const token = jwt.sign({ id: user._id, isVolunteer }, "secret");
    res.json({
      token,
      id: user._id,
      isVolunteer,
      itemsGiven: 0,
      itemsTaken: 0,
    });
  } catch (err) {
    res.status(400).json({ message: "User already exists" });
  }
});

app.post("/api/auth/login", async (req, res) => {
  const { email, password, isVolunteer } = req.body;
  const user = await User.findOne({ email, password, isVolunteer });
  if (!user) return res.status(400).json({ message: "Invalid credentials" });
  const token = jwt.sign({ id: user._id, isVolunteer }, "secret");
  res.json({
    token,
    id: user._id,
    isVolunteer,
    itemsGiven: user.itemsGiven,
    itemsTaken: user.itemsTaken,
  });
});

// Item Routes
app.get("/api/items", auth, async (req, res) => {
  const items = await Item.find()
    .populate("postedBy", "email")
    .populate("requestedBy", "email")
    .populate("assignedTo", "email");
  res.json(items);
});

app.post("/api/items", auth, async (req, res) => {
  const { name, description } = req.body;
  const item = new Item({ name, description, postedBy: req.user.id });
  await item.save();
  res.status(201).json(item);
});

app.put("/api/items/:id/request", auth, async (req, res) => {
  const item = await Item.findById(req.params.id);
  if (
    !item ||
    item.status !== "posted" ||
    item.postedBy.toString() === req.user.id
  ) {
    return res
      .status(400)
      .json({ message: "Item unavailable or you posted it" });
  }
  if (!item.requestedBy.includes(req.user.id)) {
    item.requestedBy.push(req.user.id);
    await item.save();
  }
  res.json(item);
});

app.put("/api/items/:id/assign", auth, async (req, res) => {
  const { takerId } = req.body;
  const item = await Item.findById(req.params.id).populate("postedBy", "email");
  console.log("Assign request:", {
    itemId: req.params.id,
    takerId,
    userId: req.user.id,
  });
  console.log("Item data:", item);
  if (
    !item ||
    item.postedBy._id.toString() !== req.user.id ||
    item.status !== "posted"
  ) {
    console.log("Failed validation 1: Cannot assign item");
    return res.status(400).json({ message: "Cannot assign item" });
  }
  if (!item.requestedBy.map((id) => id.toString()).includes(takerId)) {
    console.log("Failed validation 2: User didn’t request this item", {
      requestedBy: item.requestedBy.map((id) => id.toString()),
      takerId,
    });
    return res.status(400).json({ message: "User didn’t request this item" });
  }
  item.assignedTo = takerId;
  await item.save();

  const notification = new Notification({
    userId: takerId,
    message: `You’ve been assigned "${item.name}" by ${item.postedBy.email}. Please pick it up!`,
    itemId: item._id,
  });
  await notification.save();

  res.json(item);
});

app.put("/api/items/:id/pickup", auth, async (req, res) => {
  if (!req.user.isVolunteer)
    return res.status(403).json({ message: "Volunteers only" });
  const item = await Item.findById(req.params.id);
  const threeDays = 3 * 24 * 60 * 60 * 1000;
  if (
    !item ||
    item.status !== "posted" ||
    Date.now() - new Date(item.createdAt) < threeDays
  ) {
    return res
      .status(400)
      .json({ message: "Item unavailable or too early to pick up" });
  }
  item.status = "picked";
  await item.save();
  res.json(item);
});

app.put("/api/items/:id/deliver", auth, async (req, res) => {
  if (!req.user.isVolunteer)
    return res.status(403).json({ message: "Volunteers only" });
  const item = await Item.findById(req.params.id);
  if (!item || item.status !== "picked" || !item.assignedTo) {
    return res.status(400).json({ message: "Item not ready" });
  }
  item.status = "delivered";
  await item.save();
  const giver = await User.findById(item.postedBy);
  const taker = await User.findById(item.assignedTo);
  giver.itemsGiven += 1;
  taker.itemsTaken += 1;
  await giver.save();
  await taker.save();
  res.json(item);
});

// Notification Routes
app.get("/api/notifications", auth, async (req, res) => {
  // console.log("Notifications route hit for user:", req.user.id); // Commented out
  const notifications = await Notification.find({ userId: req.user.id })
    .populate("itemId", "name")
    .sort({ createdAt: -1 });
  res.json(notifications);
});

// Test route to confirm server is alive
app.get("/test", (req, res) => {
  res.json({ message: "Server is running" });
});

app.listen(5000, () => console.log("Server running on port 5000"));
