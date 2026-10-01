# Routing System Notes

## Basics

Nextjs handles who rides together and the python microservice decides what order they get picked up in and which specific vehicles takes them

How the system works:

1. Admin dashboard triggers a term solve with this: RoutesService.triggerTermSolve(dto) is the entry point
2. A job is pushed to BULLMQ called "route-solve" this.solveQueue.add('solve-term', dto, { attempts: 2, backoff: {...} })
   Nothing happens synchronously here — it returns a job_id immediately. The retry config means if the whole thing throws, BullMQ retries it twice with backoff.
3. The worker picks up the job
   RouteSolveProcessor is registered as a @Processor('route-solve'), so BullMQ hands the job to its process() method. This method is the orchestrator — it does nothing clever itself, it just calls the other services in order.
