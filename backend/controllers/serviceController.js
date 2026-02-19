const { query } = require('../config/database');

// Get all departments
const getAllDepartments = async (req, res, next) => {
  try {
    const result = await query(
      'SELECT * FROM departments ORDER BY dept_name'
    );

    res.json({
      departments: result.rows,
    });
  } catch (error) {
    next(error);
  }
};

// Get all service types
const getAllServices = async (req, res, next) => {
  try {
    const { deptId } = req.query;

    let queryText = `
      SELECT 
        s.service_id, s.service_name, s.description, s.default_priority,
        d.dept_id, d.dept_name
      FROM service_types s
      JOIN departments d ON s.dept_id = d.dept_id
    `;

    const params = [];

    if (deptId) {
      queryText += ' WHERE s.dept_id = $1';
      params.push(deptId);
    }

    queryText += ' ORDER BY d.dept_name, s.service_name';

    const result = await query(queryText, params);

    res.json({
      services: result.rows,
    });
  } catch (error) {
    next(error);
  }
};

// Get service by ID
const getServiceById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const result = await query(
      `SELECT 
        s.service_id, s.service_name, s.description, s.default_priority,
        d.dept_id, d.dept_name, d.response_sla_hours
      FROM service_types s
      JOIN departments d ON s.dept_id = d.dept_id
      WHERE s.service_id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Service not found' });
    }

    res.json({
      service: result.rows[0],
    });
  } catch (error) {
    next(error);
  }
};

// Create new service type (admin only)
const createService = async (req, res, next) => {
  try {
    const { serviceName, deptId, description, defaultPriority } = req.body;

    if (!serviceName || !deptId) {
      return res.status(400).json({ 
        error: 'Service name and department ID are required' 
      });
    }

    const result = await query(
      `INSERT INTO service_types (service_name, dept_id, description, default_priority)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [serviceName, deptId, description, defaultPriority || 'medium']
    );

    res.status(201).json({
      message: 'Service created successfully',
      service: result.rows[0],
    });
  } catch (error) {
    next(error);
  }
};

// Create new department (admin only)
const createDepartment = async (req, res, next) => {
  try {
    const { deptName, maxCapacity, responseSlaHours } = req.body;

    if (!deptName) {
      return res.status(400).json({ error: 'Department name is required' });
    }

    const result = await query(
      `INSERT INTO departments (dept_name, max_capacity, response_sla_hours)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [deptName, maxCapacity || 50, responseSlaHours || 48]
    );

    res.status(201).json({
      message: 'Department created successfully',
      department: result.rows[0],
    });
  } catch (error) {
    next(error);
  }
};

// Update department (admin only)
const updateDepartment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { deptName, maxCapacity, responseSlaHours } = req.body;

    const result = await query(
      `UPDATE departments
       SET dept_name = COALESCE($1, dept_name),
           max_capacity = COALESCE($2, max_capacity),
           response_sla_hours = COALESCE($3, response_sla_hours)
       WHERE dept_id = $4
       RETURNING *`,
      [deptName, maxCapacity, responseSlaHours, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Department not found' });
    }

    res.json({
      message: 'Department updated successfully',
      department: result.rows[0],
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllDepartments,
  getAllServices,
  getServiceById,
  createService,
  createDepartment,
  updateDepartment,
};
