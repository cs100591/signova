-- Enable pg_net extension for async HTTP requests from DB triggers
create extension if not exists pg_net schema extensions;
