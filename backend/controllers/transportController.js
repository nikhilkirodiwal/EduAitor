import mongoose from "mongoose";
import { Driver, Bus, TransportRoute, Activity } from "../models/transport.js";

// ── HELPERS ───────────────────────────────────────────────────────────────────

const toId = (id) => new mongoose.Types.ObjectId(id);

const notFound = (res, entity = "Record") =>
  res.status(404).json({ success: false, message: `${entity} not found` });

const serverError = (res, err) => {
  console.error(err);
  res.status(500).json({ success: false, message: "Internal server error" });
};

const missingSchoolId = (res) =>
  res.status(400).json({ success: false, message: "school_id is required" });

// Safe ObjectId resolver — returns ObjectId if valid string, else null
const resolveId = (val) =>
  val && mongoose.isValidObjectId(val) ? toId(val) : null;

// ════════════════════════════════════════════════════════════════════════════
// DASHBOARD SUMMARY
// GET /transport/summary?school_id=
// ════════════════════════════════════════════════════════════════════════════

export const getSummary = async (req, res) => {
  try {
    const { school_id } = req.query;
    if (!school_id) return missingSchoolId(res);

    const schoolObjId = toId(school_id);

    const [buses, routes, drivers] = await Promise.all([
      Bus.find({ schoolId: schoolObjId }).lean(),
      TransportRoute.find({ schoolId: schoolObjId }).lean(),
      Driver.find({ schoolId: schoolObjId }).lean(),
    ]);

    const totalStudents = routes.reduce((sum, r) => sum + (r.students || 0), 0);

    res.json({
      success: true,
      buses: buses.length,
      routes: routes.length,
      drivers: drivers.length,
      students: totalStudents,
      maintenance: buses.filter((b) => b.status === "Maintenance").length,
      suspended: routes.filter((r) => r.status === "Suspended").length,
      on_leave: drivers.filter((d) => d.status === "On Leave").length,
    });
  } catch (err) {
    serverError(res, err);
  }
};

// ════════════════════════════════════════════════════════════════════════════
// TODAY'S ACTIVITY
// GET /transport/activity?school_id=
// ════════════════════════════════════════════════════════════════════════════

export const getActivity = async (req, res) => {
  try {
    const { school_id } = req.query;
    if (!school_id) return missingSchoolId(res);

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const activity = await Activity.find({
      schoolId: toId(school_id),
      date: { $gte: startOfDay },
    })
      .populate("bus", "busId")
      .populate("route", "name")
      .populate("driver", "name")
      .sort({ date: -1 })
      .lean();

    const data = activity.map((a) => ({
      _id: a._id,
      bus: a.bus?.busId || "",
      route: a.route?.name || "",
      driver: a.driver?.name || "",
      time: a.time,
      status: a.status,
    }));

    res.json({ success: true, data });
  } catch (err) {
    serverError(res, err);
  }
};

// ════════════════════════════════════════════════════════════════════════════
// DRIVERS
// ════════════════════════════════════════════════════════════════════════════

// GET /transport/drivers?school_id=
export const getDrivers = async (req, res) => {
  try {
    const { school_id } = req.query;
    if (!school_id) return missingSchoolId(res);

    const drivers = await Driver.find({ schoolId: toId(school_id) })
      .populate("bus", "busId regNo")
      .populate("route", "name")
      .sort({ createdAt: -1 })
      .lean();

    const data = drivers.map((d) => ({
      ...d,
      bus: d.bus?.busId || "",
      route: d.route?.name || "",
    }));

    res.json({ success: true, data });
  } catch (err) {
    serverError(res, err);
  }
};

// POST /transport/drivers
// body: { school_id, name, phone, license, licenseExpiry, bus, route, experience }
export const createDriver = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { school_id, name, phone, bus, route } = req.body;

    if (!school_id || !name || !phone)
      return res.status(400).json({ message: "Required fields missing" });

    const driver = await Driver.create(
      [
        {
          schoolId: school_id,
          name,
          phone,
          bus,
          route,
        },
      ],
      { session },
    );

    // Sync Bus
    if (bus) {
      await Bus.findByIdAndUpdate(bus, { driver: driver[0]._id }, { session });
    }

    // Sync Route
    if (route) {
      await TransportRoute.findByIdAndUpdate(
        route,
        { driver: driver[0]._id },
        { session },
      );
    }

    // Activity
    await Activity.create(
      [
        {
          schoolId: school_id,
          driver: driver[0]._id,
          bus,
          route,
          status: "Driver Assigned",
          time: new Date().toLocaleTimeString(),
        },
      ],
      { session },
    );

    await session.commitTransaction();

    res.status(201).json({ success: true, data: driver[0] });
  } catch (err) {
    await session.abortTransaction();
    res.status(500).json({ message: err.message });
  } finally {
    session.endSession();
  }
};

// PUT /transport/drivers/:id
// body: { school_id, name, phone, license, licenseExpiry, bus, route, experience, status }
export const updateDriver = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { id } = req.params;
    const { school_id, bus, route } = req.body;

    const driver = await Driver.findOne({ _id: id, schoolId: school_id });

    if (!driver) return res.status(404).json({ message: "Driver not found" });

    driver.bus = bus || null;
    driver.route = route || null;

    await driver.save({ session });

    // Sync bus
    if (bus) {
      await Bus.findByIdAndUpdate(bus, { driver: id }, { session });
    }

    // Sync route
    if (route) {
      await TransportRoute.findByIdAndUpdate(
        route,
        { driver: id },
        { session },
      );
    }

    await session.commitTransaction();

    res.json({ success: true, data: driver });
  } catch (err) {
    await session.abortTransaction();
    res.status(500).json({ message: err.message });
  } finally {
    session.endSession();
  }
};

// PATCH /transport/drivers/:id/status
// body: { school_id, status }
export const updateDriverStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { school_id, status } = req.body;

    if (!school_id) return missingSchoolId(res);
    if (!["Active", "On Leave", "Inactive"].includes(status))
      return res
        .status(400)
        .json({ success: false, message: "Invalid status value" });

    const driver = await Driver.findOneAndUpdate(
      { _id: id, schoolId: toId(school_id) },
      { status },
      { new: true },
    );
    if (!driver) return notFound(res, "Driver");

    res.json({
      success: true,
      message: `Driver marked as ${status}`,
      data: driver,
    });
  } catch (err) {
    serverError(res, err);
  }
};

// DELETE /transport/drivers/:id?school_id=
export const deleteDriver = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { id } = req.params;
    const { school_id } = req.query;

    const driver = await Driver.findOneAndDelete(
      { _id: id, schoolId: school_id },
      { session },
    );

    if (!driver) return res.status(404).json({ message: "Driver not found" });

    // Remove from Bus
    await Bus.updateMany(
      { driver: id },
      { $set: { driver: null } },
      { session },
    );

    // Remove from Route
    await TransportRoute.updateMany(
      { driver: id },
      { $set: { driver: null } },
      { session },
    );

    await session.commitTransaction();

    res.json({ success: true, message: "Driver deleted" });
  } catch (err) {
    await session.abortTransaction();
    res.status(500).json({ message: err.message });
  } finally {
    session.endSession();
  }
};

// ════════════════════════════════════════════════════════════════════════════
// BUSES
// ════════════════════════════════════════════════════════════════════════════

// GET /transport/buses?school_id=
export const getBuses = async (req, res) => {
  try {
    const { school_id } = req.query;
    if (!school_id) return missingSchoolId(res);

    const buses = await Bus.find({ schoolId: toId(school_id) })
      .populate("driver", "name")
      .populate("route", "name")
      .sort({ createdAt: -1 })
      .lean();

    const data = buses.map((b) => ({
      ...b,
      id: b.busId,
      driver: b.driver,
      route: b.route,
      nextService: b.nextService
        ? new Date(b.nextService).toISOString().slice(0, 10)
        : "N/A",
    }));

    res.json({ success: true, data });
  } catch (err) {
    serverError(res, err);
  }
};

// POST /transport/buses
// body: { school_id, id (busId), regNo, model, capacity, driver, route, fuel }
export const createBus = async (req, res) => {
  try {
    const {
      school_id,
      id: busId,
      regNo,
      model,
      capacity,
      driver,
      route,
      fuel,
    } = req.body;

    if (!school_id) return missingSchoolId(res);
    if (!busId?.trim() || !regNo?.trim())
      return res.status(400).json({
        success: false,
        message: "Bus ID and registration number are required",
      });

    const exists = await Bus.findOne({
      schoolId: toId(school_id),
      busId: busId.trim(),
    });
    if (exists)
      return res.status(400).json({
        success: false,
        message: "Bus ID already exists for this school",
      });

    const bus = await Bus.create({
      schoolId: toId(school_id),
      busId: busId.trim(),
      regNo: regNo.trim(),
      model: model?.trim() || "",
      capacity: Number(capacity) || 0,
      driver: resolveId(driver),
      route: resolveId(route),
      fuel: Number(fuel) || 100,
      status: "Active",
    });

    res.status(201).json({
      success: true,
      message: "Bus registered successfully",
      data: bus,
    });
  } catch (err) {
    serverError(res, err);
  }
};

// PUT /transport/buses/:id
// body: { school_id, regNo, model, capacity, driver, route, fuel, status }
export const updateBus = async (req, res) => {
  try {
    const { id } = req.params;
    const { school_id, regNo, model, capacity, driver, route, fuel, status } =
      req.body;

    if (!school_id) return missingSchoolId(res);

    const bus = await Bus.findOne({ _id: id, schoolId: toId(school_id) });
    if (!bus) return notFound(res, "Bus");

    if (regNo !== undefined) bus.regNo = regNo.trim();
    if (model !== undefined) bus.model = model.trim();
    if (capacity !== undefined) bus.capacity = Number(capacity);
    if (driver !== undefined) bus.driver = resolveId(driver);
    if (route !== undefined) bus.route = resolveId(route);
    if (fuel !== undefined) bus.fuel = Number(fuel);
    if (status !== undefined) bus.status = status;

    await bus.save();

    res.json({ success: true, message: "Bus updated successfully", data: bus });
  } catch (err) {
    serverError(res, err);
  }
};

// PATCH /transport/buses/:id/status
// body: { school_id, status }
export const updateBusStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { school_id, status } = req.body;

    if (!school_id) return missingSchoolId(res);
    if (!["Active", "Maintenance", "Inactive"].includes(status))
      return res
        .status(400)
        .json({ success: false, message: "Invalid status value" });

    const bus = await Bus.findOneAndUpdate(
      { _id: id, schoolId: toId(school_id) },
      { status },
      { new: true },
    );
    if (!bus) return notFound(res, "Bus");

    res.json({ success: true, message: `Bus marked as ${status}`, data: bus });
  } catch (err) {
    serverError(res, err);
  }
};

// DELETE /transport/buses/:id?school_id=
export const deleteBus = async (req, res) => {
  try {
    const { id } = req.params;
    const { school_id } = req.query;

    if (!school_id) return missingSchoolId(res);

    const bus = await Bus.findOneAndDelete({
      _id: id,
      schoolId: toId(school_id),
    });
    if (!bus) return notFound(res, "Bus");

    res.json({ success: true, message: "Bus deleted successfully" });
  } catch (err) {
    serverError(res, err);
  }
};

// ════════════════════════════════════════════════════════════════════════════
// ROUTES
// ════════════════════════════════════════════════════════════════════════════

// GET /transport/routes?school_id=
export const getRoutes = async (req, res) => {
  try {
    const { school_id } = req.query;
    if (!school_id) return missingSchoolId(res);

    const routes = await TransportRoute.find({ schoolId: toId(school_id) })
      .populate("bus", "busId")
      .populate("driver", "name")
      .sort({ createdAt: -1 })
      .lean();

    const data = routes.map((r) => ({
      ...r,
      id: r.routeId,
      bus: r.bus?.busId || "",
      driver: r.driver?.name || "",
    }));

    res.json({ success: true, data });
  } catch (err) {
    serverError(res, err);
  }
};

// POST /transport/routes
// body: { school_id, name, bus, driver, stops, students, startTime, endTime, stopsList }
export const createRoute = async (req, res) => {
  try {
    const {
      school_id,
      name,
      bus,
      driver,
      stops,
      students,
      startTime,
      endTime,
      stopsList,
    } = req.body;

    if (!school_id) return missingSchoolId(res);
    if (!name?.trim())
      return res
        .status(400)
        .json({ success: false, message: "Route name is required" });

    const route = await TransportRoute.create({
      schoolId: toId(school_id),
      name: name.trim(),
      bus: resolveId(bus),
      driver: resolveId(driver),
      stops: Number(stops) || 0,
      students: Number(students) || 0,
      startTime: startTime?.trim() || "",
      endTime: endTime?.trim() || "",
      stopsList: Array.isArray(stopsList) ? stopsList : [],
    });

    res.status(201).json({
      success: true,
      message: "Route added successfully",
      data: route,
    });
  } catch (err) {
    serverError(res, err);
  }
};

// PUT /transport/routes/:id
// body: { school_id, name, bus, driver, stops, students, startTime, endTime, stopsList, status }
export const updateRoute = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      school_id,
      name,
      bus,
      driver,
      stops,
      students,
      startTime,
      endTime,
      stopsList,
      status,
    } = req.body;

    if (!school_id) return missingSchoolId(res);

    const route = await TransportRoute.findOne({
      _id: id,
      schoolId: toId(school_id),
    });
    if (!route) return notFound(res, "Route");

    if (name !== undefined) route.name = name.trim();
    if (bus !== undefined) route.bus = resolveId(bus);
    if (driver !== undefined) route.driver = resolveId(driver);
    if (stops !== undefined) route.stops = Number(stops);
    if (students !== undefined) route.students = Number(students);
    if (startTime !== undefined) route.startTime = startTime.trim();
    if (endTime !== undefined) route.endTime = endTime.trim();
    if (stopsList !== undefined)
      route.stopsList = Array.isArray(stopsList) ? stopsList : [];
    if (status !== undefined) route.status = status;

    await route.save();

    res.json({
      success: true,
      message: "Route updated successfully",
      data: route,
    });
  } catch (err) {
    serverError(res, err);
  }
};

// PATCH /transport/routes/:id/status
// body: { school_id, status }
export const updateRouteStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { school_id, status } = req.body;

    if (!school_id) return missingSchoolId(res);
    if (!["Active", "Suspended"].includes(status))
      return res
        .status(400)
        .json({ success: false, message: "Invalid status value" });

    const route = await TransportRoute.findOneAndUpdate(
      { _id: id, schoolId: toId(school_id) },
      { status },
      { new: true },
    );
    if (!route) return notFound(res, "Route");

    res.json({
      success: true,
      message: `Route marked as ${status}`,
      data: route,
    });
  } catch (err) {
    serverError(res, err);
  }
};

// DELETE /transport/routes/:id?school_id=
export const deleteRoute = async (req, res) => {
  try {
    const { id } = req.params;
    const { school_id } = req.query;

    if (!school_id) return missingSchoolId(res);

    const route = await TransportRoute.findOneAndDelete({
      _id: id,
      schoolId: toId(school_id),
    });
    if (!route) return notFound(res, "Route");

    res.json({ success: true, message: "Route deleted successfully" });
  } catch (err) {
    serverError(res, err);
  }
};
