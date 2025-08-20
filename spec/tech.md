**Frontend**

- pnpm/pnpx (pnpm dlx)
- Next.JS
  - with Supabase queries on frontend, only query to python for more complex tasks if supabase cannot handle. I.e simply finding a row/tables in the db don't need to be done through python backend hosted api as it slows server down.
- Shadcn
  - Use sonner/toast to error handle

**Backend**

- python3
- Supabase Postgres db
  - Singular table names ("user" instead of "users")
- Python
