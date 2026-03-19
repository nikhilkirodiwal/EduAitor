import express from "express";
import {
  // Dashboard
  getSummary,
  getActivity,

  // Drivers
  getDrivers,
  createDriver,
  updateDriver,
  updateDriverStatus,
  deleteDriver,

  // Buses
  getBuses,
  createBus,
  updateBus,
  updateBusStatus,
  deleteBus,

  // Routes
  getRoutes,
  createRoute,
  updateRoute,
  updateRouteStatus,
  deleteRoute,
} from "../controllers/transportController.js";

const router = express.Router();

// ── DASHBOARD ─────────────────────────────────────────────────────────────────

// GET  /transport/summary?school_id=
router.get("/summary", getSummary);

// GET  /transport/activity?school_id=
router.get("/activity", getActivity);

// ── DRIVERS ───────────────────────────────────────────────────────────────────

// GET    /transport/drivers?school_id=
router.get("/drivers", getDrivers);

// POST   /transport/drivers           body: { school_id, name, phone, ... }
router.post("/drivers", createDriver);

// PUT    /transport/drivers/:id        body: { school_id, ...fields }
router.put("/drivers/:id", updateDriver);

// PATCH  /transport/drivers/:id/status body: { school_id, status }
router.patch("/drivers/:id/status", updateDriverStatus);

// DELETE /transport/drivers/:id        query: ?school_id=
router.delete("/drivers/:id", deleteDriver);

// ── BUSES ─────────────────────────────────────────────────────────────────────

// GET    /transport/buses?school_id=
router.get("/buses", getBuses);

// POST   /transport/buses              body: { school_id, id, regNo, ... }
router.post("/buses", createBus);

// PUT    /transport/buses/:id          body: { school_id, ...fields }
router.put("/buses/:id", updateBus);

// PATCH  /transport/buses/:id/status   body: { school_id, status }
router.patch("/buses/:id/status", updateBusStatus);

// DELETE /transport/buses/:id          query: ?school_id=
router.delete("/buses/:id", deleteBus);

// ── ROUTES ────────────────────────────────────────────────────────────────────

// GET    /transport/routes?school_id=
router.get("/routes", getRoutes);

// POST   /transport/routes             body: { school_id, name, bus, driver, ... }
router.post("/routes", createRoute);

// PUT    /transport/routes/:id         body: { school_id, ...fields }
router.put("/routes/:id", updateRoute);

// PATCH  /transport/routes/:id/status  body: { school_id, status }
router.patch("/routes/:id/status", updateRouteStatus);

// DELETE /transport/routes/:id         query: ?school_id=
router.delete("/routes/:id", deleteRoute);

export default router;
