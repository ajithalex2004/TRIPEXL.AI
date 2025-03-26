import { Router } from 'express';
import { db } from '../db';
import { eq, and } from 'drizzle-orm';
import { approvalWorkflows } from '@shared/schema';

const router = Router();

// Get all approval workflows
router.get('/api/approval-workflows', async (_req, res) => {
  try {
    const workflows = await db.query.approvalWorkflows.findMany({
      with: {
        level1Approver: true,
        level2Approver: true,
      },
    });
    res.json(workflows);
  } catch (error: any) {
    console.error("Error fetching approval workflows:", error);
    res.status(500).json({ error: "Failed to fetch approval workflows" });
  }
});

// Create new approval workflow
router.post('/api/approval-workflows', async (req, res) => {
  try {
    // Check if workflow already exists for this combination
    const existing = await db.query.approvalWorkflows.findFirst({
      where: and(
        eq(approvalWorkflows.region, req.body.region),
        eq(approvalWorkflows.department, req.body.department),
        eq(approvalWorkflows.unit, req.body.unit)
      ),
    });

    if (existing) {
      return res.status(400).json({
        error: "Workflow already exists for this Region, Department, and Unit combination"
      });
    }

    const [workflow] = await db
      .insert(approvalWorkflows)
      .values(req.body)
      .returning();

    res.status(201).json(workflow);
  } catch (error: any) {
    console.error("Error creating approval workflow:", error);
    res.status(500).json({ error: "Failed to create approval workflow" });
  }
});

// Update approval workflow
router.put('/api/approval-workflows/:id', async (req, res) => {
  try {
    const [workflow] = await db
      .update(approvalWorkflows)
      .set(req.body)
      .where(eq(approvalWorkflows.id, parseInt(req.params.id)))
      .returning();

    if (!workflow) {
      return res.status(404).json({ error: "Workflow not found" });
    }

    res.json(workflow);
  } catch (error: any) {
    console.error("Error updating approval workflow:", error);
    res.status(500).json({ error: "Failed to update approval workflow" });
  }
});

// Delete approval workflow
router.delete('/api/approval-workflows/:id', async (req, res) => {
  try {
    const [workflow] = await db
      .delete(approvalWorkflows)
      .where(eq(approvalWorkflows.id, parseInt(req.params.id)))
      .returning();

    if (!workflow) {
      return res.status(404).json({ error: "Workflow not found" });
    }

    res.json({ message: "Workflow deleted successfully" });
  } catch (error: any) {
    console.error("Error deleting approval workflow:", error);
    res.status(500).json({ error: "Failed to delete approval workflow" });
  }
});

export const approvalWorkflowsRouter = router;
