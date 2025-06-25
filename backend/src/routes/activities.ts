import { Elysia, t } from 'elysia';
import { ActivitiesRepository } from '../repositories/activities';

export const activitiesRouter = new Elysia({ prefix: '/activities' })
  .get('/', async ({ query }) => {
    try {
      const {
        type,
        reportId,
        user,
        startDate,
        endDate,
        sortBy = 'createdAt',
        sortOrder = 'desc',
        page,
        limit
      } = query;

      const activities = await ActivitiesRepository.findAll({
        type,
        reportId,
        user,
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined,
        sortBy: sortBy as 'createdAt',
        sortOrder: sortOrder as 'asc' | 'desc',
        page: page ? parseInt(page) : undefined,
        limit: limit ? parseInt(limit) : undefined
      });

      return { success: true, data: activities };
    } catch (error) {
      return { success: false, error: 'Failed to fetch activities' };
    }
  }, {
    query: t.Object({
      type: t.Optional(t.String()),
      reportId: t.Optional(t.String()),
      user: t.Optional(t.String()),
      startDate: t.Optional(t.String()),
      endDate: t.Optional(t.String()),
      sortBy: t.Optional(t.Literal('createdAt')),
      sortOrder: t.Optional(t.Union([t.Literal('asc'), t.Literal('desc')])),
      page: t.Optional(t.String()),
      limit: t.Optional(t.String())
    })
  })

  .get('/report/:reportId', async ({ params: { reportId } }) => {
    try {
      const activities = await ActivitiesRepository.findByReportId(reportId);
      return { success: true, data: activities };
    } catch (error) {
      return { success: false, error: 'Failed to fetch activities for report' };
    }
  })

  .get('/export', async ({ query }) => {
    try {
      const {
        type,
        reportId,
        user,
        startDate,
        endDate,
        sortBy = 'createdAt',
        sortOrder = 'desc'
      } = query;

      const csvData = await ActivitiesRepository.exportActivities({
        type,
        reportId,
        user,
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined,
        sortBy: sortBy as 'createdAt',
        sortOrder: sortOrder as 'asc' | 'desc'
      });

      return new Response(csvData, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': 'attachment; filename="activity-log.csv"'
        }
      });
    } catch (error) {
      return { success: false, error: 'Failed to export activities' };
    }
  }, {
    query: t.Object({
      type: t.Optional(t.String()),
      reportId: t.Optional(t.String()),
      user: t.Optional(t.String()),
      startDate: t.Optional(t.String()),
      endDate: t.Optional(t.String()),
      sortBy: t.Optional(t.Literal('createdAt')),
      sortOrder: t.Optional(t.Union([t.Literal('asc'), t.Literal('desc')]))
    })
  })

  .post('/', async ({ body }) => {
    try {
      const activity = await ActivitiesRepository.create(body);
      return { success: true, data: activity };
    } catch (error) {
      return { success: false, error: 'Failed to create activity' };
    }
  }, {
    body: t.Object({
      type: t.String(),
      details: t.String(),
      user: t.Optional(t.String()),
      reportId: t.Optional(t.String())
    })
  }); 