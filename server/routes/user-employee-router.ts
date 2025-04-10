import { Router } from "express";
import { storage } from "../storage";

const router = Router();

// Endpoint to find user by employee ID
router.get("/by-employee/:employeeId", async (req, res) => {
  try {
    const { employeeId } = req.params;
    
    if (!employeeId) {
      return res.status(400).json({ error: "Employee ID parameter is required" });
    }
    
    console.log(`Looking up user by employee ID: ${employeeId}`);
    
    // First find the employee
    const employee = await storage.findEmployeeByEmployeeId(employeeId);
    
    if (!employee) {
      return res.status(404).json({ 
        error: "No employee found",
        message: `No employee found with ID: ${employeeId}`
      });
    }
    
    // Then find the associated user
    const user = await storage.mapEmployeeToUser(employee);
    
    if (!user) {
      return res.status(404).json({ 
        error: "No user found",
        message: `Employee found but no user account is linked to employee with ID: ${employeeId}`
      });
    }
    
    // Remove sensitive information before sending
    const { password, ...userWithoutPassword } = user;
    
    res.json({
      user: userWithoutPassword,
      employee: {
        id: employee.id,
        employee_id: employee.employee_id,
        employee_name: employee.employee_name,
        email_id: employee.email_id,
        department: employee.department,
        designation: employee.designation
      }
    });
  } catch (error: any) {
    console.error("Error finding user by employee ID:", error);
    res.status(500).json({ 
      error: "Server error",
      message: error.message || "Failed to find user by employee ID"
    });
  }
});

// Endpoint to find employee by user ID
router.get("/find-employee/:userId", async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    
    if (isNaN(userId)) {
      return res.status(400).json({ error: "Valid user ID parameter is required" });
    }
    
    console.log(`Looking up employee for user ID: ${userId}`);
    
    // First find the user
    const user = await storage.getUser(userId);
    
    if (!user) {
      return res.status(404).json({ 
        error: "No user found",
        message: `No user found with ID: ${userId}`
      });
    }
    
    // Then find the associated employee
    const employee = await storage.mapUserToEmployee(user);
    
    if (!employee) {
      return res.status(404).json({ 
        error: "No employee found",
        message: `User found but no employee record is linked to user ID: ${userId}`
      });
    }
    
    res.json({
      employee: {
        id: employee.id,
        employee_id: employee.employee_id,
        employee_name: employee.employee_name,
        email_id: employee.email_id,
        department: employee.department,
        designation: employee.designation,
        region: employee.region,
        hierarchy_level: employee.hierarchy_level
      },
      user: {
        id: user.id,
        user_name: user.user_name,
        email_id: user.email_id,
        user_type: user.user_type
      }
    });
  } catch (error: any) {
    console.error("Error finding employee by user ID:", error);
    res.status(500).json({ 
      error: "Server error",
      message: error.message || "Failed to find employee by user ID"
    });
  }
});

export default router;