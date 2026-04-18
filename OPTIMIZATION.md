# Optimization

This file documents the performance optimizations applied to this FlowForge MERN Stack application.

## Frontend
- Configured Vite build chunking using `splitVendorChunkPlugin` to improve caching and bundle size.
- Implemented lazy loading (`React.lazy` and `Suspense`) for Heavy layout components (`Canvas`, `ConfigPanel`, `Sidebar`), deferring their load until necessary and reducing initial JS bundle footprint.

## Backend
- Integrated `compression` middleware in the Express API to gzip all API payload responses.

## Database (Mongoose)
- Appended missing indexes to `OTP` collection (`userId`, `email`, `phone`).
- Appended missing index to `RefreshToken` collection (`userId`).
- This dramatically increases lookup speeds for auth workflows.

## Benchmarking
- Added `benchmark.js` in the root folder to easily visualize total frontend chunk size and average API response time headers.
