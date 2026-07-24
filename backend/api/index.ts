/**
 * Vercel serverless entry point.
 * Wraps the Express app so Vercel can invoke it as a function per-request.
 */
import { createApp } from '../src/app';

export default createApp();
