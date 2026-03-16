import Event from "../models/event.js";

// GET all events for a school
export const getAllEvents = async (req, res) => {
  try {
    const { schoolId } = req.params;
    const events = await Event.find({ schoolId }).sort({ createdAt: -1 });

    const total = events.length;
    const completed = events.filter((e) => {
      const end = e.endDate || e.startDate;
      return new Date(end) < new Date();
    }).length;
    const upcoming = events.filter(
      (e) => new Date(e.startDate) > new Date(),
    ).length;
    const categories = [...new Set(events.map((e) => e.type))].length;

    res.status(200).json({
      success: true,
      stats: { total, completed, upcoming, categories },
      events,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET single event by ID
export const getEventById = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event)
      return res
        .status(404)
        .json({ success: false, message: "Event not found" });
    res.status(200).json({ success: true, event });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST create event
export const createEvent = async (req, res) => {
  try {
    const { schoolId } = req.params;
    const event = await Event.create({ ...req.body, schoolId });
    res
      .status(201)
      .json({ success: true, message: "Event created successfully", event });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// PUT update event
export const updateEvent = async (req, res) => {
  try {
    const event = await Event.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!event)
      return res
        .status(404)
        .json({ success: false, message: "Event not found" });
    res
      .status(200)
      .json({ success: true, message: "Event updated successfully", event });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// DELETE event
export const deleteEvent = async (req, res) => {
  try {
    const event = await Event.findByIdAndDelete(req.params.id);
    if (!event)
      return res
        .status(404)
        .json({ success: false, message: "Event not found" });
    res
      .status(200)
      .json({ success: true, message: "Event deleted successfully" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
