import { z } from 'zod'
import { getRun } from 'workflow/api'

const paramsSchema = z.object({
  runId: z.string().min(1),
})

export default defineEventHandler(async (event) => {
  const { runId } = await getValidatedRouterParams(event, paramsSchema.parse)
  const run = getRun(runId)
  const status = await run.status

  if (status === 'completed') {
    return { status, result: await run.returnValue }
  }

  if (status === 'failed') {
    let error = 'unknown error'
    try {
      await run.returnValue
    } catch (err) {
      error = err instanceof Error ? err.message : String(err)
    }
    return { status, error }
  }

  return { status }
})
