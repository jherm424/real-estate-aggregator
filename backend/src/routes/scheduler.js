const express = require('express');
const schedulerService = require('../services/scheduler');
const logger = require('../utils/logger');

const router = express.Router();

router.get('/status', (req, res) => {
  try {
    const status = schedulerService.getSchedulerStatus();
    res.json(status);
  } catch (error) {
    logger.error('Error getting scheduler status:', error);
    res.status(500).json({
      error: 'Failed to get scheduler status',
      message: error.message
    });
  }
});

router.post('/start', (req, res) => {
  try {
    if (schedulerService.isRunning) {
      return res.status(409).json({
        error: 'Scheduler already running',
        message: 'The scheduler service is already active'
      });
    }

    schedulerService.start();

    res.json({
      message: 'Scheduler started successfully',
      status: schedulerService.getSchedulerStatus()
    });

  } catch (error) {
    logger.error('Error starting scheduler:', error);
    res.status(500).json({
      error: 'Failed to start scheduler',
      message: error.message
    });
  }
});

router.post('/stop', (req, res) => {
  try {
    if (!schedulerService.isRunning) {
      return res.status(400).json({
        error: 'Scheduler not running',
        message: 'The scheduler service is not currently active'
      });
    }

    schedulerService.stop();

    res.json({
      message: 'Scheduler stopped successfully'
    });

  } catch (error) {
    logger.error('Error stopping scheduler:', error);
    res.status(500).json({
      error: 'Failed to stop scheduler',
      message: error.message
    });
  }
});

router.post('/run-manual', async (req, res) => {
  try {
    const { sources, searchParams = {} } = req.body;

    if (!schedulerService.isRunning) {
      return res.status(400).json({
        error: 'Scheduler not running',
        message: 'The scheduler service must be running to execute manual tasks'
      });
    }

    logger.info('Manual scraping initiated via API', { sources, searchParams });

    schedulerService.runManualScraping(sources, searchParams)
      .then(results => {
        logger.info('Manual scraping completed', { results });
      })
      .catch(error => {
        logger.error('Manual scraping failed:', error);
      });

    res.json({
      message: 'Manual scraping initiated',
      sources: sources || 'all',
      searchParams
    });

  } catch (error) {
    logger.error('Error running manual scraping:', error);
    res.status(500).json({
      error: 'Failed to run manual scraping',
      message: error.message
    });
  }
});

router.get('/tasks', (req, res) => {
  try {
    const tasks = schedulerService.listTasks();
    res.json({
      tasks,
      total_tasks: tasks.length
    });
  } catch (error) {
    logger.error('Error listing tasks:', error);
    res.status(500).json({
      error: 'Failed to list tasks',
      message: error.message
    });
  }
});

router.post('/tasks/:taskName/pause', (req, res) => {
  try {
    const { taskName } = req.params;

    schedulerService.pauseTask(taskName);

    res.json({
      message: `Task '${taskName}' paused successfully`
    });

  } catch (error) {
    logger.error(`Error pausing task ${req.params.taskName}:`, error);
    res.status(400).json({
      error: 'Failed to pause task',
      message: error.message
    });
  }
});

router.post('/tasks/:taskName/resume', (req, res) => {
  try {
    const { taskName } = req.params;

    schedulerService.resumeTask(taskName);

    res.json({
      message: `Task '${taskName}' resumed successfully`
    });

  } catch (error) {
    logger.error(`Error resuming task ${req.params.taskName}:`, error);
    res.status(400).json({
      error: 'Failed to resume task',
      message: error.message
    });
  }
});

router.post('/tasks', (req, res) => {
  try {
    const { name, cronExpression, options = {} } = req.body;

    if (!name || !cronExpression) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'name and cronExpression are required'
      });
    }

    const taskFunction = async () => {
      logger.info(`Executing custom task: ${name}`);
    };

    schedulerService.addCustomTask(name, cronExpression, taskFunction, options);

    res.status(201).json({
      message: `Custom task '${name}' created successfully`,
      task: {
        name,
        cronExpression,
        options
      }
    });

  } catch (error) {
    logger.error('Error creating custom task:', error);
    res.status(400).json({
      error: 'Failed to create custom task',
      message: error.message
    });
  }
});

router.delete('/tasks/:taskName', (req, res) => {
  try {
    const { taskName } = req.params;

    const builtInTasks = ['mainScraping', 'cleanup', 'healthCheck'];
    if (builtInTasks.includes(taskName)) {
      return res.status(400).json({
        error: 'Cannot delete built-in task',
        message: `The task '${taskName}' is a built-in task and cannot be deleted`
      });
    }

    schedulerService.removeCustomTask(taskName);

    res.json({
      message: `Task '${taskName}' deleted successfully`
    });

  } catch (error) {
    logger.error(`Error deleting task ${req.params.taskName}:`, error);
    res.status(400).json({
      error: 'Failed to delete task',
      message: error.message
    });
  }
});

module.exports = router;