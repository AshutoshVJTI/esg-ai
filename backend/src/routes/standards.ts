import { Elysia, t } from 'elysia';
import { StandardsRepository } from '../repositories/standards';
import type { CreateStandardInput, UpdateStandardInput } from '../repositories/standards';

const StandardSchema = t.Object({
  id: t.String(),
  name: t.String(),
  description: t.String(),
  categories: t.Array(t.String()),
  isCustom: t.Boolean(),
  isActive: t.Boolean(),
  website: t.Optional(t.String()),
  files: t.Optional(t.Array(t.Any()))
});

export const standardsRouter = new Elysia({ prefix: '/standards' })
  .get('/', async () => {
    try {
      const standards = await StandardsRepository.findAll();
      return { success: true, data: standards };
    } catch (error) {
      return { success: false, error: 'Failed to fetch standards' };
    }
  })

  .get('/:standardId', async ({ params: { standardId } }) => {
    try {
      const standard = await StandardsRepository.findById(standardId);
      if (!standard) {
        return { success: false, error: 'Standard not found' };
      }
      return { success: true, data: standard };
    } catch (error) {
      return { success: false, error: 'Failed to fetch standard' };
    }
  })

  .post('/', async ({ body }) => {
    try {
      const standard = await StandardsRepository.create(body as CreateStandardInput);
      return { success: true, data: standard };
    } catch (error) {
      return { success: false, error: 'Failed to create standard' };
    }
  }, {
    body: t.Object({
      name: t.String(),
      description: t.String(),
      categories: t.Array(t.String()),
      isCustom: t.Optional(t.Boolean()),
      isActive: t.Optional(t.Boolean()),
      website: t.Optional(t.String()),
      files: t.Optional(t.Array(t.Object({
        name: t.String(),
        url: t.String(),
        size: t.Number(),
        type: t.String()
      })))
    })
  })

  .put('/:standardId', async ({ params: { standardId }, body }) => {
    try {
      const standard = await StandardsRepository.update(standardId, body as UpdateStandardInput);
      return { success: true, data: standard };
    } catch (error) {
      return { success: false, error: 'Failed to update standard' };
    }
  }, {
    body: t.Object({
      name: t.Optional(t.String()),
      description: t.Optional(t.String()),
      categories: t.Optional(t.Array(t.String())),
      isCustom: t.Optional(t.Boolean()),
      isActive: t.Optional(t.Boolean()),
      website: t.Optional(t.String())
    })
  })

  .delete('/:standardId', async ({ params: { standardId } }) => {
    try {
      const standard = await StandardsRepository.delete(standardId);
      return { success: true, data: standard };
    } catch (error) {
      return { success: false, error: 'Failed to delete standard' };
    }
  })

  .post('/:standardId/files', async ({ params: { standardId }, body }) => {
    try {
      const files = await StandardsRepository.addFiles(standardId, body.files);
      return { success: true, data: files };
    } catch (error) {
      return { success: false, error: 'Failed to add files' };
    }
  }, {
    body: t.Object({
      files: t.Array(t.Object({
        name: t.String(),
        url: t.String(),
        size: t.Number(),
        type: t.String()
      }))
    })
  })

  .delete('/:standardId/files/:fileId', async ({ params: { fileId } }) => {
    try {
      const file = await StandardsRepository.removeFile(fileId);
      return { success: true, data: file };
    } catch (error) {
      return { success: false, error: 'Failed to remove file' };
    }
  }); 